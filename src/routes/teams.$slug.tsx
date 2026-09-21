import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageShell } from '@/components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/teams/$slug')({ component: TeamProfile });

function TeamProfile() {
  const { slug } = Route.useParams() as { slug: string };
  const team = useQuery({
    queryKey: ['public-team', slug],
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('id, name, slug, logo_url, primary_color, league_id').eq('slug', slug).eq('is_suspended', false).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const players = useQuery({
    queryKey: ['public-team-players', team.data?.id],
    enabled: !!team.data,
    queryFn: async () => {
      const { data, error } = await supabase.from('team_members').select('id, display_name, jersey_number, position').eq('team_id', team.data!.id).order('jersey_number');
      if (error) throw error;
      return data ?? [];
    },
  });
  if (team.isLoading) return <PageShell><main className="mx-auto max-w-6xl px-4 py-10">Loading team...</main></PageShell>;
  if (!team.data) return <PageShell><main className="mx-auto max-w-6xl px-4 py-10">Team not found.</main></PageShell>;
  return <PageShell><main className="mx-auto max-w-6xl px-4 py-10"><Button asChild variant="outline"><Link to={'/teams' as never}>Back to teams</Link></Button><section className="mt-6 flex flex-wrap items-center gap-5">{team.data.logo_url ? <img src={team.data.logo_url} alt="" className="h-24 w-24 rounded object-cover" /> : <div className="flex h-24 w-24 items-center justify-center rounded bg-muted text-3xl font-bold">{team.data.name.slice(0, 1)}</div>}<div><h1 className="text-3xl font-bold">{team.data.name}</h1><p className="mt-2 text-muted-foreground">Official team profile</p></div></section><Card className="mt-8"><CardHeader><CardTitle>Squad</CardTitle></CardHeader><CardContent>{players.isLoading ? <p className="text-sm text-muted-foreground">Loading players...</p> : (players.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No public squad information is available.</p> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{players.data!.map((player) => <div key={player.id} className="rounded border p-3"><p className="font-medium">{player.display_name}</p><p className="text-sm text-muted-foreground">{player.position ?? 'Position pending'} {player.jersey_number ? ' / #' + player.jersey_number : ''}</p></div>)}</div>}</CardContent></Card></main></PageShell>;
}
