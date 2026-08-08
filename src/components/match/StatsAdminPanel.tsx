import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
};

export function StatsAdminPanel({ matchId, homeTeamId, awayTeamId }: Props) {
  const statsQ = useQuery({
    queryKey: ["match-stats-admin", matchId],
    queryFn: async () => {
      const { data } = await supabase
        .from("player_match_stats")
        .select("*, team_members(player_number)")
        .eq("match_id", matchId);
      return data ?? [];
    },
    refetchInterval: 30000,
  });

  const homeStats = (statsQ.data ?? []).filter((s: any) => s.team_id === homeTeamId);
  const awayStats = (statsQ.data ?? []).filter((s: any) => s.team_id === awayTeamId);

  const sumField = (arr: any[], field: string) =>
    arr.reduce((acc: number, s: any) => acc + (s[field] || 0), 0);

  const statRows = [
    { label: "Goals", home: sumField(homeStats, "goals"), away: sumField(awayStats, "goals") },
    { label: "Assists", home: sumField(homeStats, "assists"), away: sumField(awayStats, "assists") },
    { label: "Shots", home: sumField(homeStats, "shots"), away: sumField(awayStats, "shots") },
    { label: "Passes", home: sumField(homeStats, "passes"), away: sumField(awayStats, "passes") },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Stats Admin</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="font-semibold text-blue-400">Home</div>
          <div className="text-center text-muted-foreground">Stat</div>
          <div className="text-right font-semibold text-red-400">Away</div>
          {statRows.map((row) => (
            <>
              <div key={`${row.label}-h`} className="font-mono">{row.home}</div>
              <div key={row.label} className="text-center">{row.label}</div>
              <div key={`${row.label}-a`} className="text-right font-mono">{row.away}</div>
            </>
          ))}
        </div>
        {statsQ.isLoading && <p className="text-xs text-muted-foreground">Loading stats...</p>}
      </CardContent>
    </Card>
  );
}
