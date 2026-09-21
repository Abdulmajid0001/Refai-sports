import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Eye, EyeOff, ShieldPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useState, type InputHTMLAttributes } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const Route = createFileRoute('/dashboard/league/moderators')({
  component: LeagueModeratorsPage,
});

function LeagueModeratorsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [createdInvitation, setCreatedInvitation] = useState<{ token: string; expiresAt: string } | null>(null);
  const [showToken, setShowToken] = useState(false);

  const { data: leagues } = useQuery({
    queryKey: ['league-owner-leagues', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_registrations')
        .select('id, league_name')
        .eq('owner_id', user!.id);

      if (error) throw error;
      return data ?? [];
    },
  });

  const leagueIds = (leagues ?? []).map((league) => league.id);

  const { data: matches } = useQuery({
    queryKey: ['league-operational-matches', leagueIds],
    enabled: leagueIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('id, kickoff_at, home_team_id, away_team_id')
        .in('league_registration_id', leagueIds)
        .order('kickoff_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: invitations } = useQuery({
    queryKey: ['staff-invitations', leagueIds],
    enabled: leagueIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_invitations')
        .select('*')
        .in('league_registration_id', leagueIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const createInvitation = useMutation({
    mutationFn: async (form: FormData) => {
      if (!leagues?.[0]?.id) throw new Error('Create a league first');

      const permissions = String(form.get('permissions') || '')
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean);
      const expiresAt = String(form.get('expires_at') || '').trim();
      const { data, error } = await supabase.rpc('create_staff_invitation', {
        p_league_registration_id: leagues[0].id,
        p_email: String(form.get('email') || '').trim(),
        p_role: String(form.get('role') || 'moderator'),
        p_permissions: permissions,
        p_match_id: (() => {
          const matchId = String(form.get('match_id') || '');
          return matchId && matchId !== 'all' ? matchId : null;
        })(),
        p_expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined
      });
      if (error) throw error;
      const invitation = data?.[0];
      if (!invitation?.token) throw new Error('Invitation was created without a token');
      return invitation;
    },
    onSuccess: (invitation) => {
      setCreatedInvitation({ token: invitation.token, expiresAt: invitation.expires_at });
      setShowToken(true);
      toast.success('Secure staff invitation created');
      qc.invalidateQueries({ queryKey: ['staff-invitations'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not add moderator'),
  });

  const invitationUrl = createdInvitation ? `${window.location.origin}/auth?invite=${encodeURIComponent(createdInvitation.token)}` : '';

  return (
    <RoleGuard allow="league_owner" requireApproved={false}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Moderators</h1>
            <p className="text-muted-foreground">
              Invite the people who operate live matches. Roles, permissions and expiry are enforced by the database.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/dashboard/league">Back to dashboard</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldPlus className="h-5 w-5 text-primary" />
              Invite Match Staff
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                createInvitation.mutate(new FormData(e.currentTarget));
                e.currentTarget.reset();
              }}
            >
              <Field name="email" label="Email" type="email" required />
              <div>
                <Label>Role</Label>
                <Select name="role" defaultValue="moderator">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general_moderator">General Moderator</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="assistant_moderator">Assistant Moderator</SelectItem>
                    <SelectItem value="commentator">Commentator</SelectItem>
                    <SelectItem value="camera_operator">Camera Operator</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="statistician">Statistician</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field
                name="permissions"
                label="Permissions"
                placeholder="scores, replays, graphics, var"
                required
              />
              <Field name="expires_at" label="Expires at" type="datetime-local" />
              <div>
                <Label>Assigned match</Label>
                <Select name="match_id">
                  <SelectTrigger><SelectValue placeholder="League-wide access" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">League-wide access</SelectItem>
                    {(matches ?? []).map((match: { id: string; kickoff_at: string | null }) => (
                      <SelectItem key={match.id} value={match.id}>
                        {match.kickoff_at ? new Date(match.kickoff_at).toLocaleString() : 'Kickoff TBD'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button className="md:col-span-2" disabled={createInvitation.isPending}>
                Create secure invitation
              </Button>
            </form>

            {createdInvitation && (
              <div className="mt-5 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">Share this secure invitation link only with the invited email address.</p>
                  <Button type="button" size="icon" variant="ghost" onClick={() => setShowToken((value) => !value)} aria-label={showToken ? 'Hide invitation token' : 'Show invitation token'}>
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="mt-2 flex items-center gap-2 font-mono text-xs break-all">
                  <span>{showToken ? invitationUrl : '••••••••••••••••••••••••••••••••'}</span>
                  <Button type="button" size="icon" variant="ghost" aria-label="Copy invitation link" onClick={() => navigator.clipboard.writeText(invitationUrl).then(() => toast.success('Invitation link copied'))}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-xs">Expires {new Date(createdInvitation.expiresAt).toLocaleString()}.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Invitations</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {(invitations ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No staff invitations yet.</p>
            ) : (
              invitations!.map((invitation: any) => (
                <div key={invitation.id} className="rounded-md border p-3">
                  <div className="font-medium">{invitation.role.replace(/_/g, ' ')}</div>
                  <div className="text-sm text-muted-foreground">
                    {invitation.email} / {invitation.accepted_at ? 'accepted' : invitation.revoked_at ? 'revoked' : new Date(invitation.expires_at) <= new Date() ? 'expired' : 'active'}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}

function Field(props: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, ...inputProps } = props;

  return (
    <div>
      <Label>{label}</Label>
      <Input {...inputProps} />
    </div>
  );
}
