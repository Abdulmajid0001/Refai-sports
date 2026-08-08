import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Palette, Monitor, Image, Clock, Type, Eye, EyeOff,
  RotateCw, Check, Trash2, Upload, Settings, Preview
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ViewerSettingsData {
  show_league_logo: boolean;
  custom_logo_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  scoreboard_style: 'default' | 'minimal' | 'classic' | 'modern' | 'custom';
  scoreboard_position: 'top_left' | 'top_center' | 'top_right' | 'bottom_left' | 'bottom_center' | 'bottom_right';
  show_timer: boolean;
  show_score: boolean;
  show_team_logos: boolean;
  custom_overlay_url: string;
}

const SCOREBOARD_STYLES = [
  { id: 'default', label: 'Default', description: 'Standard Refai style' },
  { id: 'minimal', label: 'Minimal', description: 'Clean, simple design' },
  { id: 'classic', label: 'Classic', description: 'Traditional broadcast look' },
  { id: 'modern', label: 'Modern', description: 'Sleek gradient design' },
  { id: 'custom', label: 'Custom', description: 'Use your own overlay' },
];

export function ViewerCustomization({ leagueId }: { leagueId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [settings, setSettings] = useState<ViewerSettingsData>({
    show_league_logo: true,
    custom_logo_url: '',
    primary_color: '#0ea5e9',
    secondary_color: '#1e293b',
    accent_color: '#22d3ee',
    scoreboard_style: 'default',
    scoreboard_position: 'top_center',
    show_timer: true,
    show_score: true,
    show_team_logos: true,
    custom_overlay_url: '',
  });

  // Load settings
  const loadSettings = useCallback(async () => {
    const { data } = await supabase
      .from('league_viewer_settings')
      .select('*')
      .eq('league_id', leagueId)
      .single();

    if (data) {
      setSettings({
        show_league_logo: data.show_league_logo ?? true,
        custom_logo_url: data.custom_logo_url || '',
        primary_color: data.primary_color || '#0ea5e9',
        secondary_color: data.secondary_color || '#1e293b',
        accent_color: data.accent_color || '#22d3ee',
        scoreboard_style: data.scoreboard_style || 'default',
        scoreboard_position: data.scoreboard_position || 'top_center',
        show_timer: data.show_timer ?? true,
        show_score: data.show_score ?? true,
        show_team_logos: data.show_team_logos ?? true,
        custom_overlay_url: data.custom_overlay_url || '',
      });
    }
  }, [leagueId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Update setting
  const updateSetting = <K extends keyof ViewerSettingsData>(key: K, value: ViewerSettingsData[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Save settings
  const saveSettings = async () => {
    setIsLoading(true);

    const { error } = await supabase
      .from('league_viewer_settings')
      .upsert({
        league_id: leagueId,
        show_league_logo: settings.show_league_logo,
        custom_logo_url: settings.custom_logo_url,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        accent_color: settings.accent_color,
        scoreboard_style: settings.scoreboard_style,
        scoreboard_position: settings.scoreboard_position,
        show_timer: settings.show_timer,
        show_score: settings.show_score,
        show_team_logos: settings.show_team_logos,
        custom_overlay_url: settings.custom_overlay_url,
      }, { onConflict: 'league_id' });

    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Viewer settings saved");
      setHasChanges(false);
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      <Card className="border-cyan-900/50 bg-slate-950/90">
        <CardHeader className="py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-cyan-400" />
              Viewer Customization
            </CardTitle>
            {hasChanges && (
              <Badge variant="secondary">Unsaved Changes</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo Settings */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <Image className="h-3 w-3" />
              Logo Display
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <div>
                <div className="text-sm text-white">Show League Logo</div>
                <div className="text-xs text-slate-400">Display league logo on scoreboard</div>
              </div>
              <Button
                size="sm"
                variant={settings.show_league_logo ? "default" : "outline"}
                onClick={() => updateSetting('show_league_logo', !settings.show_league_logo)}
              >
                {settings.show_league_logo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">Custom Logo URL</div>
              <Input
                value={settings.custom_logo_url}
                onChange={(e) => updateSetting('custom_logo_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Color Scheme */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400">Color Scheme</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Primary</div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => updateSetting('primary_color', e.target.value)}
                    className="w-8 h-8 rounded border-0 cursor-pointer"
                  />
                  <Input
                    value={settings.primary_color}
                    onChange={(e) => updateSetting('primary_color', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Secondary</div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.secondary_color}
                    onChange={(e) => updateSetting('secondary_color', e.target.value)}
                    className="w-8 h-8 rounded border-0 cursor-pointer"
                  />
                  <Input
                    value={settings.secondary_color}
                    onChange={(e) => updateSetting('secondary_color', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Accent</div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.accent_color}
                    onChange={(e) => updateSetting('accent_color', e.target.value)}
                    className="w-8 h-8 rounded border-0 cursor-pointer"
                  />
                  <Input
                    value={settings.accent_color}
                    onChange={(e) => updateSetting('accent_color', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Scoreboard Style */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400">Scoreboard Style</div>
            <div className="grid grid-cols-5 gap-1.5">
              {SCOREBOARD_STYLES.map((style) => (
                <button
                  key={style.id}
                  className={`p-2 rounded border text-center ${
                    settings.scoreboard_style === style.id
                      ? 'border-cyan-500 bg-cyan-950/30'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                  onClick={() => updateSetting('scoreboard_style', style.id as any)}
                >
                  <Monitor className="h-4 w-4 mx-auto mb-1 text-slate-400" />
                  <div className="text-[10px] text-white">{style.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Scoreboard Position */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400">Scoreboard Position</div>
            <div className="grid grid-cols-3 gap-1.5">
              {['top_left', 'top_center', 'top_right', 'bottom_left', 'bottom_center', 'bottom_right'].map((pos) => (
                <button
                  key={pos}
                  className={`p-2 rounded border text-[10px] ${
                    settings.scoreboard_position === pos
                      ? 'border-cyan-500 bg-cyan-950/30 text-cyan-400'
                      : 'border-slate-700 bg-slate-800/50 text-slate-300'
                  }`}
                  onClick={() => updateSetting('scoreboard_position', pos as any)}
                >
                  {pos.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400">Display Options</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'show_timer', label: 'Show Timer', icon: Clock },
                { key: 'show_score', label: 'Show Score', icon: Monitor },
                { key: 'show_team_logos', label: 'Team Logos', icon: Image },
              ].map((opt) => (
                <button
                  key={opt.key}
                  className={`p-3 rounded-lg border flex flex-col items-center ${
                    settings[opt.key as keyof ViewerSettingsData]
                      ? 'border-cyan-500 bg-cyan-950/30'
                      : 'border-slate-700 bg-slate-800/50'
                  }`}
                  onClick={() => updateSetting(opt.key as any, !settings[opt.key as keyof ViewerSettingsData])}
                >
                  <opt.icon className={`h-5 w-5 mb-1 ${
                    settings[opt.key as keyof ViewerSettingsData] ? 'text-cyan-400' : 'text-slate-400'
                  }`} />
                  <span className={`text-xs ${
                    settings[opt.key as keyof ViewerSettingsData] ? 'text-white' : 'text-slate-400'
                  }`}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="flex gap-2 pt-3 border-t border-slate-700">
            <Button
              size="sm"
              className="flex-1"
              onClick={saveSettings}
              disabled={isLoading || !hasChanges}
            >
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { loadSettings(); setHasChanges(false); }}
              disabled={!hasChanges}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
