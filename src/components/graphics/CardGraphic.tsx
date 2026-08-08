import { Shield, AlertTriangle } from "lucide-react";

interface Props {
  payload: Record<string, any>;
  onDismiss: () => void;
}

export function CardGraphic({ payload, onDismiss }: Props) {
  const {
    teamName,
    teamLogo,
    teamColor,
    playerName,
    playerNumber,
    cardColor = "yellow",
    reason,
    minute,
  } = payload;

  const colorClass: Record<string, string> = {
    yellow: "from-yellow-500 to-yellow-600",
    second_yellow: "from-yellow-500 to-orange-500",
    red: "from-red-600 to-red-700",
  };

  const label: Record<string, string> = {
    yellow: "Yellow Card",
    second_yellow: "Second Yellow",
    red: "Red Card",
  };

  const reasonLabels: Record<string, string> = {
    dangerous_tackle: "Dangerous Tackle",
    handball: "Handball",
    dissent: "Dissent",
    violent_conduct: "Violent Conduct",
    time_wasting: "Time Wasting",
    unsporting_behavior: "Unsporting Behavior",
  };

  return (
    <div className="relative" onClick={onDismiss}>
      <div className={`min-w-[280px] rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br ${colorClass[cardColor]}`}>
        {/* Card icon */}
        <div className="relative px-6 py-4">
          <div className="flex items-center gap-4">
            <Shield className="w-16 h-16 text-white animate-pulse" />
            <div className="flex-1 text-white">
              <div className="text-3xl font-bold">{label[cardColor]}</div>
              {minute && <div className="text-sm opacity-80">{minute}'</div>}
            </div>
          </div>
        </div>

        {/* Player info */}
        <div className="relative bg-black/30 px-6 py-4">
          <div className="flex items-center gap-4">
            {teamLogo && (
              <img src={teamLogo} alt="" className="w-10 h-10 rounded-full" />
            )}
            <div className="flex-1 text-white">
              <div className="font-bold text-lg">{playerName || "Player"}</div>
              {playerNumber && <div className="text-sm opacity-70">#{playerNumber}</div>}
              <div className="text-sm opacity-80">{teamName}</div>
            </div>
          </div>
        </div>

        {/* Reason */}
        {reason && (
          <div className="bg-black/50 px-6 py-3 flex items-center gap-2 text-white/80">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{reasonLabels[reason] || reason}</span>
          </div>
        )}
      </div>
    </div>
  );
}
