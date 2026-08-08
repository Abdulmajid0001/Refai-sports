import { Trophy, Clock, Star } from "lucide-react";

interface Props {
  payload: Record<string, any>;
  onDismiss: () => void;
}

export function FulltimeStatsGraphic({ payload, onDismiss }: Props) {
  const { homeTeamName, awayTeamName, homeScore, awayScore, stats = [], manOfTheMatch, scorers = [] } = payload;

  const defaultStats = [
    { label: "Possession", home: 52, away: 48, unit: "%" },
    { label: "Shots", home: 15, away: 11, unit: "" },
    { label: "On Target", home: 6, away: 4, unit: "" },
    { label: "Corners", home: 8, away: 6, unit: "" },
    { label: "Fouls", home: 14, away: 16, unit: "" },
    { label: "Yellow Cards", home: 2, away: 3, unit: "" },
    { label: "Passes", home: 423, away: 356, unit: "" },
    { label: "Pass Accuracy", home: 85, away: 78, unit: "%" },
  ];

  const displayStats = stats.length > 0 ? stats : defaultStats;

  return (
    <div className="relative" onClick={onDismiss}>
      <div className="min-w-[440px] rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-800 via-green-950 to-slate-900">
        {/* Header with Final Score */}
        <div className="px-6 py-5 bg-gradient-to-r from-green-700 to-emerald-700 text-white text-center">
          <div className="text-xs uppercase tracking-widest opacity-80 mb-1">Full Time</div>
          <div className="flex items-center justify-center gap-6">
            <div className="text-right">
              <div className="font-bold text-lg">{homeTeamName || "Home"}</div>
            </div>
            <div className="text-5xl font-bold">
              {homeScore ?? 0} - {awayScore ?? 0}
            </div>
            <div className="text-left">
              <div className="font-bold text-lg">{awayTeamName || "Away"}</div>
            </div>
          </div>
          <div className="mt-2 text-xs opacity-60">90'</div>
        </div>

        {/* Man of the Match */}
        {manOfTheMatch && (
          <div className="px-6 py-3 bg-yellow-500/20 flex items-center gap-3">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-300 text-sm">Man of the Match:</span>
            <span className="text-white font-bold">{manOfTheMatch}</span>
          </div>
        )}

        {/* Scorers */}
        {scorers.length > 0 && (
          <div className="px-6 py-3 bg-black/20 border-b border-green-700/30">
            <div className="flex gap-8">
              <div className="flex-1 text-sm">
                {scorers.filter((s: any) => s.side === "home").map((s: any, i: number) => (
                  <div key={i} className="text-white">{s.minute}' {s.name}</div>
                ))}
              </div>
              <div className="flex-1 text-sm text-right">
                {scorers.filter((s: any) => s.side === "away").map((s: any, i: number) => (
                  <div key={i} className="text-white">{s.name} {s.minute}'</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="px-6 py-4 space-y-2">
          {displayStats.map((stat: any, i: number) => {
            const total = (stat.home || 0) + (stat.away || 0) || 1;
            const homeWidth = ((stat.home || 0) / total) * 100;

            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-white">
                  <span className="font-mono">{stat.home}{stat.unit}</span>
                  <span className="text-green-300">{stat.label}</span>
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

        {/* Footer */}
        <div className="px-6 py-3 bg-black/30 flex items-center justify-center gap-2 text-green-400">
          <Trophy className="w-4 h-4" />
          <span className="text-sm font-medium">Match Complete</span>
        </div>
      </div>
    </div>
  );
}
