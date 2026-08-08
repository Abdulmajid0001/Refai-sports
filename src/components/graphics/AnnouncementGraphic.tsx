import { AlertTriangle, Bell, Info, X, AlertCircle, Radio, Thermometer, Zap } from "lucide-react";

interface Props {
  payload: Record<string, any>;
  onDismiss: () => void;
}

export function AnnouncementGraphic({ payload, onDismiss }: Props) {
  const {
    type = "info",
    headline,
    message,
    icon,
    priority = "normal",
    showDismiss = true,
  } = payload;

  const priorityConfig: Record<string, { bg: string; border: string; iconColor: string }> = {
    low: { bg: "from-slate-800 to-slate-900", border: "border-slate-600", iconColor: "text-slate-400" },
    normal: { bg: "from-blue-900 to-slate-900", border: "border-blue-500", iconColor: "text-blue-400" },
    high: { bg: "from-amber-900 to-slate-900", border: "border-amber-500", iconColor: "text-amber-400" },
    urgent: { bg: "from-red-900 to-slate-900", border: "border-red-500", iconColor: "text-red-400" },
  };

  const typeIcons: Record<string, any> = {
    info: Info,
    hydration: Thermometer,
    weather: CloudLightning,
    emergency: AlertTriangle,
    technical: Radio,
    alert: AlertCircle,
    match: Zap,
    announcement: Bell,
  };

  const config = priorityConfig[priority] || priorityConfig.normal;
  const IconComponent = icon ? typeIcons[icon] || Info : typeIcons[type] || Bell;

  return (
    <div className="relative" onClick={onDismiss}>
      <div className={`min-w-[360px] max-w-lg rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br ${config.bg} border ${config.border}`}>
        {/* Header */}
        <div className="px-5 py-3 flex items-center gap-3 border-b border-white/10">
          <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
          <span className="text-white font-bold flex-1">
            {type === "hydration" ? "Hydration Break" :
             type === "weather" ? "Weather Update" :
             type === "emergency" ? "Emergency Alert" :
             type === "technical" ? "Technical Notice" :
             type === "alert" ? "Match Alert" : "Announcement"}
          </span>
          {showDismiss && (
            <button
              onClick={(e) => { e.stopPropagation(); onDismiss(); }}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-5 py-4 text-white">
          {headline && (
            <div className="font-bold text-lg mb-1">{headline}</div>
          )}
          {message && (
            <div className="text-sm opacity-80">{message}</div>
          )}
        </div>

        {/* Priority indicator for urgent */}
        {priority === "urgent" && (
          <div className="px-5 py-2 bg-red-950 flex items-center gap-2 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs text-red-300 uppercase tracking-widest">Urgent - Attention Required</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CloudLightning({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" />
      <polyline points="13 11 9 17 15 17 11 23" />
    </svg>
  );
}
