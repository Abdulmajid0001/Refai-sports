import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Shield, Eye, EyeOff, RotateCw, CheckCircle, XCircle,
  Play, Pause, ZoomIn, ZoomOut, RefreshCw, Video,
  ChevronUp, ChevronDown, AlertTriangle, Target, Zap,
  Layers, Settings, Clock, Camera, Hand, Flag, Users
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface VARReview {
  id: string;
  incidentType: "foul" | "offside" | "handball" | "goal" | "penalty" | "card";
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
  minute: number;
  description: string;
  aiReasoning: string;
  suggestedDecision: "confirm" | "reject" | "escalate";
  status: "pending" | "reviewing" | "decided";
}

interface VARSystemProps {
  matchId: string;
  leagueId?: string;
  minute: number;
}

const INCIDENT_TYPES: { id: VARReview["incidentType"]; label: string; icon: any; color: string }[] = [
  { id: "foul", label: "Foul", icon: AlertsIcon, color: "text-yellow-400" },
  { id: "offside", label: "Offside", icon: Flag, color: "text-orange-400" },
  { id: "handball", label: "Handball", icon: Hand, color: "text-red-400" },
  { id: "goal", label: "Goal Check", icon: Zap, color: "text-green-400" },
  { id: "penalty", label: "Penalty", icon: Target, color: "text-purple-400" },
  { id: "card", label: "Card Review", icon: Shield, color: "text-red-500" },
];

