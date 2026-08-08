import { BarChart3, TrendingUp } from "lucide-react";

interface Props {
  payload: Record<string, any>;
  onDismiss: () => void;
}

export function MatchStatsGraphic({ payload, onDismiss }: Props) {
  const { homeTeamName, awayTeamName, stats = [] } = payload;

  const defaultStats = [
    { label: "Possession", home: 55, away: 45, unit: "%" },
    { label: "Shots", home: 12, away: 8, unit: "" },
    { label: "On Target", home: 5, away: 3, unit: "" },
    { label: "Corners", home: 6, away: 4, unit: "" },
    { label: "Fouls", home: 10, away: 12, unit: "" },
    { label: "Yellow Cards", home: 1, away: 2, unit: "" },
  ];

  const displayStats = stats.length > 0 ? stats : defaultStats;

  return (
    <div className="relative" onClick={onDismiss}>
      <div className="min-w-[360px] rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-800 to-slate-900">
        {/* Header */}
        <div className="px-6 py-3 bg-pink-600 flex items-center gap-2 text-white">
          <BarChart3 className="w-5 h-5" />
          <span className="font-bold">Match Statistics</span>
        </div>

        {/* Teams */}
        <div className="px-6 py-3 bg-black/20 flex items-center justify-between text-white">
          <span className="font-bold">{homeTeamName || "Home"}</span>
          <span className="text-xs text-slate-400">vs</span>
          <span className="font-bold">{awayTeamName || "Away"}</span>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 space-y-3">
          {displayStats.map((stat: any, i: number) => {
            const total = (stat.home || 0) + (stat.away || 0) || 1;
            const homeWidth = ((stat.home || 0) / total) * 100;
            const awayWidth = ((stat.away || 0) / total) * 100;

            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-white">
                  <span className="font-mono">{stat.home}{stat.unit}</span>
                  <span>{stat.label}</span>
                  <span className="font-mono">{stat.away}{stat.unit}</span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-slate-700">
                  <div
                    className="bg-blue-500 transition-all duration-500"
                    style={{ width: `${homeWidth}%` }}
                  />
                  <div
                    className="bg-red-500 transition-all duration-500"
                    style={{ width: `${awayWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-2 bg-black/30 flex items-center justify-center gap-1 text-xs text-slate-400">
          <TrendingUp className="w-3 h-3" />
          <span>Live Statistics</span>
        </div>
      </div>
    </div>
  );
}
