import React from 'react';
import { X } from 'lucide-react';

export function CardGraphic({ payload, onDismiss }: { payload: Record<string, any>; onDismiss: () => void }) {
  const { teamName, teamLogo, playerName, playerNumber, minute, cardColor, reason } = payload;

  const isRed = cardColor === 'red' || cardColor === 'second_yellow';
  const cardBgColor = isRed ? 'bg-red-600' : 'bg-yellow-400';
  const glowColor = isRed ? 'shadow-[0_0_30px_rgba(220,38,38,0.4)]' : 'shadow-[0_0_30px_rgba(250,204,21,0.4)]';

  return (
    <div className="relative w-full max-w-sm mx-4 bg-[#0a0a1a] rounded-2xl border border-cyan-500/30 p-8 backdrop-blur-xl shadow-[0_0_30px_rgba(0,255,255,0.15)]">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition"
        >
          <X size={24} />
        </button>

        {/* Team Logo */}
        <div className="flex justify-center mb-6">
          {teamLogo && <img src={teamLogo} alt={teamName} className="h-12" />}
        </div>

        {/* Card Icon */}
        <div className="flex justify-center mb-8">
          <div className={`w-24 h-32 ${cardBgColor} rounded-lg ${glowColor} flex items-center justify-center`} />
        </div>

        {/* Player Info */}
        <div className="text-center mb-6">
          <p className="text-white font-display uppercase tracking-wider text-xl mb-2">{playerName}</p>
          <p className="text-cyan-300 text-lg font-bold">#{playerNumber}</p>
        </div>

        {/* Details */}
        <div className="bg-slate-950/40 rounded-lg px-4 py-3 border border-cyan-500/20 mb-4">
          <p className="text-white font-display uppercase tracking-wide text-sm">
            {reason?.replace(/_/g, ' ')}
          </p>
          <p className="text-emerald-300 text-xs mt-1">{minute}'</p>
        </div>

        {/* Team Name */}
        <p className="text-center text-white/70 text-sm uppercase tracking-wider">{teamName}</p>
    </div>
  );
}
