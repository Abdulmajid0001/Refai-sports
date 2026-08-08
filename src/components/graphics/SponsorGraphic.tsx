import { Gift, Sparkles } from "lucide-react";

interface Props {
  payload: Record<string, any>;
  onDismiss: () => void;
}

export function SponsorGraphic({ payload, onDismiss }: Props) {
  const { name, logo, tagline, website, cta } = payload;

  return (
    <div className="relative" onClick={onDismiss}>
      <div className="min-w-[280px] rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-amber-100 via-white to-amber-50">
        {/* Animated border */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 animate-pulse opacity-30" />

        {/* Content */}
        <div className="relative p-6 text-center">
          {logo && (
            <img src={logo} alt={name} className="w-20 h-20 mx-auto mb-3 object-contain" />
          )}

          {name && (
            <div className="text-xl font-bold text-amber-900">{name}</div>
          )}

          {tagline && (
            <div className="text-sm text-amber-700 mt-1">{tagline}</div>
          )}

          {cta && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium text-sm">
              <Gift className="w-4 h-4" />
              {cta}
            </div>
          )}

          {website && (
            <div className="mt-2 text-xs text-amber-600">{website}</div>
          )}
        </div>

        {/* Sponsored badge */}
        <div className="px-4 py-2 bg-amber-200/50 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-600" />
          <span className="text-xs text-amber-800 uppercase tracking-widest">Sponsored</span>
        </div>
      </div>
    </div>
  );
}
