import { Trophy, MapPin, Calendar, DollarSign } from "lucide-react";

interface Props {
  payload: Record<string, any>;
  onDismiss: () => void;
}

export function LeagueIntroGraphic({ payload, onDismiss }: Props) {
  const { leagueName, logoUrl, season, organizer, venue, prizePool, sponsor } = payload;

  return (
    <div className="relative" onClick={onDismiss}>
      <div className="min-w-[400px] rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900">
        {/* Header with logo animation */}
        <div className="px-8 py-8 text-center text-white">
          {logoUrl && (
            <div className="mb-4 animate-pulse">
              <img src={logoUrl} alt="" className="w-24 h-24 mx-auto rounded-2xl bg-white/20 p-3 shadow-lg" />
            </div>
          )}
          <div className="text-3xl font-bold">{leagueName || "League"}</div>
          {season && <div className="text-lg opacity-80 mt-1">{season}</div>}
        </div>

        {/* Info grid */}
        <div className="px-6 py-4 grid grid-cols-2 gap-3 bg-black/20">
          {organizer && (
            <div className="flex items-center gap-2 text-white">
              <Trophy className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs opacity-60">Organizer</div>
                <div className="text-sm font-medium">{organizer}</div>
              </div>
            </div>
          )}
          {venue && (
            <div className="flex items-center gap-2 text-white">
              <MapPin className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs opacity-60">Venue</div>
                <div className="text-sm font-medium">{venue}</div>
              </div>
            </div>
          )}
          {prizePool && (
            <div className="flex items-center gap-2 text-white">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs opacity-60">Prize Pool</div>
                <div className="text-sm font-medium">{prizePool}</div>
              </div>
            </div>
          )}
          {sponsor && (
            <div className="flex items-center gap-2 text-white">
              <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-xs text-amber-400 font-bold">S</div>
              <div>
                <div className="text-xs opacity-60">Sponsor</div>
                <div className="text-sm font-medium">{sponsor}</div>
              </div>
            </div>
          )}
        </div>

        {/* Sponsor banner */}
        {sponsor && (
          <div className="px-6 py-3 bg-black/30 text-center">
            <span className="text-xs text-amber-300 uppercase tracking-widester">Powered by {sponsor}</span>
          </div>
        )}
      </div>
    </div>
  );
}
