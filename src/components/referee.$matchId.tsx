import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Camera, CameraOff, Maximize2, Minimize2, Play, Pause, Square,
  Goal, Square as CardIcon, Flag, AlertTriangle, Video, RefreshCw, Plus, Minus,
  Rewind, Download, X,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { Database } from "@/integrations/supabase/types";
import { AIRefereePanel } from "@/components/match/AIRefereePanel";
import { StatsAdminPanel } from "@/components/match/StatsAdminPanel";
import { LiveStreamRoom } from "@/components/match/LiveStreamRoom";

type EventType = Database["public"]["Enums"]["match_event_type"];
type MatchStatus = Database["public"]["Enums"]["match_status"];

export const Route = createFileRoute("/referee/$matchId")({ component: RefereeConsole });

export function RefereeConsole() {
  const { matchId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // ---- Auth gate ----
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  // ---- Match data ----
  const matchQ = useQuery({
    queryKey: ["referee-match", matchId],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("matches").select("*").eq("id", matchId).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const [{ data: home }, { data: away }] = await Promise.all([
        supabase.from("teams").select("id, name, primary_color, logo_url").eq("id", data.home_team_id).maybeSingle(),
        supabase.from("teams").select("id, name, primary_color, logo_url").eq("id", data.away_team_id).maybeSingle(),
      ]);
      return { ...data, home, away };
    },
  });

  // ---- Camera state ----
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDeviceId, setVideoDeviceId] = useState<string>("");
  const [audioDeviceId, setAudioDeviceId] = useState<string>("");
  const [cameraOn, setCameraOn] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Rolling VAR buffer (continuous capture while camera is on)
  const bufferRecorderRef = useRef<MediaRecorder | null>(null);
  const bufferChunksRef = useRef<Blob[]>([]);
  const BUFFER_SECONDS = 60;
  const [replayUrl, setReplayUrl] = useState<string | null>(null);
  const [replayDuration, setReplayDuration] = useState(0);
  const [markIn, setMarkIn] = useState(0);
  const [markOut, setMarkOut] = useState(0);
  const replayVideoRef = useRef<HTMLVideoElement>(null);


  // ---- Match clock (manual) ----
  const [minute, setMinute] = useState(0);
  const [extra, setExtra] = useState(0);
  const [clockRunning, setClockRunning] = useState(false);
  useEffect(() => {
    if (!clockRunning) return;
    const t = setInterval(() => setMinute((m) => m + 1), 60_000);
    return () => clearInterval(t);
  }, [clockRunning]);

  // ---- Device enumeration ----
  async function refreshDevices() {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(list.filter((d) => d.kind === "videoinput"));
      setAudioDevices(list.filter((d) => d.kind === "audioinput"));
    } catch (e) {
      console.error(e);
    }
  }
  useEffect(() => { refreshDevices(); }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : { facingMode: "environment" },
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
      await refreshDevices();
      startBuffer(stream);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Camera access denied");
    }
  }

  function stopCamera() {
    stopBuffer();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    if (recording) stopRecording();
  }

  useEffect(() => () => stopCamera(), []);

  // ---- VAR rolling buffer ----
  function startBuffer(stream: MediaStream) {
    try {
      bufferChunksRef.current = [];
      const rec = new MediaRecorder(stream, { mimeType: "video/webm" });
      rec.ondataavailable = (e) => {
        if (e.data.size === 0) return;
        bufferChunksRef.current.push(e.data);
        // keep last BUFFER_SECONDS (1s slices)
        if (bufferChunksRef.current.length > BUFFER_SECONDS) bufferChunksRef.current.shift();
      };
      rec.start(1000);
      bufferRecorderRef.current = rec;
    } catch (e) {
      console.error("buffer:", e);
    }
  }
  function stopBuffer() {
    try { bufferRecorderRef.current?.stop(); } catch { /* noop */ }
    bufferRecorderRef.current = null;
  }
  function openReplay() {
    if (bufferChunksRef.current.length === 0) {
      toast.error("Buffer empty — wait a few seconds after starting camera");
      return;
    }
    const blob = new Blob(bufferChunksRef.current, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    if (replayUrl) URL.revokeObjectURL(replayUrl);
    setReplayUrl(url);
    setMarkIn(0); setMarkOut(0); setReplayDuration(0);
  }
  function closeReplay() {
    if (replayUrl) URL.revokeObjectURL(replayUrl);
    setReplayUrl(null);
  }
  function downloadReplay() {
    if (!replayUrl) return;
    const a = document.createElement("a");
    a.href = replayUrl;
    a.download = `var-${matchId}-${Date.now()}.webm`;
    a.click();
    logEvent("var_check", null, `VAR replay saved (in ${markIn.toFixed(1)}s – out ${markOut.toFixed(1)}s)`);
  }

  async function saveAsHighlight() {
    if (!user) return;
    const title = window.prompt("Highlight title (e.g. 'Late goal — 87')", `Highlight @ ${minute || "?"}'`);
    if (!title) return;
    const { error } = await supabase.from("match_highlights").insert({
      match_id: matchId,
      title,
      minute: minute || null,
      start_seconds: markIn || null,
      end_seconds: markOut || null,
      created_by: user.id,
    });
    if (error) toast.error(error.message);
    else toast.success("Highlight saved");
  }



  // ---- Local recording (VAR rolling buffer placeholder) ----
  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const rec = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `match-${matchId}-${Date.now()}.webm`; a.click();
      URL.revokeObjectURL(url);
    };
    rec.start(1000);
    recorderRef.current = rec;
    setRecording(true);
  }
  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  // ---- Fullscreen ----
  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  }

  // ---- Match actions ----
  async function setStatus(status: MatchStatus) {
    const { error } = await supabase.from("matches").update({ status }).eq("id", matchId);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["referee-match", matchId] });
  }

  async function changeScore(side: "home" | "away", delta: number) {
    const m = matchQ.data;
    if (!m) return;
    const next = Math.max(0, (side === "home" ? m.home_score : m.away_score) + delta);
    const patch = side === "home" ? { home_score: next } : { away_score: next };
    const { error } = await supabase.from("matches").update(patch).eq("id", matchId);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["referee-match", matchId] });
  }

  async function logEvent(type: EventType, teamId?: string | null, detail?: string) {
    if (!user) return;
    const { error } = await supabase.from("match_events").insert({
      match_id: matchId,
      type,
      team_id: teamId ?? null,
      minute: minute || null,
      extra_minute: extra || null,
      detail: detail ?? null,
      created_by: user.id,
    });
    if (error) toast.error(error.message);
    else toast.success(`${type.replace(/_/g, " ")} logged`);
  }

  async function goal(side: "home" | "away") {
    const m = matchQ.data;
    if (!m) return;
    const teamId = side === "home" ? m.home_team_id : m.away_team_id;
    await Promise.all([logEvent("goal", teamId), changeScore(side, 1)]);
  }

  if (loading || matchQ.isLoading) {
    return <PageShell><div className="mx-auto max-w-7xl px-4 py-10">Loading…</div></PageShell>;
  }
  const m = matchQ.data;
  if (!m) return <PageShell><div className="mx-auto max-w-7xl px-4 py-10">Match not found.</div></PageShell>;

  const home = m.home; const away = m.away;

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Referee console</h1>
            <p className="text-sm text-muted-foreground">{home?.name} vs {away?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={m.status === "live" ? "destructive" : "outline"} className="capitalize">{m.status}</Badge>
            <Button asChild size="sm" variant="outline">
              <Link to="/commentate/$matchId" params={{ matchId }}>Commentator booth</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/matches/$id" params={{ id: matchId }}>Viewer page</Link>
            </Button>
          </div>
        </div>

        {/* Camera + HUD container — 50% height on desktop, 90% width */}
        <div
          ref={containerRef}
          className="relative mx-auto w-full overflow-hidden rounded-xl border bg-black md:w-[90%]"
          style={{ aspectRatio: "16 / 9" }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
          />
          {!cameraOn && (
            <div className="absolute inset-0 grid place-items-center text-white/70">
              <div className="text-center">
                <CameraOff className="mx-auto mb-2 h-10 w-10" />
                <p>Camera off — select a device and start</p>
              </div>
            </div>
          )}

          {/* Scoreboard HUD */}
          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-3 rounded-lg bg-black/60 px-4 py-2 text-white backdrop-blur">
            <div className="text-xs uppercase tracking-widest opacity-70">Live</div>
            <div className="font-display text-xl font-bold">
              <span style={{ color: home?.primary_color || undefined }}>{home?.name?.slice(0, 3).toUpperCase()}</span>
              <span className="mx-2 tabular-nums">{m.home_score} - {m.away_score}</span>
              <span style={{ color: away?.primary_color || undefined }}>{away?.name?.slice(0, 3).toUpperCase()}</span>
            </div>
            <div className="rounded bg-white/10 px-2 py-1 font-mono text-xs tabular-nums">
              {minute}{extra ? `+${extra}` : ""}'
            </div>
          </div>

          <div className="absolute right-3 top-3 flex gap-2">
            <Button size="sm" variant="secondary" onClick={openReplay} disabled={!cameraOn} title="VAR replay">
              <Rewind className="mr-1 h-4 w-4" />VAR
            </Button>
            <Button size="icon" variant="secondary" onClick={toggleFullscreen}>
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* VAR replay panel */}
        {replayUrl && (
          <Card className="border-destructive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">VAR replay — last {BUFFER_SECONDS}s</CardTitle>
              <Button size="icon" variant="ghost" onClick={closeReplay}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <video
                ref={replayVideoRef}
                src={replayUrl}
                controls
                className="w-full rounded bg-black"
                onLoadedMetadata={(e) => {
                  const d = (e.target as HTMLVideoElement).duration;
                  // Some WebM blobs report Infinity; force a seek to compute real duration
                  if (!isFinite(d)) {
                    const v = e.target as HTMLVideoElement;
                    v.currentTime = 1e9;
                    v.ontimeupdate = () => {
                      v.ontimeupdate = null;
                      v.currentTime = 0;
                      setReplayDuration(v.duration || 0);
                      setMarkOut(v.duration || 0);
                    };
                  } else {
                    setReplayDuration(d);
                    setMarkOut(d);
                  }
                }}
              />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Button size="sm" variant="outline" onClick={() => {
                  const v = replayVideoRef.current; if (v) setMarkIn(Number(v.currentTime.toFixed(2)));
                }}>Mark in ({markIn.toFixed(1)}s)</Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const v = replayVideoRef.current; if (v) setMarkOut(Number(v.currentTime.toFixed(2)));
                }}>Mark out ({markOut.toFixed(1)}s)</Button>
              </div>
              <div className="relative h-2 rounded bg-muted">
                {replayDuration > 0 && (
                  <div
                    className="absolute h-full rounded bg-destructive/70"
                    style={{
                      left: `${(markIn / replayDuration) * 100}%`,
                      width: `${Math.max(0, ((markOut - markIn) / replayDuration) * 100)}%`,
                    }}
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => { const v = replayVideoRef.current; if (v) v.currentTime = markIn; }}>
                  <Play className="mr-1 h-4 w-4" />Play from in
                </Button>
                <Button size="sm" variant="secondary" onClick={downloadReplay}>
                  <Download className="mr-1 h-4 w-4" />Save clip
                </Button>
                <Button size="sm" variant="outline" onClick={saveAsHighlight}>
                  <Flag className="mr-1 h-4 w-4" />Save as highlight
                </Button>
                <Button size="sm" variant="outline" onClick={() => logEvent("var_decision", null, `VAR decision (replay ${markIn.toFixed(1)}–${markOut.toFixed(1)}s)`)}>
                  <Flag className="mr-1 h-4 w-4" />Log decision
                </Button>

              </div>
              <p className="text-xs text-muted-foreground">
                The full buffered clip is saved as WebM. Frame-accurate trimming between mark-in/out will be added with server-side ffmpeg in Milestone 6.
              </p>
            </CardContent>
          </Card>
        )}


        {/* Devices + camera controls */}
        <Card>
          <CardHeader><CardTitle className="text-base">Capture</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto_auto_auto]">
            <Select value={videoDeviceId} onValueChange={setVideoDeviceId}>
              <SelectTrigger><SelectValue placeholder="Video input" /></SelectTrigger>
              <SelectContent>
                {devices.map((d) => (
                  <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 6)}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={audioDeviceId} onValueChange={setAudioDeviceId}>
              <SelectTrigger><SelectValue placeholder="Microphone" /></SelectTrigger>
              <SelectContent>
                {audioDevices.map((d) => (
                  <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0, 6)}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={refreshDevices} variant="outline" size="icon" title="Refresh devices">
              <RefreshCw className="h-4 w-4" />
            </Button>
            {!cameraOn ? (
              <Button onClick={startCamera}><Camera className="mr-1 h-4 w-4" />Start</Button>
            ) : (
              <Button onClick={stopCamera} variant="outline"><CameraOff className="mr-1 h-4 w-4" />Stop</Button>
            )}
            {!recording ? (
              <Button onClick={startRecording} disabled={!cameraOn} variant="secondary">
                <Video className="mr-1 h-4 w-4" />Record
              </Button>
            ) : (
              <Button onClick={stopRecording} variant="destructive">
                <Square className="mr-1 h-4 w-4" />Save clip
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Match control */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Match clock & status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Input type="number" min={0} max={130} value={minute} onChange={(e) => setMinute(Number(e.target.value))} className="w-20" />
                <span className="text-muted-foreground">+</span>
                <Input type="number" min={0} max={20} value={extra} onChange={(e) => setExtra(Number(e.target.value))} className="w-20" />
                <span className="text-sm text-muted-foreground">minute</span>
                {!clockRunning ? (
                  <Button size="sm" onClick={() => setClockRunning(true)}><Play className="mr-1 h-4 w-4" />Run</Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setClockRunning(false)}><Pause className="mr-1 h-4 w-4" />Pause</Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => { setStatus("live"); logEvent("kickoff"); setClockRunning(true); }}>Kick off</Button>
                <Button size="sm" variant="outline" onClick={() => { setStatus("halftime"); logEvent("period_end", null, "Half time"); setClockRunning(false); }}>Half time</Button>
                <Button size="sm" variant="outline" onClick={() => { setStatus("live"); logEvent("period_start", null, "Second half"); setClockRunning(true); }}>Resume</Button>
                <Button size="sm" variant="destructive" onClick={() => { setStatus("completed"); logEvent("fulltime"); setClockRunning(false); }}>Full time</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Scoreboard</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <ScoreControl label={home?.name ?? "Home"} value={m.home_score} onPlus={() => goal("home")} onMinus={() => changeScore("home", -1)} />
              <ScoreControl label={away?.name ?? "Away"} value={m.away_score} onPlus={() => goal("away")} onMinus={() => changeScore("away", -1)} />
            </CardContent>
          </Card>
        </div>

        {/* Event buttons */}
        <Card>
          <CardHeader><CardTitle className="text-base">Log event</CardTitle></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <TeamRow label={home?.name ?? "Home"} teamId={m.home_team_id} log={logEvent} />
            <TeamRow label={away?.name ?? "Away"} teamId={m.away_team_id} log={logEvent} />
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">VAR / neutral</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => logEvent("var_check", null, "VAR check")}>
                  <AlertTriangle className="mr-1 h-4 w-4" />VAR check
                </Button>
                <Button size="sm" variant="outline" onClick={() => logEvent("var_decision", null, "VAR decision")}>
                  <Flag className="mr-1 h-4 w-4" />VAR decision
                </Button>
                <Button size="sm" variant="ghost" onClick={() => logEvent("note", null, "Note")}>Note</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <AIRefereePanel sport="football" context={`${home?.name ?? "Home"} vs ${away?.name ?? "Away"} — ${m.home_score}-${m.away_score}`} />
        <StatsAdminPanel matchId={matchId} homeTeamId={m.home_team_id} awayTeamId={m.away_team_id} />
        <LiveStreamRoom matchId={matchId} role="publisher" name={user?.email ?? "Referee"} />
      </div>

    </PageShell>
  );
}

function ScoreControl({ label, value, onPlus, onMinus }: { label: string; value: number; onPlus: () => void; onMinus: () => void }) {
  return (
    <div className="rounded-lg border p-4 text-center">
      <div className="truncate text-sm text-muted-foreground">{label}</div>
      <div className="my-2 font-display text-5xl font-bold tabular-nums">{value}</div>
      <div className="flex justify-center gap-2">
        <Button size="icon" variant="outline" onClick={onMinus}><Minus className="h-4 w-4" /></Button>
        <Button size="icon" onClick={onPlus}><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function TeamRow({ label, teamId, log }: { label: string; teamId: string; log: (t: EventType, team?: string | null, d?: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => log("goal", teamId)}><Goal className="mr-1 h-4 w-4" />Goal</Button>
        <Button size="sm" variant="outline" onClick={() => log("yellow_card", teamId)}><CardIcon className="mr-1 h-4 w-4 text-yellow-500" />Yellow</Button>
        <Button size="sm" variant="outline" onClick={() => log("red_card", teamId)}><CardIcon className="mr-1 h-4 w-4 text-red-600" />Red</Button>
        <Button size="sm" variant="ghost" onClick={() => log("foul", teamId)}>Foul</Button>
        <Button size="sm" variant="ghost" onClick={() => log("corner", teamId)}>Corner</Button>
        <Button size="sm" variant="ghost" onClick={() => log("substitution", teamId)}>Sub</Button>
      </div>
    </div>
  );
}
