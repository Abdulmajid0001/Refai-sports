interface Props {
  payload: Record<string, any>;
  onDismiss: () => void;
}

export function CoachIntroGraphic({ payload, onDismiss }: Props) {
  const { coachName, nationality, formation, photoUrl, teamName, teamLogo } = payload;

  return (
    <div className="relative" onClick={onDismiss}>
      <div className="min-w-[320px] rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-800 to-slate-900">
        {/* Header */}
        <div className="px-6 py-3 bg-orange-600 text-white flex items-center gap-2">
          <span className="font-bold">Coach Profile</span>
          {teamLogo && <img src={teamLogo} alt="" className="w-6 h-6 rounded ml-auto" />}
        </div>

        {/* Photo and info */}
        <div className="p-6 flex items-center gap-4">
          {photoUrl ? (
            <img src={photoUrl} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-orange-500" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-orange-500/20 flex items-center justify-center text-3xl font-bold text-orange-400">
              {coachName?.[0] || "C"}
            </div>
          )}
          <div className="text-white flex-1">
            <div className="text-xl font-bold">{coachName || "Coach"}</div>
            {nationality && <div className="text-sm text-slate-400">{nationality}</div>}
            {teamName && <div className="text-sm text-orange-400 mt-1">{teamName}</div>}
          </div>
        </div>

        {/* Formation */}
        {formation && (
          <div className="px-6 py-3 bg-black/30 flex items-center justify-between text-white">
            <span className="text-sm text-slate-400">Preferred Formation</span>
            <span className="text-lg font-bold text-orange-400">{formation}</span>
          </div>
        )}
      </div>
    </div>
  );
}
