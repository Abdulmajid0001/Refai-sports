import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Prefs = {
  in_app_enabled: boolean;
  email_enabled: boolean;
  digest_frequency: string;
  notify_match_start: boolean;
  notify_goals: boolean;
  notify_half_full_time: boolean;
  notify_highlights: boolean;
  notify_league_updates: boolean;
};

const DEFAULTS: Prefs = {
  in_app_enabled: true,
  email_enabled: false,
  digest_frequency: "daily",
  notify_match_start: true,
  notify_goals: true,
  notify_half_full_time: true,
  notify_highlights: true,
  notify_league_updates: true,
};

export function NotificationPreferencesCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  const q = useQuery({
    queryKey: ["notification-prefs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("notification_preferences").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (q.data) setPrefs({ ...DEFAULTS, ...(q.data as Prefs) });
  }, [q.data]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: user.id, ...prefs }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Preferences saved");
      qc.invalidateQueries({ queryKey: ["notification-prefs", user.id] });
    }
  }

  function toggle<K extends keyof Prefs>(key: K, val: Prefs[K]) {
    setPrefs((p) => ({ ...p, [key]: val }));
  }

  if (!user) return null;

  const rows: { key: keyof Prefs; label: string; desc: string }[] = [
    { key: "notify_match_start", label: "Match kickoff", desc: "When a match you follow begins." },
    { key: "notify_goals", label: "Goals & red cards", desc: "Key in-match events." },
    { key: "notify_half_full_time", label: "Half-time & full-time", desc: "AI recaps when matches break/end." },
    { key: "notify_highlights", label: "New highlights", desc: "Clips published from your leagues." },
    { key: "notify_league_updates", label: "League updates", desc: "Standings, fixtures, news from leagues you follow." },
  ];

  return (
    <Card id="notifications">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4 text-primary" /> Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="text-sm font-medium">In-app alerts</div>
              <div className="text-xs text-muted-foreground">Bell icon notifications.</div>
            </div>
            <Switch checked={prefs.in_app_enabled} onCheckedChange={(v) => toggle("in_app_enabled", v)} />
          </label>
          <label className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="text-sm font-medium">Email digests</div>
              <div className="text-xs text-muted-foreground">Periodic email summary.</div>
            </div>
            <Switch checked={prefs.email_enabled} onCheckedChange={(v) => toggle("email_enabled", v)} />
          </label>
        </div>

        {prefs.email_enabled && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Digest frequency:</span>
            <Select value={prefs.digest_frequency} onValueChange={(v) => toggle("digest_frequency", v)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          {rows.map((r) => (
            <label key={r.key} className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">{r.label}</div>
                <div className="text-xs text-muted-foreground">{r.desc}</div>
              </div>
              <Switch
                checked={Boolean(prefs[r.key])}
                onCheckedChange={(v) => toggle(r.key, v as Prefs[typeof r.key])}
              />
            </label>
          ))}
        </div>

        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save preferences"}</Button>
      </CardContent>
    </Card>
  );
}
