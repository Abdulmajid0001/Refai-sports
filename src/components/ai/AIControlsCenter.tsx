import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Brain, Settings, Zap, Shield, Target, Activity,
  AlertTriangle, MessageSquare, Camera, Mic, Database,
  RefreshCw, Save, Power, Gauge, Layers
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface AISettings {
  // Detection Settings
  varEnabled: boolean;
  varAutoDetect: boolean;
  varConfidenceThreshold: number;
  offsideDetection: boolean;
  goalLineTechnology: boolean;
  foulDetection: boolean;
  handballDetection: boolean;

  // Match Intelligence
  matchIntelligenceEnabled: boolean;
  goalProbabilityTracking: boolean;
  momentumAnalysis: boolean;
  injuryRiskMonitoring: boolean;
  tacticalAnalysis: boolean;

  // Ball Tracking
  ballTrackingEnabled: boolean;
  ballTrackingRate: number;
  touchDetection: boolean;
  autoOffsideLine: boolean;

  // Broadcast
  autoGraphics: boolean;
  autoReplayHighlight: boolean;
  commentarySuggestions: boolean;
  realTimeStats: boolean;

  // Voice Control
  voiceControlEnabled: boolean;
  voiceLanguage: string;
  voiceCommandsEnabled: boolean;

  // Data & Storage
  archiveMode: "standard" | "enhanced" | "full";
  dataRetentionDays: number;
  cloudSync: boolean;
}

interface AIControlsCenterProps {
  matchId?: string;
  leagueId?: string;
  onSettingsChange?: (settings: AISettings) => void;
}

const defaultSettings: AISettings = {
  varEnabled: true,
  varAutoDetect: true,
  varConfidenceThreshold: 85,
  offsideDetection: true,
  goalLineTechnology: true,
  foulDetection: true,
  handballDetection: false,

  matchIntelligenceEnabled: true,
  goalProbabilityTracking: true,
  momentumAnalysis: true,
  injuryRiskMonitoring: true,
  tacticalAnalysis: false,

  ballTrackingEnabled: true,
  ballTrackingRate: 500,
  touchDetection: true,
  autoOffsideLine: false,

  autoGraphics: true,
  autoReplayHighlight: true,
  commentarySuggestions: false,
  realTimeStats: true,

  voiceControlEnabled: false,
  voiceLanguage: "en-US",
  voiceCommandsEnabled: true,

  archiveMode: "enhanced",
  dataRetentionDays: 365,
  cloudSync: true,
};

