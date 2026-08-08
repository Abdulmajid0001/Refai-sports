import React from 'react';
import { X } from 'lucide-react';

export function FormationGraphic({ payload, onDismiss }: { payload: Record<string, any>; onDismiss: () => void }) {
  const { teamName, teamLogo, formation, players = [] } = payload;

  const PITCH_WIDTH = 500;
  const PITCH_HEIGHT = 300;

  return (
    <div className="relative w-full max-w-2xl mx-4 bg-[#0a0a1a] rounded-2xl border border-cyan-500/30 p-8 backdrop-blur-xl shadow-[0_0_30px_rgba(0,255,255,0.15)]">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          {teamLogo && <img src={teamLogo} alt={teamName} className="h-10" />}
          <div>
            <p className="text-white font-display uppercase tracking-wider">{teamName}</p>
            {formation && <p className="text-cyan-400 text-sm font-display uppercase">{formation}</p>}
          </div>
        </div>

        {/* Pitch */}
        <div className="flex justify-center mb-6">
          <svg width={PITCH_WIDTH} height={PITCH_HEIGHT} className="border border-emerald-500/30 rounded">
            <defs>
              <linearGradient id="pitchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0a3a2a" />
                <stop offset="100%" stopColor="#0f1f1a" />
              </linearGradient>
            </defs>
            <rect width={PITCH_WIDTH} height={PITCH_HEIGHT} fill="url(#pitchGradient)" />

            {/* Pitch lines */}
            <line x1={PITCH_WIDTH / 2} y1={0} x2={PITCH_WIDTH / 2} y2={PITCH_HEIGHT} stroke="#ffffff" strokeWidth="1" opacity="0.3" />
            <circle cx={PITCH_WIDTH / 2} cy={PITCH_HEIGHT / 2} r={PITCH_HEIGHT / 6} fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.2" />
            <circle cx={PITCH_WIDTH / 2} cy={PITCH_HEIGHT / 2} r={3} fill="#ffffff" opacity="0.3" />

            {/* Players */}
            {players.map((player: any, idx: number) => {
              const x = (player.x / 100) * PITCH_WIDTH;
              const y = (player.y / 100) * PITCH_HEIGHT;
              return (
                <g key={idx}>
                  <circle cx={x} cy={y} r={8} fill="#0a0a1a" stroke="#00ffff" strokeWidth="2" />
                  <text x={x} y={y} textAnchor="middle" dy="0.3em" fill="#00ffff" fontSize="10" fontWeight="bold">
                    {player.number}
                  </text>
                  <text x={x} y={y + 18} textAnchor="middle" fill="#00ffaa" fontSize="8" opacity="0.8">
                    {player.name?.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Players List */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {players.slice(0, 11).map((player: any, idx: number) => (
            <div key={idx} className="text-cyan-300">
              <span className="font-bold">#{player.number}</span> {player.name}
            </div>
          ))}
        </div>
    </div>
  );
}
