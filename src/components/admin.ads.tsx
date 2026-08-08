import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState , type ReactNode } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/ads")({ component: AdminAds });

const PLACEMENTS = [
  { value: "homepage_strip", label: "Homepage — top strip" },
  { value: "homepage_inline", label: "Homepage — inline" },
  { value: "site_banner", label: "Site-wide banner" },
  { value: "match_overlay_bottom", label: "Match — bottom overlay" },
  { value: "match_overlay_side", label: "Match — side overlay" },
  { value: "match_overlay_top", label: "Match — top overlay" },
] as const;

const KINDS = ["image", "video", "html", "link"] as const;

type Ad = {
  id: string;
  placement: string;
  match_id: string | null;
  kind: string;
  title: string | null;
  asset_url: string | null;
  link_url: string | null;
  html: string | null;
  bg_color: string | null;
  text_color: string | null;
  width_pct: number | null;
  height_pct: number | null;
  position_x: string | null;
  position_y: string | null;
  start_seconds: number | null;
  duration_seconds: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  priority: number;
};

export function AdminAds() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-ads"],
    queryFn: async () => {
      const { data } = await supabase.from("ads").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Ad[];
    },
  });

  async function addAd() {
    const { error } = await supabase.from("ads").insert({
      placement: "homepage_strip",
      kind: "image",
      title: "New ad",
      bg_color: "#000000",
      text_color: "#ffffff",
      is_active: false,
    });
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-ads"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Ads & overlays</h1>
          <p className="text-sm text-muted-foreground">
            Schedule ads on the homepage, site-wide, or as timed overlays on live match pages.
            Choose placement, color, size, position, when to show, and how long.
          </p>
        </div>
        <Button onClick={addAd}><Plus className="mr-1 h-4 w-4" />New ad</Button>
      </div>
      <div className="space-y-3">
        {(data ?? []).map((a) => <AdEditor key={a.id} ad={a} />)}
        {(data ?? []).length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No ads yet.</p>
        )}
      </div>
    </div>
  );
}

function AdEditor({ ad }: { ad: Ad }) {
  const qc = useQueryClient();
  const [d, setD] = useState(ad);
  const isMatchOverlay = d.placement.startsWith("match_overlay");

  async function save() {
    const { id: _id, ...rest } = d;
    void _id;
    const { error } = await supabase
      .from("ads")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ ...(rest as any), match_id: d.match_id || null, starts_at: d.starts_at || null, ends_at: d.ends_at || null })
      .eq("id", ad.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-ads"] });
    }
  }

  async function destroy() {
    if (!confirm("Delete this ad?")) return;
    const { error } = await supabase.from("ads").delete().eq("id", ad.id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-ads"] });
  }

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Title"><Input value={d.title ?? ""} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
          <Field label="Placement">
            <Select value={d.placement} onValueChange={(v) => setD({ ...d, placement: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLACEMENTS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Kind">
            <Select value={d.kind} onValueChange={(v) => setD({ ...d, kind: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Priority"><Input type="number" value={d.priority} onChange={(e) => setD({ ...d, priority: Number(e.target.value) })} /></Field>

          {(d.kind === "image" || d.kind === "video") && (
            <Field label="Asset URL"><Input value={d.asset_url ?? ""} onChange={(e) => setD({ ...d, asset_url: e.target.value })} /></Field>
          )}
          <Field label="Link URL (click target)"><Input value={d.link_url ?? ""} onChange={(e) => setD({ ...d, link_url: e.target.value })} /></Field>
          {d.kind === "html" && (
            <Field label="HTML">
              <Textarea value={d.html ?? ""} onChange={(e) => setD({ ...d, html: e.target.value })} />
            </Field>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Background color">
            <Input type="color" value={d.bg_color ?? "#000000"} onChange={(e) => setD({ ...d, bg_color: e.target.value })} />
          </Field>
          <Field label="Text color">
            <Input type="color" value={d.text_color ?? "#ffffff"} onChange={(e) => setD({ ...d, text_color: e.target.value })} />
          </Field>
          <Field label="Width %"><Input type="number" min={1} max={100} value={d.width_pct ?? ""} onChange={(e) => setD({ ...d, width_pct: e.target.value ? Number(e.target.value) : null })} /></Field>
          <Field label="Height %"><Input type="number" min={1} max={100} value={d.height_pct ?? ""} onChange={(e) => setD({ ...d, height_pct: e.target.value ? Number(e.target.value) : null })} /></Field>
          <Field label="Position X">
            <Select value={d.position_x ?? "center"} onValueChange={(v) => setD({ ...d, position_x: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["left", "center", "right"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Position Y">
            <Select value={d.position_y ?? "bottom"} onValueChange={(v) => setD({ ...d, position_y: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["top", "middle", "bottom"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>

        {isMatchOverlay && (
          <div className="grid gap-3 rounded-md border border-dashed p-3 sm:grid-cols-3">
            <Field label="Match ID (blank = all live matches)">
              <Input value={d.match_id ?? ""} onChange={(e) => setD({ ...d, match_id: e.target.value || null })} />
            </Field>
            <Field label="Show after kickoff (seconds)">
              <Input type="number" value={d.start_seconds ?? ""} onChange={(e) => setD({ ...d, start_seconds: e.target.value ? Number(e.target.value) : null })} />
            </Field>
            <Field label="Show duration (seconds)">
              <Input type="number" value={d.duration_seconds ?? ""} onChange={(e) => setD({ ...d, duration_seconds: e.target.value ? Number(e.target.value) : null })} />
            </Field>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Active from">
            <Input type="datetime-local" value={d.starts_at?.slice(0, 16) ?? ""} onChange={(e) => setD({ ...d, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
          </Field>
          <Field label="Active until">
            <Input type="datetime-local" value={d.ends_at?.slice(0, 16) ?? ""} onChange={(e) => setD({ ...d, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
          </Field>
          <div className="flex items-end gap-2">
            <Switch checked={d.is_active} onCheckedChange={(v) => setD({ ...d, is_active: v })} />
            <Label>Active</Label>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={save}><Save className="mr-1 h-3 w-3" />Save</Button>
          <Button size="sm" variant="destructive" onClick={destroy}><Trash2 className="h-3 w-3" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
