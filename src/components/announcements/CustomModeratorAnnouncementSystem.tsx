import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Megaphone, AlertTriangle, AlertCircle, Info, Bell,
  Radio, Thermometer, Zap, Clock, Layers, Monitor,
  Play, X, Save, ChevronDown, ChevronUp, Volume2, Music
} from "lucide-react";
import { toast } from "sonner";
import { useBGE } from "../use-bge";

interface CMASProps {
  matchId: string;
}

type AnnouncementType = "hydration" | "weather" | "match_paused" | "emergency" | "technical" | "general" | "score_update" | "time_check";
type DisplayMode = "popup" | "banner" | "half_screen" | "full_screen" | "ticker";
type Priority = "low" | "normal" | "high" | "urgent";

const ANNOUNCEMENT_TEMPLATES: Record<AnnouncementType, { headline: string; message: string; icon: any; color: string }> = {
  hydration: {
    headline: "Hydration Break",
    message: "A short break for players to hydrate.",
    icon: Thermometer,
    color: "from-blue-600 to-cyan-600",
  },
  weather: {
    headline: "Weather Delay",
    message: "Match paused due to adverse weather conditions.",
    icon: Thermometer,
    color: "from-gray-600 to-slate-600",
  },
  match_paused: {
    headline: "Match Paused",
    message: "The match has been temporarily paused.",
    icon: PauseIcon,
    color: "from-amber-600 to-orange-600",
  },
  emergency: {
    headline: "Emergency Alert",
    message: "Please follow safety instructions immediately.",
    icon: AlertTriangle,
    color: "from-red-600 to-rose-600",
  },
  technical: {
    headline: "Technical Issue",
    message: "We are experiencing a technical difficulty. Please stand by.",
    icon: Radio,
    color: "from-yellow-600 to-amber-600",
  },
  general: {
    headline: "Announcement",
    message: "",
    icon: Megaphone,
    color: "from-slate-600 to-gray-600",
  },
  score_update: {
    headline: "Score Update",
    message: "",
    icon: Zap,
    color: "from-green-600 to-emerald-600",
  },
  time_check: {
    headline: "Time Check",
    message: "",
    icon: Clock,
    color: "from-purple-600 to-violet-600",
  },
};

const DISPLAY_MODES: { id: DisplayMode; label: string; icon: any }[] = [
  { id: "popup", label: "Popup", icon: Layers },
  { id: "banner", label: "Bottom Banner", icon: ChevronUp },
  { id: "half_screen", label: "Half Screen", icon: Monitor },
  { id: "full_screen", label: "Full Screen", icon: Maximize2 },
  { id: "ticker", label: "Scrolling Ticker", icon: ChevronDown },
];

const PRIORITY_LEVELS: { id: Priority; label: string; color: string }[] = [
  { id: "low", label: "Low", color: "bg-slate-500" },
  { id: "normal", label: "Normal", color: "bg-blue-500" },
  { id: "high", label: "High", color: "bg-amber-500" },
  { id: "urgent", label: "Urgent", color: "bg-red-500" },
];

