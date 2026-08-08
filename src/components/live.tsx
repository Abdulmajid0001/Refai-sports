import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/live")({ component: LivePage });

function LivePage() {
  const { data } = useQuery({
    queryKey: ["matches", "live"],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("id, status, home_team_id, away_team_id, home_score, away_score, kickoff_at")
        .in("status", ["live", "halftime"])
        .order("kickoff_at", { ascending: true });
      const ids = Array.from(new Set((data ?? []).flatMap((m) => [m.home_team_id, m.away_team_id])));
      const { data: ts } = ids.length ? await supabase.from("teams").select("id, name").in("id", ids) : { data: [] };
      const map = new Map((ts ?? []).map((t) => [t.id, t]));
      return (data ?? []).map((m) => ({ ...m, home: map.get(m.home_team_id), away: map.get(m.away_team_id) }));
    },
    refetchInterval: 15000,
  });

  return (
    <PageShell>
      <section className="border-b bg-gradient-to-b from-destructive/10 to-transparent">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-14">
          <Radio className="h-6 w-6 text-destructive animate-pulse" />
          <h1 className="font-display text-3xl font-bold md:text-4xl">Live now</h1>
        </div>
      </section>
      <section className="mx-auto max-w-7xl space-y-2 px-4 py-8">
        {(data ?? []).length === 0 ? (
          <p className="text-center text-muted-foreground">No matches live right now. Check the matches page for upcoming kickoffs.</p>
        ) : (data ?? []).map((m) => (
          <Link key={m.id} to="/matches/$id" params={{ id: m.id }}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <Badge variant="destructive">LIVE</Badge>
                <div className="font-medium">
                  {m.home?.name} <span className="mx-2 rounded bg-muted px-2 py-1 font-bold">{m.home_score} - {m.away_score}</span> {m.away?.name}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
