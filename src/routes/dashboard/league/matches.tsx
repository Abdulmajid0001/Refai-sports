import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import type { InputHTMLAttributes } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/dashboard/league/matches')({
  component: LeagueMatchesPage,
});

function LeagueMatchesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: leagues } = useQuery({
    queryKey: ['league-owner-leagues', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_registrations')
        .select('id, league_name')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const leagueIds = (leagues ?? []).map((league) => league.id);

  const { data: matches } = useQuery({
    queryKey: ['league-matches', leagueIds],
    enabled: leagueIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_matches')
        .select('*')
        .in('league_registration_id', leagueIds)
        .order('match_date', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  const createMatch = useMutation({
    mutationFn: async (form: FormData) => {
      if (!leagues?.[0]?.id) throw new Error('Create a league first');

      const payload = {
        league_registration_id: leagues[0].id,
        home_team_name: String(form.get('home_team_name') || '').trim(),
        away_team_name: String(form.get('away_team_name') || '').trim(),
        venue_name: String(form.get('venue_name') || '').trim(),
        match_date: String(form.get('match_date') || ''),
        status: 'scheduled',
      };

      const { error } = await supabase.from('league_matches').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Match created');
      qc.invalidateQueries({ queryKey: ['league-matches'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not create match'),
  });

  return (
    <RoleGuard allow="league_owner" requireApproved={false}>
      <div className="space-y-6">
        <Top title="Matches" description="Create fixtures and prepare schedules, standings and brackets." />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-primary" />
              Create Match
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                createMatch.mutate(new FormData(e.currentTarget));
                e.currentTarget.reset();
              }}
            >
              <Field name="home_team_name" label="Home Team" required />
              <Field name="away_team_name" label="Away Team" required />
              <Field name="venue_name" label="Venue" required />
              <Field name="match_date" label="Match Date" type="datetime-local" required />

              <Button className="md:col-span-2" disabled={createMatch.isPending}>
                Create fixture
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fixtures</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {(matches ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No fixtures yet.</p>
            ) : (
              matches!.map((match: any) => (
                <div key={match.id} className="rounded-md border p-3">
                  <div className="font-medium">
                    {match.home_team_name} vs {match.away_team_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {match.venue_name} / {match.match_date}
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

function Top({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Button asChild variant="outline">
        <Link to="/dashboard/league">Back to dashboard</Link>
      </Button>
    </div>
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
