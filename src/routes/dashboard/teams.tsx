import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Users, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { slugify } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/dashboard/teams")({ component: MyTeams });

const teamSchema = z.object({
  name: z.string().trim().min(2).max(120),
  short_name: z.string().trim().max(20).optional(),
  sport: z.string().trim().min(2).max(40),
  country: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  home_venue: z.string().trim().max(120).optional(),
  primary_color: z.string().trim().max(20).optional(),
  description: z.string().trim().max(2000).optional(),
});

const memberSchema = z.object({
  display_name: z.string().trim().min(2).max(80),
  jersey_number: z.coerce.number().int().min(1).max(99).optional(),
  position: z.enum(["GK", "DF", "MF", "FW", "UTIL"]).optional(),
});

function MyTeams() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const { data: teams } = useQuery({
    queryKey: ["my-teams", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, slug, city, country, logo_url, primary_color")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function createTeam(fd: FormData) {
    if (!user) return;
    try {
      const parsed = teamSchema.parse(Object.fromEntries(fd.entries()));
      const slug = `${slugify(parsed.name)}-${Math.random().toString(36).slice(2, 6)}`;
      const { error } = await supabase.from("teams").insert({ ...parsed, slug, owner_id: user.id });
      if (error) throw error;
      await supabase.from("user_roles").insert({ user_id: user.id, role: "team_owner" });
      toast.success("Team created");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["my-teams"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create team");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">My teams</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" />Register team</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Register a team</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); createTeam(new FormData(e.currentTarget)); }}>
              <div><Label>Team name</Label><Input name="name" required minLength={2} maxLength={120} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Short name</Label><Input name="short_name" maxLength={20} /></div>
                <div><Label>Sport</Label><Input name="sport" defaultValue="football" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>City</Label><Input name="city" maxLength={80} /></div>
                <div><Label>Country</Label><Input name="country" maxLength={80} /></div>
              </div>
              <div><Label>Home venue</Label><Input name="home_venue" maxLength={120} /></div>
              <div><Label>Primary color</Label><Input name="primary_color" type="color" defaultValue="#0e7a3e" /></div>
              <div><Label>Description</Label><Textarea name="description" maxLength={2000} rows={3} /></div>
              <Button type="submit" className="w-full">Create team</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {(teams ?? []).map((t) => (
          <Card key={t.id}>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded text-white"
                style={{ background: t.primary_color || "hsl(var(--primary))" }}>
                <Users className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">{t.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{[t.city, t.country].filter(Boolean).join(", ")}</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/teams/$slug" params={{ slug: t.slug }}>View public</Link>
              </Button>
              <Button size="sm" onClick={() => setSelectedTeam(selectedTeam === t.id ? null : t.id)}>
                {selectedTeam === t.id ? "Close" : "Roster"}
              </Button>
            </CardHeader>
            {selectedTeam === t.id && <RosterEditor teamId={t.id} />}
          </Card>
        ))}
        {(teams ?? []).length === 0 && (
          <Card><CardContent className="py-10 text-center text-muted-foreground">No teams yet.</CardContent></Card>
        )}
      </div>
    </div>
  );
}

function RosterEditor({ teamId }: { teamId: string }) {
  const qc = useQueryClient();
  const { data: members } = useQuery({
    queryKey: ["roster", teamId],
    queryFn: async () => {
      const { data } = await supabase.from("team_members")
        .select("id, display_name, jersey_number, position, is_captain")
        .eq("team_id", teamId)
        .order("jersey_number", { ascending: true });
      return data ?? [];
    },
  });

  async function addMember(fd: FormData) {
    try {
      const parsed = memberSchema.parse({
        display_name: fd.get("display_name"),
        jersey_number: fd.get("jersey_number") || undefined,
        position: fd.get("position") || undefined,
      });
      const { error } = await supabase.from("team_members").insert({ team_id: teamId, ...parsed });
      if (error) throw error;
      toast.success("Player added");
      qc.invalidateQueries({ queryKey: ["roster", teamId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function removeMember(id: string) {
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["roster", teamId] });
  }

  return (
    <CardContent className="space-y-4 border-t pt-4">
      <form
        className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_80px_100px_auto]"
        onSubmit={(e) => { e.preventDefault(); addMember(new FormData(e.currentTarget)); (e.target as HTMLFormElement).reset(); }}
      >
        <Input name="display_name" placeholder="Player name" required minLength={2} maxLength={80} />
        <Input name="jersey_number" type="number" min={1} max={99} placeholder="#" />
        <Select name="position">
          <SelectTrigger><SelectValue placeholder="Pos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="GK">GK</SelectItem><SelectItem value="DF">DF</SelectItem>
            <SelectItem value="MF">MF</SelectItem><SelectItem value="FW">FW</SelectItem>
            <SelectItem value="UTIL">UTIL</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit"><Plus className="h-4 w-4" /></Button>
      </form>
      <div className="space-y-1">
        {(members ?? []).map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded border p-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-8 text-center font-mono tabular-nums text-muted-foreground">{m.jersey_number ?? "—"}</span>
              <span className="font-medium">{m.display_name}</span>
              <span className="text-xs text-muted-foreground">{m.position ?? ""}</span>
            </div>
            <Button size="icon" variant="ghost" onClick={() => removeMember(m.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </CardContent>
  );
}
