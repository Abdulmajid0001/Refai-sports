import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Radio } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { HighlightsList } from "@/components/HighlightsList";
import { PlayerStatsTable } from "@/components/PlayerStatsTable";
import { PlayerHeatmap } from "@/components/PlayerHeatmap";
import { LiveStreamRoom } from "@/components/LiveStreamRoom";



export const Route = createFileRoute("/matches/$id")({ component: MatchDetail });

function MatchDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();


  const matchQ = useQuery({
    queryKey: ["match", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("matches").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const [{ data: home }, { data: away }, { data: league }] = await Promise.all([
        supabase.from("teams").select("id, name, slug, logo_url, primary_color").eq("id", data.home_team_id).maybeSingle(),
        supabase.from("teams").select("id, name, slug, logo_url, primary_color").eq("id", data.away_team_id).maybeSingle(),
        supabase.from("leagues").select("id, name, slug").eq("id", data.league_id).maybeSingle(),
      ]);
      return { ...data, home, away, league };
    },
  });

  const eventsQ = useQuery({
    queryKey: ["match-events", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("match_events")
        .select("id, minute, extra_minute, type, detail, team_id, created_at")
        .eq("match_id", id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`match-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "match_events", filter: `match_id=eq.${id}` }, () => {
        eventsQ.refetch();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${id}` }, () => {
        matchQ.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const m = matchQ.data;
  if (matchQ.isLoading) return <PageShell><div className="mx-auto max-w-5xl px-4 py-10">Loading…</div></PageShell>;
  if (!m) return <PageShell><div className="mx-auto max-w-5xl px-4 py-10">Match not found.</div></PageShell>;

  return (
    <PageShell>
      <section className="border-b bg-gradient-to-b from-primary/10 to-transparent">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              {m.league?.name} {m.matchday && `• Matchday ${m.matchday}`}
            </div>
            {user && (
              <Button asChild size="sm" variant="outline">
                <Link to="/referee/$matchId" params={{ matchId: id }}>
                  <Radio className="mr-1 h-4 w-4" />Referee console
                </Link>
              </Button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 items-center gap-4">
            <div className="flex flex-col items-center text-center">
              {m.home?.logo_url && <img src={m.home.logo_url} className="h-16 w-16 rounded object-cover" alt="" />}
              <div className="mt-2 font-display text-xl font-bold">{m.home?.name ?? "TBD"}</div>
            </div>
            <div className="text-center">
              <Badge variant={m.status === "live" ? "destructive" : "outline"} className="capitalize">{m.status}</Badge>
              <div className="mt-2 font-display text-5xl font-bold tabular-nums">
                {m.home_score} <span className="text-muted-foreground">–</span> {m.away_score}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {m.kickoff_at ? new Date(m.kickoff_at).toLocaleString() : "TBD"}
              </div>
              {m.venue && <div className="text-xs text-muted-foreground">{m.venue}</div>}
            </div>
            <div className="flex flex-col items-center text-center">
              {m.away?.logo_url && <img src={m.away.logo_url} className="h-16 w-16 rounded object-cover" alt="" />}
              <div className="mt-2 font-display text-xl font-bold">{m.away?.name ?? "TBD"}</div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-8 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Live timeline</CardTitle></CardHeader>
          <CardContent>
            {(eventsQ.data ?? []).length === 0 ? (
              <p className="text-muted-foreground">No events yet.</p>
            ) : (
              <ol className="space-y-3">
                {eventsQ.data!.map((e) => (
                  <li key={e.id} className="flex gap-3 border-l-2 border-primary pl-3">
                    <span className="w-12 font-mono text-sm tabular-nums">
                      {e.minute != null ? `${e.minute}${e.extra_minute ? `+${e.extra_minute}` : ""}'` : "—"}
                    </span>
                    <div>
                      <div className="text-sm font-medium capitalize">{e.type.replace(/_/g, " ")}</div>
                      {e.detail && <div className="text-sm text-muted-foreground">{e.detail}</div>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <HighlightsList matchId={id} />
        </div>
        {m.status === "live" && user && (
          <div className="lg:col-span-2">
            <LiveStreamRoom matchId={id} role="viewer" name={user.email ?? "Viewer"} />
          </div>
        )}
        <div className="lg:col-span-2">
          <PlayerStatsTable matchId={id} />
        </div>
        <div className="lg:col-span-2">
          <PlayerHeatmap matchId={id} />
        </div>
      </section>

    </PageShell>
  );
}
