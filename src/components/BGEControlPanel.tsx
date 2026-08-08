import { useState } from "react";
import { toast } from "sonner";
import { Tv, Goal, Shield, ArrowRightLeft, Grid3X3, User, Users, Trophy, BarChart3, Monitor, X, Eye, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useBGE } from "./use-bge";
import { BGEOverlayRenderer } from "./BGEOverlayRenderer";
import type { BGEGraphicType, BGEDisplayMode, GoalType, CardColor } from "./types";
import { DEFAULT_DISPLAY_MODES, DEFAULT_DISMISS_MS } from "./types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MatchData {
  id: string; home_team_id: string; away_team_id: string; home_score: number; away_score: number; status: string;
  home?: { id: string; name: string; primary_color?: string; logo_url?: string } | null;
  away?: { id: string; name: string; primary_color?: string; logo_url?: string } | null;
  league_id?: string;
}

interface BGEControlPanelProps {
  matchId: string;
  match: MatchData;
  minute: number;
}

export function BGEControlPanel({ matchId, match, minute }: BGEControlPanelProps) {
  const { user } = useAuth();
  const { pushGraphic, dismissAll, activeGraphics } = useBGE();
  const [previewGraphic, setPreviewGraphic] = useState<BGEGraphicType | null>(null);

  const h = match.home;
  const a = match.away;

  // Auto-generate graphic payloads from match state
  function autoGoalPayload(side: "home" | "away"): Record<string, any> {
    const team = side === "home" ? h : a;
    return {
      side,
      teamName: team?.name ?? (side === "home" ? "Home" : "Away"),
      teamLogo: team?.logo_url,
      teamColor: team?.primary_color,
      playerName: "",
      playerNumber: undefined,
      minute,
      goalType: "open_play" as GoalType,
      assist: "",
      homeScore: match.home_score,
      awayScore: match.away_score,
      homeTeamName: h?.name ?? "Home",
      awayTeamName: a?.name ?? "Away",
      homeTeamLogo: h?.logo_url,
      awayTeamLogo: a?.logo_url,
      scorers: [],
    };
  }

  function autoCardPayload(side: "home" | "away"): Record<string, any> {
    const team = side === "home" ? h : a;
    return {
      side,
      teamName: team?.name ?? (side === "home" ? "Home" : "Away"),
      teamLogo: team?.logo_url,
      teamColor: team?.primary_color,
      cardColor: "yellow" as CardColor,
      playerName: "",
      playerNumber: undefined,
      reason: undefined as CardReason | undefined,
      minute,
    };
  }

  function autoSubPayload(side: "home" | "away"): Record<string, any> {
    const team = side === "home" ? h : a;
    return {
      side,
      teamName: team?.name ?? (side === "home" ? "Home" : "Away"),
      teamLogo: team?.logo_url,
      teamColor: team?.primary_color,
      outName: "",
      outNumber: 0,
      inName: "",
      inNumber: 0,
      minute,
      subsRemaining: undefined,
    };
  }

  async function pushAndLog(type: BGEGraphicType, displayMode: BGEDisplayMode, payload: Record<string, any>) {
    pushGraphic(type, displayMode, payload);
    if (user) {
      await supabase.from("graphics_events").insert({
        match_id: matchId,
        graphic_type: type,
        display_mode: displayMode,
        payload,
        auto_dismiss_ms: DEFAULT_DISMISS_MS[type],
        pushed_at: new Date().toISOString(),
        created_by: user.id,
      });
    }
    toast.success(`${type.replace(/_/g, " ")} graphic pushed`);
  }

  function quickPush(type: BGEGraphicType, payload: Record<string, any>) {
    const dm = DEFAULT_DISPLAY_MODES[type];
    pushAndLog(type, dm, payload);
  }

  const graphicButtons: { type: BGEGraphicType; label: string; icon: any; color: string }[] = [
    { type: "goal", label: "Goal", icon: Goal, color: "text-green-400" },
    { type: "card", label: "Card", icon: Shield, color: "text-yellow-400" },
    { type: "var", label: "VAR", icon: Monitor, color: "text-cyan-400" },
    { type: "substitution", label: "Sub", icon: ArrowRightLeft, color: "text-blue-400" },
    { type: "formation", label: "Formation", icon: Grid3X3, color: "text-purple-400" },
    { type: "coach_intro", label: "Coach", icon: User, color: "text-orange-400" },
    { type: "team_intro", label: "Team Intro", icon: Users, color: "text-emerald-400" },
    { type: "league_intro", label: "League Intro", icon: Trophy, color: "text-amber-400" },
    { type: "scoreboard", label: "Scoreboard", icon: Tv, color: "text-sky-400" },
    { type: "match_stats", label: "Stats", icon: BarChart3, color: "text-pink-400" },
    { type: "full_overlay", label: "Full Overlay", icon: Monitor, color: "text-red-400" },
  ];

  return (
    <div className="space-y-3">
      <BGEOverlayRenderer />
      <Card className="border-cyan-900/50 bg-slate-950/50">
        <CardHeader className="py-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Tv className="h-4 w-4 text-cyan-400" />
            Broadcast Graphics Engine
            {activeGraphics.length > 0 && <Badge variant="secondary" className="text-[10px]">{activeGraphics.length} active</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {graphicButtons.map(({ type, label, icon: Icon, color }) => (
              <Button key={type} size="sm" variant="outline" className="text-xs gap-1 border-slate-700 hover:border-cyan-600" onClick={() => setPreviewGraphic(previewGraphic === type ? null : type)}>
                <Icon className={`h-3 w-3 ${color}`} />{label}
              </Button>
            ))}
            <Button size="sm" variant="destructive" className="text-xs gap-1" onClick={dismissAll}><X className="h-3 w-3" />Clear All</Button>
          </div>

          {previewGraphic && (
            <GraphicEditor
              type={previewGraphic}
              match={match}
              minute={minute}
              onPush={(payload) => { quickPush(previewGraphic, payload); setPreviewGraphic(null); }}
              onClose={() => setPreviewGraphic(null)}
            />
          )}

          <Separator />
          <div className="text-xs text-muted-foreground">
            <div className="font-semibold mb-1">Quick Push (AI Auto-fill)</div>
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="secondary" className="text-[10px] h-6" onClick={() => quickPush("goal", { ...autoGoalPayload("home"), playerName: "Scorer", playerNumber: 9 })}>
                <Goal className="mr-1 h-3 w-3 text-green-400" />Home Goal
              </Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-6" onClick={() => quickPush("goal", { ...autoGoalPayload("away"), playerName: "Scorer", playerNumber: 10 })}>
                <Goal className="mr-1 h-3 w-3 text-green-400" />Away Goal
              </Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-6" onClick={() => quickPush("card", { ...autoCardPayload("home"), cardColor: "yellow", playerName: "Player" })}>
                <Shield className="mr-1 h-3 w-3 text-yellow-400" />Home Yellow
              </Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-6" onClick={() => quickPush("card", { ...autoCardPayload("away"), cardColor: "yellow", playerName: "Player" })}>
                <Shield className="mr-1 h-3 w-3 text-yellow-400" />Away Yellow
              </Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-6" onClick={() => quickPush("scoreboard", { homeTeamName: h?.name, awayTeamName: a?.name, homeTeamLogo: h?.logo_url, awayTeamLogo: a?.logo_url, homeScore: match.home_score, awayScore: match.away_score, minute })}>
                <Tv className="mr-1 h-3 w-3 text-sky-400" />Scoreboard
              </Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-6" onClick={() => quickPush("var", { phase: "check", incidentReason: "Possible handball" })}>
                <Monitor className="mr-1 h-3 w-3 text-cyan-400" />VAR Check
              </Button>
            </div>
          </div>

          {activeGraphics.length > 0 && (
            <>
              <Separator />
              <div className="text-xs text-muted-foreground">
                <div className="font-semibold mb-1">Active Graphics</div>
                <div className="flex flex-wrap gap-1">
                  {activeGraphics.map((g) => (
                    <Badge key={g.id} variant="outline" className="text-[10px] gap-1 border-cyan-800 cursor-pointer" onClick={() => dismissAll()}>
                      {g.graphicType.replace(/_/g, " ")} <X className="h-2 w-2" />
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GraphicEditor({ type, match, minute, onPush, onClose }: {
  type: BGEGraphicType; match: MatchData; minute: number;
  onPush: (payload: Record<string, any>) => void; onClose: () => void;
}) {
  const h = match.home;
  const a = match.away;
  const [side, setSide] = useState<"home" | "away">("home");
  const team = side === "home" ? h : a;

  const [fields, setFields] = useState<Record<string, any>>({});

  function updateField(key: string, value: any) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function buildPayload(): Record<string, any> {
    const base: Record<string, any> = {
      side,
      teamName: team?.name ?? (side === "home" ? "Home" : "Away"),
      teamLogo: team?.logo_url,
      teamColor: team?.primary_color,
      minute,
      ...fields,
    };

    if (type === "goal") {
      base.homeScore = match.home_score;
      base.awayScore = match.away_score;
      base.homeTeamName = h?.name ?? "Home";
      base.awayTeamName = a?.name ?? "Away";
      base.homeTeamLogo = h?.logo_url;
      base.awayTeamLogo = a?.logo_url;
    }
    if (type === "scoreboard") {
      base.homeTeamName = h?.name ?? "Home";
      base.awayTeamName = a?.name ?? "Away";
      base.homeTeamLogo = h?.logo_url;
      base.awayTeamLogo = a?.logo_url;
      base.homeScore = match.home_score;
      base.awayScore = match.away_score;
    }
    if (type === "match_stats") {
      base.homeTeamName = h?.name ?? "Home";
      base.awayTeamName = a?.name ?? "Away";
    }

    return base;
  }

  return (
    <div className="rounded-lg border border-cyan-900/40 bg-slate-950/80 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">{type.replace(/_/g, " ")} Editor</span>
        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={onClose}><X className="h-3 w-3" /></Button>
      </div>

      {["goal", "card", "substitution", "formation", "coach_intro", "team_intro"].includes(type) && (
        <div className="flex gap-1">
          <Button size="sm" variant={side === "home" ? "default" : "outline"} className="text-xs h-6" onClick={() => setSide("home")}>{h?.name ?? "Home"}</Button>
          <Button size="sm" variant={side === "away" ? "default" : "outline"} className="text-xs h-6" onClick={() => setSide("away")}>{a?.name ?? "Away"}</Button>
        </div>
      )}

      {type === "goal" && (
        <div className="grid grid-cols-2 gap-1.5">
          <Input placeholder="Player name" className="h-7 text-xs" value={fields.playerName ?? ""} onChange={(e) => updateField("playerName", e.target.value)} />
          <Input type="number" placeholder="#" className="h-7 text-xs" value={fields.playerNumber ?? ""} onChange={(e) => updateField("playerNumber", Number(e.target.value) || undefined)} />
          <Select value={fields.goalType ?? "open_play"} onValueChange={(v) => updateField("goalType", v)}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{["open_play","penalty","header","free_kick","own_goal","volley","long_range"].map((g) => <SelectItem key={g} value={g} className="text-xs">{g.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Assist (optional)" className="h-7 text-xs" value={fields.assist ?? ""} onChange={(e) => updateField("assist", e.target.value)} />
        </div>
      )}

      {type === "card" && (
        <div className="grid grid-cols-2 gap-1.5">
          <Input placeholder="Player name" className="h-7 text-xs" value={fields.playerName ?? ""} onChange={(e) => updateField("playerName", e.target.value)} />
          <Input type="number" placeholder="#" className="h-7 text-xs" value={fields.playerNumber ?? ""} onChange={(e) => updateField("playerNumber", Number(e.target.value) || undefined)} />
          <Select value={fields.cardColor ?? "yellow"} onValueChange={(v) => updateField("cardColor", v)}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{["yellow","second_yellow","red"].map((c) => <SelectItem key={c} value={c} className="text-xs">{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={fields.reason ?? "none"} onValueChange={(v) => updateField("reason", v === "none" ? undefined : v)}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">No reason</SelectItem>
              {["dangerous_tackle","handball","dissent","violent_conduct","time_wasting","unsporting_behavior"].map((r) => <SelectItem key={r} value={r} className="text-xs">{r.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {type === "substitution" && (
        <div className="grid grid-cols-2 gap-1.5">
          <div className="col-span-2 text-[10px] text-red-400 font-semibold">OUT</div>
          <Input placeholder="Out player" className="h-7 text-xs" value={fields.outName ?? ""} onChange={(e) => updateField("outName", e.target.value)} />
          <Input type="number" placeholder="#" className="h-7 text-xs" value={fields.outNumber ?? ""} onChange={(e) => updateField("outNumber", Number(e.target.value) || 0)} />
          <div className="col-span-2 text-[10px] text-green-400 font-semibold">IN</div>
          <Input placeholder="In player" className="h-7 text-xs" value={fields.inName ?? ""} onChange={(e) => updateField("inName", e.target.value)} />
          <Input type="number" placeholder="#" className="h-7 text-xs" value={fields.inNumber ?? ""} onChange={(e) => updateField("inNumber", Number(e.target.value) || 0)} />
          <Input type="number" placeholder="Subs left" className="h-7 text-xs col-span-2" value={fields.subsRemaining ?? ""} onChange={(e) => updateField("subsRemaining", Number(e.target.value) || undefined)} />
        </div>
      )}

      {type === "var" && (
        <div className="grid grid-cols-2 gap-1.5">
          <Select value={fields.phase ?? "check"} onValueChange={(v) => updateField("phase", v)}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{["check","pending","result"].map((p) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Incident reason" className="h-7 text-xs" value={fields.incidentReason ?? ""} onChange={(e) => updateField("incidentReason", e.target.value)} />
          {fields.phase === "result" && (
            <Select value={fields.result ?? "no_penalty"} onValueChange={(v) => updateField("result", v)} className="col-span-2">
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{["penalty_awarded","no_penalty","goal_confirmed","goal_disallowed"].map((r) => <SelectItem key={r} value={r} className="text-xs">{r.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
            </Select>
          )}
        </div>
      )}

      {type === "formation" && (
        <div className="grid gap-1.5">
          <Select value={fields.formation ?? "4-3-3"} onValueChange={(v) => updateField("formation", v)}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{["4-4-2","4-3-3","3-5-2","5-4-1","4-2-3-1"].map((f) => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Player names (comma-sep)" className="h-7 text-xs" value={fields.playerNames ?? ""} onChange={(e) => updateField("playerNames", e.target.value)} />
        </div>
      )}

      {type === "coach_intro" && (
        <div className="grid grid-cols-2 gap-1.5">
          <Input placeholder="Coach name" className="h-7 text-xs" value={fields.coachName ?? ""} onChange={(e) => updateField("coachName", e.target.value)} />
          <Input placeholder="Nationality" className="h-7 text-xs" value={fields.nationality ?? ""} onChange={(e) => updateField("nationality", e.target.value)} />
          <Input placeholder="Formation" className="h-7 text-xs" value={fields.formation ?? ""} onChange={(e) => updateField("formation", e.target.value)} />
          <Input placeholder="Photo URL" className="h-7 text-xs" value={fields.photoUrl ?? ""} onChange={(e) => updateField("photoUrl", e.target.value)} />
        </div>
      )}

      {type === "team_intro" && (
        <div className="grid grid-cols-2 gap-1.5">
          <Input placeholder="Coach" className="h-7 text-xs" value={fields.coach ?? ""} onChange={(e) => updateField("coach", e.target.value)} />
          <Input placeholder="Captain" className="h-7 text-xs" value={fields.captain ?? ""} onChange={(e) => updateField("captain", e.target.value)} />
          <Input placeholder="Formation" className="h-7 text-xs" value={fields.formation ?? ""} onChange={(e) => updateField("formation", e.target.value)} />
          <Input placeholder="Country" className="h-7 text-xs" value={fields.country ?? ""} onChange={(e) => updateField("country", e.target.value)} />
        </div>
      )}

      {type === "league_intro" && (
        <div className="grid grid-cols-2 gap-1.5">
          <Input placeholder="League name" className="h-7 text-xs" value={fields.leagueName ?? ""} onChange={(e) => updateField("leagueName", e.target.value)} />
          <Input placeholder="Season" className="h-7 text-xs" value={fields.season ?? ""} onChange={(e) => updateField("season", e.target.value)} />
          <Input placeholder="Organizer" className="h-7 text-xs" value={fields.organizer ?? ""} onChange={(e) => updateField("organizer", e.target.value)} />
          <Input placeholder="Venue" className="h-7 text-xs" value={fields.venue ?? ""} onChange={(e) => updateField("venue", e.target.value)} />
          <Input placeholder="Prize pool" className="h-7 text-xs" value={fields.prizePool ?? ""} onChange={(e) => updateField("prizePool", e.target.value)} />
          <Input placeholder="Sponsor" className="h-7 text-xs" value={fields.sponsor ?? ""} onChange={(e) => updateField("sponsor", e.target.value)} />
        </div>
      )}

      {type === "match_stats" && (
        <div className="text-[10px] text-muted-foreground">Uses current match stats from the Stats tab. Push to display as overlay.</div>
      )}

      {type === "scoreboard" && (
        <div className="text-[10px] text-muted-foreground">Auto-fills current score and team info.</div>
      )}

      {type === "full_overlay" && (
        <Input placeholder="Content text" className="h-7 text-xs" value={fields.content ?? ""} onChange={(e) => updateField("content", e.target.value)} />
      )}

      <div className="flex gap-1.5">
        <Button size="sm" className="text-xs h-7 gap-1 bg-cyan-600 hover:bg-cyan-500" onClick={() => onPush(buildPayload())}>
          <Send className="h-3 w-3" />Push Live
        </Button>
      </div>
    </div>
  );
}
