import { Tv, Clock } from "lucide-react";

interface Props {
  payload: Record<string, any>;
  onDismiss: () => void;
}

export function ScoreboardGraphic({ payload, onDismiss }: Props) {
  const {
    homeTeamName,
    awayTeamName,
    homeTeamLogo,
    awayTeamLogo,
    homeScore,
    awayScore,
    minute,
    period,
    homeColor,
    awayColor,
  } = payload;

  return (
    <div className="w-full px-4 py-2" onClick={onDismiss}>
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Home team */}
          <div className="flex items-center gap-3 flex-1">
            {homeTeamLogo && (
              <img src={homeTeamLogo} alt="" className="w-10 h-10 object-contain" />
            )}
            <span className="text-white font-bold text-sm truncate">{homeTeamName || "Home"}</span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-2 px-4 py-1 bg-black/30 rounded-lg">
            <span className="text-3xl font-bold text-white tabular-nums">{homeScore ?? 0}</span>
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-500">-</span>
              {minute !== undefined && (
                <div className="flex items-center gap-1 text-red-500">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-mono">{minute}'</span>
                </div>
              )}
            </div>
            <span className="text-3xl font-bold text-white tabular-nums">{awayScore ?? 0}</span>
          </div>

          {/* Away team */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <span className="text-white font-bold text-sm truncate">{awayTeamName || "Away"}</span>
            {awayTeamLogo && (
              <img src={awayTeamLogo} alt="" className="w-10 h-10 object-contain" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
