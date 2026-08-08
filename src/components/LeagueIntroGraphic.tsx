import React from 'react';
import { X } from 'lucide-react';

export function LeagueIntroGraphic({ payload, onDismiss }: { payload: Record<string, any>; onDismiss: () => void }) {
  const {
    leagueName,
    leagueLogo,
    season,
    organizer,
    numTeams,
    openingDate,
    venue,
    sponsor,
    prizePool,
    country,
    description,
    ownerLogo,
  } = payload;

  return (
    <div className="relative w-full max-w-2xl mx-4 bg-[#0a0a1a] rounded-2xl border border-cyan-500/30 p-8 backdrop-blur-xl shadow-[0_0_30px_rgba(0,255,255,0.15)] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition"
        >
          <X size={24} />
        </button>

        {/* League Header */}
        <div className="text-center mb-8">
          {leagueLogo && (
            <img
              src={leagueLogo}
              alt={leagueName}
              className="h-20 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(0,255,255,0.3)]"
            />
          )}
          <p className="text-white font-display uppercase tracking-wider text-3xl">{leagueName}</p>
          {season && <p className="text-cyan-400 text-sm mt-1">Season {season}</p>}
        </div>

        {/* Description */}
        {description && (
          <p className="text-white/80 text-sm text-center mb-8 leading-relaxed">{description}</p>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
          {numTeams && (
            <div className="bg-slate-950/40 rounded-lg px-3 py-2 border border-cyan-500/20">
              <p className="text-cyan-300 font-display uppercase tracking-wide">Teams</p>
              <p className="text-white text-sm mt-1">{numTeams}</p>
            </div>
          )}
          {country && (
            <div className="bg-slate-950/40 rounded-lg px-3 py-2 border border-cyan-500/20">
              <p className="text-cyan-300 font-display uppercase tracking-wide">Country</p>
              <p className="text-white text-sm mt-1">{country}</p>
            </div>
          )}
          {organizer && (
            <div className="bg-slate-950/40 rounded-lg px-3 py-2 border border-cyan-500/20">
              <p className="text-cyan-300 font-display uppercase tracking-wide">Organizer</p>
              <p className="text-white text-sm mt-1">{organizer}</p>
            </div>
          )}
          {venue && (
            <div className="bg-slate-950/40 rounded-lg px-3 py-2 border border-cyan-500/20">
              <p className="text-cyan-300 font-display uppercase tracking-wide">Venue</p>
              <p className="text-white text-sm mt-1">{venue}</p>
            </div>
          )}
          {openingDate && (
            <div className="bg-slate-950/40 rounded-lg px-3 py-2 border border-cyan-500/20">
              <p className="text-cyan-300 font-display uppercase tracking-wide">Opening Date</p>
              <p className="text-white text-sm mt-1">{openingDate}</p>
            </div>
          )}
          {sponsor && (
            <div className="bg-slate-950/40 rounded-lg px-3 py-2 border border-cyan-500/20">
              <p className="text-cyan-300 font-display uppercase tracking-wide">Sponsor</p>
              <p className="text-white text-sm mt-1">{sponsor}</p>
            </div>
          )}
          {prizePool && (
            <div className="bg-emerald-950/40 rounded-lg px-3 py-2 border border-emerald-500/30 col-span-2">
              <p className="text-emerald-300 font-display uppercase tracking-wide">Prize Pool</p>
              <p className="text-white text-sm mt-1 font-bold">{prizePool}</p>
            </div>
          )}
        </div>

        {/* Owner Logo */}
        {ownerLogo && (
          <div className="text-center pt-4 border-t border-cyan-500/20">
            <img src={ownerLogo} alt="Owner" className="h-8 mx-auto opacity-70" />
          </div>
        )}
    </div>
  );
}