export function VARSystem({ matchId, leagueId, minute }: VARSystemProps) {
  const { user } = useAuth();
  const [is3DMode, setIs3DMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeReview, setActiveReview] = useState<VARReview | null>(null);
  const [reviews, setReviews] = useState<VARReview[]>([]);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const [showOverlay, setShowOverlay] = useState(false);
  const [camera3DAngle, setCamera3DAngle] = useState(0);
  const [offsideLineVisible, setOffsideLineVisible] = useState(false);
  const [trajectoriesVisible, setTrajectoriesVisible] = useState(false);
  const [skeletonsVisible, setSkeletonsVisible] = useState(false);

  // Simulated detection confidence
  const [detectionConfidence, setDetectionConfidence] = useState(0);

  // Start VAR review
  const startVARReview = useCallback(async (incidentType: VARReview["incidentType"]) => {
    setIsLoading(true);

    // AI detection simulation
    const confidence = Math.floor(70 + Math.random() * 25);
    const decision = confidence > 85 ? "confirm" : confidence > 60 ? "escalate" : "reject";

    const newReview: VARReview = {
      id: `var-${Date.now()}`,
      incidentType,
      severity: confidence > 90 ? "critical" : confidence > 75 ? "high" : "medium",
      confidence,
      minute,
      description: `Detected ${incidentType} at ${minute}'`,
      aiReasoning: generateAIReasoning(incidentType, confidence),
      suggestedDecision: decision as any,
      status: "reviewing",
    };

    setActiveReview(newReview);
    setDetectionConfidence(confidence);
    setShowOverlay(true);
    setIsLoading(false);

    // Save to database
    if (user) {
      await supabase.from("var_reviews").insert({
        match_id: matchId,
        incident_type: incidentType,
        severity: newReview.severity,
        confidence: confidence,
        minute: minute,
        description: newReview.description,
        ai_reasoning: newReview.aiReasoning,
        created_by: user.id,
      });
    }

    toast.success("VAR review started");
  }, [matchId, minute, user]);

  const acceptDecision = useCallback(async () => {
    if (!activeReview) return;

    // Update decision
    const updatedReview = { ...activeReview, status: "decided" as const };
    setReviews((prev) => [...prev, updatedReview]);
    setActiveReview(null);
    setShowOverlay(false);

    // Update in database
    if (user) {
      await supabase
        .from("var_reviews")
        .update({
          decision: activeReview.suggestedDecision,
          decided_by: user.id,
          decided_at: new Date().toISOString(),
        })
        .eq("id", activeReview.id);
    }

    toast.success(`VAR decision: ${activeReview.suggestedDecision.toUpperCase()}`);
  }, [activeReview, user]);

  const rejectDecision = useCallback(async () => {
    if (!activeReview) return;

    const updatedReview = { ...activeReview, status: "decided", suggestedDecision: "reject" as const };
    setReviews((prev) => [...prev, updatedReview]);
    setActiveReview(null);
    setShowOverlay(false);

    toast.success("VAR decision: REJECTED");
  }, [activeReview]);

  const pushToViewers = useCallback(async () => {
    // PushVAR overlay to broadcast
    await supabase.from("broadcast_state").upsert({
      match_id: matchId,
      var_screen_mode: is3DMode ? "full" : "half",
      var_active: true,
      var_incident_type: activeReview?.incidentType,
      var_confidence: detectionConfidence,
      updated_by: user?.id,
    });

    toast.success("VAR overlay pushed to viewers");
  }, [matchId, is3DMode, activeReview, detectionConfidence, user]);

  const dismissOverlay = useCallback(async () => {
    await supabase.from("broadcast_state").update({
      var_screen_mode: "none",
      var_active: false,
    }).eq("match_id", matchId);

    setShowOverlay(false);
  }, [matchId]);

  return (
    <Card className="border-cyan-900/50 bg-slate-950/90">
      <CardHeader className="py-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4 text-cyan-400" />
          VAR System
          {activeReview && <Badge variant="destructive" className="animate-pulse">ACTIVE</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Detection triggers */}
        <div className="grid grid-cols-3 gap-1.5">
          {INCIDENT_TYPES.map((type) => (
            <Button
              key={type.id}
              size="sm"
              variant="outline"
              className={`h-8 text-xs ${type.color} border-current`}
              onClick={() => startVARReview(type.id)}
              disabled={isLoading}
            >
              <type.icon className="h-3 w-3 mr-1" />
              {type.label}
            </Button>
          ))}
        </div>

        {/* Active VAR Review */}
        {activeReview && (
          <div className="space-y-3 border border-cyan-800 rounded-lg p-3 bg-cyan-950/30">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-400 animate-pulse" />
                <span className="font-bold text-white uppercase">
                  VAR: {activeReview.incidentType.replace(/_/g, " ")}
                </span>
              </div>
              <Badge variant={activeReview.severity === "critical" ? "destructive" : "secondary"}>
                {activeReview.severity}
              </Badge>
            </div>

            {/* AI Confidence */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-white">
                <span>AI Confidence</span>
                <span className="font-bold">{activeReview.confidence}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    activeReview.confidence > 85 ? "bg-green-500" :
                    activeReview.confidence > 70 ? "bg-yellow-500" : "bg-orange-500"
                  }`}
                  style={{ width: `${activeReview.confidence}%` }}
                />
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="bg-black/30 rounded p-2 text-xs text-cyan-300">
              <div className="font-semibold mb-1">AI Analysis:</div>
              {activeReview.aiReasoning}
            </div>

            {/* Suggested Decision */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Suggested:</span>
              <Badge className={activeReview.suggestedDecision === "confirm" ? "bg-green-600" : activeReview.suggestedDecision === "reject" ? "bg-red-600" : "bg-yellow-600"}>
                {activeReview.suggestedDecision.toUpperCase()}
              </Badge>
            </div>

            {/* 3D Replay Controls */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button size="sm" variant={is3DMode ? "default" : "outline"} onClick={() => setIs3DMode(!is3DMode)}>
                  <Layers className="h-3 w-3 mr-1" />
                  3D View
                </Button>
                <Button size="sm" variant="outline" onClick={() => setOffsideLineVisible(!offsideLineVisible)}>
                  <Flag className="h-3 w-3 mr-1" />
                  Offside Line
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTrajectoriesVisible(!trajectoriesVisible)}>
                  <RotateCw className="h-3 w-3 mr-1" />
                  Trajectories
                </Button>
              </div>

              {is3DMode && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-white">
                    <span>Camera:</span>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={camera3DAngle}
                      onChange={(e) => setCamera3DAngle(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span>{camera3DAngle}°</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white">
                    <span>Speed:</span>
                    <input
                      type="range"
                      min={0.25}
                      max={2}
                      step={0.25}
                      value={replaySpeed}
                      onChange={(e) => setReplaySpeed(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span>{replaySpeed}x</span>
                  </div>
                </div>
              )}
            </div>

            {/* Decision Box */}
            <div className="flex gap-2 pt-2 border-t border-cyan-800">
              <Button className="flex-1 bg-green-600 hover:bg-green-500" onClick={acceptDecision}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Accept ({activeReview.suggestedDecision})
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-500" onClick={rejectDecision}>
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>

            {/* Viewer push */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={pushToViewers}>
                <Eye className="h-4 w-4 mr-1" />
                Push to Viewers
              </Button>
              <Button variant="ghost" onClick={dismissOverlay}>
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Review History */}
        {reviews.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-400">VAR Reviews ({reviews.length})</div>
            <div className="max-h-24 overflow-y-auto space-y-1">
              {reviews.map((review) => (
                <div key={review.id} className="flex items-center gap-2 bg-slate-800/50 rounded p-2 text-xs">
                  <Shield className="h-4 w-4 text-cyan-400" />
                  <span className="flex-1">{review.incidentType} - {review.minute}'</span>
                  <Badge variant={review.status === "decided" ? "secondary" : "destructive"} className="text-[10px]">
                    {review.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function generateAIReasoning(incidentType: string, confidence: number): string {
  const reasonings: Record<string, string[]> = {
    foul: [
      "Contact detected at high velocity. Defenders trailing leg made contact with attacker's standing leg.",
      "Shoulder-to-shoulder challenge deemed fair. No foul recommended.",
      "Arm used to impede attacker's progress. Direct free kick advised.",
    ],
    offside: [
      "Attacker positioned 0.5m beyond last defender at moment of pass. Offside confirmed.",
      "Attacker in line with last defender. No offside.",
      "Frame-by-frame analysis shows attacker onside at moment of ball contact.",
    ],
    handball: [
      "Arm in unnatural position, making body bigger. Ball-to-hand distance suggests deliberateness.",
      "Hand close to body, natural position. No handball.",
      "Deflection from close range. Arm movement toward ball detected.",
    ],
    goal: [
      "Ball fully crossed line before clearance. Goal confirmed.",
      "Goalkeeper cleared ball before full crossing. No goal.",
      "Frame analysis shows ball fractionally over line. Goal awarded.",
    ],
    penalty: [
      "Contact occurred inside penalty area. Attacker's momentum altered by challenge.",
      "Attacker initiated contact. No penalty recommended.",
      "Tripping foul in penalty area. Penalty advised.",
    ],
    card: [
      "Tackle endangered opponent's safety. Red card recommended.",
      "Persistent infringement by same player. Second yellow advised.",
      "Tactical foul denying goal-scoring opportunity. Yellow card recommended.",
    ],
  };

  const options = reasonings[incidentType] || ["Analysis pending."];
  return options[Math.floor(Math.random() * options.length)];
}

function AlertsIcon(props: any) {
  return <AlertTriangle {...props} />;
}
