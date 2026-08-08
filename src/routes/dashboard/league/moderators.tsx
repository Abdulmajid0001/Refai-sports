import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldPlus } from 'lucide-react';
import { toast } from 'sonner';
import type { InputHTMLAttributes } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/dashboard/league/moderators')({
  component: LeagueModeratorsPage,
});

function LeagueModeratorsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

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

  const { data: moderators } = useQuery({
    queryKey: ['league-moderators', leagueIds],
    enabled: leagueIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_moderators')
        .select('*')
        .in('league_registration_id', leagueIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const createModerator = useMutation({
    mutationFn: async (form: FormData) => {
      if (!leagues?.[0]?.id) throw new Error('Create a league first');

      const payload = {
        league_registration_id: leagues[0].id,
        name: String(form.get('name') || '').trim(),
        email: String(form.get('email') || '').trim(),
        moderator_role: String(form.get('moderator_role') || '').trim(),
        permissions: String(form.get('permissions') || '')
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean),
        status: 'invited',
      };

      const { error } = await supabase.from('league_moderators').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Moderator added');
      qc.invalidateQueries({ queryKey: ['league-moderators'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not add moderator'),
  });

  return (
    <RoleGuard allow="league_owner" requireApproved={false}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Moderators</h1>
            <p className="text-muted-foreground">
              Create live match moderators and assign match control permissions.
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
              Add Moderator
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                createModerator.mutate(new FormData(e.currentTarget));
                e.currentTarget.reset();
              }}
            >
              <Field name="name" label="Full Name" required />
              <Field name="email" label="Email" type="email" required />
              <Field name="moderator_role" label="Role, example VAR Moderator" required />
              <Field
                name="permissions"
                label="Permissions, comma separated"
                placeholder="scores, replays, graphics, var"
                required
              />

              <Button className="md:col-span-2" disabled={createModerator.isPending}>
                Create moderator
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moderator List</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {(moderators ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No moderators added yet.</p>
            ) : (
              moderators!.map((moderator: any) => (
                <div key={moderator.id} className="rounded-md border p-3">
                  <div className="font-medium">{moderator.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {moderator.email} / {moderator.moderator_role}
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
