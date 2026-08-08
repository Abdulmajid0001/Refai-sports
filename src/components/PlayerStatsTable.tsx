import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

export function PlayerStatsTable({ matchId }: { matchId: string }) {
  const q = useQuery({
    queryKey: ["player-stats", matchId],
    queryFn: async () => {
      const { data: stats } = await supabase
        .from("player_match_stats")
        .select("*")
        .eq("match_id", matchId)
        .order("rating", { ascending: false, nullsFirst: false });
      const memberIds = Array.from(new Set((stats ?? []).map((s) => s.member_id)));
      const teamIds = Array.from(new Set((stats ?? []).map((s) => s.team_id)));
      const [{ data: members }, { data: teams }] = await Promise.all([
        memberIds.length
          ? supabase.from("team_members").select("id, display_name, jersey_number, position").in("id", memberIds)
          : Promise.resolve({ data: [] as { id: string; display_name: string; jersey_number: number | null; position: string | null }[] }),
        teamIds.length
          ? supabase.from("teams").select("id, name, short_name").in("id", teamIds)
          : Promise.resolve({ data: [] as { id: string; name: string; short_name: string | null }[] }),
      ]);
      const mById = new Map((members ?? []).map((m) => [m.id, m]));
      const tById = new Map((teams ?? []).map((t) => [t.id, t]));
      return (stats ?? []).map((s) => ({ ...s, member: mById.get(s.member_id), team: tById.get(s.team_id) }));
    },
    refetchInterval: 30_000,
  });

  const rows = q.data ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-primary" /> Player ratings & stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No player stats logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                  <TableHead className="text-right">G</TableHead>
                  <TableHead className="text-right">A</TableHead>
                  <TableHead className="text-right">Sh</TableHead>
                  <TableHead className="text-right">Tkl</TableHead>
                  <TableHead className="text-right">Y/R</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.member?.jersey_number != null && (
                        <span className="mr-1 text-xs text-muted-foreground">#{s.member.jersey_number}</span>
                      )}
                      {s.member?.display_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.team?.short_name ?? s.team?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{s.minutes_played}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.goals}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.assists}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s.shots_on_target}/{s.shots}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{s.tackles}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">
                      {s.yellow_cards}/{s.red_cards}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.rating != null ? (
                        <Badge variant={Number(s.rating) >= 8 ? "default" : Number(s.rating) >= 6 ? "secondary" : "outline"}>
                          {Number(s.rating).toFixed(1)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
