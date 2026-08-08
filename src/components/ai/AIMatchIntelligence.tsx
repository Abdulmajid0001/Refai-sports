import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, Target,
  Activity, Shield, Zap, Users, BarChart3, LineChart,
  RefreshCw, ChevronUp, ChevronDown, Minus, Clock
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GoalProbability {
  teamId: string;
  teamName: string;
  probability: number;
  trend: "rising" | "falling" | "stable";
  factors: string[];
}

interface MomentumShift {
  id: string;
  minute: number;
  teamId: string;
  teamName: string;
  type: "gaining" | "losing";
  intensity: number;
  description: string;
}

interface InjuryRisk {
  playerId: string;
  playerName: string;
  teamName: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  probability: number;
  factors: string[];
  recommendation: string;
}

interface TacticalChange {
  id: string;
  minute: number;
  teamId: string;
  teamName: string;
  type: "formation" | "pressing" | "defensive_line" | "attack_pattern";
  from: string;
  to: string;
  confidence: number;
  impact: "positive" | "negative" | "neutral";
}

interface MatchInsight {
  id: string;
  type: "goal_probability" | "momentum" | "injury_risk" | "tactical";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  timestamp: Date;
}

interface AIMatchIntelligenceProps {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  minute: number;
}

export function AIMatchIntelligence({
  matchId,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  minute,
}: AIMatchIntelligenceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [goalProbability, setGoalProbability] = useState<GoalProbability[]>([]);
  const [momentumShifts, setMomentumShifts] = useState<MomentumShift[]>([]);
  const [injuryRisks, setInjuryRisks] = useState<InjuryRisk[]>([]);
  const [tacticalChanges, setTacticalChanges] = useState<TacticalChange[]>([]);
  const [insights, setInsights] = useState<MatchInsight[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const analyzeMatch = useCallback(async () => {
    setIsLoading(true);

    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate goal probabilities
    const homeProb = Math.floor(Math.random() * 40 + 20);
    const awayProb = Math.floor(Math.random() * 40 + 20);

    setGoalProbability([
      {
        teamId: homeTeamId,
        teamName: homeTeamName,
        probability: homeProb,
        trend: homeProb > 35 ? "rising" : homeProb < 25 ? "falling" : "stable",
        factors: [
          "High shot conversion rate",
          "Strong possession in final third",
          "Opponent defensive vulnerabilities",
        ].slice(0, Math.floor(Math.random() * 3) + 1),
      },
      {
        teamId: awayTeamId,
        teamName: awayTeamName,
        probability: awayProb,
        trend: awayProb > 35 ? "rising" : awayProb < 25 ? "falling" : "stable",
        factors: [
          "Counter-attack opportunities",
          "Set-piece threat",
          "Winger isolation advantage",
        ].slice(0, Math.floor(Math.random() * 3) + 1),
      },
    ]);

    // Generate momentum shifts
    const newMomentum: MomentumShift[] = [
      {
        id: `mom-${Date.now()}-1`,
        minute: Math.max(1, minute - 5),
        teamId: homeTeamId,
        teamName: homeTeamName,
        type: Math.random() > 0.5 ? "gaining" : "losing",
        intensity: Math.floor(Math.random() * 40 + 60),
        description:
          "Increased pressing intensity leading to turnovers in opposition half",
      },
      {
        id: `mom-${Date.now()}-2`,
        minute,
        teamId: awayTeamId,
        teamName: awayTeamName,
        type: Math.random() > 0.5 ? "gaining" : "losing",
        intensity: Math.floor(Math.random() * 40 + 60),
        description: "Formation shift creating width in attack",
      },
    ];
    setMomentumShifts(newMomentum);

    // Generate injury risks
    const newInjuryRisks: InjuryRisk[] = [
      {
        playerId: "player-1",
        playerName: "Key Striker",
        teamName: homeTeamName,
        riskLevel: Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low",
        probability: Math.floor(Math.random() * 30 + 20),
        factors: ["High sprint load", "Previous muscle injury", "Fatigue indicators"],
        recommendation: "Consider substitution in next 15 minutes",
      },
      {
        playerId: "player-2",
        playerName: "Central Defender",
        teamName: awayTeamName,
        riskLevel: Math.random() > 0.8 ? "critical" : Math.random() > 0.5 ? "high" : "low",
        probability: Math.floor(Math.random() * 40 + 30),
        factors: ["Collision impact detected", "Reduced mobility"],
        recommendation: "Immediate assessment recommended",
      },
    ];
    setInjuryRisks(newInjuryRisks);

    // Generate tactical changes
    const newTactical: TacticalChange[] = [
      {
        id: `tac-${Date.now()}-1`,
        minute: Math.max(1, minute - 3),
        teamId: homeTeamId,
        teamName: homeTeamName,
        type: "pressing",
        from: "Mid-block",
        to: "High press",
        confidence: Math.floor(Math.random() * 20 + 80),
        impact: Math.random() > 0.6 ? "positive" : "neutral",
      },
      {
        id: `tac-${Date.now()}-2`,
        minute,
        teamId: awayTeamId,
        teamName: awayTeamName,
        type: "formation",
        from: "4-3-3",
        to: "3-5-2",
        confidence: Math.floor(Math.random() * 20 + 75),
        impact: Math.random() > 0.5 ? "positive" : "negative",
      },
    ];
    setTacticalChanges(newTactical);

    // Generate insights
    const newInsights: MatchInsight[] = [
      {
        id: `ins-${Date.now()}-1`,
        type: "goal_probability",
        priority: homeProb > 40 || awayProb > 40 ? "high" : "medium",
        title: "High Goal Probability Alert",
        description: `${homeProb > awayProb ? homeTeamName : awayTeamName} showing strong attacking indicators`,
        timestamp: new Date(),
      },
      {
        id: `ins-${Date.now()}-2`,
        type: "injury_risk",
        priority: newInjuryRisks.some((r) => r.riskLevel === "critical" || r.riskLevel === "high")
          ? "high"
          : "low",
        title: "Player Welfare Alert",
        description: "Elevated injury risk detected for key players",
        timestamp: new Date(),
      },
    ];
    setInsights(newInsights);

    setLastUpdate(new Date());
    setIsLoading(false);

    // Save to database
    await supabase.from("ai_match_analysis").insert({
      match_id: matchId,
      minute,
      goal_probability: { home: homeProb, away: awayProb },
      momentum: newMomentum,
      injury_risks: newInjuryRisks,
      tactical_changes: newTactical,
      insights: newInsights,
    });

    toast.success("AI analysis complete");
  }, [matchId, minute, homeTeamId, awayTeamId, homeTeamName, awayTeamName]);

  useEffect(() => {
    analyzeMatch();
  }, []);

  const getRiskColor = (level: InjuryRisk["riskLevel"]) => {
    switch (level) {
      case "critical":
        return "text-red-500 bg-red-500/10 border-red-500";
      case "high":
        return "text-orange-500 bg-orange-500/10 border-orange-500";
      case "medium":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500";
      default:
        return "text-green-500 bg-green-500/10 border-green-500";
    }
  };

  const getTrendIcon = (trend: GoalProbability["trend"]) => {
    switch (trend) {
      case "rising":
        return <ChevronUp className="h-4 w-4 text-green-400" />;
      case "falling":
        return <ChevronDown className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-cyan-900/50 bg-slate-950/90">
        <CardHeader className="py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4 text-cyan-400" />
              AI Match Intelligence
              {isLoading && <RefreshCw className="h-3 w-3 animate-spin text-cyan-400" />}
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                Last: {lastUpdate.toLocaleTimeString()}
              </span>
              <Button size="sm" variant="outline" onClick={analyzeMatch} disabled={isLoading}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Goal Probability */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Target className="h-4 w-4 text-yellow-400" />
              Goal Probability
            </div>
            <div className="grid grid-cols-2 gap-3">
              {goalProbability.map((gp) => (
                <div
                  key={gp.teamId}
                  className="p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{gp.teamName}</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(gp.trend)}
                      <span className="text-lg font-bold text-white">{gp.probability}%</span>
                    </div>
                  </div>
                  <Progress value={gp.probability} className="h-2" />
                  <div className="mt-2 space-y-1">
                    {gp.factors.map((factor, i) => (
                      <div key={i} className="text-xs text-slate-400">
                        • {factor}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Momentum Shifts */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Activity className="h-4 w-4 text-purple-400" />
              Momentum Shifts
            </div>
            <div className="space-y-1.5">
              {momentumShifts.map((ms) => (
                <div
                  key={ms.id}
                  className={`p-2 rounded border ${
                    ms.type === "gaining"
                      ? "border-green-500/50 bg-green-500/10"
                      : "border-red-500/50 bg-red-500/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {ms.type === "gaining" ? (
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      )}
                      <span className="text-xs font-medium text-white">{ms.teamName}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {ms.minute}'
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">Intensity:</span>
                      <span
                        className={`text-xs font-bold ${
                          ms.intensity > 70 ? "text-green-400" : "text-yellow-400"
                        }`}
                      >
                        {ms.intensity}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{ms.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Injury Risks */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Injury Risk Monitor
            </div>
            <div className="grid grid-cols-2 gap-2">
              {injuryRisks.map((ir) => (
                <div
                  key={ir.playerId}
                  className={`p-2 rounded border ${getRiskColor(ir.riskLevel)}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">{ir.playerName}</span>
                    <Badge
                      variant={
                        ir.riskLevel === "critical" || ir.riskLevel === "high"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {ir.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400 mb-1">{ir.teamName}</div>
                  <div className="flex items-center gap-1 mb-2">
                    <Progress value={ir.probability} className="h-1.5 flex-1" />
                    <span className="text-xs font-bold text-white">{ir.probability}%</span>
                  </div>
                  <p className="text-[10px] text-slate-300 italic">{ir.recommendation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tactical Changes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Shield className="h-4 w-4 text-blue-400" />
              Tactical Analysis
            </div>
            <div className="space-y-1.5">
              {tacticalChanges.map((tc) => (
                <div
                  key={tc.id}
                  className="p-2 rounded bg-slate-800/50 border border-slate-700"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {tc.minute}'
                      </Badge>
                      <span className="text-xs font-medium text-white">{tc.teamName}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          tc.impact === "positive"
                            ? "border-green-500 text-green-400"
                            : tc.impact === "negative"
                            ? "border-red-500 text-red-400"
                            : ""
                        }`}
                      >
                        {tc.type.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">AI:</span>
                      <span className="text-xs font-bold text-cyan-400">{tc.confidence}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="text-slate-500">{tc.from}</span>
                    <Zap className="h-3 w-3 text-cyan-400" />
                    <span className="text-white font-medium">{tc.to}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Insights */}
          {insights.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <BarChart3 className="h-4 w-4 text-cyan-400" />
                Key Insights
              </div>
              <div className="space-y-1">
                {insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-2 rounded border ${
                      insight.priority === "high"
                        ? "border-yellow-500/50 bg-yellow-500/10"
                        : "border-slate-700 bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={insight.priority === "high" ? "destructive" : "secondary"}
                        className="text-[10px]"
                      >
                        {insight.priority}
                      </Badge>
                      <span className="text-xs font-medium text-white">{insight.title}</span>
                    </div>
                    <p className="text-xs text-slate-300">{insight.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
