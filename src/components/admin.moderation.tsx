import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/server-fn";
import { toast } from "sonner";
import { Ban, Trash2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setEntitySuspended, deleteEntity } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/moderation")({ component: AdminModeration });

export function AdminModeration() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Leagues & teams</h1>
        <p className="text-sm text-muted-foreground">Suspend or delete any league or team.</p>
      </div>
      <Tabs defaultValue="leagues">
        <TabsList>
          <TabsTrigger value="leagues">Leagues</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>
        <TabsContent value="leagues" className="mt-4">
          <EntityList kind="league" />
        </TabsContent>
        <TabsContent value="teams" className="mt-4">
          <EntityList kind="team" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EntityList({ kind }: { kind: "league" | "team" }) {
  const qc = useQueryClient();
  const suspend = useServerFn(setEntitySuspended);
  const remove = useServerFn(deleteEntity);
  const table = kind === "league" ? "leagues" : "teams";

  const { data } = useQuery({
    queryKey: ["admin-entities", kind],
    queryFn: async () => {
      const { data } = await supabase
        .from(table)
        .select("id, name, slug, is_suspended, suspended_reason, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      return data ?? [];
    },
  });

  async function toggleSuspend(id: string, suspended: boolean) {
    const reason = suspended ? (prompt("Reason for suspending?") ?? undefined) : undefined;
    try {
      await suspend({ data: { target_type: kind, target_id: id, suspended, reason } });
      toast.success(suspended ? "Suspended" : "Reinstated");
      qc.invalidateQueries({ queryKey: ["admin-entities", kind] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function destroy(id: string, name: string) {
    if (!confirm(`Delete ${kind} "${name}"? This cannot be undone.`)) return;
    try {
      await remove({ data: { target_type: kind, target_id: id } });
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-entities", kind] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="space-y-2">
      {(data ?? []).map((e) => (
        <Card key={e.id}>
          <CardContent className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{e.name}</div>
              <div className="truncate text-xs text-muted-foreground">/{e.slug}</div>
            </div>
            {e.is_suspended && <Badge variant="destructive">suspended</Badge>}
            <Button size="sm" variant="outline" onClick={() => toggleSuspend(e.id, !e.is_suspended)}>
              {e.is_suspended ? <RotateCcw className="mr-1 h-3 w-3" /> : <Ban className="mr-1 h-3 w-3" />}
              {e.is_suspended ? "Reinstate" : "Suspend"}
            </Button>
            <Button size="sm" variant="destructive" onClick={() => destroy(e.id, e.name)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      ))}
      {(data ?? []).length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">Nothing to show.</p>}
    </div>
  );
}
