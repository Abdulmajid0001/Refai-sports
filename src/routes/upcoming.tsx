import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PageShell } from '@/components/PageShell';
import { Card, CardContent } from '@/components/ui/card';

export const Route = createFileRoute('/upcoming')({ component: UpcomingMatches });

function UpcomingMatches() {
  const matches = useQuery({
    queryKey: ['upcoming-matches'],
    queryFn: async () => {
      const { data, error } = await supabase.from('matches').select('id, kickoff_at, venue, home_team_id, away_team_id').eq('status', 'scheduled').gte('kickoff_at', new Date().toISOString()).order('kickoff_at').limit(50);
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).flatMap((match) => [match.home_team_id, match.away_team_id])));
      const { data: teams } = ids.length ? await supabase.from('teams').select('id, name, logo_url').in('id', ids) : { data: [] };
      const byId = new Map((teams ?? []).map((team) => [team.id, team]));
      return (data ?? []).map((match) => ({ ...match, home: byId.get(match.home_team_id), away: byId.get(match.away_team_id) }));
    },
  });
  return <PageShell><main className="mx-auto max-w-6xl px-4 py-10"><div className="flex items-center gap-3"><CalendarClock className="h-7 w-7 text-primary" /><div><h1 className="text-3xl font-bold">Upcoming Matches</h1><p className="text-muted-foreground">Fixtures scheduled by participating leagues.</p></div></div><section className="mt-8 space-y-3">{matches.isLoading ? <p className="text-muted-foreground">Loading fixtures...</p> : (matches.data ?? []).length === 0 ? <p className="text-muted-foreground">No upcoming matches are scheduled.</p> : matches.data!.map((match) => <Link key={match.id} to="/matches/$id" params={{ id: match.id }}><Card className="transition hover:border-primary"><CardContent className="flex flex-wrap items-center justify-between gap-4 p-4"><div className="font-medium">{match.home?.name ?? 'Home team'} vs {match.away?.name ?? 'Away team'}</div><div className="text-right text-sm text-muted-foreground"><div>{match.kickoff_at ? new Date(match.kickoff_at).toLocaleString() : 'Kickoff TBD'}</div>{match.venue && <div>{match.venue}</div>}</div></CardContent></Card></Link>)}</section></main></PageShell>;
}
