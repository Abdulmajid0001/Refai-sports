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

const MAX_SLIDES = 10;

export const Route = createFileRoute("/admin/slideshow")({ component: AdminSlideshow });

type Slide = {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  link_url: string | null;
  position: number;
  is_active: boolean;
};

export function AdminSlideshow() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-slides"],
    queryFn: async () => {
      const { data } = await supabase
        .from("homepage_slides")
        .select("*")
        .order("position", { ascending: true });
      return (data ?? []) as Slide[];
    },
  });

  async function addSlide() {
    if ((data?.length ?? 0) >= MAX_SLIDES) {
      toast.error(`Max ${MAX_SLIDES} slides.`);
      return;
    }
    const { error } = await supabase.from("homepage_slides").insert({
      image_url: "https://placehold.co/1600x600",
      title: "New slide",
      subtitle: "",
      position: data?.length ?? 0,
      is_active: true,
    });
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-slides"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Homepage slideshow</h1>
          <p className="text-sm text-muted-foreground">Up to {MAX_SLIDES} slides. Currently {data?.length ?? 0}.</p>
        </div>
        <Button onClick={addSlide} disabled={(data?.length ?? 0) >= MAX_SLIDES}>
          <Plus className="mr-1 h-4 w-4" />Add slide
        </Button>
      </div>

      <div className="space-y-3">
        {(data ?? []).map((s) => <SlideEditor key={s.id} slide={s} />)}
        {(data ?? []).length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No slides yet.</p>
        )}
      </div>
    </div>
  );
}

function SlideEditor({ slide }: { slide: Slide }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState(slide);

  async function save() {
    const { error } = await supabase
      .from("homepage_slides")
      .update({
        image_url: draft.image_url,
        title: draft.title,
        subtitle: draft.subtitle,
        link_url: draft.link_url,
        position: draft.position,
        is_active: draft.is_active,
      })
      .eq("id", slide.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-slides"] });
    }
  }

  async function destroy() {
    if (!confirm("Delete this slide?")) return;
    const { error } = await supabase.from("homepage_slides").delete().eq("id", slide.id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-slides"] });
  }

  return (
    <Card>
      <CardContent className="grid gap-3 py-4 md:grid-cols-[160px_1fr]">
        <img src={draft.image_url} alt="" className="aspect-video w-full rounded-md border object-cover" />
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Image URL">
              <Input value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} />
            </Field>
            <Field label="Link URL">
              <Input value={draft.link_url ?? ""} onChange={(e) => setDraft({ ...draft, link_url: e.target.value })} />
            </Field>
            <Field label="Title">
              <Input value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label="Subtitle">
              <Input value={draft.subtitle ?? ""} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
            </Field>
            <Field label="Order">
              <Input type="number" value={draft.position} onChange={(e) => setDraft({ ...draft, position: Number(e.target.value) })} />
            </Field>
            <div className="flex items-end gap-2">
              <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save}><Save className="mr-1 h-3 w-3" />Save</Button>
            <Button size="sm" variant="destructive" onClick={destroy}><Trash2 className="h-3 w-3" /></Button>
          </div>
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
