import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Play, Pause, RotateCcw, FastForward, Rewind,
  SkipBack, SkipForward, Download, Bookmark, Trash2,
  Video, Camera, Clock, Settings, ChevronDown, ChevronUp,
  Repeat, Volume2, VolumeX, Maximize2, Layers, Scissors
} from "lucide-react";
import { toast } from "sonner";

interface ReplayClip {
  id: string;
  startTime: number;
  endTime: number;
  label: string;
  tags: string[];
  cameraAngle: string;
  createdAt: number;
}

interface InstantReplayEngineProps {
  matchId: string;
  leagueId?: string;
  leagueLogo?: string;
  sponsorName?: string;
  sponsorLogo?: string;
}

const REPLAY_TRIGGERS = [
  { id: "goal", label: "Goal", color: "bg-green-600" },
  { id: "penalty", label: "Penalty", color: "bg-red-600" },
  { id: "red_card", label: "Red Card", color: "bg-red-700" },
  { id: "var", label: "VAR Review", color: "bg-cyan-600" },
  { id: "foul", label: "Foul", color: "bg-yellow-600" },
  { id: "skill", label: "Skill Move", color: "bg-purple-600" },
  { id: "near_miss", label: "Near Miss", color: "bg-orange-600" },
];

const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 1.5, 2];
const CAMERA_ANGLES = ["Main", "Tactical", "Goal Line", "Behind Goal", "Crowd", "Drone"];

