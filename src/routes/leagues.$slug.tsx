import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Calendar, Users, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FollowButton } from "@/components/FollowButton";

export const Route = createFileRoute("/leagues/$slug")({ component: LeagueDetail });

function LeagueDetail() {
  const { slug } = Route.useParams();
  const { data: league, isLoading } = useQuery({
    queryKey: ["league", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("leagues").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: standings } = useQuery({
    queryKey: ["standings", league?.id],
    enabled: !!league?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("league_standings")
        .select("team_id, played, wins, draws, losses, goals_for, goals_against, goal_diff, points")
        .eq("league_id", league!.id);
      if (error) throw error;
      const teamIds = (data ?? []).map((s) => s.team_id).filter((x): x is string => !!x);
      const { data: teams } = teamIds.length
        ? await supabase.from("teams").select("id, name, slug, logo_url").in("id", teamIds)
        : { data: [] as { id: string; name: string; slug: string; logo_url: string | null }[] };
      const byId = new Map((teams ?? []).map((t) => [t.id, t]));
      return (data ?? [])
        .map((row) => ({ ...row, team: row.team_id ? byId.get(row.team_id) : undefined }))
        .sort((a, b) => (b.points ?? 0) - (a.points ?? 0) || (b.goal_diff ?? 0) - (a.goal_diff ?? 0));
    },
  });

  const { data: matches } = useQuery({
    queryKey: ["matches", league?.id],
    enabled: !!league?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("id, kickoff_at, status, home_score, away_score, home_team_id, away_team_id, venue, matchday")
        .eq("league_id", league!.id)
        .order("kickoff_at", { ascending: true });
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).flatMap((m) => [m.home_team_id, m.away_team_id])));
      const { data: teams } = ids.length
        ? await supabase.from("teams").select("id, name, slug, logo_url").in("id", ids)
        : { data: [] };
      const byId = new Map((teams ?? []).map((t) => [t.id, t]));
      return (data ?? []).map((m) => ({ ...m, home: byId.get(m.home_team_id), away: byId.get(m.away_team_id) }));
    },
  });

  const { data: teams } = useQuery({
    queryKey: ["league-teams", league?.id],
    enabled: !!league?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("team_league_registrations")
        .select("team_id, status")
        .eq("league_id", league!.id)
        .eq("status", "approved");
      const ids = (data ?? []).map((r) => r.team_id);
      if (!ids.length) return [];
      const { data: ts } = await supabase.from("teams").select("id, name, slug, logo_url, city").in("id", ids);
      return ts ?? [];
    },
  });

  if (isLoading) return <PageShell><div className="mx-auto max-w-7xl px-4 py-10">Loading…</div></PageShell>;
  if (!league) return <PageShell><div className="mx-auto max-w-7xl px-4 py-10">League not found.</div></PageShell>;

  return (
    <PageShell>
      <section className="relative border-b">
        {league.banner_url && (
          <div className="absolute inset-0 -z-10 opacity-30">
            <img src={league.banner_url} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-12 md:flex-row md:items-end">
          {league.logo_url ? (
            <img src={league.logo_url} alt="" className="h-20 w-20 rounded-lg object-cover" />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-lg bg-primary/10 text-primary">
              <Trophy className="h-8 w-8" />
            </div>
          )}
          <div className="flex-1">
            <Badge variant="secondary" className="capitalize">{league.status.replace("_", " ")}</Badge>
            <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">{league.name}</h1>
            <p className="text-muted-foreground">
              {[league.sport, league.country, league.region].filter(Boolean).join(" • ")}
            </p>
            <div className="mt-3"><FollowButton targetType="league" targetId={league.id} /></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        {league.description && <p className="mb-6 max-w-3xl text-muted-foreground">{league.description}</p>}

        <Tabs defaultValue="standings">
          <TabsList>
            <TabsTrigger value="standings"><Trophy className="mr-1 h-4 w-4" />Standings</TabsTrigger>
            <TabsTrigger value="scorers"><Target className="mr-1 h-4 w-4" />Top scorers</TabsTrigger>
            <TabsTrigger value="fixtures"><Calendar className="mr-1 h-4 w-4" />Fixtures</TabsTrigger>
            <TabsTrigger value="teams"><Users className="mr-1 h-4 w-4" />Teams</TabsTrigger>
          </TabsList>

          <TabsContent value="scorers" className="mt-4">
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Top scorer statistics coming soon.
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="standings" className="mt-4">
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left">
                    <tr>
                      <th className="px-3 py-2">#</th><th className="px-3 py-2">Team</th>
                      <th className="px-2 py-2">P</th><th className="px-2 py-2">W</th>
                      <th className="px-2 py-2">D</th><th className="px-2 py-2">L</th>
                      <th className="px-2 py-2">GF</th><th className="px-2 py-2">GA</th>
                      <th className="px-2 py-2">GD</th><th className="px-2 py-2 font-bold">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(standings ?? []).map((s, i) => (
                      <tr key={s.team_id} className="border-t">
                        <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                        <td className="px-3 py-2">
                          {s.team ? (
                            <Link to="/teams/$slug" params={{ slug: s.team.slug }} className="hover:underline">
                              {s.team.name}
                            </Link>
                          ) : "—"}
                        </td>
                        <td className="px-2 py-2">{s.played}</td><td className="px-2 py-2">{s.wins}</td>
                        <td className="px-2 py-2">{s.draws}</td><td className="px-2 py-2">{s.losses}</td>
                        <td className="px-2 py-2">{s.goals_for}</td><td className="px-2 py-2">{s.goals_against}</td>
                        <td className="px-2 py-2">{s.goal_diff}</td>
                        <td className="px-2 py-2 font-bold">{s.points}</td>
                      </tr>
                    ))}
                    {(standings ?? []).length === 0 && (
                      <tr><td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">No completed matches yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fixtures" className="mt-4">
            <div className="space-y-2">
              {(matches ?? []).map((m) => (
                <Link key={m.id} to="/matches/$id" params={{ id: m.id }}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <div className="text-xs text-muted-foreground">
                        {m.kickoff_at ? new Date(m.kickoff_at).toLocaleString() : "TBD"}
                        {m.matchday && ` • MD ${m.matchday}`}
                      </div>
                      <div className="flex items-center gap-3 font-medium">
                        <span>{m.home?.name ?? "TBD"}</span>
                        <span className="rounded bg-muted px-2 py-1 font-bold tabular-nums">
                          {m.status === "scheduled" ? "vs" : `${m.home_score} - ${m.away_score}`}
                        </span>
                        <span>{m.away?.name ?? "TBD"}</span>
                      </div>
                      <Badge variant="outline" className="capitalize">{m.status}</Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {(matches ?? []).length === 0 && (
                <p className="text-center text-muted-foreground">No fixtures yet.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="teams" className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(teams ?? []).map((t) => (
                <Link key={t.id} to="/teams/$slug" params={{ slug: t.slug }}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardHeader className="flex flex-row items-center gap-3">
                      {t.logo_url ? (
                        <img src={t.logo_url} className="h-10 w-10 rounded" alt="" />
                      ) : (
                        <div className="grid h-10 w-10 place-items-center rounded bg-primary/10 text-primary">
                          <Users className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base">{t.name}</CardTitle>
                        {t.city && <p className="text-xs text-muted-foreground">{t.city}</p>}
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
              {(teams ?? []).length === 0 && (
                <p className="text-center text-muted-foreground">No teams approved yet.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </PageShell>
  );
}
