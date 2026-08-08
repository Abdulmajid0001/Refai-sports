import { Users, Shield, Trophy } from "lucide-react";

interface Props {
  payload: Record<string, any>;
  onDismiss: () => void;
}

export function TeamIntroGraphic({ payload, onDismiss }: Props) {
  const { teamName, teamLogo, coach, captain, formation, country, teamColor } = payload;

  return (
    <div className="relative" onClick={onDismiss}>
      <div className="min-w-[360px] rounded-xl overflow-hidden shadow-2xl" style={{ background: teamColor ? `linear-gradient(135deg, ${teamColor}dd, ${teamColor}55)` : "linear-gradient(135deg, #1e40af, #3b82f6)" }}>
        {/* Header */}
        <div className="px-6 py-4 text-center text-white">
          {teamLogo && (
            <img src={teamLogo} alt="" className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/20 p-2" />
          )}
          <div className="text-2xl font-bold">{teamName || "Team"}</div>
          {country && <div className="text-sm opacity-80">{country}</div>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 px-6 py-4 bg-black/20">
          <div className="text-center text-white">
            <Shield className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
            <div className="text-xs opacity-70">Captain</div>
            <div className="font-bold text-sm">{captain || "N/A"}</div>
          </div>
          <div className="text-center text-white">
            <Users className="w-6 h-6 mx-auto mb-1 text-blue-400" />
            <div className="text-xs opacity-70">Coach</div>
            <div className="font-bold text-sm">{coach || "N/A"}</div>
          </div>
          <div className="text-center text-white">
            <Trophy className="w-6 h-6 mx-auto mb-1 text-green-400" />
            <div className="text-xs opacity-70">Formation</div>
            <div className="font-bold text-sm">{formation || "N/A"}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-black/30 text-center">
          <span className="text-xs text-white/60 uppercase tracking-widest">Team Introduction</span>
        </div>
      </div>
    </div>
  );
}