export function InstantReplayEngine({ matchId, leagueId, leagueLogo, sponsorName, sponsorLogo }: InstantReplayEngineProps) {
  // Buffer state
  const [bufferDuration, setBufferDuration] = useState(600); // 10 minutes in seconds
  const [bufferAvailable, setBufferAvailable] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState("Main");

  // Marker and clip state
  const [markIn, setMarkIn] = useState<number | null>(null);
  const [markOut, setMarkOut] = useState<number | null>(null);
  const [clips, setClips] = useState<ReplayClip[]>([]);
  const [replayQueue, setReplayQueue] = useState<ReplayClip[]>([]);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [clipLabel, setClipLabel] = useState("");
  const [exportFormat, setExportFormat] = useState<"mp4" | "gif">("mp4");

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const bufferChunksRef = useRef<Blob[]>([]);

  // Simulated buffer recording
  useEffect(() => {
    // In production, this would connect to WebRTC/WebSocket streams
    const interval = setInterval(() => {
      if (bufferChunksRef.current.length > bufferDuration) {
        bufferChunksRef.current.shift();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [bufferDuration]);

  const playPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const frameStep = useCallback((direction: "forward" | "backward") => {
    const frameTime = 1 / 30; // Assuming 30fps
    const newTime = direction === "forward"
      ? Math.min(currentTime + frameTime, duration)
      : Math.max(currentTime - frameTime, 0);
    seekTo(newTime);
  }, [currentTime, duration, seekTo]);

  const setMark = useCallback((type: "in" | "out") => {
    if (type === "in") {
      setMarkIn(currentTime);
      toast.success(`Mark In set at ${formatTime(currentTime)}`);
    } else {
      setMarkOut(currentTime);
      toast.success(`Mark Out set at ${formatTime(currentTime)}`);
    }
  }, [currentTime]);

  const saveClip = useCallback(() => {
    if (markIn === null || markOut === null) {
      toast.error("Set both Mark In and Mark Out first");
      return;
    }

    const newClip: ReplayClip = {
      id: `clip-${Date.now()}`,
      startTime: markIn,
      endTime: markOut,
      label: clipLabel || `Clip ${clips.length + 1}`,
      tags: [],
      cameraAngle: selectedCamera,
      createdAt: Date.now(),
    };

    setClips((prev) => [...prev, newClip]);
    setMarkIn(null);
    setMarkOut(null);
    setClipLabel("");
    toast.success("Clip saved to queue");
  }, [markIn, markOut, clipLabel, clips.length, selectedCamera]);

  const addToQueue = useCallback((clip: ReplayClip) => {
    setReplayQueue((prev) => [...prev, clip]);
    toast.success("Added to replay queue");
  }, []);

  const exportClip = useCallback(async (clip: ReplayClip, format: "mp4" | "gif") => {
    toast.success(`Exporting ${clip.label} as ${format.toUpperCase()}...`);
    // In production, this would use server-side ffmpeg
  }, [exportFormat]);

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  }

  return (
    <Card className="border-cyan-900/50 bg-slate-950/90">
      <CardHeader className="py-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Video className="h-4 w-4 text-cyan-400" />
          Instant Replay Engine
          <Badge variant="outline" className="ml-auto text-xs">
            {clips.length} clips
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Video preview */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          />

          {/* Camera selector */}
          <div className="absolute top-2 left-2 flex gap-1">
            {CAMERA_ANGLES.slice(0, 4).map((cam) => (
              <Button
                key={cam}
                size="sm"
                variant={selectedCamera === cam ? "default" : "ghost"}
                className={selectedCamera === cam ? "bg-cyan-600 text-xs h-6" : "text-xs text-white/60 h-6"}
                onClick={() => setSelectedCamera(cam)}
              >
                {cam}
              </Button>
            ))}
          </div>

          {/* Time overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs font-mono bg-black/60 rounded px-2 py-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Mark in/out indicator */}
          {markIn !== null && (
            <div className="absolute bottom-10 left-2 text-xs text-green-400 bg-black/60 px-2 py-1 rounded">
              IN: {formatTime(markIn)}
            </div>
          )}
          {markOut !== null && (
            <div className="absolute bottom-10 right-2 text-xs text-red-400 bg-black/60 px-2 py-1 rounded">
              OUT: {formatTime(markOut)}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          <div className="relative h-2 bg-slate-800 rounded cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              seekTo(pct * duration);
            }}
          >
            {/* Mark in/out range */}
            {markIn !== null && markOut !== null && (
              <div
                className="absolute h-full bg-cyan-500/30"
                style={{
                  left: `${(markIn / duration) * 100}%`,
                  width: `${((markOut - markIn) / duration) * 100}%`,
                }}
              />
            )}
            {/* Clips markers */}
            {clips.map((clip) => (
              <div
                key={clip.id}
                className="absolute h-full w-1 bg-yellow-500"
                style={{ left: `${(clip.startTime / duration) * 100}%` }}
                title={clip.label}
              />
            ))}
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={() => frameStep("backward")} title="Frame back">
            <SkipBack className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => seekTo(Math.max(0, currentTime - 5))}>
            <Rewind className="h-3 w-3" />
          </Button>
          <Button size="sm" className="bg-cyan-600" onClick={playPause}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="outline" onClick={() => seekTo(Math.min(duration, currentTime + 5))}>
            <FastForward className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => frameStep("forward")} title="Frame forward">
            <SkipForward className="h-3 w-3" />
          </Button>

          <div className="border-l border-slate-700 h-6 mx-1" />

          {/* Speed */}
          <Select value={playbackSpeed.toString()} onValueChange={(v) => setPlaybackSpeed(Number(v))}>
            <SelectTrigger className="w-16 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLAYBACK_SPEEDS.map((s) => (
                <SelectItem key={s} value={s.toString()} className="text-xs">{s}x</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="border-l border-slate-700 h-6 mx-1" />

          {/* Marks */}
          <Button size="sm" variant={markIn !== null ? "default" : "outline"} className="h-7 text-xs" onClick={() => setMark("in")}>
            Mark In
          </Button>
          <Button size="sm" variant={markOut !== null ? "default" : "outline"} className="h-7 text-xs" onClick={() => setMark("out")}>
            Mark Out
          </Button>
          <Input
            placeholder="Clip label"
            className="h-7 w-32 text-xs"
            value={clipLabel}
            onChange={(e) => setClipLabel(e.target.value)}
          />
          <Button size="sm" className="bg-green-600 h-7 text-xs" onClick={saveClip}>
            <Bookmark className="h-3 w-3 mr-1" /> Save
          </Button>
        </div>

        {/* Quick replay triggers */}
        <div className="flex flex-wrap gap-1.5">
          {REPLAY_TRIGGERS.map((trigger) => (
            <Button
              key={trigger.id}
              size="sm"
              variant="outline"
              className={`text-xs h-6 ${trigger.color} text-white border-transparent`}
              onClick={() => {
                setMarkIn(Math.max(0, currentTime - 10));
                setMarkOut(currentTime);
                setClipLabel(trigger.label);
                toast.success(`${trigger.label} marked for replay`);
              }}
            >
              {trigger.label}
            </Button>
          ))}
        </div>

        {/* Clips list */}
        {clips.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-400">Saved Clips ({clips.length})</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {clips.map((clip) => (
                <div key={clip.id} className="flex items-center gap-2 bg-slate-800/50 rounded p-2 text-xs">
                  <Camera className="h-3 w-3 text-cyan-400" />
                  <span className="flex-1 truncate">{clip.label}</span>
                  <span className="text-slate-500">{formatTime(clip.endTime - clip.startTime)}</span>
                  <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => addToQueue(clip)}>
                    <Play className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => exportClip(clip, "mp4")}>
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400" onClick={() => setClips((prev) => prev.filter((c) => c.id !== clip.id))}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Replay queue */}
        {replayQueue.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-yellow-400 flex items-center gap-2">
              <Layers className="h-3 w-3" />
              Replay Queue ({replayQueue.length})
            </div>
            <div className="flex gap-1.5">
              {replayQueue.map((clip, i) => (
                <Badge key={clip.id} variant="outline" className="text-xs">
                  {i + 1}. {clip.label}
                </Badge>
              ))}
              <Button size="sm" variant="ghost" className="h-5 text-xs" onClick={() => setReplayQueue([])}>
                Clear
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper for slider
function Select(props: any) {
  return <div {...props} />;
}
function SelectTrigger(props: any) {
  return <div {...props} />;
}
function SelectValue(props: any) {
  return <div {...props} />;
}
function SelectContent(props: any) {
  return <div {...props} />;
}
function SelectItem(props: any) {
  return <div {...props} />;
}
