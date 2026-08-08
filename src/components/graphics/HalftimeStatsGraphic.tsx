import { Clock, TrendingUp } from "lucide-react";

interface Props {
  payload: Record<string, any>;
  onDismiss: () => void;
}

export function HalftimeStatsGraphic({ payload, onDismiss }: Props) {
  const { homeTeamName, awayTeamName, homeScore, awayScore, stats = [], highlights = [] } = payload;

  const defaultStats = [
    { label: "Possession", home: 52, away: 48, unit: "%" },
    { label: "Shots", home: 8, away: 5, unit: "" },
    { label: "On Target", home: 3, away: 2, unit: "" },
    { label: "Corners", home: 4, away: 3, unit: "" },
    { label: "Fouls", home: 7, away: 9, unit: "" },
    { label: "Offsides", home: 1, away: 2, unit: "" },
  ];

  const displayStats = stats.length > 0 ? stats : defaultStats;

  return (
    <div className="relative" onClick={onDismiss}>
      <div className="min-w-[420px] rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-amber-900 via-slate-900 to-amber-950">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-600 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span className="font-bold text-lg">Half Time</span>
          </div>
          <div className="text-2xl font-bold">
            {homeScore ?? 0} - {awayScore ?? 0}
          </div>
        </div>

        {/* Teams */}
        <div className="px-6 py-3 bg-black/20 flex items-center justify-between text-white border-b border-amber-700/30">
          <span className="font-bold">{homeTeamName || "Home"}</span>
          <span className="text-xs text-amber-400 uppercase">45'</span>
          <span className="font-bold">{awayTeamName || "Away"}</span>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 space-y-2">
          {displayStats.map((stat: any, i: number) => {
            const total = (stat.home || 0) + (stat.away || 0) || 1;
            const homeWidth = ((stat.home || 0) / total) * 100;

            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-white">
                  <span className="font-mono">{stat.home}{stat.unit}</span>
                  <span className="text-amber-300">{stat.label}</span>
                  <span className="font-mono">{stat.away}{stat.unit}</span>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-700">
                  <div className="bg-blue-500" style={{ width: `${homeWidth}%` }} />
                  <div className="bg-red-500" style={{ width: `${100 - homeWidth}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="px-6 py-3 bg-black/20 border-t border-amber-700/30">
            <div className="text-xs text-amber-400 mb-2">Key Events</div>
            <div className="space-y-1 text-xs text-white">
              {highlights.slice(0, 4).map((h: string, i: number) => (
                <div key={i}>{h}</div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-2 bg-black/30 flex items-center justify-center gap-1 text-xs text-amber-400">
          <TrendingUp className="w-3 h-3" />
          <span>Half-Time Statistics</span>
        </div>
      </div>
    </div>
  );
}
