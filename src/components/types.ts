export type BGEGraphicType =
  | "goal"
  | "card"
  | "substitution"
  | "var"
  | "formation"
  | "coach_intro"
  | "team_intro"
  | "league_intro"
  | "scoreboard"
  | "match_stats"
  | "full_overlay"
  | "announcement"
  | "halftime_stats"
  | "fulltime_stats"
  | "replay_intro"
  | "sponsor_graphic";

export type BGEDisplayMode =
  | "popup"
  | "bottom_banner"
  | "top_banner"
  | "half_screen"
  | "full_screen"
  | "center_takeover"
  | "side_panel"
  | "corner_widget"
  | "ticker"
  | "pip"
  | "multi_angle";

export type BGEAnimation =
  | "fade"
  | "slide_left"
  | "slide_right"
  | "slide_up"
  | "slide_down"
  | "zoom"
  | "glow_pulse"
  | "spin"
  | "bounce"
  | "elastic";

export type GoalType = "open_play" | "penalty" | "header" | "free_kick" | "own_goal" | "volley" | "long_range";
export type CardColor = "yellow" | "second_yellow" | "red";
export type CardReason = "dangerous_tackle" | "handball" | "dissent" | "violent_conduct" | "time_wasting" | "unsporting_behavior";

export interface BGEGraphic {
  id: string;
  graphicType: BGEGraphicType;
  displayMode: BGEDisplayMode;
  animation: BGEAnimation;
  payload: Record<string, any>;
  templateId?: string;
  autoDismissMs?: number;
  createdAt: number;
}

export interface BGETemplate {
  id: string;
  category: BGEGraphicType;
  name: string;
  description: string;
  defaultDisplayMode: BGEDisplayMode;
  defaultAnimation: BGEAnimation;
  defaultDismissMs: number;
  thumbnail?: string;
  enabled: boolean;
}

 export const DEFAULT_DISPLAY_MODES: Record<BGEGraphicType, BGEDisplayMode> = {
  goal: "center_takeover",
  card: "popup",
  substitution: "popup",
  var: "center_takeover",
  formation: "half_screen",
  coach_intro: "side_panel",
  team_intro: "center_takeover",
  league_intro: "full_screen",
  scoreboard: "top_banner",
  match_stats: "side_panel",
  full_overlay: "full_screen",
  announcement: "bottom_banner",
  halftime_stats: "half_screen",
  fulltime_stats: "half_screen",
  replay_intro: "full_screen",
  sponsor_graphic: "corner_widget",
};

export const DEFAULT_DISMISS_MS: Record<BGEGraphicType, number> = {
  goal: 5000,
  card: 4000,
  substitution: 4000,
  var: 0,
  formation: 0,
  coach_intro: 6000,
  team_intro: 8000,
  league_intro: 10000,
  scoreboard: 0,
  match_stats: 0,
  full_overlay: 0,
  announcement: 5000,
  halftime_stats: 0,
  fulltime_stats: 0,
  replay_intro: 3000,
  sponsor_graphic: 4000,
};

