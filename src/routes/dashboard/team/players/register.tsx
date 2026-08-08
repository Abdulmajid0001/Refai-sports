import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { PlayerRegistrationForm } from '@/components/onboarding/PlayerRegistrationForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const Route = createFileRoute('/dashboard/team/players/register')({
  component: RegisterPlayerPage,
});

function RegisterPlayerPage() {
  const { user } = useAuth();

  const { data: teams, isLoading } = useQuery({
    queryKey: ['my-team-registrations', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_registrations')
        .select('*')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const teamId = (teams?.[0] as any)?.id ?? null;

  return (
    <RoleGuard allow="team_owner" requireApproved={false}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Register Player</h1>
            <p className="text-muted-foreground">
              Add players, photos, videos and squad details.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/dashboard/team">Back to dashboard</Link>
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Loading your team...
            </CardContent>
          </Card>
        ) : !teamId ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              You need to register a team before adding players.
            </CardContent>
          </Card>
        ) : (
          <PlayerRegistrationForm teamId={teamId} />
        )}
      </div>
    </RoleGuard>
  );
}