export function AIControlsCenter({ matchId, leagueId, onSettingsChange }: AIControlsCenterProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AISettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [aiStatus, setAiStatus] = useState<"online" | "degraded" | "offline">("online");

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      if (!leagueId) return;

      const { data } = await supabase
        .from("league_ai_settings")
        .select("*")
        .eq("league_id", leagueId)
        .single();

      if (data?.settings) {
        setSettings({ ...defaultSettings, ...data.settings });
      }
    };

    loadSettings();
  }, [leagueId]);

  // Update a single setting
  const updateSetting = useCallback(<K extends keyof AISettings>(key: K, value: AISettings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      setHasChanges(true);
      if (onSettingsChange) {
        onSettingsChange(updated);
      }
      return updated;
    });
  }, [onSettingsChange]);

  // Save settings to database
  const saveSettings = useCallback(async () => {
    if (!leagueId || !user) return;

    setIsLoading(true);

    await supabase.from("league_ai_settings").upsert({
      league_id: leagueId,
      settings,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });

    setHasChanges(false);
    setIsLoading(false);
    toast.success("AI settings saved");
  }, [leagueId, settings, user]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast.info("Settings reset to defaults");
  }, []);

  // Enable all AI features
  const enableAllFeatures = useCallback(() => {
    const allEnabled: AISettings = {
      ...settings,
      varEnabled: true,
      varAutoDetect: true,
      offsideDetection: true,
      goalLineTechnology: true,
      foulDetection: true,
      handballDetection: true,
      matchIntelligenceEnabled: true,
      goalProbabilityTracking: true,
      momentumAnalysis: true,
      injuryRiskMonitoring: true,
      tacticalAnalysis: true,
      ballTrackingEnabled: true,
      touchDetection: true,
      autoOffsideLine: true,
      autoGraphics: true,
      autoReplayHighlight: true,
      commentarySuggestions: true,
      realTimeStats: true,
    };
    setSettings(allEnabled);
    setHasChanges(true);
    toast.success("All AI features enabled");
  }, [settings]);

  // Disable all AI features
  const disableAllFeatures = useCallback(() => {
    const allDisabled: AISettings = {
      ...settings,
      varEnabled: false,
      varAutoDetect: false,
      offsideDetection: false,
      goalLineTechnology: false,
      foulDetection: false,
      handballDetection: false,
      matchIntelligenceEnabled: false,
      goalProbabilityTracking: false,
      momentumAnalysis: false,
      injuryRiskMonitoring: false,
      tacticalAnalysis: false,
      ballTrackingEnabled: false,
      touchDetection: false,
      autoOffsideLine: false,
      autoGraphics: false,
      autoReplayHighlight: false,
      commentarySuggestions: false,
      realTimeStats: false,
    };
    setSettings(allDisabled);
    setHasChanges(true);
    toast.info("All AI features disabled");
  }, [settings]);

  // Count enabled features
  const enabledCount = Object.entries(settings).filter(
    ([key, value]) => typeof value === "boolean" && value === true
  ).length;

  const totalFeatures = Object.entries(settings).filter(
    ([key, value]) => typeof value === "boolean"
  ).length;

  return (
    <div className="space-y-4">
      <Card className="border-cyan-900/50 bg-slate-950/90">
        <CardHeader className="py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4 text-cyan-400" />
              AI Controls Center
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={`${
                  aiStatus === "online"
                    ? "border-green-500 text-green-400"
                    : aiStatus === "degraded"
                    ? "border-yellow-500 text-yellow-400"
                    : "border-red-500 text-red-400"
                }`}
              >
                <Power className="h-3 w-3 mr-1" />
                {aiStatus.toUpperCase()}
              </Badge>
              <Badge variant="secondary">
                {enabledCount}/{totalFeatures} enabled
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* VAR System */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Shield className="h-4 w-4 text-blue-400" />
              VAR System
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">VAR System</label>
                <Switch
                  checked={settings.varEnabled}
                  onCheckedChange={(v) => updateSetting("varEnabled", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Auto-Detect Incidents</label>
                <Switch
                  checked={settings.varAutoDetect}
                  onCheckedChange={(v) => updateSetting("varAutoDetect", v)}
                  disabled={!settings.varEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Offside Detection</label>
                <Switch
                  checked={settings.offsideDetection}
                  onCheckedChange={(v) => updateSetting("offsideDetection", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Goal Line Technology</label>
                <Switch
                  checked={settings.goalLineTechnology}
                  onCheckedChange={(v) => updateSetting("goalLineTechnology", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Foul Detection</label>
                <Switch
                  checked={settings.foulDetection}
                  onCheckedChange={(v) => updateSetting("foulDetection", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Handball Detection</label>
                <Switch
                  checked={settings.handballDetection}
                  onCheckedChange={(v) => updateSetting("handballDetection", v)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-1">
              <label className="text-xs text-slate-300">Confidence Threshold:</label>
              <Slider
                value={[settings.varConfidenceThreshold]}
                onValueChange={([v]) => updateSetting("varConfidenceThreshold", v)}
                min={50}
                max={99}
                step={1}
                className="flex-1"
                disabled={!settings.varEnabled}
              />
              <span className="text-xs font-mono text-white w-10">{settings.varConfidenceThreshold}%</span>
            </div>
          </div>

          {/* Match Intelligence */}
          <div className="space-y-3 border-t border-slate-700 pt-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Activity className="h-4 w-4 text-purple-400" />
              Match Intelligence
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Match Intelligence</label>
                <Switch
                  checked={settings.matchIntelligenceEnabled}
                  onCheckedChange={(v) => updateSetting("matchIntelligenceEnabled", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Goal Probability</label>
                <Switch
                  checked={settings.goalProbabilityTracking}
                  onCheckedChange={(v) => updateSetting("goalProbabilityTracking", v)}
                  disabled={!settings.matchIntelligenceEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Momentum Analysis</label>
                <Switch
                  checked={settings.momentumAnalysis}
                  onCheckedChange={(v) => updateSetting("momentumAnalysis", v)}
                  disabled={!settings.matchIntelligenceEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Injury Risk Monitor</label>
                <Switch
                  checked={settings.injuryRiskMonitoring}
                  onCheckedChange={(v) => updateSetting("injuryRiskMonitoring", v)}
                  disabled={!settings.matchIntelligenceEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Tactical Analysis</label>
                <Switch
                  checked={settings.tacticalAnalysis}
                  onCheckedChange={(v) => updateSetting("tacticalAnalysis", v)}
                  disabled={!settings.matchIntelligenceEnabled}
                />
              </div>
            </div>
          </div>

          {/* Ball Tracking */}
          <div className="space-y-3 border-t border-slate-700 pt-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Target className="h-4 w-4 text-yellow-400" />
              Ball Tracking
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Ball Tracking</label>
                <Switch
                  checked={settings.ballTrackingEnabled}
                  onCheckedChange={(v) => updateSetting("ballTrackingEnabled", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Touch Detection</label>
                <Switch
                  checked={settings.touchDetection}
                  onCheckedChange={(v) => updateSetting("touchDetection", v)}
                  disabled={!settings.ballTrackingEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Auto Offside Line</label>
                <Switch
                  checked={settings.autoOffsideLine}
                  onCheckedChange={(v) => updateSetting("autoOffsideLine", v)}
                  disabled={!settings.ballTrackingEnabled}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-1">
              <label className="text-xs text-slate-300">Tracking Rate:</label>
              <Slider
                value={[settings.ballTrackingRate]}
                onValueChange={([v]) => updateSetting("ballTrackingRate", v)}
                min={100}
                max={1000}
                step={50}
                className="flex-1"
                disabled={!settings.ballTrackingEnabled}
              />
              <span className="text-xs font-mono text-white w-14">{settings.ballTrackingRate}Hz</span>
            </div>
          </div>

          {/* Broadcast Intelligence */}
          <div className="space-y-3 border-t border-slate-700 pt-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Camera className="h-4 w-4 text-green-400" />
              Broadcast Intelligence
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Auto Graphics</label>
                <Switch
                  checked={settings.autoGraphics}
                  onCheckedChange={(v) => updateSetting("autoGraphics", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Auto Replay Highlights</label>
                <Switch
                  checked={settings.autoReplayHighlight}
                  onCheckedChange={(v) => updateSetting("autoReplayHighlight", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Commentary Suggestions</label>
                <Switch
                  checked={settings.commentarySuggestions}
                  onCheckedChange={(v) => updateSetting("commentarySuggestions", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Real-Time Stats</label>
                <Switch
                  checked={settings.realTimeStats}
                  onCheckedChange={(v) => updateSetting("realTimeStats", v)}
                />
              </div>
            </div>
          </div>

          {/* Voice Control */}
          <div className="space-y-3 border-t border-slate-700 pt-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Mic className="h-4 w-4 text-red-400" />
              Voice Control
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Voice Control</label>
                <Switch
                  checked={settings.voiceControlEnabled}
                  onCheckedChange={(v) => updateSetting("voiceControlEnabled", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Voice Commands</label>
                <Switch
                  checked={settings.voiceCommandsEnabled}
                  onCheckedChange={(v) => updateSetting("voiceCommandsEnabled", v)}
                  disabled={!settings.voiceControlEnabled}
                />
              </div>
            </div>
          </div>

          {/* Data & Storage */}
          <div className="space-y-3 border-t border-slate-700 pt-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Database className="h-4 w-4 text-cyan-400" />
              Data & Storage
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Cloud Sync</label>
                <Switch
                  checked={settings.cloudSync}
                  onCheckedChange={(v) => updateSetting("cloudSync", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Retention (days)</label>
                <input
                  type="number"
                  value={settings.dataRetentionDays}
                  onChange={(e) => updateSetting("dataRetentionDays", Number(e.target.value))}
                  className="w-20 px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-white"
                  min={7}
                  max={3650}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-1">
              <label className="text-xs text-slate-300">Archive Mode:</label>
              <div className="flex gap-2 flex-1">
                {(["standard", "enhanced", "full"] as const).map((mode) => (
                  <Button
                    key={mode}
                    size="sm"
                    variant={settings.archiveMode === mode ? "default" : "outline"}
                    onClick={() => updateSetting("archiveMode", mode)}
                    className="flex-1"
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-3 border-t border-slate-700">
            <Button size="sm" variant="outline" className="flex-1" onClick={enableAllFeatures}>
              <Zap className="h-3 w-3 mr-1" />
              Enable All
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={disableAllFeatures}>
              <Power className="h-3 w-3 mr-1" />
              Disable All
            </Button>
          </div>

          {/* Save */}
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={saveSettings}
              disabled={!hasChanges || isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save Settings
            </Button>
            <Button variant="ghost" onClick={resetToDefaults} disabled={isLoading}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
