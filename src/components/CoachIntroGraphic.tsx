import React from 'react';
import { X } from 'lucide-react';

export function CoachIntroGraphic({ payload, onDismiss }: { payload: Record<string, any>; onDismiss: () => void }) {
  const { teamName, teamLogo, teamColor, coachName, nationality, role, yearsCoaching, formation, photoUrl } = payload;

  return (
    <div className="relative w-full max-w-2xl mx-4 bg-[#0a0a1a] rounded-2xl border border-cyan-500/30 p-8 backdrop-blur-xl shadow-[0_0_30px_rgba(0,255,255,0.15)]">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition"
        >
          <X size={24} />
        </button>

        <div className="flex gap-6">
          {/* Photo and Team Logo */}
          <div className="flex-shrink-0 text-center">
            {photoUrl && (
              <img src={photoUrl} alt={coachName} className="w-32 h-40 object-cover rounded-lg mb-4 border border-cyan-500/30" />
            )}
            {teamLogo && <img src={teamLogo} alt={teamName} className="h-12 mx-auto" />}
          </div>

          {/* Coach Info */}
          <div className="flex-1">
            <div className="mb-4">
              <p className="text-cyan-400 font-display uppercase tracking-wider text-sm">{teamName}</p>
              <p className="text-white font-display uppercase tracking-wider text-2xl">{coachName}</p>
            </div>

            {/* Details Grid */}
            <div className="space-y-3 text-sm">
              {nationality && (
                <div>
                  <p className="text-cyan-300 text-xs font-display uppercase tracking-wide">Nationality</p>
                  <p className="text-white">{nationality}</p>
                </div>
              )}

              {role && (
                <div>
                  <p className="text-cyan-300 text-xs font-display uppercase tracking-wide">Role</p>
                  <p className="text-white">{role}</p>
                </div>
              )}

              {yearsCoaching && (
                <div>
                  <p className="text-cyan-300 text-xs font-display uppercase tracking-wide">Years Coaching</p>
                  <p className="text-white">{yearsCoaching}</p>
                </div>
              )}

              {formation && (
                <div>
                  <p className="text-cyan-300 text-xs font-display uppercase tracking-wide">Formation</p>
                  <p className="text-emerald-400 font-bold text-lg">{formation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
