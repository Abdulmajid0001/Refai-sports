import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteAdSlot } from "@/components/SiteAdSlot";

export const Route = createFileRoute("/matches/")({ component: MatchesPage });

function MatchesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["matches", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("id, status, home_score, away_score, kickoff_at, home_team_id, away_team_id, league_id, venue, matchday")
        .order("kickoff_at", { ascending: true })
        .limit(50);
      if (error) throw error;

      const teamIds = Array.from(new Set((data ?? []).flatMap((m) => [m.home_team_id, m.away_team_id]).filter(Boolean)));
      const leagueIds = Array.from(new Set((data ?? []).map((m) => m.league_id).filter(Boolean)));

      const [teamsRes, leaguesRes] = await Promise.all([
        teamIds.length ? supabase.from("teams").select("id, name, slug, logo_url").in("id", teamIds) : { data: [] },
        leagueIds.length ? supabase.from("leagues").select("id, name, slug").in("id", leagueIds) : { data: [] },
      ]);

      const teamById = new Map((teamsRes.data ?? []).map((t) => [t.id, t]));
      const leagueById = new Map((leaguesRes.data ?? []).map((l) => [l.id, l]));

      return (data ?? []).map((m) => ({
        ...m,
        home: m.home_team_id ? teamById.get(m.home_team_id) : null,
        away: m.away_team_id ? teamById.get(m.away_team_id) : null,
        league: m.league_id ? leagueById.get(m.league_id) : null,
      }));
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

      <section className="mx-auto max-w-7xl px-4 py-8">
        {isLoading ? (
          <p className="text-muted-foreground">Loading matches...</p>
        ) : (data?.length ?? 0) === 0 ? (
          <p className="text-center text-muted-foreground">No matches scheduled yet.</p>
        ) : (
          <>
            <SiteAdSlot placement="middle" pageGroup="matches" />

            <div className="space-y-3">
            {data!.map((m) => (
              <Link key={m.id} to="/matches/$id" params={{ id: m.id }}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div className="text-xs text-muted-foreground w-32">
                      {m.kickoff_at ? new Date(m.kickoff_at).toLocaleDateString() : "TBD"}
                      {m.matchday && <span className="block">MD {m.matchday}</span>}
                    </div>
                    <div className="flex-1 flex items-center justify-center gap-4">
                      <div className="flex items-center gap-2">
                        {m.home?.logo_url && <img src={m.home.logo_url} className="h-6 w-6 rounded" alt="" />}
                        <span className="font-medium">{m.home?.name ?? "TBD"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.status === "scheduled" ? (
                          <span className="text-muted-foreground text-sm">vs</span>
                        ) : (
                          <span className="rounded bg-muted px-2 py-1 font-bold tabular-nums">
                            {m.home_score} - {m.away_score}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {m.away?.logo_url && <img src={m.away.logo_url} className="h-6 w-6 rounded" alt="" />}
                        <span className="font-medium">{m.away?.name ?? "TBD"}</span>
                      </div>
                    </div>
                    <Badge
                      variant={m.status === "live" ? "destructive" : m.status === "completed" ? "secondary" : "outline"}
                      className="capitalize w-20 justify-center"
                    >
                      {m.status}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </PageShell>
  );
}
