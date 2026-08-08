import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { slugify } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard/leagues")({ component: MyLeagues });

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  sport: z.string().trim().min(2).max(40),
  country: z.string().trim().max(80).optional(),
  region: z.string().trim().max(80).optional(),
  description: z.string().trim().max(2000).optional(),
});

function MyLeagues() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["my-leagues", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leagues")
        .select("id, name, slug, sport, country, status, logo_url")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function createLeague(fd: FormData) {
    if (!user) return;
    setSaving(true);
    try {
      const parsed = schema.parse({
        name: fd.get("name"),
        sport: fd.get("sport"),
        country: fd.get("country") || undefined,
        region: fd.get("region") || undefined,
        description: fd.get("description") || undefined,
      });
      const slug = `${slugify(parsed.name)}-${Math.random().toString(36).slice(2, 6)}`;
      const { error } = await supabase.from("leagues").insert({
        ...parsed,
        slug,
        owner_id: user.id,
      });
      if (error) throw error;
      // Self-assign league_owner role (best effort; ignored if already)
      await supabase.from("user_roles").insert({ user_id: user.id, role: "league_owner" });
      toast.success("League created");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["my-leagues"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create league");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">My leagues</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" />New league</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create a league</DialogTitle></DialogHeader>
            <form
              className="space-y-3"
              onSubmit={(e) => { e.preventDefault(); createLeague(new FormData(e.currentTarget)); }}
            >
              <div><Label>Name</Label><Input name="name" required minLength={2} maxLength={120} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Sport</Label><Input name="sport" defaultValue="football" required /></div>
                <div><Label>Country</Label><Input name="country" maxLength={80} /></div>
              </div>
              <div><Label>Region</Label><Input name="region" maxLength={80} /></div>
              <div><Label>Description</Label><Textarea name="description" maxLength={2000} rows={3} /></div>
              <Button type="submit" disabled={saving} className="w-full">{saving ? "Saving…" : "Create"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {(data ?? []).map((l) => (
          <Card key={l.id}>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded bg-primary/10 text-primary">
                <Trophy className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">{l.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{l.sport} • {l.country}</p>
              </div>
              <Badge variant="secondary" className="capitalize">{l.status.replace("_", " ")}</Badge>
              <Button asChild size="sm" variant="outline">
                <Link to="/leagues/$slug" params={{ slug: l.slug }}>View</Link>
              </Button>
            </CardHeader>
          </Card>
        ))}
        {(data ?? []).length === 0 && (
          <Card><CardContent className="py-10 text-center text-muted-foreground">No leagues yet.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
