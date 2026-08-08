import { Grid3X3 } from "lucide-react";

interface Props {
  payload: Record<string, any>;
  onDismiss: () => void;
}

export function FormationGraphic({ payload, onDismiss }: Props) {
  const { teamName, teamLogo, formation = "4-3-3", playerNames = "", teamColor } = payload;

  const players = playerNames.split(",").map((p: string) => p.trim()).filter(Boolean);
  const positions = formation.split("-").map(Number);
  const totalPlayers = positions.reduce((a, b) => a + b, 0) + 1; // +1 for GK

  // Simple pitch visualization
  return (
    <div className="relative min-w-[400px] max-w-lg" onClick={onDismiss}>
      <div className="rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-green-900 to-green-950">
        {/* Header */}
        <div className="px-4 py-3 bg-black/30 flex items-center gap-3">
          {teamLogo && <img src={teamLogo} alt="" className="w-8 h-8 rounded" />}
          <div className="flex-1 text-white">
            <div className="font-bold">{teamName || "Team"}</div>
            <div className="text-sm text-green-400">{formation} Formation</div>
          </div>
          <Grid3X3 className="w-5 h-5 text-green-400" />
        </div>

        {/* Pitch */}
        <div className="relative p-4 aspect-[3/4] bg-green-800">
          {/* Field lines */}
          <div className="absolute inset-4 border-2 border-white/30 rounded">
            <div className="absolute top-1/2 left-0 right-0 border-t border-white/20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/30 rounded-full" />
          </div>

          {/* Player positions */}
          <div className="absolute inset-4 flex flex-col justify-between py-4">
            {/* GK */}
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-xs font-bold text-black">1</div>
            </div>

            {/* Defenders */}
            {positions[0] && (
              <div className="flex justify-around">
                {Array.from({ length: positions[0] }).map((_, i) => (
                  <div key={`def-${i}`} className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                    {players[i + 1]?.[0] || i + 2}
                  </div>
                ))}
              </div>
            )}

            {/* Midfielders */}
            {positions[1] && (
              <div className="flex justify-around">
                {Array.from({ length: positions[1] }).map((_, i) => (
                  <div key={`mid-${i}`} className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white">
                    {players[positions[0] + i + 1]?.[0] || positions[0] + i + 2}
                  </div>
                ))}
              </div>
            )}

            {/* Forwards */}
            {positions[2] && (
              <div className="flex justify-around">
                {Array.from({ length: positions[2] }).map((_, i) => (
                  <div key={`fwd-${i}`} className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold text-white">
                    {players[positions[0] + (positions[1] || 0) + i + 1]?.[0] || positions[0] + (positions[1] || 0) + i + 2}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Player names */}
        {players.length > 0 && (
          <div className="px-4 py-3 bg-black/30">
            <div className="flex flex-wrap gap-2 text-xs text-white">
              {players.slice(0, 11).map((p: string, i: number) => (
                <span key={i} className="px-2 py-1 bg-white/10 rounded">{p}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
