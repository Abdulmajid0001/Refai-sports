import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  LayoutDashboard, Shield, Brain, Target, Camera, Mic,
  Database, Palette, Video, Users, Zap, Settings,
  ChevronDown, ChevronUp, Lock, Unlock, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface FeatureConfig {
  id: string;
  name: string;
  description: string;
  category: "core" | "broadcast" | "ai" | "advanced_ai" | "storage";
  enabled: boolean;
  requiredPlan: "free" | "pro" | "enterprise";
  dependencies?: string[];
}

interface FeatureActivationCenterProps {
  leagueId: string;
  onFeatureChange?: (featureId: string, enabled: boolean) => void;
}

const defaultFeatures: FeatureConfig[] = [
  // Core Features
  {
    id: "match_management",
    name: "Match Management",
    description: "Create and manage matches, lineups, and events",
    category: "core",
    enabled: true,
    requiredPlan: "free",
  },
  {
    id: "live_scores",
    name: "Live Scores",
    description: "Real-time score updates and match tracking",
    category: "core",
    enabled: true,
    requiredPlan: "free",
  },
  {
    id: "team_management",
    name: "Team Management",
    description: "Manage teams, players, and rosters",
    category: "core",
    enabled: true,
    requiredPlan: "free",
  },
  {
    id: "player_stats",
    name: "Player Statistics",
    description: "Individual player performance tracking",
    category: "core",
    enabled: true,
    requiredPlan: "free",
  },

  // Broadcast Features
  {
    id: "broadcast_graphics",
    name: "Broadcast Graphics Engine",
    description: "Professional graphics overlays for broadcasts",
    category: "broadcast",
    enabled: true,
    requiredPlan: "pro",
  },
  {
    id: "instant_replay",
    name: "Instant Replay Engine",
    description: "Multi-angle replay with slow-motion controls",
    category: "broadcast",
    enabled: true,
    requiredPlan: "pro",
  },
  {
    id: "multi_camera",
    name: "Multi-Camera System",
    description: "Multiple camera angles and switching",
    category: "broadcast",
    enabled: false,
    requiredPlan: "enterprise",
  },
  {
    id: "custom_announcements",
    name: "Custom Announcements",
    description: "Create custom moderator announcements",
    category: "broadcast",
    enabled: true,
    requiredPlan: "pro",
  },
  {
    id: "formation_display",
    name: "Formation Display",
    description: "Visual formation graphics with drag-drop",
    category: "broadcast",
    enabled: true,
    requiredPlan: "pro",
  },

  // AI Features
  {
    id: "var_system",
    name: "VAR System",
    description: "Video Assistant Referee with decision support",
    category: "ai",
    enabled: true,
    requiredPlan: "pro",
    dependencies: ["instant_replay"],
  },
  {
    id: "match_intelligence",
    name: "AI Match Intelligence",
    description: "Goal probability, momentum, tactical analysis",
    category: "ai",
    enabled: false,
    requiredPlan: "enterprise",
  },
  {
    id: "ball_tracking",
    name: "Ball Microchip Tracking",
    description: "High-frequency ball position tracking",
    category: "ai",
    enabled: false,
    requiredPlan: "enterprise",
  },
  {
    id: "auto_offsides",
    name: "Automatic Offside Detection",
    description: "AI-powered offside line detection",
    category: "ai",
    enabled: false,
    requiredPlan: "enterprise",
    dependencies: ["ball_tracking"],
  },
  {
    id: "goal_line_tech",
    name: "Goal Line Technology",
    description: "Automatic goal detection",
    category: "ai",
    enabled: false,
    requiredPlan: "enterprise",
    dependencies: ["ball_tracking"],
  },

  // Advanced AI
  {
    id: "injury_prediction",
    name: "Injury Risk Prediction",
    description: "AI-based player injury risk monitoring",
    category: "advanced_ai",
    enabled: false,
    requiredPlan: "enterprise",
    dependencies: ["match_intelligence"],
  },
  {
    id: "auto_highlights",
    name: "Auto Highlight Generation",
    description: "AI-curated highlight reels",
    category: "advanced_ai",
    enabled: false,
    requiredPlan: "enterprise",
  },
  {
    id: "commentary_ai",
    name: "AI Commentary Assist",
    description: "Real-time commentary suggestions",
    category: "advanced_ai",
    enabled: false,
    requiredPlan: "enterprise",
  },
  {
    id: "voice_control",
    name: "Voice Control System",
    description: "Voice commands for moderator controls",
    category: "advanced_ai",
    enabled: false,
    requiredPlan: "enterprise",
  },

  // Storage
  {
    id: "match_archive",
    name: "Match Vault Archive",
    description: "Long-term match storage and replay",
    category: "storage",
    enabled: true,
    requiredPlan: "pro",
  },
  {
    id: "cloud_storage",
    name: "Cloud Storage Integration",
    description: "Sync matches to cloud storage",
    category: "storage",
    enabled: true,
    requiredPlan: "pro",
  },
  {
    id: "export_tools",
    name: "Export Tools",
    description: "Export matches and data in various formats",
    category: "storage",
    enabled: true,
    requiredPlan: "pro",
  },
];

const categoryInfo = {
  core: { icon: LayoutDashboard, label: "Core Features", color: "text-blue-400" },
  broadcast: { icon: Camera, label: "Broadcast Features", color: "text-green-400" },
  ai: { icon: Brain, label: "AI Features", color: "text-purple-400" },
  advanced_ai: { icon: Zap, label: "Advanced AI", color: "text-yellow-400" },
  storage: { icon: Database, label: "Storage & Data", color: "text-cyan-400" },
};

