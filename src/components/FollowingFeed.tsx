import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CalendarDays, Radio, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function FollowingFeed() {
  const { user } = useAuth();

  const q = useQuery({
    queryKey: ["following-feed", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: follows } = await supabase
        .from("user_follows")
        .select("target_type, target_id")
        .eq("user_id", user!.id);
      const teamIds = (follows ?? []).filter((f) => f.target_type === "team").map((f) => f.target_id);
      const leagueIds = (follows ?? []).filter((f) => f.target_type === "league").map((f) => f.target_id);

      if (teamIds.length === 0 && leagueIds.length === 0) {
        return { matches: [], teams: [], leagues: [] };
      }

      const filters: string[] = [];
      if (leagueIds.length) filters.push(`league_id.in.(${leagueIds.join(",")})`);
      if (teamIds.length) {
        filters.push(`home_team_id.in.(${teamIds.join(",")})`);
        filters.push(`away_team_id.in.(${teamIds.join(",")})`);
      }
      const { data: matches } = await supabase
        .from("matches")
        .select("id, status, kickoff_at, home_score, away_score, home_team_id, away_team_id, league_id")
        .or(filters.join(","))
        .order("kickoff_at", { ascending: false })
        .limit(15);

      const allTeamIds = Array.from(new Set([
        ...teamIds,
        ...(matches ?? []).flatMap((m) => [m.home_team_id, m.away_team_id]),
      ]));
      const allLeagueIds = Array.from(new Set([...leagueIds, ...(matches ?? []).map((m) => m.league_id)]));

      const [{ data: teams }, { data: leagues }] = await Promise.all([
        allTeamIds.length
          ? supabase.from("teams").select("id, name, slug, logo_url").in("id", allTeamIds)
          : Promise.resolve({ data: [] }),
        allLeagueIds.length
          ? supabase.from("leagues").select("id, name, slug").in("id", allLeagueIds)
          : Promise.resolve({ data: [] }),
      ]);

      return { matches: matches ?? [], teams: teams ?? [], leagues: leagues ?? [] };
    },
  });

  const teamById = new Map((q.data?.teams ?? []).map((t: any) => [t.id, t]));
  const leagueById = new Map((q.data?.leagues ?? []).map((l: any) => [l.id, l]));
  const followedTeams = (q.data?.teams ?? []).filter((t: any) =>
    (q.data?.matches ?? []).some((m: any) => m.home_team_id === t.id || m.away_team_id === t.id),
  );
  const followedLeagues = q.data?.leagues ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Radio className="h-5 w-5 text-primary" />
        <CardTitle>Following feed</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!user && <p className="text-sm text-muted-foreground">Sign in to see your personalized feed.</p>}
        {user && q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {user && !q.isLoading && (q.data?.matches.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">
            You're not following anyone yet. Visit a{" "}
            <Link to="/leagues" className="underline">league</Link> or{" "}
            <Link to="/teams" className="underline">team</Link> and tap Follow.
          </p>
        )}
        <ul className="divide-y">
          {(q.data?.matches ?? []).map((m: any) => {
            const home = teamById.get(m.home_team_id);
            const away = teamById.get(m.away_team_id);
            const league = leagueById.get(m.league_id);
            return (
              <li key={m.id} className="py-3">
                <Link to="/matches/$id" params={{ id: m.id }} className="block hover:bg-muted/40 rounded px-2 py-1 -mx-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{league?.name ?? "League"}</span>
                    <Badge variant={m.status === "live" ? "destructive" : "outline"} className="capitalize text-[10px]">
                      {m.status}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-medium">{home?.name ?? "TBD"}</span>
                    <span className="font-mono tabular-nums">{m.home_score} – {m.away_score}</span>
                    <span className="font-medium">{away?.name ?? "TBD"}</span>
                  </div>
                  {m.kickoff_at && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(m.kickoff_at).toLocaleString()}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {(followedLeagues.length > 0 || followedTeams.length > 0) && (
          <div className="border-t pt-3">
            <div className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Trophy className="h-3 w-3" /> Following
            </div>
            <div className="flex flex-wrap gap-2">
              {followedLeagues.map((l: any) => (
                <Link key={l.id} to="/leagues/$slug" params={{ slug: l.slug }}>
                  <Badge variant="secondary" className="hover:bg-primary/20">{l.name}</Badge>
                </Link>
              ))}
              {followedTeams.map((t: any) => (
                <Link key={t.id} to="/teams/$slug" params={{ slug: t.slug }}>
                  <Badge variant="outline" className="hover:bg-primary/20">{t.name}</Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
