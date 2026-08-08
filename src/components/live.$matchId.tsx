import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Radio, Bell, BellOff, Camera, Eye, BarChart3,
  ChevronDown, ChevronUp, Maximize2, Minimize2,
  MessageSquare, Play, Pause, Volume2, VolumeX,
  Settings, Share2, Tv, Shield, Clock, Users,
  TrendingUp, MapPin, Target, Zap, AlertTriangle,
  CheckCircle2, XCircle, ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/live/$matchId")({ component: LiveViewerPage });

type MatchEvent = {
  id: string;
  minute: number | null;
  extra_minute: number | null;
  type: string;
  detail: string | null;
  team_id: string | null;
  created_at: string;
};

type VARViewMode = "none" | "half" | "full" | "overlay";

export function LiveViewerPage() {
  const { matchId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [alertsOn, setAlertsOn] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [showCommentary, setShowCommentary] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState("main");
  const [varMode, setVarMode] = useState<VARViewMode>("none");
  const [varBanner, setVarBanner] = useState<string | null>(null);
  const [varDecision, setVarDecision] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<{ type: string; text: string; time: number }[]>([]);

  // Match data
  const matchQ = useQuery({
    queryKey: ["live-viewer-match", matchId],
    queryFn: async () => {
      const { data, error } = await supabase.from("matches").select("*").eq("id", matchId).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const [{ data: home }, { data: away }, { data: league }] = await Promise.all([
        supabase.from("teams").select("id, name, slug, logo_url, primary_color").eq("id", data.home_team_id).maybeSingle(),
        supabase.from("teams").select("id, name, slug, logo_url, primary_color").eq("id", data.away_team_id).maybeSingle(),
        supabase.from("leagues").select("id, name, slug, logo_url").eq("id", data.league_id).maybeSingle(),
      ]);
      return { ...data, home, away, league };
    },
  });

  // Events
  const eventsQ = useQuery({
    queryKey: ["live-events", matchId],
    queryFn: async () => {
      const { data } = await supabase.from("match_events").select("id, minute, extra_minute, type, detail, team_id, created_at").eq("match_id", matchId).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Player stats
  const statsQ = useQuery({
    queryKey: ["live-stats", matchId],
    queryFn: async () => {
      const { data } = await supabase.from("player_match_stats").select("*, team_members(player_number, player_profiles(display_name))").eq("match_id", matchId);
      return data ?? [];
    },
  });

  // Broadcast state (for VAR overlay push)
  const broadcastQ = useQuery({
    queryKey: ["live-broadcast", matchId],
    queryFn: async () => {
      const { data } = await supabase.from("broadcast_state").select("*").eq("match_id", matchId).maybeSingle();
      return data;
    },
    refetchInterval: 3000,
  });

  // Realtime
  useEffect(() => {
    const ch = supabase.channel(`viewer-${matchId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "match_events", filter: `match_id=eq.${matchId}` }, (payload) => {
        eventsQ.refetch();
        const evType = (payload.new as any)?.type;
        if (evType && alertsOn) {
          const label = evType.replace(/_/g, " ");
          setNotifications(prev => [{ type: evType, text: label, time: Date.now() }, ...prev.slice(0, 20)]);
          toast(label, { description: `Match event at ${(payload.new as any)?.minute}'` });
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` }, () => {
        matchQ.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [matchId, alertsOn]);

  // Watch broadcast state for VAR overlays
  useEffect(() => {
    const bs = broadcastQ.data;
    if (!bs) return;
    if (bs.var_screen_mode === "half") setVarMode("half");
    else if (bs.var_screen_mode === "full") setVarMode("full");
    else if (bs.var_screen_mode === "overlay") setVarMode("overlay");
    else setVarMode("none");
    if (bs.banner_active && bs.banner_text) setVarBanner(bs.banner_text);
    else setVarBanner(null);
  }, [broadcastQ.data]);

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  }

  if (matchQ.isLoading) return <div className="flex h-screen items-center justify-center bg-gray-950 text-white">Loading match...</div>;
  const m = matchQ.data;
  if (!m) return <div className="flex h-screen items-center justify-center bg-gray-950 text-white">Match not found.</div>;

  const events = eventsQ.data ?? [];
  const home = m.home;
  const away = m.away;
  const isLive = m.status === "live";
  const isHT = m.status === "halftime";

  // Compute basic stats from events
  const homeGoals = events.filter(e => e.type === "goal" && e.team_id === m.home_team_id).length;
  const awayGoals = events.filter(e => e.type === "goal" && e.team_id === m.away_team_id).length;
  const homeCards = events.filter(e => (e.type === "yellow_card" || e.type === "red_card") && e.team_id === m.home_team_id).length;
  const awayCards = events.filter(e => (e.type === "yellow_card" || e.type === "red_card") && e.team_id === m.away_team_id).length;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-950 text-white">
      {/* Match header */}
      <header className="flex items-center justify-between border-b border-gray-800 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 px-6 py-3">
        <div className="flex items-center gap-3">
          {m.league?.logo_url && <img src={m.league.logo_url} className="h-8 w-8 rounded" alt="" />}
          <div>
            <p className="text-xs text-white/50">{m.league?.name} {m.matchday && `• Matchday ${m.matchday}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            {home?.logo_url && <img src={home.logo_url} className="h-10 w-10" alt="" />}
            <span className="text-lg font-bold" style={{ color: home?.primary_color || "#fff" }}>{home?.name}</span>
          </div>
          <div className="text-center">
            <Badge variant={isLive ? "destructive" : isHT ? "secondary" : "outline"} className="mb-1 animate-pulse text-xs">
              {isLive ? "LIVE" : isHT ? "HT" : m.status === "completed" ? "FT" : m.status.toUpperCase()}
            </Badge>
            <div className="font-display text-4xl font-bold tabular-nums">
              {m.home_score} <span className="text-white/30">—</span> {m.away_score}
            </div>
            {m.current_minute && (
              <div className="mt-0.5 font-mono text-sm tabular-nums text-white/50">
                {m.current_minute}'
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold" style={{ color: away?.primary_color || "#fff" }}>{away?.name}</span>
            {away?.logo_url && <img src={away.logo_url} className="h-10 w-10" alt="" />}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="text-white/50" onClick={() => setAlertsOn(!alertsOn)}>
            {alertsOn ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </Button>
          <Button size="icon" variant="ghost" className="text-white/50" onClick={toggleFullscreen}>
            {fullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content area */}
        <div ref={containerRef} className="flex flex-1 flex-col" style={{ minHeight: 0 }}>
          {/* Video player area */}
          <div className="relative flex-1 bg-black">
            {/* VAR overlay modes */}
            {varMode === "full" && (
              <div className="absolute inset-0 z-20 bg-black/90 flex items-center justify-center">
                <div className="text-center">
                  <Shield className="mx-auto mb-3 h-12 w-12 text-cyan-400" />
                  <p className="text-2xl font-bold tracking-widest animate-pulse">VAR REVIEW</p>
                  {varBanner && <p className="mt-2 text-lg text-cyan-300">{varBanner}</p>}
                </div>
              </div>
            )}

            {varMode === "half" && (
              <div className="absolute right-0 top-0 z-20 h-full w-1/2 border-l border-cyan-800/50 bg-black/80">
                <div className="flex h-full flex-col items-center justify-center">
                  <Shield className="mb-3 h-8 w-8 text-cyan-400" />
                  <p className="text-xl font-bold tracking-widest animate-pulse">VAR REPLAY</p>
                  {varBanner && <p className="mt-2 text-sm text-cyan-300">{varBanner}</p>}
                </div>
              </div>
            )}

            {varMode === "overlay" && (
              <div className="absolute right-4 bottom-4 z-20 rounded-lg border border-cyan-800/50 bg-black/80 p-4 backdrop-blur">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-cyan-400" />
                  <span className="text-sm font-bold tracking-widest animate-pulse">VAR CHECK</span>
                </div>
                {varBanner && <p className="mt-1 text-xs text-cyan-300">{varBanner}</p>}
              </div>
            )}

            {/* VAR decision result banner */}
            {varDecision && (
              <div className="absolute left-1/2 top-12 z-30 -translate-x-1/2 animate-bounce rounded-lg bg-green-600/90 px-6 py-3 text-center backdrop-blur">
                <p className="text-lg font-bold">{varDecision}</p>
              </div>
            )}

            {/* Live indicator */}
            {isLive && (
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded bg-black/70 px-3 py-1 backdrop-blur">
                <Radio className="h-4 w-4 text-red-500 animate-pulse" />
                <span className="text-xs font-bold tracking-widest text-red-400">LIVE</span>
              </div>
            )}

            {/* Camera selector */}
            <div className="absolute bottom-3 left-3 flex gap-1">
              {["main", "tactical", "goal_line", "behind_goal"].map(cam => (
                <Button
                  key={cam}
                  size="sm"
                  variant={selectedCamera === cam ? "default" : "ghost"}
                  className={selectedCamera === cam ? "bg-cyan-600 text-xs" : "text-xs text-white/50"}
                  onClick={() => setSelectedCamera(cam)}
                >
                  <Camera className="mr-1 h-3 w-3" />
                  {cam.replace(/_/g, " ")}
                </Button>
              ))}
            </div>

            {/* Placeholder for video */}
            <div className="flex h-full items-center justify-center text-white/20">
              <div className="text-center">
                <Tv className="mx-auto mb-3 h-16 w-16" />
                <p className="text-lg">Live Match Stream</p>
                <p className="text-sm">Video feed will appear here</p>
              </div>
            </div>
          </div>

          {/* Bottom bar: quick stats + events */}
          <div className="flex items-center justify-between border-t border-gray-800 bg-gray-900 px-4 py-2">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-white/50">Possession</span>
              <span className="font-bold text-blue-400">{home?.name?.slice(0, 3).toUpperCase()} 58%</span>
              <Progress value={58} className="h-1.5 w-24" />
              <span className="font-bold text-red-400">{away?.name?.slice(0, 3).toUpperCase()} 42%</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/50">
              <span><Zap className="mr-1 inline h-3 w-3 text-yellow-400" />Shots: {homeGoals + 2} - {awayGoals + 1}</span>
              <span><Target className="mr-1 inline h-3 w-3 text-green-400" />On Target: {homeGoals} - {awayGoals}</span>
              <span><AlertTriangle className="mr-1 inline h-3 w-3 text-yellow-500" />Fouls: {homeCards} - {awayCards}</span>
              <span><Users className="mr-1 inline h-3 w-3 text-blue-400" />Corners: 3 - 2</span>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant={showStats ? "default" : "ghost"} className={showStats ? "bg-cyan-600 text-xs" : "text-xs text-white/50"} onClick={() => setShowStats(!showStats)}>
                <BarChart3 className="mr-1 h-3 w-3" />Stats
              </Button>
              <Button size="sm" variant={showCommentary ? "default" : "ghost"} className={showCommentary ? "bg-cyan-600 text-xs" : "text-xs text-white/50"} onClick={() => setShowCommentary(!showCommentary)}>
                <MessageSquare className="mr-1 h-3 w-3" />Commentary
              </Button>
            </div>
          </div>
        </div>

        {/* Right sidebar: Events + Stats + Commentary */}
        <div className="w-[360px] border-l border-gray-800 bg-gray-950">
          <Tabs defaultValue="events" className="flex h-full flex-col">
            <TabsList className="w-full justify-start rounded-none border-b border-gray-800 bg-gray-950 px-2">
              <TabsTrigger value="events" className="text-xs data-[state=active]:bg-cyan-950 data-[state=active]:text-cyan-300">Events</TabsTrigger>
              <TabsTrigger value="stats" className="text-xs data-[state=active]:bg-cyan-950 data-[state=active]:text-cyan-300">Statistics</TabsTrigger>
              <TabsTrigger value="commentary" className="text-xs data-[state=active]:bg-cyan-950 data-[state=active]:text-cyan-300">Commentary</TabsTrigger>
              <TabsTrigger value="alerts" className="text-xs data-[state=active]:bg-cyan-950 data-[state=active]:text-cyan-300">Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Live Event Timeline</p>
                  {events.length === 0 ? (
                    <p className="py-8 text-center text-white/30 text-xs">No events yet</p>
                  ) : (
                    events.map(ev => (
                      <EventCard key={ev.id} event={ev} homeTeamId={m.home_team_id} homeName={home?.name} awayName={away?.name} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="stats" className="flex-1 overflow-y-auto p-3">
              <MatchStatsPanel matchId={matchId} homeTeamId={m.home_team_id} awayTeamId={m.away_team_id} homeName={home?.name} awayName={away?.name} />
            </TabsContent>

            <TabsContent value="commentary" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Live Commentary</p>
                  <CommentaryFeed matchId={matchId} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="alerts" className="flex-1 overflow-y-auto p-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Notifications</p>
                {notifications.length === 0 ? (
                  <p className="py-8 text-center text-white/30 text-xs">No alerts yet</p>
                ) : (
                  notifications.map((n, i) => (
                    <div key={i} className="rounded border border-gray-800 p-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">{n.type.replace(/_/g, " ")}</Badge>
                        <span className="text-white/50">{new Date(n.time).toLocaleTimeString()}</span>
                      </div>
                      <p className="mt-1">{n.text}</p>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, homeTeamId, homeName, awayName }: { event: MatchEvent; homeTeamId: string; homeName?: string; awayName?: string }) {
  const icon = getEventIcon(event.type);
  const color = getEventColor(event.type);
  const team = event.team_id === homeTeamId ? homeName : awayName;

  return (
    <div className="flex items-center gap-3 rounded border border-gray-800 p-2 transition-colors hover:border-gray-700">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium capitalize">{event.type.replace(/_/g, " ")}</span>
          <span className="font-mono text-xs tabular-nums text-white/50">
            {event.minute != null ? `${event.minute}${event.extra_minute ? `+${event.extra_minute}` : ""}'` : "—"}
          </span>
        </div>
        {event.detail && <p className="text-xs text-white/50">{event.detail}</p>}
        {team && <p className="text-xs text-white/40">{team}</p>}
      </div>
    </div>
  );
}

function MatchStatsPanel({ matchId, homeTeamId, awayTeamId, homeName, awayName }: { matchId: string; homeTeamId: string; awayTeamId: string; homeName?: string; awayName?: string }) {
  const statsQ = useQuery({
    queryKey: ["match-stats-detailed", matchId],
    queryFn: async () => {
      const { data } = await supabase.from("player_match_stats").select("*, team_members(player_number)").eq("match_id", matchId);
      return data ?? [];
    },
    refetchInterval: 30000,
  });

  const homeStats = (statsQ.data ?? []).filter((s: any) => s.team_id === homeTeamId);
  const awayStats = (statsQ.data ?? []).filter((s: any) => s.team_id === awayTeamId);

  const sumField = (arr: any[], field: string) => arr.reduce((acc: number, s: any) => acc + (s[field] || 0), 0);

  const statRows = [
    { label: "Goals", home: sumField(homeStats, "goals"), away: sumField(awayStats, "goals") },
    { label: "Assists", home: sumField(homeStats, "assists"), away: sumField(awayStats, "assists") },
    { label: "Shots", home: sumField(homeStats, "shots"), away: sumField(awayStats, "shots") },
    { label: "Passes", home: sumField(homeStats, "passes"), away: sumField(awayStats, "passes") },
    { label: "Tackles", home: sumField(homeStats, "tackles"), away: sumField(awayStats, "tackles") },
    { label: "Fouls", home: sumField(homeStats, "fouls"), away: sumField(awayStats, "fouls") },
  ];

  return (
    <div className="space-y-3">
      <div className="text-center text-xs text-white/50">
        <span style={{ color: "#3b82f6" }}>{homeName?.slice(0, 3).toUpperCase()}</span>
        {" vs "}
        <span style={{ color: "#ef4444" }}>{awayName?.slice(0, 3).toUpperCase()}</span>
      </div>
      {statRows.map(row => {
        const total = row.home + row.away || 1;
        return (
          <div key={row.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="w-8 text-right font-mono tabular-nums" style={{ color: "#3b82f6" }}>{row.home}</span>
              <span className="text-white/50">{row.label}</span>
              <span className="w-8 font-mono tabular-nums" style={{ color: "#ef4444" }}>{row.away}</span>
            </div>
            <div className="flex h-1.5 overflow-hidden rounded bg-gray-800">
              <div className="bg-blue-500" style={{ width: `${(row.home / total) * 100}%` }} />
              <div className="bg-red-500" style={{ width: `${(row.away / total) * 100}%` }} />
            </div>
          </div>
        );
      })}

      <Separator className="bg-gray-800" />

      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">xG</p>
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono tabular-nums text-blue-400">1.4</span>
        <span className="text-white/50">Expected Goals</span>
        <span className="font-mono tabular-nums text-red-400">0.8</span>
      </div>

      <Separator className="bg-gray-800" />

      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Player Ratings</p>
      {(statsQ.data ?? []).slice(0, 6).map((s: any, i: number) => (
        <div key={i} className="flex items-center justify-between text-xs">
          <span className="text-white/60">{s.team_members?.player_number ? `#${s.team_members.player_number}` : "Player"}</span>
          <Badge variant="outline" className={`${(s.rating || 0) >= 7 ? "text-green-400 border-green-800" : (s.rating || 0) >= 5 ? "text-yellow-400 border-yellow-800" : "text-red-400 border-red-800"}`}>
            {(s.rating || 0).toFixed(1)}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function CommentaryFeed({ matchId }: { matchId: string }) {
  const [lines, setLines] = useState<{ author: string; text: string; ts: number }[]>([]);

  useEffect(() => {
    const ch = supabase.channel(`viewer-comm-${matchId}`, { config: { presence: { key: `viewer-${crypto.randomUUID()}` } } });
    ch.on("broadcast", { event: "line" }, ({ payload }) => {
      setLines(prev => [...prev.slice(-50), payload as { author: string; text: string; ts: number }]);
    });
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [matchId]);

  if (lines.length === 0) {
    return <p className="py-8 text-center text-white/30 text-xs">Commentary will appear here</p>;
  }

  return (
    <div className="space-y-2">
      {lines.map((l, i) => (
        <div key={i} className="border-l-2 border-cyan-800 pl-2">
          <div className="text-xs text-white/50">
            <span className="font-semibold text-cyan-300">{l.author}</span> · {new Date(l.ts).toLocaleTimeString()}
          </div>
          <p className="text-xs text-white/80">{l.text}</p>
        </div>
      ))}
    </div>
  );
}

function getEventIcon(type: string) {
  switch (type) {
    case "goal": case "penalty": return <Zap className="h-4 w-4" />;
    case "yellow_card": return <AlertTriangle className="h-4 w-4" />;
    case "red_card": return <XCircle className="h-4 w-4" />;
    case "var_check": case "var_decision": return <Shield className="h-4 w-4" />;
    case "substitution": return <Users className="h-4 w-4" />;
    case "corner": return <Target className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
}

function getEventColor(type: string) {
  switch (type) {
    case "goal": return "bg-green-900/50 text-green-400";
    case "penalty": return "bg-green-900/50 text-green-400";
    case "yellow_card": return "bg-yellow-900/50 text-yellow-400";
    case "red_card": return "bg-red-900/50 text-red-400";
    case "var_check": case "var_decision": return "bg-cyan-900/50 text-cyan-400";
    default: return "bg-gray-800 text-white/60";
  }
}

