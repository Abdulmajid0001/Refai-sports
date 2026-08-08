import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState , type ReactNode } from "react";
import { toast } from "sonner";
import {
  Play, Pause, Square, Plus, Minus, AlertTriangle, Flag,
  CheckCircle2, XCircle, ArrowUpCircle, Send, Mic, MicOff,
  Eye, EyeOff, Monitor, Maximize2, Tv, Radio, Users,
  Clock, Shield, Brain, TrendingUp, Globe, Wifi,
  Smartphone, BarChart3, Download, FileText, Camera,
  FastForward, Rewind, Volume2, ChevronDown, ChevronUp,
  Target, Zap, Layers, MessageSquare, Bell,
  RotateCcw, Settings, UserPlus, UserMinus, CreditCard,
  Edit, Trash2, Save, Ban
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

type MatchStatus = "scheduled" | "live" | "halftime" | "completed" | "postponed" | "cancelled";
type GoalType = "open_play" | "penalty" | "free_kick" | "own_goal" | "header";
type CardReason = "foul" | "dissent" | "handball" | "dangerous_tackle" | "violent_conduct" | "time_wasting";
type EventType = "goal" | "penalty" | "yellow_card" | "red_card" | "second_yellow" | "foul" | "advantage" | "free_kick" | "corner" | "offside" | "substitution" | "injury" | "var_check" | "var_decision" | "kickoff" | "period_end" | "period_start" | "fulltime" | "note";

export const Route = createFileRoute("/moderator/$matchId")({ component: ModeratorControlCenter });

export function ModeratorControlCenter() {
  const { matchId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  // Match data
  const matchQ = useQuery({
    queryKey: ["mod-match", matchId],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("matches").select("*").eq("id", matchId).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const [{ data: home }, { data: away }, { data: league }] = await Promise.all([
        supabase.from("teams").select("id, name, primary_color, logo_url").eq("id", data.home_team_id).maybeSingle(),
        supabase.from("teams").select("id, name, primary_color, logo_url").eq("id", data.away_team_id).maybeSingle(),
        supabase.from("leagues").select("id, name").eq("id", data.league_id).maybeSingle(),
      ]);
      return { ...data, home, away, league };
    },
  });

  // Events
  const eventsQ = useQuery({
    queryKey: ["mod-events", matchId],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("match_events").select("*").eq("match_id", matchId).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Broadcast state
  const broadcastQ = useQuery({
    queryKey: ["mod-broadcast", matchId],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("broadcast_state").select("*").eq("match_id", matchId).maybeSingle();
      return data;
    },
  });

  // VAR reviews
  const varQ = useQuery({
    queryKey: ["mod-var", matchId],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("var_reviews").select("*").eq("match_id", matchId).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Stream analytics
  const analyticsQ = useQuery({
    queryKey: ["mod-analytics", matchId],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("stream_analytics").select("*").eq("match_id", matchId).order("recorded_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });

  // Clock
  const [minute, setMinute] = useState(0);
  const [extra, setExtra] = useState(0);
  const [clockRunning, setClockRunning] = useState(false);
  useEffect(() => {
    if (!clockRunning) return;
    const t = setInterval(() => setMinute(m => m + 1), 60_000);
    return () => clearInterval(t);
  }, [clockRunning]);

  // Commentary
  const [commentary, setCommentary] = useState("");
  const [aiCommentary, setAiCommentary] = useState(false);

  // Communication
  const [commChannel, setCommChannel] = useState<"referee" | "production" | "commentators" | "assistant_var">("referee");
  const [commMsg, setCommMsg] = useState("");
  const [commLog, setCommLog] = useState<{ from: string; to: string; text: string; time: number }[]>([]);

  // Goal dialog state
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalSide, setGoalSide] = useState<"home" | "away">("home");
  const [goalScorer, setGoalScorer] = useState("");
  const [goalAssist, setGoalAssist] = useState("");
  const [goalType, setGoalType] = useState<GoalType>("open_play");

  // Card dialog state
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [cardType, setCardType] = useState<"yellow_card" | "second_yellow" | "red_card">("yellow_card");
  const [cardSide, setCardSide] = useState<"home" | "away">("home");
  const [cardPlayer, setCardPlayer] = useState("");
  const [cardReason, setCardReason] = useState<CardReason>("foul");

  // Sub dialog
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [subSide, setSubSide] = useState<"home" | "away">("home");
  const [subPlayerOff, setSubPlayerOff] = useState("");
  const [subPlayerOn, setSubPlayerOn] = useState("");

  // Realtime
  useEffect(() => {
    const ch = supabase.channel(`mod-${matchId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "match_events", filter: `match_id=eq.${matchId}` }, () => eventsQ.refetch())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` }, () => matchQ.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "var_reviews", filter: `match_id=eq.${matchId}` }, () => varQ.refetch())
      .on("broadcast", { event: "comm" }, ({ payload }) => {
        setCommLog(prev => [...prev.slice(-30), payload as { from: string; to: string; text: string; time: number }]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [matchId]);

  if (authLoading || matchQ.isLoading) {
    return <div className="flex h-screen items-center justify-center bg-gray-950 text-white">Loading Moderator Control...</div>;
  }
  const m = matchQ.data;
  if (!m) return <div className="flex h-screen items-center justify-center bg-gray-950 text-white">Match not found.</div>;

  const home = m.home;
  const away = m.away;

  // Actions
  async function setStatus(status: MatchStatus) {
    const { error } = await supabase.from("matches").update({ status }).eq("id", matchId);
    if (error) toast.error(error.message);
    else { qc.invalidateQueries({ queryKey: ["mod-match", matchId] }); toast.success(`Match status: ${status}`); }
  }

  async function changeScore(side: "home" | "away", delta: number) {
    const field = side === "home" ? "home_score" : "away_score";
    const current = side === "home" ? m.home_score : m.away_score;
    const next = Math.max(0, current + delta);
    const { error } = await supabase.from("matches").update({ [field]: next }).eq("id", matchId);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["mod-match", matchId] });
  }

  async function logEvent(type: EventType, teamId?: string | null, detail?: string) {
    if (!user) return;
    const { error } = await supabase.from("match_events").insert({
      match_id: matchId, type, team_id: teamId ?? null, minute: minute || null, extra_minute: extra || null, detail: detail ?? null, created_by: user.id,
    });
    if (error) toast.error(error.message);
    else toast.success(`${type.replace(/_/g, " ")} logged`);
  }

  async function submitGoal() {
    const teamId = goalSide === "home" ? m.home_team_id : m.away_team_id;
    const detail = `${goalType.replace(/_/g, " ")}${goalScorer ? ` — Scorer: ${goalScorer}` : ""}${goalAssist ? `, Assist: ${goalAssist}` : ""}`;
    await Promise.all([logEvent("goal", teamId, detail), changeScore(goalSide, 1)]);
    setGoalDialogOpen(false);
    setGoalScorer(""); setGoalAssist(""); setGoalType("open_play");
  }

  async function submitCard() {
    const teamId = cardSide === "home" ? m.home_team_id : m.away_team_id;
    const detail = `${cardReason.replace(/_/g, " ")}${cardPlayer ? ` — Player: ${cardPlayer}` : ""}`;
    await logEvent(cardType, teamId, detail);
    setCardDialogOpen(false);
    setCardPlayer(""); setCardReason("foul");
  }

  async function submitSub() {
    const teamId = subSide === "home" ? m.home_team_id : m.away_team_id;
    const detail = `${subPlayerOff || "?"} ➜ ${subPlayerOn || "?"}`;
    await logEvent("substitution", teamId, detail);
    setSubDialogOpen(false);
    setSubPlayerOff(""); setSubPlayerOn("");
  }

  async function pushBroadcast(mode: string, banner?: string) {
    if (!user) return;
    const { error } = await supabase.from("broadcast_state").upsert({
      match_id: matchId, var_screen_mode: mode, banner_text: banner || null, banner_active: !!banner, updated_by: user.id, updated_at: new Date().toISOString(),
    });
    if (error) toast.error(error.message);
    else toast.success(`Broadcast: ${mode}`);
  }

  function sendComm() {
    if (!commMsg.trim()) return;
    const msg = { from: user?.email ?? "Moderator", to: commChannel, text: commMsg, time: Date.now() };
    supabase.channel(`mod-${matchId}`).send({ type: "broadcast", event: "comm", payload: msg });
    setCommLog(prev => [...prev.slice(-30), msg]);
    setCommMsg("");
  }

  async function pushCommentary() {
    if (!commentary.trim()) return;
    const ch = supabase.channel(`commentary-${matchId}`);
    ch.send({
      type: "broadcast",
      event: "line",
      payload: { id: `mod-${Date.now()}`, author: user?.email ?? "Moderator", text: commentary, ts: Date.now() },
    });
    toast.success("Commentary pushed");
    setCommentary("");
  }

  async function sendAlert(type: string, text: string) {
    if (!user) return;
    const { error } = await supabase.from("notifications").insert({
      user_id: user.id, kind: type, title: text, body: `${home?.name} vs ${away?.name}`,
    });
    if (error) toast.error(error.message);
    else toast.success(`Alert sent: ${text}`);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-950 text-white">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-amber-900/40 bg-gray-950 px-4 py-2">
        <div className="flex items-center gap-3">
          <Monitor className="h-6 w-6 text-amber-400" />
          <h1 className="text-lg font-bold tracking-tight">Master Match Control</h1>
          <Badge variant={m.status === "live" ? "destructive" : "secondary"} className="capitalize">{m.status}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="font-mono text-xl tabular-nums">
            <span style={{ color: home?.primary_color || "#fff" }}>{home?.name?.slice(0, 3).toUpperCase()}</span>
            <span className="mx-2">{m.home_score} - {m.away_score}</span>
            <span style={{ color: away?.primary_color || "#fff" }}>{away?.name?.slice(0, 3).toUpperCase()}</span>
            <span className="ml-2 text-sm text-white/50">{minute}{extra ? `+${extra}` : ""}'</span>
          </div>
          <Button asChild size="sm" variant="outline" className="border-amber-800 text-amber-300">
            <Link to="/var/$matchId" params={{ matchId }}>VAR Page</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-amber-800 text-amber-300">
            <Link to="/live/$matchId" params={{ matchId }}>Viewer Page</Link>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <Tabs defaultValue="match" className="flex flex-1 flex-col">
          <TabsList className="w-full flex-wrap justify-start rounded-none border-b border-gray-800 bg-gray-950 px-2 gap-0">
            {["match", "score", "cards", "fouls", "subs", "var", "stats", "commentary", "broadcast", "comms", "analytics", "archive"].map(tab => (
              <TabsTrigger key={tab} value={tab} className="text-xs capitalize data-[state=active]:bg-amber-950 data-[state=active]:text-amber-300 px-2">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Match Control */}
          <TabsContent value="match" className="flex-1 overflow-y-auto p-4">
            <div className="grid gap-4 lg:grid-cols-2 max-w-5xl mx-auto">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader><CardTitle className="text-sm text-amber-300">Match Clock & Status</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input type="number" min={0} max={130} value={minute} onChange={e => setMinute(Number(e.target.value))} className="w-20 border-gray-700 bg-gray-800" />
                    <span className="text-white/50">+</span>
                    <Input type="number" min={0} max={20} value={extra} onChange={e => setExtra(Number(e.target.value))} className="w-20 border-gray-700 bg-gray-800" />
                    <span className="text-xs text-white/50">min</span>
                    {!clockRunning ? (
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => setClockRunning(true)}><Play className="mr-1 h-4 w-4" />Run</Button>
                    ) : (
                      <Button size="sm" variant="outline" className="border-gray-700" onClick={() => setClockRunning(false)}><Pause className="mr-1 h-4 w-4" />Pause</Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="border-green-800 text-green-400" onClick={() => { setStatus("live"); logEvent("kickoff"); setClockRunning(true); }}>Kick Off</Button>
                    <Button size="sm" variant="outline" className="border-yellow-800 text-yellow-400" onClick={() => { setStatus("halftime"); logEvent("period_end", null, "Half time"); setClockRunning(false); }}>Half Time</Button>
                    <Button size="sm" variant="outline" className="border-blue-800 text-blue-400" onClick={() => { setStatus("live"); logEvent("period_start", null, "Second half"); setClockRunning(true); }}>Resume</Button>
                    <Button size="sm" variant="outline" className="border-orange-800 text-orange-400" onClick={() => { setMinute(90); logEvent("period_end", null, "Extra time"); }}>Extra Time</Button>
                    <Button size="sm" variant="destructive" onClick={() => { setStatus("completed"); logEvent("fulltime"); setClockRunning(false); }}>Full Time</Button>
                    <Button size="sm" variant="ghost" className="text-white/50" onClick={() => { setStatus("postponed"); setClockRunning(false); }}>Postpone</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader><CardTitle className="text-sm text-amber-300">Quick Actions</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" className="border-gray-700" onClick={() => logEvent("foul", null, "General foul")}><AlertTriangle className="mr-1 h-4 w-4" />Foul</Button>
                  <Button size="sm" variant="outline" className="border-gray-700" onClick={() => logEvent("advantage", null, "Advantage")}><FastForward className="mr-1 h-4 w-4" />Advantage</Button>
                  <Button size="sm" variant="outline" className="border-gray-700" onClick={() => logEvent("free_kick", null, "Free kick")}><Target className="mr-1 h-4 w-4" />Free Kick</Button>
                  <Button size="sm" variant="outline" className="border-gray-700" onClick={() => logEvent("corner", null, "Corner")}><RotateCcw className="mr-1 h-4 w-4" />Corner</Button>
                  <Button size="sm" variant="outline" className="border-gray-700" onClick={() => logEvent("offside", null, "Offside")}><Ban className="mr-1 h-4 w-4" />Offside</Button>
                  <Button size="sm" variant="outline" className="border-gray-700" onClick={() => logEvent("injury", null, "Injury")}><UserPlus className="mr-1 h-4 w-4" />Injury</Button>
                  <Button size="sm" variant="outline" className="border-cyan-800 text-cyan-400" onClick={() => logEvent("var_check", null, "VAR check")}><Shield className="mr-1 h-4 w-4" />VAR Check</Button>
                  <Button size="sm" variant="ghost" className="text-white/40" onClick={() => logEvent("note", null, "Note")}><FileText className="mr-1 h-4 w-4" />Note</Button>
                </CardContent>
              </Card>

              {/* Alert System */}
              <Card className="border-gray-800 bg-gray-900 lg:col-span-2">
                <CardHeader><CardTitle className="text-sm text-amber-300">Alert System</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => sendAlert("goal", "GOAL!")}><Zap className="mr-1 h-4 w-4" />Goal Alert</Button>
                  <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700" onClick={() => sendAlert("var_check", "VAR CHECK")}><Shield className="mr-1 h-4 w-4" />VAR Alert</Button>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => sendAlert("red_card", "RED CARD")}><XCircle className="mr-1 h-4 w-4" />Red Card</Button>
                  <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700" onClick={() => sendAlert("half_time", "HALF TIME")}><Clock className="mr-1 h-4 w-4" />Half Time</Button>
                  <Button size="sm" className="bg-gray-600 hover:bg-gray-700" onClick={() => sendAlert("full_time", "FULL TIME")}><Square className="mr-1 h-4 w-4" />Full Time</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Score Control */}
          <TabsContent value="score" className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-3xl space-y-4">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader><CardTitle className="text-sm text-amber-300">Scoreboard Control</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <ScorePanel name={home?.name ?? "Home"} score={m.home_score} color={home?.primary_color} onPlus={() => changeScore("home", 1)} onMinus={() => changeScore("home", -1)} />
                    <ScorePanel name={away?.name ?? "Away"} score={m.away_score} color={away?.primary_color} onPlus={() => changeScore("away", 1)} onMinus={() => changeScore("away", -1)} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader><CardTitle className="text-sm text-amber-300">Log Goal</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-white/50">Team</Label>
                      <Select value={goalSide} onValueChange={v => setGoalSide(v as "home" | "away")}>
                        <SelectTrigger className="border-gray-700 bg-gray-800"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home">{home?.name ?? "Home"}</SelectItem>
                          <SelectItem value="away">{away?.name ?? "Away"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-white/50">Goal Type</Label>
                      <Select value={goalType} onValueChange={v => setGoalType(v as GoalType)}>
                        <SelectTrigger className="border-gray-700 bg-gray-800"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open_play">Open Play</SelectItem>
                          <SelectItem value="penalty">Penalty</SelectItem>
                          <SelectItem value="free_kick">Free Kick</SelectItem>
                          <SelectItem value="own_goal">Own Goal</SelectItem>
                          <SelectItem value="header">Header</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-white/50">Scorer</Label>
                      <Input value={goalScorer} onChange={e => setGoalScorer(e.target.value)} placeholder="Player name/number" className="border-gray-700 bg-gray-800" />
                    </div>
                    <div>
                      <Label className="text-xs text-white/50">Assist</Label>
                      <Input value={goalAssist} onChange={e => setGoalAssist(e.target.value)} placeholder="Assist by" className="border-gray-700 bg-gray-800" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="bg-green-600 hover:bg-green-700" onClick={submitGoal}><Zap className="mr-1 h-4 w-4" />Submit Goal</Button>
                    <Button variant="outline" className="border-red-800 text-red-400" onClick={() => changeScore(goalSide, -1)}><Minus className="mr-1 h-4 w-4" />Remove Goal</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Card Management */}
          <TabsContent value="cards" className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-3xl space-y-4">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader><CardTitle className="text-sm text-amber-300">Card Management</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-white/50">Card Type</Label>
                      <Select value={cardType} onValueChange={v => setCardType(v as typeof cardType)}>
                        <SelectTrigger className="border-gray-700 bg-gray-800"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yellow_card">Yellow Card</SelectItem>
                          <SelectItem value="second_yellow">Second Yellow</SelectItem>
                          <SelectItem value="red_card">Red Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-white/50">Team</Label>
                      <Select value={cardSide} onValueChange={v => setCardSide(v as "home" | "away")}>
                        <SelectTrigger className="border-gray-700 bg-gray-800"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home">{home?.name ?? "Home"}</SelectItem>
                          <SelectItem value="away">{away?.name ?? "Away"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-white/50">Reason</Label>
                      <Select value={cardReason} onValueChange={v => setCardReason(v as CardReason)}>
                        <SelectTrigger className="border-gray-700 bg-gray-800"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="foul">Foul</SelectItem>
                          <SelectItem value="dissent">Dissent</SelectItem>
                          <SelectItem value="handball">Handball</SelectItem>
                          <SelectItem value="dangerous_tackle">Dangerous Tackle</SelectItem>
                          <SelectItem value="violent_conduct">Violent Conduct</SelectItem>
                          <SelectItem value="time_wasting">Time Wasting</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-white/50">Player</Label>
                    <Input value={cardPlayer} onChange={e => setCardPlayer(e.target.value)} placeholder="Player name/number" className="border-gray-700 bg-gray-800" />
                  </div>
                  <div className="flex gap-2">
                    <Button className="bg-yellow-600 hover:bg-yellow-700" onClick={submitCard}><CreditCard className="mr-1 h-4 w-4" />Issue Card</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Fouls */}
          <TabsContent value="fouls" className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-3xl space-y-4">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader><CardTitle className="text-sm text-amber-300">Foul Control</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-blue-400">{home?.name ?? "Home"}</p>
                    <div className="grid grid-cols-2 gap-1">
                      <Button size="sm" variant="outline" className="border-gray-700 text-xs" onClick={() => logEvent("foul", m.home_team_id)}>Foul</Button>
                      <Button size="sm" variant="outline" className="border-gray-700 text-xs" onClick={() => logEvent("advantage", m.home_team_id)}>Advantage</Button>
                      <Button size="sm" variant="outline" className="border-gray-700 text-xs" onClick={() => logEvent("free_kick", m.home_team_id)}>Free Kick</Button>
                      <Button size="sm" variant="outline" className="border-green-800 text-green-400 text-xs" onClick={() => logEvent("penalty", m.home_team_id)}>Penalty</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-red-400">{away?.name ?? "Away"}</p>
                    <div className="grid grid-cols-2 gap-1">
                      <Button size="sm" variant="outline" className="border-gray-700 text-xs" onClick={() => logEvent("foul", m.away_team_id)}>Foul</Button>
                      <Button size="sm" variant="outline" className="border-gray-700 text-xs" onClick={() => logEvent("advantage", m.away_team_id)}>Advantage</Button>
                      <Button size="sm" variant="outline" className="border-gray-700 text-xs" onClick={() => logEvent("free_kick", m.away_team_id)}>Free Kick</Button>
                      <Button size="sm" variant="outline" className="border-green-800 text-green-400 text-xs" onClick={() => logEvent("penalty", m.away_team_id)}>Penalty</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Substitutions */}
          <TabsContent value="subs" className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-3xl">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader><CardTitle className="text-sm text-amber-300">Substitution Control</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-white/50">Team</Label>
                      <Select value={subSide} onValueChange={v => setSubSide(v as "home" | "away")}>
                        <SelectTrigger className="border-gray-700 bg-gray-800"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home">{home?.name ?? "Home"}</SelectItem>
                          <SelectItem value="away">{away?.name ?? "Away"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-white/50">Player Off</Label>
                      <Input value={subPlayerOff} onChange={e => setSubPlayerOff(e.target.value)} placeholder="#7" className="border-gray-700 bg-gray-800" />
                    </div>
                    <div>
                      <Label className="text-xs text-white/50">Player On</Label>
                      <Input value={subPlayerOn} onChange={e => setSubPlayerOn(e.target.value)} placeholder="#14" className="border-gray-700 bg-gray-800" />
                    </div>
                  </div>
                  <Button className="bg-amber-600 hover:bg-amber-700" onClick={submitSub}>
                    <UserMinus className="mr-1 h-4 w-4" /> <UserPlus className="mr-1 h-4 w-4" /> Submit Substitution
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* VAR Control */}
          <TabsContent value="var" className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-4xl space-y-4">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader><CardTitle className="text-sm text-cyan-300">VAR Control Module</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-3 gap-2">
                  <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={() => logEvent("var_check", null, "VAR review opened")}><Shield className="mr-1 h-4 w-4" />Open VAR</Button>
                  <Button variant="outline" className="border-cyan-800 text-cyan-400" onClick={() => logEvent("var_decision", null, "VAR review started")}><Play className="mr-1 h-4 w-4" />Start Review</Button>
                  <Button variant="outline" className="border-cyan-800 text-cyan-400" onClick={() => pushBroadcast("half", "VAR CHECK IN PROGRESS")}><Eye className="mr-1 h-4 w-4" />Push to Viewers</Button>
                  <Button variant="outline" className="border-green-800 text-green-400" onClick={() => { logEvent("var_decision", null, "VAR: Decision confirmed"); pushBroadcast("hidden"); }}><CheckCircle2 className="mr-1 h-4 w-4" />Confirm</Button>
                  <Button variant="outline" className="border-red-800 text-red-400" onClick={() => { logEvent("var_decision", null, "VAR: Review ended"); pushBroadcast("hidden"); }}><XCircle className="mr-1 h-4 w-4" />End Review</Button>
                  <Button variant="ghost" className="text-white/40" onClick={() => pushBroadcast("hidden")}><EyeOff className="mr-1 h-4 w-4" />Hide from Viewers</Button>
                </CardContent>
              </Card>

              {/* VAR Reviews */}
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader><CardTitle className="text-sm text-cyan-300">VAR Reviews</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    {(varQ.data ?? []).length === 0 ? (
                      <p className="py-4 text-center text-white/30 text-xs">No VAR reviews yet</p>
                    ) : (
                      <div className="space-y-2">
                        {(varQ.data ?? []).map((r: any) => (
                          <div key={r.id} className="flex items-center justify-between rounded border border-gray-800 p-2 text-xs">
                            <div>
                              <span className="capitalize font-medium">{r.incident_type?.replace(/_/g, " ")}</span>
                              <span className="ml-2 text-white/50">{r.minute}'</span>
                            </div>
                            <Badge variant={r.status === "decided" ? "default" : "secondary"} className="text-xs">{r.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Statistics Engine */}
          <TabsContent value="stats" className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-3xl space-y-4">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader><CardTitle className="text-sm text-amber-300">Statistics Engine Control</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-white/50">Update Mode</Label>
                    <div className="flex gap-1">
                      <Button size="sm" variant="default" className="bg-amber-600 text-xs">Manual</Button>
                      <Button size="sm" variant="ghost" className="text-xs text-white/50">AI Auto</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Possession (%)", home: "58", away: "42" },
                      { label: "Shots", home: "8", away: "5" },
                      { label: "Pass Accuracy (%)", home: "82", away: "76" },
                      { label: "Fouls", home: "9", away: "11" },
                      { label: "Tackles", home: "14", away: "12" },
                      { label: "Corners", home: "4", away: "3" },
                      { label: "Offsides", home: "2", away: "3" },
                      { label: "Saves", home: "3", away: "5" },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between rounded border border-gray-800 p-2 text-xs">
                        <span className="text-blue-400 font-mono w-6 text-right">{s.home}</span>
                        <span className="text-white/50">{s.label}</span>
                        <span className="text-red-400 font-mono w-6">{s.away}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Commentary Control */}
          <TabsContent value="commentary" className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-3xl space-y-4">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader><CardTitle className="text-sm text-amber-300">Commentary Control</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-white/50">Commentary Source</Label>
                    <div className="flex gap-1">
                      <Button size="sm" variant={!aiCommentary ? "default" : "ghost"} className={!aiCommentary ? "bg-amber-600 text-xs" : "text-xs text-white/50"} onClick={() => setAiCommentary(false)}>Manual</Button>
                      <Button size="sm" variant={aiCommentary ? "default" : "ghost"} className={aiCommentary ? "bg-cyan-600 text-xs" : "text-xs text-white/50"} onClick={() => setAiCommentary(true)}>AI Auto</Button>
                    </div>
                  </div>
                  <Textarea
                    value={commentary}
                    onChange={e => setCommentary(e.target.value)}
                    placeholder={aiCommentary ? "AI will auto-generate commentary..." : "Type commentary manually..."}
                    rows={3}
                    className="border-gray-700 bg-gray-800 text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" className="border-gray-700 text-xs" onClick={() => setCommentary(`${minute}' — `)}><Clock className="mr-1 h-3 w-3" />Add Timestamp</Button>
                    <Button className="bg-amber-600 hover:bg-amber-700" onClick={pushCommentary}><Send className="mr-1 h-4 w-4" />Push to Viewers</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Broadcast Control */}
          <TabsContent value="broadcast" className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-3xl space-y-4">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader><CardTitle className="text-sm text-amber-300">Viewer Broadcast Control</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Push to Viewer Screens</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700" onClick={() => pushBroadcast("half")}><Monitor className="mr-1 h-4 w-4" />Half Screen</Button>
                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700" onClick={() => pushBroadcast("full")}><Maximize2 className="mr-1 h-4 w-4" />Full Screen</Button>
                    <Button size="sm" variant="outline" className="border-cyan-800 text-cyan-400" onClick={() => pushBroadcast("overlay")}><Layers className="mr-1 h-4 w-4" />Overlay</Button>
                    <Button size="sm" variant="outline" className="border-gray-700" onClick={() => pushBroadcast("hidden")}><EyeOff className="mr-1 h-4 w-4" />Remove Overlay</Button>
                    <Button size="sm" variant="outline" className="border-green-800 text-green-400" onClick={() => pushBroadcast("overlay", "GOAL!")}><Zap className="mr-1 h-4 w-4" />Push Replay</Button>
                    <Button size="sm" variant="outline" className="border-amber-800 text-amber-400" onClick={() => pushBroadcast("overlay", "SPONSOR")}><Tv className="mr-1 h-4 w-4" />Sponsor Overlay</Button>
                  </div>

                  <Separator className="bg-gray-800" />

                  <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Push Banner</p>
                  <div className="flex gap-2">
                    <Input placeholder="Banner text..." className="border-gray-700 bg-gray-800" />
                    <Button className="bg-amber-600 hover:bg-amber-700">Push</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Communications */}
          <TabsContent value="comms" className="flex-1 overflow-hidden p-4">
            <div className="mx-auto max-w-3xl flex h-full flex-col">
              <div className="mb-2 flex gap-1">
                {(["referee", "production", "commentators", "assistant_var"] as const).map(ch => (
                  <Button key={ch} size="sm" variant={commChannel === ch ? "default" : "ghost"} className={commChannel === ch ? "bg-amber-600 text-xs" : "text-xs text-white/50"} onClick={() => setCommChannel(ch)}>
                    {ch.replace(/_/g, " ")}
                  </Button>
                ))}
              </div>
              <ScrollArea className="flex-1">
                <div className="space-y-2">
                  {commLog.filter(m => m.to === commChannel).map((msg, i) => (
                    <div key={i} className="rounded border border-gray-800 p-2 text-xs">
                      <span className="text-amber-300">{msg.from}</span>
                      <span className="mx-1">→</span>
                      <span className="text-white/50">{msg.to}</span>
                      <span className="ml-2 text-white/30">{new Date(msg.time).toLocaleTimeString()}</span>
                      <p className="mt-1">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-2 flex gap-1">
                <Input value={commMsg} onChange={e => setCommMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendComm()} placeholder="Message..." className="border-gray-700 bg-gray-800" />
                <Button className="bg-amber-600 hover:bg-amber-700" onClick={sendComm}><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-3xl space-y-4">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader><CardTitle className="text-sm text-amber-300">Analytics Panel</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard label="Viewer Count" value={analyticsQ.data?.viewer_count?.toLocaleString() ?? "0"} icon={<Users className="h-5 w-5 text-blue-400" />} />
                    <StatCard label="Avg Latency" value={`${analyticsQ.data?.avg_latency_ms ?? "0"}ms`} icon={<Wifi className="h-5 w-5 text-green-400" />} />
                    <StatCard label="Buffering Rate" value={`${((analyticsQ.data?.buffering_rate ?? 0) * 100).toFixed(1)}%`} icon={<BarChart3 className="h-5 w-5 text-yellow-400" />} />
                    <StatCard label="Top Region" value="Europe" icon={<Globe className="h-5 w-5 text-purple-400" />} />
                  </div>
                  <Separator className="my-4 bg-gray-800" />
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Device Breakdown</p>
                    <div className="flex gap-4 text-xs">
                      <span><Smartphone className="mr-1 inline h-3 w-3" />Mobile 62%</span>
                      <span><Monitor className="mr-1 inline h-3 w-3" />Desktop 28%</span>
                      <span><Tv className="mr-1 inline h-3 w-3" />TV 10%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Incident Archive */}
          <TabsContent value="archive" className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-4xl">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm text-amber-300">Incident Archive</CardTitle>
                  <Button size="sm" variant="outline" className="border-gray-700 text-xs" onClick={() => toast("Report generation coming soon")}>
                    <Download className="mr-1 h-4 w-4" />Generate Report
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {(eventsQ.data ?? []).length === 0 ? (
                      <p className="py-8 text-center text-white/30 text-xs">No events recorded yet</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-800 text-left text-white/50">
                            <th className="pb-2 pr-3">Time</th>
                            <th className="pb-2 pr-3">Type</th>
                            <th className="pb-2 pr-3">Team</th>
                            <th className="pb-2">Detail</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(eventsQ.data ?? []).map((ev: any) => (
                            <tr key={ev.id} className="border-b border-gray-800/50">
                              <td className="py-1.5 pr-3 font-mono tabular-nums">{ev.minute ?? "—"}'</td>
                              <td className="py-1.5 pr-3 capitalize">{ev.type?.replace(/_/g, " ")}</td>
                              <td className="py-1.5 pr-3">{ev.team_id === m.home_team_id ? home?.name : ev.team_id === m.away_team_id ? away?.name : "—"}</td>
                              <td className="py-1.5 text-white/50">{ev.detail ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ScorePanel({ name, score, color, onPlus, onMinus }: { name: string; score: number; color?: string; onPlus: () => void; onMinus: () => void }) {
  return (
    <div className="rounded-lg border border-gray-800 p-4 text-center">
      <p className="text-sm truncate" style={{ color: color || "#fff" }}>{name}</p>
      <p className="my-2 text-5xl font-bold tabular-nums">{score}</p>
      <div className="flex justify-center gap-2">
        <Button size="icon" variant="outline" className="border-gray-700" onClick={onMinus}><Minus className="h-4 w-4" /></Button>
        <Button size="icon" className="bg-amber-600 hover:bg-amber-700" onClick={onPlus}><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-800 p-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-white/50">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
