import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageShell } from '@/components/PageShell';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export const Route = createFileRoute('/teams')({ component: TeamsDirectory });

function TeamsDirectory() {
  const [search, setSearch] = useState('');
  const teams = useQuery({
    queryKey: ['public-team-directory'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('id, name, slug, logo_url, league_id').eq('is_suspended', false).order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
  const visibleTeams = (teams.data ?? []).filter((team) => team.name.toLowerCase().includes(search.trim().toLowerCase()));
  return <PageShell><main className="mx-auto max-w-6xl px-4 py-10"><h1 className="text-3xl font-bold">Teams</h1><p className="mt-2 text-muted-foreground">Discover active teams across RefAI competitions.</p><div className="relative mt-6 max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teams" /></div><section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{teams.isLoading ? <p className="text-muted-foreground">Loading teams...</p> : visibleTeams.length === 0 ? <p className="text-muted-foreground">No active teams found.</p> : visibleTeams.map((team) => <Link key={team.id} to={'/teams/$slug' as never} params={{ slug: team.slug } as never}><Card className="h-full transition hover:border-primary"><CardContent className="flex items-center gap-4 p-4">{team.logo_url ? <img src={team.logo_url} alt="" className="h-12 w-12 rounded object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded bg-muted font-bold">{team.name.slice(0, 1)}</div>}<span className="font-semibold">{team.name}</span></CardContent></Card></Link>)}</section></main></PageShell>;
}
