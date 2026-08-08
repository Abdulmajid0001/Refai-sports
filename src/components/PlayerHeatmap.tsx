import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flame } from "lucide-react";

type Pt = { x: number; y: number };

function buildHeatmap(points: Pt[], gridX = 24, gridY = 16) {
  const grid: number[][] = Array.from({ length: gridY }, () => Array(gridX).fill(0));
  for (const p of points) {
    const gx = Math.min(gridX - 1, Math.max(0, Math.floor((p.x / 100) * gridX)));
    const gy = Math.min(gridY - 1, Math.max(0, Math.floor((p.y / 100) * gridY)));
    grid[gy][gx] += 1;
  }
  let max = 0;
  for (const row of grid) for (const v of row) if (v > max) max = v;
  return { grid, max };
}

export function PlayerHeatmap({ matchId }: { matchId: string }) {
  const [memberId, setMemberId] = useState<string>("");

  const playersQ = useQuery({
    queryKey: ["heatmap-players", matchId],
    queryFn: async () => {
      const { data } = await supabase
        .from("player_heatmap_points")
        .select("member_id")
        .eq("match_id", matchId);
      const ids = Array.from(new Set((data ?? []).map((d) => d.member_id)));
      if (!ids.length) return [];
      const { data: members } = await supabase
        .from("team_members")
        .select("id, display_name, jersey_number")
        .in("id", ids);
      return members ?? [];
    },
  });

  const pointsQ = useQuery({
    queryKey: ["heatmap-points", matchId, memberId],
    enabled: !!memberId,
    queryFn: async () => {
      const { data } = await supabase
        .from("player_heatmap_points")
        .select("x, y")
        .eq("match_id", matchId)
        .eq("member_id", memberId)
        .limit(2000);
      return (data ?? []).map((p) => ({ x: Number(p.x), y: Number(p.y) })) as Pt[];
    },
    refetchInterval: 20_000,
  });

  const { grid, max } = useMemo(() => buildHeatmap(pointsQ.data ?? []), [pointsQ.data]);
  const players = playersQ.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="h-4 w-4 text-primary" /> Heatmap
        </CardTitle>
        <Select value={memberId} onValueChange={setMemberId}>
          <SelectTrigger className="h-8 w-48 text-xs">
            <SelectValue placeholder="Select player..." />
          </SelectTrigger>
          <SelectContent>
            {players.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.jersey_number != null ? `#${p.jersey_number} ` : ""}
                {p.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {players.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tracking points logged yet.</p>
        ) : !memberId ? (
          <p className="text-sm text-muted-foreground">Pick a player to view their heatmap.</p>
        ) : (
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-md border bg-emerald-900/40">
            <svg viewBox="0 0 100 66.67" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
              <rect x="0.5" y="0.5" width="99" height="65.67" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="0.3" />
              <line x1="50" y1="0.5" x2="50" y2="66.17" stroke="white" strokeOpacity="0.4" strokeWidth="0.3" />
              <circle cx="50" cy="33.33" r="6" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="0.3" />
              <rect x="0.5" y="20" width="14" height="26.67" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="0.3" />
              <rect x="85.5" y="20" width="14" height="26.67" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="0.3" />
            </svg>
            <div
              className="absolute inset-0 grid"
              style={{ gridTemplateColumns: `repeat(${grid[0]?.length ?? 0}, 1fr)`, gridTemplateRows: `repeat(${grid.length}, 1fr)` }}
            >
              {grid.flatMap((row, y) =>
                row.map((v, x) => {
                  const intensity = max ? v / max : 0;
                  const bg =
                    intensity === 0
                      ? "transparent"
                      : `rgba(${Math.round(255 * Math.min(1, intensity * 1.5))}, ${Math.round(140 * (1 - intensity))}, 0, ${0.15 + 0.55 * intensity})`;
                  return <div key={`${x}-${y}`} style={{ background: bg }} />;
                })
              )}
            </div>
          </div>
        )}
        {memberId && (pointsQ.data?.length ?? 0) > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">{pointsQ.data!.length} tracked positions</p>
        )}
      </CardContent>
    </Card>
  );
}
