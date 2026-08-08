import React from 'react';
import { X } from 'lucide-react';

export function MatchStatsGraphic({ payload, onDismiss }: { payload: Record<string, any>; onDismiss: () => void }) {
  const { homeTeamName, awayTeamName, stats = [] } = payload;

  return (
    <div className="relative w-full max-w-2xl mx-4 bg-[#0a0a1a] rounded-2xl border border-cyan-500/30 p-8 backdrop-blur-xl shadow-[0_0_30px_rgba(0,255,255,0.15)]">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <p className="text-cyan-400 font-display uppercase tracking-wider text-center text-sm mb-6">Match Statistics</p>

        {/* Stats */}
        <div className="space-y-4">
          {stats.map((stat: any, idx: number) => {
            const homeVal = stat.home || 0;
            const awayVal = stat.away || 0;
            const maxVal = Math.max(homeVal, awayVal) || 100;
            const homeWidth = (homeVal / maxVal) * 100;
            const awayWidth = (awayVal / maxVal) * 100;

            return (
              <div key={idx}>
                {/* Label */}
                <p className="text-white/70 text-xs font-display uppercase tracking-wide mb-2">{stat.label}</p>

                {/* Bars */}
                <div className="flex items-center gap-3">
                  {/* Home Bar */}
                  <div className="flex-1 text-right">
                    <div className="bg-slate-950/60 rounded-l-lg h-6 border border-r-0 border-cyan-500/20 flex items-center justify-end pr-3">
                      <span className="text-white text-xs font-bold">{homeVal}</span>
                    </div>
                  </div>

                  {/* Center Divider */}
                  <div className="w-1 h-6 bg-cyan-500/30" />

                  {/* Away Bar */}
                  <div className="flex-1">
                    <div className="bg-slate-950/60 rounded-r-lg h-6 border border-l-0 border-cyan-500/20 flex items-center justify-start pl-3">
                      <span className="text-white text-xs font-bold">{awayVal}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Team Names */}
        <div className="flex justify-between mt-8 pt-6 border-t border-cyan-500/20">
          <p className="text-cyan-300 font-display uppercase tracking-wider text-sm">{homeTeamName}</p>
          <p className="text-emerald-300 font-display uppercase tracking-wider text-sm">{awayTeamName}</p>
        </div>
    </div>
  );
}
