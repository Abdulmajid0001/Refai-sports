import { Shield, Monitor, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface Props {
  payload: Record<string, any>;
  onDismiss: () => void;
}

export function VARGraphic({ payload, onDismiss }: Props) {
  const { phase = "check", incidentReason, result, minute } = payload;

  const phaseConfig: Record<string, { bg: string; icon: any; label: string }> = {
    check: {
      bg: "from-cyan-900 to-cyan-950",
      icon: AlertTriangle,
      label: "VAR CHECK",
    },
    pending: {
      bg: "from-yellow-900 to-yellow-950",
      icon: Monitor,
      label: "VAR REVIEW",
    },
    result: {
      bg: "from-green-900 to-green-950",
      icon: CheckCircle,
      label: "VAR DECISION",
    },
  };

  const resultConfig: Record<string, { label: string; icon: any; color: string }> = {
    penalty_awarded: { label: "Penalty Awarded", icon: CheckCircle, color: "text-green-400" },
    no_penalty: { label: "No Penalty", icon: XCircle, color: "text-red-400" },
    goal_confirmed: { label: "Goal Confirmed", icon: CheckCircle, color: "text-green-400" },
    goal_disallowed: { label: "Goal Disallowed", icon: XCircle, color: "text-red-400" },
  };

  const config = phaseConfig[phase] || phaseConfig.check;
  const Icon = config.icon;

  return (
    <div className="relative" onClick={phase === "result" ? onDismiss : undefined}>
      <div className={`min-w-[320px] rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br ${config.bg}`}>
        {/* Header */}
        <div className="px-6 py-6 text-center text-white">
          <div className="mb-4 animate-pulse">
            <Monitor className="w-16 h-16 mx-auto text-cyan-400" />
          </div>
          <div className="text-3xl font-bold tracking-widest animate-pulse">
            {config.label}
          </div>
          {minute && <div className="mt-2 text-sm opacity-70">{minute}'</div>}
        </div>

        {/* Incident */}
        {incidentReason && (
          <div className="px-6 py-4 bg-black/30 text-center">
            <Shield className="w-8 h-8 mx-auto mb-2 text-cyan-300" />
            <p className="text-white text-lg">{incidentReason}</p>
          </div>
        )}

        {/* Result */}
        {phase === "result" && result && (
          <div className="px-6 py-6 bg-black/40 text-center">
            <div className="flex items-center justify-center gap-3">
              {(() => {
                const r = resultConfig[result] || { label: result, icon: Shield, color: "text-cyan-400" };
                const RIcon = r.icon;
                return (
                  <>
                    <RIcon className={`w-10 h-10 ${r.color}`} />
                    <span className="text-2xl font-bold text-white">{r.label}</span>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-cyan-950/50 text-center">
          <span className="text-xs text-cyan-300 uppercase tracking-widest">
            Video Assistant Referee
          </span>
        </div>
      </div>
    </div>
  );
}
