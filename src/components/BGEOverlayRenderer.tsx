import { useBGE } from "./use-bge";
import type { BGEGraphic } from "./types";
import { GoalGraphic } from "./graphics/GoalGraphic";
import { CardGraphic } from "./graphics/CardGraphic";
import { SubGraphic } from "./graphics/SubGraphic";
import { VARGraphic } from "./graphics/VARGraphic";
import { FormationGraphic } from "./graphics/FormationGraphic";
import { CoachIntroGraphic } from "./graphics/CoachIntroGraphic";
import { TeamIntroGraphic } from "./graphics/TeamIntroGraphic";
import { LeagueIntroGraphic } from "./graphics/LeagueIntroGraphic";
import { ScoreboardGraphic } from "./graphics/ScoreboardGraphic";
import { MatchStatsGraphic } from "./graphics/MatchStatsGraphic";
import { FullOverlayGraphic } from "./graphics/FullOverlayGraphic";

export function BGEOverlayRenderer() {
  const { activeGraphics, dismissGraphic } = useBGE();

  if (activeGraphics.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {activeGraphics.map((g) => (
        <GraphicSlot key={g.id} graphic={g} onDismiss={() => dismissGraphic(g.id)} />
      ))}
    </div>
  );
}

function GraphicSlot({ graphic, onDismiss }: { graphic: BGEGraphic; onDismiss: () => void }) {
  const content = <GraphicContent graphic={graphic} onDismiss={onDismiss} />;
  const animClass = animationClass(graphic.animation);

  const slotClass: Record<string, string> = {
    popup: "absolute inset-0 flex items-center justify-center pointer-events-auto",
    bottom_banner: "absolute bottom-0 left-0 right-0 pointer-events-auto",
    top_banner: "absolute top-0 left-0 right-0 pointer-events-auto",
    half_screen: "absolute inset-0 flex items-center justify-center pointer-events-auto",
    full_screen: "absolute inset-0 pointer-events-auto",
    center_takeover: "absolute inset-0 flex items-center justify-center pointer-events-auto",
    side_panel: "absolute top-0 left-0 bottom-0 w-[400px] max-w-full pointer-events-auto",
    corner_widget: "absolute bottom-4 right-4 pointer-events-auto",
  };

  return (
    <div className={`${slotClass[graphic.displayMode] ?? "absolute inset-0 flex items-center justify-center pointer-events-auto"} ${animClass}`}>
      {graphic.displayMode === "full_screen" || graphic.displayMode === "half_screen" || graphic.displayMode === "center_takeover"
        ? <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onDismiss} />
        : null}
      <div className="relative z-10">{content}</div>
    </div>
  );
}

function GraphicContent({ graphic, onDismiss }: { graphic: BGEGraphic; onDismiss: () => void }) {
  const p = graphic.payload;
  switch (graphic.graphicType) {
    case "goal": return <GoalGraphic payload={p} onDismiss={onDismiss} />;
    case "card": return <CardGraphic payload={p} onDismiss={onDismiss} />;
    case "substitution": return <SubGraphic payload={p} onDismiss={onDismiss} />;
    case "var": return <VARGraphic payload={p} onDismiss={onDismiss} />;
    case "formation": return <FormationGraphic payload={p} onDismiss={onDismiss} />;
    case "coach_intro": return <CoachIntroGraphic payload={p} onDismiss={onDismiss} />;
    case "team_intro": return <TeamIntroGraphic payload={p} onDismiss={onDismiss} />;
    case "league_intro": return <LeagueIntroGraphic payload={p} onDismiss={onDismiss} />;
    case "scoreboard": return <ScoreboardGraphic payload={p} onDismiss={onDismiss} />;
    case "match_stats": return <MatchStatsGraphic payload={p} onDismiss={onDismiss} />;
    case "full_overlay": return <FullOverlayGraphic payload={p} onDismiss={onDismiss} />;
    default: return null;
  }
}

function animationClass(anim: string): string {
  switch (anim) {
    case "fade": return "animate-[fadeIn_300ms_ease-out]";
    case "slide_left": return "animate-[slideInLeft_400ms_ease-out]";
    case "slide_right": return "animate-[slideInRight_400ms_ease-out]";
    case "slide_up": return "animate-[slideInUp_400ms_ease-out]";
    case "slide_down": return "animate-[slideInDown_400ms_ease-out]";
    case "zoom": return "animate-[zoomIn_400ms_ease-out]";
    case "glow_pulse": return "animate-[glowPulse_2s_ease-in-out_infinite]";
    default: return "animate-[fadeIn_300ms_ease-out]";
  }
}