// 5 templates per category
export const BGE_TEMPLATES: BGETemplate[] = [
  // Goal templates
  { id: "goal_modern", category: "goal", name: "Modern Goal", description: "Clean modern goal popup with gradient", defaultDisplayMode: "center_takeover", defaultAnimation: "zoom", defaultDismissMs: 5000, enabled: true },
  { id: "goal_classic", category: "goal", name: "Classic Goal", description: "Traditional goal announcement", defaultDisplayMode: "popup", defaultAnimation: "fade", defaultDismissMs: 5000, enabled: true },
  { id: "goal_celebration", category: "goal", name: "Celebration", description: "Animated celebration with confetti", defaultDisplayMode: "full_screen", defaultAnimation: "zoom", defaultDismissMs: 7000, enabled: true },
  { id: "goal_minimal", category: "goal", name: "Minimal Goal", description: "Simple score update popup", defaultDisplayMode: "corner_widget", defaultAnimation: "slide_up", defaultDismissMs: 3000, enabled: true },
  { id: "goal_broadcast", category: "goal", name: "Broadcast Style", description: "TV broadcast style overlay", defaultDisplayMode: "top_banner", defaultAnimation: "slide_down", defaultDismissMs: 5000, enabled: true },

  // Card templates
  { id: "card_standard", category: "card", name: "Standard Card", description: "Standard card announcement", defaultDisplayMode: "popup", defaultAnimation: "fade", defaultDismissMs: 4000, enabled: true },
  { id: "card_dramatic", category: "card", name: "Dramatic Card", description: "Dramatic card reveal", defaultDisplayMode: "center_takeover", defaultAnimation: "zoom", defaultDismissMs: 5000, enabled: true },
  { id: "card_banner", category: "card", name: "Banner Card", description: "Bottom banner card alert", defaultDisplayMode: "bottom_banner", defaultAnimation: "slide_up", defaultDismissMs: 4000, enabled: true },
  { id: "card_side", category: "card", name: "Side Panel Card", description: "Side panel card info", defaultDisplayMode: "side_panel", defaultAnimation: "slide_right", defaultDismissMs: 5000, enabled: true },
  { id: "card_red_popup", category: "card", name: "Red Card Special", description: "Special red card animation", defaultDisplayMode: "full_screen", defaultAnimation: "glow_pulse", defaultDismissMs: 6000, enabled: true },

  // VAR templates
  { id: "var_check", category: "var", name: "VAR Check", description: "Standard VAR check overlay", defaultDisplayMode: "center_takeover", defaultAnimation: "fade", defaultDismissMs: 0, enabled: true },
  { id: "var_full", category: "var", name: "Full Screen VAR", description: "Full screen VAR review", defaultDisplayMode: "full_screen", defaultAnimation: "zoom", defaultDismissMs: 0, enabled: true },
  { id: "var_cinematic", category: "var", name: "Cinematic VAR", description: "Cinematic VAR with league logo", defaultDisplayMode: "full_screen", defaultAnimation: "zoom", defaultDismissMs: 0, enabled: true },
  { id: "var_minimal", category: "var", name: "Minimal VAR", description: "Small VAR indicator", defaultDisplayMode: "corner_widget", defaultAnimation: "fade", defaultDismissMs: 0, enabled: true },
  { id: "var_result", category: "var", name: "VAR Result", description: "VAR decision display", defaultDisplayMode: "center_takeover", defaultAnimation: "bounce", defaultDismissMs: 5000, enabled: true },

  // Scoreboard templates
  { id: "score_modern", category: "scoreboard", name: "Modern Scoreboard", description: "Modern gradient scoreboard", defaultDisplayMode: "top_banner", defaultAnimation: "fade", defaultDismissMs: 0, enabled: true },
  { id: "score_classic", category: "scoreboard", name: "Classic Scoreboard", description: "Traditional TV scoreboard", defaultDisplayMode: "top_banner", defaultAnimation: "fade", defaultDismissMs: 0, enabled: true },
  { id: "score_minimal", category: "scoreboard", name: "Minimal Score", description: "Minimal score indicator", defaultDisplayMode: "corner_widget", defaultAnimation: "fade", defaultDismissMs: 0, enabled: true },
  { id: "score_center", category: "scoreboard", name: "Center Score", description: "Centered score display", defaultDisplayMode: "popup", defaultAnimation: "fade", defaultDismissMs: 0, enabled: true },
  { id: "score_broadcast", category: "scoreboard", name: "Broadcast Score", description: "Broadcast style with logos", defaultDisplayMode: "top_banner", defaultAnimation: "slide_down", defaultDismissMs: 0, enabled: true },

  // Formation templates
  { id: "formation_full", category: "formation", name: "Full Pitch", description: "Full pitch formation view", defaultDisplayMode: "half_screen", defaultAnimation: "fade", defaultDismissMs: 0, enabled: true },
  { id: "formation_side", category: "formation", name: "Side Panel", description: "Side panel formation", defaultDisplayMode: "side_panel", defaultAnimation: "slide_left", defaultDismissMs: 0, enabled: true },
  { id: "formation_tactical", category: "formation", name: "Tactical View", description: "Tactical formation view", defaultDisplayMode: "full_screen", defaultAnimation: "zoom", defaultDismissMs: 0, enabled: true },
  { id: "formation_comparison", category: "formation", name: "Team Comparison", description: "Both teams formations", defaultDisplayMode: "full_screen", defaultAnimation: "fade", defaultDismissMs: 0, enabled: true },
  { id: "formation_animated", category: "formation", name: "Animated Reveal", description: "Sequential player reveal", defaultDisplayMode: "center_takeover", defaultAnimation: "zoom", defaultDismissMs: 10000, enabled: true },

  // Announcement templates
  { id: "announce_banner", category: "announcement", name: "Banner Alert", description: "Standard announcement banner", defaultDisplayMode: "bottom_banner", defaultAnimation: "slide_up", defaultDismissMs: 5000, enabled: true },
  { id: "announce_popup", category: "announcement", name: "Popup Alert", description: "Popup announcement", defaultDisplayMode: "popup", defaultAnimation: "zoom", defaultDismissMs: 5000, enabled: true },
  { id: "announce_full", category: "announcement", name: "Full Screen Alert", description: "Full screen announcement", defaultDisplayMode: "full_screen", defaultAnimation: "fade", defaultDismissMs: 5000, enabled: true },
  { id: "announce_ticker", category: "announcement", name: "Ticker", description: "Scrolling ticker announcement", defaultDisplayMode: "ticker", defaultAnimation: "slide_left", defaultDismissMs: 10000, enabled: true },
  { id: "announce_urgent", category: "announcement", name: "Urgent Alert", description: "High priority alert", defaultDisplayMode: "center_takeover", defaultAnimation: "glow_pulse", defaultDismissMs: 0, enabled: true },

  // Halftime stats templates
  { id: "ht_stats_full", category: "halftime_stats", name: "Full Stats", description: "Complete halftime statistics", defaultDisplayMode: "half_screen", defaultAnimation: "fade", defaultDismissMs: 0, enabled: true },
  { id: "ht_stats_minimal", category: "halftime_stats", name: "Minimal Stats", description: "Key stats only", defaultDisplayMode: "side_panel", defaultAnimation: "slide_right", defaultDismissMs: 0, enabled: true },
  { id: "ht_stats_broadcast", category: "halftime_stats", name: "Broadcast Stats", description: "TV broadcast style", defaultDisplayMode: "full_screen", defaultAnimation: "zoom", defaultDismissMs: 0, enabled: true },
  { id: "ht_stats_comparison", category: "halftime_stats", name: "Team Comparison", description: "Team vs team comparison", defaultDisplayMode: "center_takeover", defaultAnimation: "fade", defaultDismissMs: 0, enabled: true },
  { id: "ht_stats_highlights", category: "halftime_stats", name: "Highlight Stats", description: "Stats with highlights", defaultDisplayMode: "half_screen", defaultAnimation: "slide_up", defaultDismissMs: 0, enabled: true },

  // Fulltime stats templates
  { id: "ft_stats_full", category: "fulltime_stats", name: "Full Time Stats", description: "Complete fulltime statistics", defaultDisplayMode: "half_screen", defaultAnimation: "fade", defaultDismissMs: 0, enabled: true },
  { id: "ft_stats_minimal", category: "fulltime_stats", name: "FT Minimal", description: "Key fulltime stats", defaultDisplayMode: "side_panel", defaultAnimation: "slide_right", defaultDismissMs: 0, enabled: true },
  { id: "ft_stats_broadcast", category: "fulltime_stats", name: "FT Broadcast", description: "Broadcast style FT stats", defaultDisplayMode: "full_screen", defaultAnimation: "zoom", defaultDismissMs: 0, enabled: true },
  { id: "ft_stats_mom", category: "fulltime_stats", name: "Man of the Match", description: "MOM with stats", defaultDisplayMode: "center_takeover", defaultAnimation: "glow_pulse", defaultDismissMs: 8000, enabled: true },
  { id: "ft_stats_summary", category: "fulltime_stats", name: "Match Summary", description: "Complete match summary", defaultDisplayMode: "full_screen", defaultAnimation: "fade", defaultDismissMs: 15000, enabled: true },

  // Sponsor templates
  { id: "sponsor_corner", category: "sponsor_graphic", name: "Corner Sponsor", description: "Small corner sponsor", defaultDisplayMode: "corner_widget", defaultAnimation: "fade", defaultDismissMs: 5000, enabled: true },
  { id: "sponsor_banner", category: "sponsor_graphic", name: "Banner Sponsor", description: "Bottom banner sponsor", defaultDisplayMode: "bottom_banner", defaultAnimation: "slide_up", defaultDismissMs: 5000, enabled: true },
  { id: "sponsor_full", category: "sponsor_graphic", name: "Full Screen Sponsor", description: "Full screen sponsor bumper", defaultDisplayMode: "full_screen", defaultAnimation: "fade", defaultDismissMs: 3000, enabled: true },
  { id: "sponsor_animated", category: "sponsor_graphic", name: "Animated Sponsor", description: "Animated sponsor reveal", defaultDisplayMode: "center_takeover", defaultAnimation: "zoom", defaultDismissMs: 4000, enabled: true },
  { id: "sponsor_split", category: "sponsor_graphic", name: "Split Screen", description: "Split screen with content", defaultDisplayMode: "half_screen", defaultAnimation: "fade", defaultDismissMs: 5000, enabled: true },

  // Replay intro templates
  { id: "replay_league", category: "replay_intro", name: "League Replay Intro", description: "Rotating league logo intro", defaultDisplayMode: "full_screen", defaultAnimation: "spin", defaultDismissMs: 2000, enabled: true },
  { id: "replay_cinematic", category: "replay_intro", name: "Cinematic Replay", description: "Cinematic replay intro", defaultDisplayMode: "full_screen", defaultAnimation: "zoom", defaultDismissMs: 1500, enabled: true },
  { id: "replay_minimal", category: "replay_intro", name: "Minimal Replay", description: "Simple replay indicator", defaultDisplayMode: "corner_widget", defaultAnimation: "fade", defaultDismissMs: 1000, enabled: true },
  { id: "replay_sponsor", category: "replay_intro", name: "Sponsored Replay", description: "Replay with sponsor", defaultDisplayMode: "full_screen", defaultAnimation: "zoom", defaultDismissMs: 3000, enabled: true },
  { id: "replay_multi", category: "replay_intro", name: "Multi Angle", description: "Multi-angle replay intro", defaultDisplayMode: "full_screen", defaultAnimation: "zoom", defaultDismissMs: 2000, enabled: true },
];
