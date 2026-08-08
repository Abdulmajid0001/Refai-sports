import { RotateCw, Monitor, Radio, Play } from "lucide-react";

interface Props {
  payload: Record<string, any>;
  onDismiss: () => void;
}

export function ReplayIntroGraphic({ payload, onDismiss }: Props) {
  const { leagueName, leagueLogo, sponsorName, sponsorLogo, type = "standard" } = payload;

  return (
    <div className="relative" onClick={onDismiss}>
      <div className="min-w-[400px] rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-cyan-950 via-slate-900 to-blue-950">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />

        {/* League logo with rotation animation */}
        <div className="relative py-8 text-center">
          {leagueLogo ? (
            <div className="w-24 h-24 mx-auto animate-spin" style={{ animationDuration: "3s" }}>
              <img src={leagueLogo} alt="" className="w-full h-full object-contain rounded-xl" />
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto rounded-xl bg-cyan-500/20 flex items-center justify-center animate-pulse">
              <TV className="w-12 h-12 text-cyan-400" />
            </div>
          )}
        </div>

        {/* Replay text */}
        <div className="relative px-6 py-4 text-center">
          <div className="text-3xl font-bold text-white tracking-widest animate-pulse">
            REPLAY
          </div>
          {leagueName && (
            <div className="text-sm text-cyan-300 mt-1">{leagueName}</div>
          )}
        </div>

        {/* Sponsor bumper */}
        {sponsorName && (
          <div className="px-6 py-3 bg-slate-800/50 flex items-center justify-center gap-2">
            {sponsorLogo && (
              <img src={sponsorLogo} alt="" className="w-8 h-8 object-contain" />
            )}
            <span className="text-xs text-slate-400">
              Replay sponsored by <span className="text-white font-medium">{sponsorName}</span>
            </span>
          </div>
        )}

        {/* Footer with play indicator */}
        <div className="px-6 py-3 bg-cyan-900/30 flex items-center justify-center gap-2">
          <Play className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-cyan-300">Starting replay...</span>
        </div>
      </div>
    </div>
  );
}

function TV({ className }: { className?: string }) {
  return <Monitor className={className} />;
}
