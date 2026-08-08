import { ArrowRightLeft } from "lucide-react";

interface Props {
  payload: Record<string, any>;
  onDismiss: () => void;
}

export function SubGraphic({ payload, onDismiss }: Props) {
  const {
    teamName,
    teamLogo,
    teamColor,
    outName,
    outNumber,
    inName,
    inNumber,
    minute,
    subsRemaining,
  } = payload;

  return (
    <div className="relative" onClick={onDismiss}>
      <div className="min-w-[300px] rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-800 to-slate-900">
        {/* Header */}
        <div className="px-6 py-3 bg-blue-600 text-white flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5" />
          <span className="font-bold">Substitution</span>
          {minute && <span className="ml-auto text-sm opacity-80">{minute}'</span>}
        </div>

        {/* Team */}
        <div className="px-6 py-2 border-b border-slate-700 flex items-center gap-2">
          {teamLogo && <img src={teamLogo} alt="" className="w-6 h-6 rounded" />}
          <span className="text-white font-medium">{teamName}</span>
          {subsRemaining !== undefined && (
            <span className="ml-auto text-xs text-slate-400">{subsRemaining} subs left</span>
          )}
        </div>

        {/* Out */}
        <div className="px-6 py-3 flex items-center gap-3 bg-red-900/20">
          <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold">
            {outNumber || "?"}
          </div>
          <div className="flex-1 text-white">
            <div className="text-sm text-red-400">OUT</div>
            <div className="font-medium">{outName || "Player"}</div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center py-1">
          <ArrowRightLeft className="w-5 h-5 text-blue-400 rotate-90" />
        </div>

        {/* In */}
        <div className="px-6 py-3 flex items-center gap-3 bg-green-900/20">
          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
            {inNumber || "?"}
          </div>
          <div className="flex-1 text-white">
            <div className="text-sm text-green-400">IN</div>
            <div className="font-medium">{inName || "Player"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
