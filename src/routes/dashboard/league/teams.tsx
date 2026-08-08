import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, Eye, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/dashboard/league/teams')({
  component: LeagueTeamsPage,
});

function LeagueTeamsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: leagues } = useQuery({
    queryKey: ['league-owner-leagues', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_registrations')
        .select('id, league_name, status')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const leagueIds = (leagues ?? []).map((league) => league.id);

  const { data: teams, isLoading } = useQuery({
    queryKey: ['league-dashboard-teams', leagueIds],
    enabled: leagueIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_registrations')
        .select('*')
        .in('league_registration_id', leagueIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const updateTeamStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('team_registrations')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Team status updated');
      qc.invalidateQueries({ queryKey: ['league-dashboard-teams'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update team'),
  });

  return (
    <RoleGuard allow="league_owner" requireApproved={false}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Teams</h1>
            <p className="text-muted-foreground">
              Approve, reject and monitor teams registered under your leagues.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/dashboard/league">Back to dashboard</Link>
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">Loading teams...</CardContent>
          </Card>
        ) : (teams ?? []).length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No team registrations yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {teams!.map((team: any) => (
              <Card key={team.id}>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                    <span>{team.team_name}</span>
                    <StatusBadge status={team.status} />
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid gap-3 text-sm md:grid-cols-3">
                    <Info label="Short name" value={team.short_name} />
                    <Info label="Owner" value={team.owner_name} />
                    <Info label="Phone" value={team.owner_phone} />
                    <Info label="Head coach" value={team.head_coach} />
                    <Info label="Manager" value={team.team_manager} />
                    <Info label="Home ground" value={team.home_ground || 'Not set'} />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateTeamStatus.mutate({ id: team.id, status: 'approved' })}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTeamStatus.mutate({ id: team.id, status: 'changes_requested' })}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Request edits
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateTeamStatus.mutate({ id: team.id, status: 'rejected' })}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>

                    {team.logo_url && (
                      <Button size="sm" variant="secondary" asChild>
                        <a href={team.logo_url} target="_blank" rel="noreferrer">
                          <Eye className="mr-2 h-4 w-4" />
                          View logo
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || 'Not provided'}</p>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  return (
    <span className="rounded bg-muted px-2 py-1 text-xs capitalize">
      {String(status || 'draft').replace(/_/g, ' ')}
    </span>
  );
}
