import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/matches")({ component: MatchesIndex });

function MatchesIndex() {
  const { data, isLoading } = useQuery({
    queryKey: ["matches", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("id, kickoff_at, status, home_score, away_score, home_team_id, away_team_id, venue, league_id")
        .order("kickoff_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      const teamIds = Array.from(new Set((data ?? []).flatMap((m) => [m.home_team_id, m.away_team_id])));
      const leagueIds = Array.from(new Set((data ?? []).map((m) => m.league_id)));
      const [{ data: ts }, { data: ls }] = await Promise.all([
        teamIds.length ? supabase.from("teams").select("id, name, slug, logo_url").in("id", teamIds) : Promise.resolve({ data: [] as { id: string; name: string; slug: string; logo_url: string | null }[] }),
        leagueIds.length ? supabase.from("leagues").select("id, name, slug").in("id", leagueIds) : Promise.resolve({ data: [] as { id: string; name: string; slug: string }[] }),
      ]);
      const t = new Map((ts ?? []).map((x) => [x.id, x]));
      const l = new Map((ls ?? []).map((x) => [x.id, x]));
      return (data ?? []).map((m) => ({ ...m, home: t.get(m.home_team_id), away: t.get(m.away_team_id), league: l.get(m.league_id) }));
    },
  });

  return (
    <PageShell>
      <section className="border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-14">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl font-bold md:text-4xl">Matches</h1>
        </div>
      </section>
      <section className="mx-auto max-w-7xl space-y-2 px-4 py-8">
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : (data ?? []).length === 0 ? (
          <p className="text-center text-muted-foreground">No matches scheduled.</p>
        ) : (data ?? []).map((m) => (
          <Link key={m.id} to="/matches/$id" params={{ id: m.id }}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="text-xs text-muted-foreground">
                  {m.league?.name} • {m.kickoff_at ? new Date(m.kickoff_at).toLocaleString() : "TBD"}
                </div>
                <div className="flex items-center gap-3 font-medium">
                  <span>{m.home?.name ?? "TBD"}</span>
                  <span className="rounded bg-muted px-2 py-1 font-bold tabular-nums">
                    {m.status === "scheduled" ? "vs" : `${m.home_score} - ${m.away_score}`}
                  </span>
                  <span>{m.away?.name ?? "TBD"}</span>
                </div>
                <Badge variant={m.status === "live" ? "destructive" : "outline"} className="capitalize">{m.status}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