export function FeatureActivationCenter({ leagueId, onFeatureChange }: FeatureActivationCenterProps) {
  const { user } = useAuth();
  const [features, setFeatures] = useState<FeatureConfig[]>(defaultFeatures);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.keys(categoryInfo)));
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load league features from database
  useEffect(() => {
    const loadFeatures = async () => {
      const { data } = await supabase
        .from("league_features")
        .select("feature_id, enabled")
        .eq("league_id", leagueId);

      if (data) {
        setFeatures((prev) =>
          prev.map((f) => {
            const dbFeature = data.find((d) => d.feature_id === f.id);
            return dbFeature ? { ...f, enabled: dbFeature.enabled } : f;
          })
        );
      }
    };

    loadFeatures();
  }, [leagueId]);

  // Toggle feature
  const toggleFeature = useCallback((featureId: string, enabled: boolean) => {
    const feature = features.find((f) => f.id === featureId);
    if (!feature) return;

    // Check dependencies
    if (enabled && feature.dependencies) {
      const missingDeps = feature.dependencies.filter((depId) => {
        const dep = features.find((f) => f.id === depId);
        return dep && !dep.enabled;
      });

      if (missingDeps.length > 0) {
        toast.error(`Enable ${missingDeps.join(", ")} first`);
        return;
      }
    }

    // Check if disabling a feature that others depend on
    if (!enabled) {
      const dependents = features.filter((f) => f.dependencies?.includes(featureId) && f.enabled);
      if (dependents.length > 0) {
        toast.error(`Disable ${dependents.map((d) => d.name).join(", ")} first`);
        return;
      }
    }

    setFeatures((prev) =>
      prev.map((f) => (f.id === featureId ? { ...f, enabled } : f))
    );
    setHasChanges(true);

    if (onFeatureChange) {
      onFeatureChange(featureId, enabled);
    }
  }, [features, onFeatureChange]);

  // Toggle category expansion
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // Save features to database
  const saveFeatures = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);

    const updates = features.map((f) => ({
      league_id: leagueId,
      feature_id: f.id,
      enabled: f.enabled,
      updated_by: user.id,
    }));

    await supabase.from("league_features").upsert(updates, {
      onConflict: "league_id,feature_id",
    });

    setHasChanges(false);
    setIsLoading(false);
    toast.success("Feature settings saved");
  }, [features, leagueId, user]);

  // Enable all available features
  const enableAll = useCallback(() => {
    setFeatures((prev) =>
      prev.map((f) => {
        // Check if dependencies are met
        if (f.dependencies) {
          const hasAllDeps = f.dependencies.every((depId) => {
            const dep = prev.find((d) => d.id === depId);
            return dep?.enabled;
          });
          return { ...f, enabled: hasAllDeps };
        }
        return { ...f, enabled: true };
      })
    );
    setHasChanges(true);
    toast.success("All available features enabled");
  }, []);

  // Get plan badge color
  const getPlanBadge = (plan: FeatureConfig["requiredPlan"]) => {
    switch (plan) {
      case "enterprise":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500";
      case "pro":
        return "bg-purple-500/20 text-purple-400 border-purple-500";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500";
    }
  };

  // Count enabled features
  const enabledCount = features.filter((f) => f.enabled).length;

  return (
    <div className="space-y-4">
      <Card className="border-cyan-900/50 bg-slate-950/90">
        <CardHeader className="py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4 text-cyan-400" />
              Feature Activation Center
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">
                {enabledCount}/{features.length} active
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Category Groups */}
          {(Object.keys(categoryInfo) as Array<keyof typeof categoryInfo>).map((category) => {
            const info = categoryInfo[category];
            const categoryFeatures = features.filter((f) => f.category === category);
            const categoryEnabled = categoryFeatures.filter((f) => f.enabled).length;
            const isExpanded = expandedCategories.has(category);

            return (
              <div key={category} className="border border-slate-700 rounded-lg overflow-hidden">
                {/* Category Header */}
                <button
                  className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center gap-2">
                    <info.icon className={`h-4 w-4 ${info.color}`} />
                    <span className="text-sm font-semibold text-white">{info.label}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {categoryEnabled}/{categoryFeatures.length}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {/* Features List */}
                {isExpanded && (
                  <div className="divide-y divide-slate-700">
                    {categoryFeatures.map((feature) => (
                      <div
                        key={feature.id}
                        className={`p-3 ${feature.enabled ? "bg-slate-800/30" : "bg-slate-900/30"}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 mr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`text-sm font-medium ${
                                  feature.enabled ? "text-white" : "text-slate-400"
                                }`}
                              >
                                {feature.name}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${getPlanBadge(feature.requiredPlan)}`}
                              >
                                {feature.requiredPlan.toUpperCase()}
                              </Badge>
                              {feature.dependencies && feature.dependencies.length > 0 && (
                                <Lock className="h-3 w-3 text-slate-500" title="Has dependencies" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500">{feature.description}</p>
                            {feature.dependencies && feature.dependencies.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertTriangle className="h-3 w-3 text-yellow-400" />
                                <span className="text-[10px] text-yellow-400">
                                  Requires: {feature.dependencies.join(", ")}
                                </span>
                              </div>
                            )}
                          </div>
                          <Switch
                            checked={feature.enabled}
                            onCheckedChange={(v) => toggleFeature(feature.id, v)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Quick Actions */}
          <div className="flex gap-2 pt-3 border-t border-slate-700">
            <Button size="sm" variant="outline" className="flex-1" onClick={enableAll}>
              <Unlock className="h-3 w-3 mr-1" />
              Enable All
            </Button>
            <Button
              size="sm"
              variant="default"
              className="flex-1"
              onClick={saveFeatures}
              disabled={!hasChanges || isLoading}
            >
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
