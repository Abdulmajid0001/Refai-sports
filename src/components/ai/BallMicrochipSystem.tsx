import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Circle, Target, Zap, TrendingUp, AlertTriangle,
  RefreshCw, Activity, MapPin, Clock, Bluetooth
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BallPosition {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface BallVelocity {
  speed: number;
  direction: number;
  verticalAngle: number;
}

interface TouchEvent {
  id: string;
  timestamp: number;
  position: BallPosition;
  playerId?: string;
  playerName?: string;
  teamId?: string;
  touchType: "pass" | "shot" | "control" | "header" | "clearance" | "unknown";
  confidence: number;
}

interface GoalLineEvent {
  id: string;
  timestamp: number;
  crossedLine: boolean;
  percentageOver: number;
  position: BallPosition;
  confidence: number;
}

interface OffsidePosition {
  playerId: string;
  playerName: string;
  teamId: string;
  x: number;
  isOffside: boolean;
  distanceFromLine: number;
}

interface BallMicrochipSystemProps {
  matchId: string;
  isActive?: boolean;
  onGoalLineEvent?: (event: GoalLineEvent) => void;
  onOffsideDetected?: (positions: OffsidePosition[]) => void;
}

export function BallMicrochipSystem({
  matchId,
  isActive = true,
  onGoalLineEvent,
  onOffsideDetected,
}: BallMicrochipSystemProps) {
  const [isTracking, setIsTracking] = useState(isActive);
  const [signalStrength, setSignalStrength] = useState(98);
  const [batteryLevel, setBatteryLevel] = useState(87);
  const [trackingRate, setTrackingRate] = useState(500);

  const [ballPosition, setBallPosition] = useState<BallPosition>({
    x: 50.5,
    y: 35.2,
    z: 0.5,
    timestamp: Date.now(),
  });

  const [ballVelocity, setBallVelocity] = useState<BallVelocity>({
    speed: 65,
    direction: 45,
    verticalAngle: 12,
  });

  const [recentTouches, setRecentTouches] = useState<TouchEvent[]>([]);
  const [goalLineStatus, setGoalLineStatus] = useState<"clear" | "approaching" | "checking" | "goal">("clear");
  const [lastGoalLineCheck, setLastGoalLineCheck] = useState<GoalLineEvent | null>(null);
  const [offsideLine, setOffsideLine] = useState({ x: 35.2, active: false });
  const [offsidePositions, setOffsidePositions] = useState<OffsidePosition[]>([]);

  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start high-frequency tracking
  const startTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }

    const interval = Math.floor(1000 / trackingRate);

    trackingIntervalRef.current = setInterval(() => {
      if (!isTracking) return;

      // Simulate ball position updates
      const newX = ballPosition.x + (Math.random() - 0.5) * 2;
      const newY = ballPosition.y + (Math.random() - 0.5) * 2;
      const newZ = Math.max(0, Math.min(3, ballPosition.z + (Math.random() - 0.5) * 0.3));

      setBallPosition({
        x: Math.max(0, Math.min(105, newX)),
        y: Math.max(0, Math.min(68, newY)),
        z: newZ,
        timestamp: Date.now(),
      });

      // Update velocity
      setBallVelocity({
        speed: Math.floor(40 + Math.random() * 60),
        direction: Math.floor(Math.random() * 360),
        verticalAngle: Math.floor(Math.random() * 45 - 10),
      });

      // Simulate signal/battery fluctuation
      setSignalStrength((prev) => Math.max(85, Math.min(100, prev + (Math.random() - 0.5) * 2)));
      setBatteryLevel((prev) => Math.max(10, Math.min(100, prev - 0.001)));

      // Check for goal line proximity
      if (newX < 1 || newX > 104) {
        checkGoalLine();
      }

    }, interval);

    toast.success(`Ball tracking started at ${trackingRate}Hz`);
  }, [isTracking, trackingRate, ballPosition]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    setIsTracking(false);
    toast.info("Ball tracking stopped");
  }, []);

  // Goal line detection
  const checkGoalLine = useCallback(async () => {
    setGoalLineStatus("checking");

    await new Promise((resolve) => setTimeout(resolve, 100));

    const percentageOver = Math.random() * 100;
    const isGoal = percentageOver > 95;

    const event: GoalLineEvent = {
      id: `gl-${Date.now()}`,
      timestamp: Date.now(),
      crossedLine: isGoal,
      percentageOver,
      position: ballPosition,
      confidence: Math.floor(95 + Math.random() * 5),
    };

    setLastGoalLineCheck(event);
    setGoalLineStatus(isGoal ? "goal" : "clear");

    if (onGoalLineEvent) {
      onGoalLineEvent(event);
    }

    // Save to database
    await supabase.from("ball_events").insert({
      match_id: matchId,
      event_type: "goal_line_check",
      position: { x: ballPosition.x, y: ballPosition.y, z: ballPosition.z },
      data: { crossed_line: isGoal, percentage_over: percentageOver },
      confidence: event.confidence,
    });

    if (isGoal) {
      toast.success("GOAL LINE TECHNOLOGY: BALL CROSSED LINE!", {
        duration: 5000,
      });
    }

    setTimeout(() => setGoalLineStatus("clear"), 3000);
  }, [ballPosition, matchId, onGoalLineEvent]);

  // Detect touch
  const detectTouch = useCallback((playerId: string, playerName: string, teamId: string) => {
    const touchTypes: TouchEvent["touchType"][] = ["pass", "shot", "control", "header", "clearance"];
    const touchType = touchTypes[Math.floor(Math.random() * touchTypes.length)];

    const touch: TouchEvent = {
      id: `touch-${Date.now()}`,
      timestamp: Date.now(),
      position: { ...ballPosition },
      playerId,
      playerName,
      teamId,
      touchType,
      confidence: Math.floor(85 + Math.random() * 15),
    };

    setRecentTouches((prev) => [touch, ...prev.slice(0, 9)]);

    toast.info(`Touch detected: ${playerName} (${touchType})`);
  }, [ballPosition]);

  // Update offside line
  const updateOffsideLine = useCallback(async (x: number) => {
    setOffsideLine({ x, active: true });

    // Generate random offside positions
    const positions: OffsidePosition[] = [
      {
        playerId: "p1",
        playerName: "Forward A",
        teamId: "home",
        x: x + (Math.random() > 0.5 ? 0.8 : -0.3),
        isOffside: Math.random() > 0.5,
        distanceFromLine: Math.random() * 2 - 1,
      },
      {
        playerId: "p2",
        playerName: "Forward B",
        teamId: "home",
        x: x + (Math.random() > 0.5 ? 1.2 : -0.5),
        isOffside: Math.random() > 0.6,
        distanceFromLine: Math.random() * 2 - 1,
      },
    ];

    setOffsidePositions(positions);

    const offsidePlayers = positions.filter((p) => p.isOffside);
    if (offsidePlayers.length > 0 && onOffsideDetected) {
      onOffsideDetected(positions);
    }

    // Save to database
    await supabase.from("ball_events").insert({
      match_id: matchId,
      event_type: "offside_line_update",
      position: { x, y: 34, z: 0 },
      data: { offside_positions: positions },
      confidence: 98,
    });
  }, [matchId, onOffsideDetected]);

  // Export tracking data
  const exportTrackingData = useCallback(async () => {
    const data = {
      matchId,
      ballPositions: [ballPosition],
      touches: recentTouches,
      goalLineChecks: lastGoalLineCheck ? [lastGoalLineCheck] : [],
      exportedAt: new Date().toISOString(),
    };

    await supabase.from("ball_tracking_exports").insert({
      match_id: matchId,
      data,
      created_at: new Date().toISOString(),
    });

    toast.success("Ball tracking data exported");
  }, [matchId, ballPosition, recentTouches, lastGoalLineCheck]);

  useEffect(() => {
    if (isTracking) {
      startTracking();
    }
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [isTracking, startTracking]);

  useEffect(() => {
    if (isTracking) {
      startTracking();
    }
  }, [trackingRate]);

  return (
    <Card className="border-cyan-900/50 bg-slate-950/90">
      <CardHeader className="py-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Circle className="h-4 w-4 text-cyan-400 animate-pulse" />
            Ball Microchip System
            <Badge variant={isTracking ? "default" : "secondary"} className="text-[10px]">
              {isTracking ? "TRACKING" : "STANDBY"}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Bluetooth className="h-3 w-3 text-blue-400" />
            <span className="text-xs text-slate-400">{signalStrength.toFixed(0)}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* System Status */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-slate-800/50 rounded border border-slate-700">
            <div className="text-[10px] text-slate-400 mb-1">Tracking Rate</div>
            <div className="text-lg font-bold text-white">{trackingRate}Hz</div>
          </div>
          <div className="p-2 bg-slate-800/50 rounded border border-slate-700">
            <div className="text-[10px] text-slate-400 mb-1">Signal</div>
            <div className="flex items-center gap-1">
              <Progress value={signalStrength} className="h-2 flex-1" />
              <span className="text-sm font-bold text-white">{signalStrength.toFixed(0)}%</span>
            </div>
          </div>
          <div className="p-2 bg-slate-800/50 rounded border border-slate-700">
            <div className="text-[10px] text-slate-400 mb-1">Battery</div>
            <div className="flex items-center gap-1">
              <Progress
                value={batteryLevel}
                className={`h-2 flex-1 ${batteryLevel < 20 ? "bg-red-900" : ""}`}
              />
              <span className="text-sm font-bold text-white">{batteryLevel.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* 3D Position */}
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white">3D Ball Position</span>
            <Badge variant="outline" className="text-[10px]">
              <Clock className="h-2 w-2 mr-1" />
              {(Date.now() - ballPosition.timestamp)}ms
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{ballPosition.x.toFixed(2)}</div>
              <div className="text-[10px] text-slate-400">X (meters)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{ballPosition.y.toFixed(2)}</div>
              <div className="text-[10px] text-slate-400">Y (meters)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{ballPosition.z.toFixed(2)}</div>
              <div className="text-[10px] text-slate-400">Z (height)</div>
            </div>
          </div>
        </div>

        {/* Velocity */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-slate-800/50 rounded border border-slate-700">
            <div className="text-[10px] text-slate-400 mb-1">Speed</div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-xl font-bold text-white">{ballVelocity.speed} km/h</span>
            </div>
          </div>
          <div className="p-2 bg-slate-800/50 rounded border border-slate-700">
            <div className="text-[10px] text-slate-400 mb-1">Direction</div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span className="text-xl font-bold text-white">{ballVelocity.direction}°</span>
            </div>
          </div>
        </div>

        {/* Goal Line Status */}
        <div
          className={`p-3 rounded-lg border ${
            goalLineStatus === "goal"
              ? "border-green-500 bg-green-500/20"
              : goalLineStatus === "checking"
              ? "border-yellow-500 bg-yellow-500/20 animate-pulse"
              : "border-slate-700 bg-slate-800/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold text-white">Goal Line Technology</span>
            </div>
            <Badge
              variant={
                goalLineStatus === "goal"
                  ? "default"
                  : goalLineStatus === "checking"
                  ? "destructive"
                  : "secondary"
              }
            >
              {goalLineStatus.toUpperCase()}
            </Badge>
          </div>
          {lastGoalLineCheck && (
            <div className="mt-2 text-xs text-slate-300">
              <div>Last check: {lastGoalLineCheck.percentageOver.toFixed(1)}% over line</div>
              <div>Confidence: {lastGoalLineCheck.confidence}%</div>
            </div>
          )}
        </div>

        {/* Offside Line */}
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white">Virtual Offside Line</span>
            <Badge variant={offsideLine.active ? "default" : "secondary"}>
              {offsideLine.active ? "ACTIVE" : "INACTIVE"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="range"
              min={0}
              max={105}
              step={0.1}
              value={offsideLine.x}
              onChange={(e) => updateOffsideLine(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-white font-mono">{offsideLine.x.toFixed(1)}m</span>
          </div>
          {offsidePositions.length > 0 && offsidePositions.some((p) => p.isOffside) && (
            <div className="space-y-1 mt-2">
              {offsidePositions
                .filter((p) => p.isOffside)
                .map((p) => (
                  <div
                    key={p.playerId}
                    className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-1 rounded"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    <span>{p.playerName} - OFFSIDE ({p.distanceFromLine.toFixed(2)}m)</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Recent Touches */}
        {recentTouches.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-400">
              Recent Touches ({recentTouches.length})
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {recentTouches.slice(0, 5).map((touch) => (
                <div
                  key={touch.id}
                  className="flex items-center justify-between p-2 bg-slate-800/50 rounded text-xs"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-cyan-400" />
                    <span className="font-medium text-white">{touch.playerName}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {touch.touchType}
                    </Badge>
                  </div>
                  <span className="text-slate-400">
                    {touch.confidence}% conf
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2 pt-2 border-t border-slate-700">
          <Button
            size="sm"
            variant={isTracking ? "destructive" : "default"}
            className="flex-1"
            onClick={() => setIsTracking((prev) => !prev)}
          >
            <Activity className={`h-3 w-3 mr-1 ${isTracking ? "animate-pulse" : ""}`} />
            {isTracking ? "Stop Tracking" : "Start Tracking"}
          </Button>
          <Button size="sm" variant="outline" onClick={exportTrackingData}>
            Export Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