export function CustomModeratorAnnouncementSystem({ matchId }: CMASProps) {
  const { pushGraphic, dismissAll, activeGraphics } = useBGE();

  const [type, setType] = useState<AnnouncementType>("general");
  const [headline, setHeadline] = useState("");
  const [message, setMessage] = useState("");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("banner");
  const [priority, setPriority] = useState<Priority>("normal");
  const [showAudioAlert, setShowAudioAlert] = useState(false);
  const [audioType, setAudioType] = useState<"chime" | "alert" | "urgent" | "goal">("chime");
  const [autoDismiss, setAutoDismiss] = useState(5);
  const [customIcon, setCustomIcon] = useState<string | null>(null);

  const template = ANNOUNCEMENT_TEMPLATES[type];

  const handlePushAnnouncement = () => {
    pushGraphic(
      "announcement",
      displayMode,
      {
        type,
        headline: headline || template.headline,
        message: message || template.message,
        priority,
        showDismiss: true,
        audioAlert: showAudioAlert ? audioType : null,
        icon: customIcon || type,
      },
      displayMode === "full_screen" ? "fade" : displayMode === "ticker" ? "slide_left" : "slide_up",
      undefined,
      autoDismiss > 0 ? autoDismiss * 1000 : undefined
    );

    toast.success("Announcement pushed to viewers");
  };

  const quickAnnounce = (quickType: AnnouncementType, quickPriority: Priority) => {
    const t = ANNOUNCEMENT_TEMPLATES[quickType];
    pushGraphic(
      "announcement",
      "banner",
      {
        type: quickType,
        headline: t.headline,
        message: t.message,
        priority: quickPriority,
      },
      "slide_up",
      undefined,
      5000
    );
    toast.success(`${t.headline} announcement pushed`);
  };

  return (
    <Card className="border-amber-900/50 bg-slate-950/90">
      <CardHeader className="py-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone className="h-4 w-4 text-amber-400" />
          Moderator Announcement System
          {activeGraphics.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">{activeGraphics.length} active</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quick announcement buttons */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-400">Quick Announcements</div>
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => quickAnnounce("hydration", "normal")}>
              <Thermometer className="h-3 w-3 mr-1 text-blue-400" />
              Hydration Break
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => quickAnnounce("weather", "high")}>
              <Thermometer className="h-3 w-3 mr-1 text-gray-400" />
              Weather Delay
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => quickAnnounce("match_paused", "high")}>
              <PauseIcon className="h-3 w-3 mr-1 text-amber-400" />
              Match Paused
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7 bg-red-900/50 border-red-700" onClick={() => quickAnnounce("emergency", "urgent")}>
              <AlertTriangle className="h-3 w-3 mr-1 text-red-400" />
              Emergency
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => quickAnnounce("technical", "normal")}>
              <Radio className="h-3 w-3 mr-1 text-yellow-400" />
              Technical Issue
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => quickAnnounce("time_check", "normal")}>
              <Clock className="h-3 w-3 mr-1 text-purple-400" />
              Time Check
            </Button>
          </div>
        </div>

        {/* Custom announcement form */}
        <div className="space-y-2 border-t border-slate-800 pt-3">
          <div className="text-xs font-semibold text-amber-400">Custom Announcement</div>

          {/* Type selector */}
          <div className="grid grid-cols-4 gap-1">
            {(Object.keys(ANNOUNCEMENT_TEMPLATES) as AnnouncementType[]).map((t) => {
              const tmpl = ANNOUNCEMENT_TEMPLATES[t];
              return (
                <Button
                  key={t}
                  size="sm"
                  variant={type === t ? "default" : "ghost"}
                  className={`text-xs h-7 ${type === t ? `bg-gradient-to-r ${tmpl.color}` : ""}`}
                  onClick={() => setType(t)}
                >
                  <tmpl.icon className="h-3 w-3 mr-1" />
                  {t.replace("_", " ")}
                </Button>
              );
            })}
          </div>

          {/* Headline and message */}
          <Input
            placeholder={template.headline}
            className="h-8 text-sm"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
          <Textarea
            placeholder={template.message || "Enter announcement message..."}
            className="text-sm min-h-[60px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          {/* Display mode */}
          <div className="grid grid-cols-5 gap-1">
            {DISPLAY_MODES.map((dm) => (
              <Button
                key={dm.id}
                size="sm"
                variant={displayMode === dm.id ? "default" : "outline"}
                className={`text-xs h-7 ${displayMode === dm.id ? "bg-amber-600" : ""}`}
                onClick={() => setDisplayMode(dm.id)}
              >
                <dm.icon className="h-3 w-3 mr-1" />
                {dm.label}
              </Button>
            ))}
          </div>

          {/* Priority */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Priority:</span>
            {PRIORITY_LEVELS.map((p) => (
              <Button
                key={p.id}
                size="sm"
                variant={priority === p.id ? "default" : "ghost"}
                className={`text-xs h-6 ${priority === p.id ? p.color : ""}`}
                onClick={() => setPriority(p.id)}
              >
                {p.label}
              </Button>
            ))}
          </div>

          {/* Audio alert */}
          <div className="flex items-center gap-3 py-2">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showAudioAlert}
                onChange={(e) => setShowAudioAlert(e.target.checked)}
                className="rounded"
              />
              <Volume2 className="h-3 w-3" />
              Audio alert
            </label>
            {showAudioAlert && (
              <div className="flex gap-1">
                {["chime", "alert", "urgent", "goal"].map((a) => (
                  <Button
                    key={a}
                    size="sm"
                    variant={audioType === a ? "default" : "ghost"}
                    className="text-xs h-6"
                    onClick={() => setAudioType(a as any)}
                  >
                    {a}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Auto dismiss */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Auto-dismiss:</span>
            <Input
              type="number"
              min={0}
              max={60}
              value={autoDismiss}
              onChange={(e) => setAutoDismiss(Number(e.target.value))}
              className="w-16 h-7 text-xs"
            />
            <span className="text-xs text-slate-500">seconds (0 = manual)</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button className="bg-amber-600 hover:bg-amber-500 text-sm" onClick={handlePushAnnouncement}>
              <Play className="h-4 w-4 mr-1" />
              Push Announcement
            </Button>
            <Button variant="outline" className="text-sm" onClick={dismissAll}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Active announcements */}
        {activeGraphics.length > 0 && (
          <div className="border-t border-slate-800 pt-3">
            <div className="text-xs font-semibold text-slate-400 mb-2">Active Announcements</div>
            <div className="space-y-1">
              {activeGraphics.map((g) => (
                <div key={g.id} className="flex items-center gap-2 bg-slate-800/50 rounded p-2 text-xs">
                  <Megaphone className="h-3 w-3 text-amber-400" />
                  <span className="flex-1 truncate">{g.payload.headline}</span>
                  <Badge variant="outline" className="text-[10px]">{g.displayMode}</Badge>
                  <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => dismissAll()}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function Maximize2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}
