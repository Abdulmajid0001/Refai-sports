import React from 'react';
import { X } from 'lucide-react';

export function GoalGraphic({ payload, onDismiss }: { payload: Record<string, any>; onDismiss: () => void }) {
  const {
    homeTeamName,
    awayTeamName,
    homeTeamLogo,
    awayTeamLogo,
    homeScore,
    awayScore,
    leagueLogo,
    scorers = [],
    minute,
  } = payload;

  return (
    <div className="relative w-full max-w-2xl mx-4 bg-[#0a0a1a] rounded-2xl border border-cyan-500/30 p-8 backdrop-blur-xl shadow-[0_0_30px_rgba(0,255,255,0.15)]">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition"
        >
          <X size={24} />
        </button>

        {/* League logo */}
        <div className="flex justify-center mb-6">
          {leagueLogo && <img src={leagueLogo} alt="League" className="h-12 opacity-80" />}
        </div>

        {/* Teams and Score */}
        <div className="flex items-center justify-between gap-4 mb-8">
          {/* Home Team */}
          <div className="flex-1 bg-slate-950/50 rounded-full px-4 py-3 text-center border border-emerald-500/20">
            {homeTeamLogo && <img src={homeTeamLogo} alt={homeTeamName} className="h-8 mb-2 mx-auto" />}
            <p className="text-white font-display uppercase tracking-wider text-sm">{homeTeamName}</p>
          </div>

          {/* Score */}
          <div className="text-center">
            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_20px_rgba(0,255,255,0.3)]">
              {homeScore}
            </div>
            <div className="text-xs text-cyan-300 mt-1">{minute}'</div>
            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              {awayScore}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex-1 bg-slate-950/50 rounded-full px-4 py-3 text-center border border-emerald-500/20">
            {awayTeamLogo && <img src={awayTeamLogo} alt={awayTeamName} className="h-8 mb-2 mx-auto" />}
            <p className="text-white font-display uppercase tracking-wider text-sm">{awayTeamName}</p>
          </div>
        </div>

        {/* Scorers */}
        <div className="space-y-3">
          {scorers.map((scorer: any, idx: number) => (
            <div key={idx} className="bg-slate-950/40 rounded-lg px-4 py-2 border border-cyan-500/20">
              <p className="text-white font-display uppercase tracking-wide text-sm">
                {scorer.playerName}
                {scorer.playerNumber && ` #${scorer.playerNumber}`}
              </p>
              <p className="text-xs text-cyan-300">
                {scorer.minute}' · {scorer.goalType?.replace(/_/g, ' ') || 'goal'}
              </p>
              {scorer.assist && <p className="text-xs text-emerald-300">Assist: {scorer.assist}</p>}
            </div>
          ))}
        </div>
    </div>
  );
}
