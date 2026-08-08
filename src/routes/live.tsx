import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteAdSlot } from "@/components/SiteAdSlot";

export const Route = createFileRoute("/live")({ component: LivePage });

function LivePage() {
  const { data } = useQuery({
    queryKey: ["matches", "live"],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("id, status, home_team_id, away_team_id, home_score, away_score, kickoff_at, league_id")
        .in("status", ["live", "halftime"])
        .order("kickoff_at", { ascending: true });
      const teamIds = Array.from(new Set((data ?? []).flatMap((m) => [m.home_team_id, m.away_team_id]).filter(Boolean)));
      const leagueIds = Array.from(new Set((data ?? []).map((m) => m.league_id).filter(Boolean)));

      const [teamsRes, leaguesRes] = await Promise.all([
        teamIds.length ? supabase.from("teams").select("id, name, logo_url").in("id", teamIds) : { data: [] },
        leagueIds.length ? supabase.from("leagues").select("id, name").in("id", leagueIds) : { data: [] },
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
    refetchInterval: 15000,
  });

  return (
    <PageShell>
      <section className="border-b bg-gradient-to-b from-red-500/10 to-transparent">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-14">
          <Radio className="h-6 w-6 text-red-500 animate-pulse" />
          <h1 className="font-display text-3xl font-bold md:text-4xl">Live now</h1>
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

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data!.map((m) => (
              <Link key={m.id} to="/matches/$id" params={{ id: m.id }}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>{m.league?.name ?? "League"}</span>
                      <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {m.home?.logo_url && <img src={m.home.logo_url} className="h-6 w-6 rounded" alt="" />}
                        <span className="font-medium">{m.home?.name ?? "TBD"}</span>
                      </div>
                      <span className="font-mono font-bold text-lg">{m.home_score}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        {m.away?.logo_url && <img src={m.away.logo_url} className="h-6 w-6 rounded" alt="" />}
                        <span className="font-medium">{m.away?.name ?? "TBD"}</span>
                      </div>
                      <span className="font-mono font-bold text-lg">{m.away_score}</span>
                    </div>
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
