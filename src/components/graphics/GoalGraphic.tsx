import { Zap, Clock } from "lucide-react";

interface Props {
  payload: Record<string, any>;
  onDismiss: () => void;
}

export function GoalGraphic({ payload, onDismiss }: Props) {
  const {
    teamName,
    teamLogo,
    teamColor,
    playerName,
    playerNumber,
    minute,
    goalType = "open_play",
    assist,
    homeScore,
    awayScore,
    homeTeamName,
    awayTeamName,
  } = payload;

  const goalTypeLabels: Record<string, string> = {
    open_play: "Open Play",
    penalty: "Penalty",
    header: "Header",
    free_kick: "Free Kick",
    own_goal: "Own Goal",
    volley: "Volley",
    long_range: "Long Range",
  };

  const bgStyle = teamColor ? { background: `linear-gradient(135deg, ${teamColor}dd, ${teamColor}88)` } : {};

  return (
    <div className="relative" onClick={onDismiss}>
      <div className="min-w-[320px] max-w-md rounded-xl overflow-hidden shadow-2xl" style={bgStyle}>
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-white/10 to-transparent animate-pulse" />

        {/* Header */}
        <div className="relative px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            {teamLogo && (
              <img src={teamLogo} alt="" className="w-12 h-12 rounded-full bg-white/20 p-1" />
            )}
            <div className="flex-1">
              <div className="text-xs uppercase tracking-widest opacity-80">Goal</div>
              <div className="text-2xl font-bold">{teamName}</div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-70">{minute}'</div>
            </div>
          </div>
        </div>

        {/* Scorer */}
        <div className="relative bg-black/30 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold">
              {playerNumber || "?"}
            </div>
            <div className="flex-1 text-white">
              <div className="text-xl font-bold">{playerName || "Goal!"}</div>
              <div className="text-sm opacity-70">{goalTypeLabels[goalType] || goalType}</div>
              {assist && <div className="text-xs opacity-50">Assist: {assist}</div>}
            </div>
            <Zap className="w-10 h-10 text-yellow-400 animate-bounce" />
          </div>
        </div>

        {/* Score */}
        <div className="relative px-6 py-3 bg-black/50 text-center">
          <div className="flex items-center justify-center gap-4 text-white">
            <span className="text-lg font-bold">{homeTeamName}</span>
            <span className="text-3xl font-bold tabular-nums">{homeScore} - {awayScore}</span>
            <span className="text-lg font-bold">{awayTeamName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
