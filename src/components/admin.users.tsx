import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/server-fn";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X, Ban, Trash2, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { listUsers, setAccountStatus, deleteUserAccount } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

export function AdminUsers() {
  const qc = useQueryClient();
  const fetchUsers = useServerFn(listUsers);
  const updateStatus = useServerFn(setAccountStatus);
  const removeUser = useServerFn(deleteUserAccount);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "suspended" | "all">("pending");
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchUsers(),
  });

  async function act(user_id: string, status: "approved" | "rejected" | "suspended" | "pending") {
    try {
      await updateStatus({ data: { user_id, status } });
      toast.success(`User ${status}`);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function destroy(user_id: string, email: string) {
    if (!confirm(`Permanently delete ${email}? This cannot be undone.`)) return;
    try {
      await removeUser({ data: { user_id } });
      toast.success("Account deleted");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  const filtered = (data ?? []).filter((u) => {
    if (filter !== "all" && u.account_status !== filter) return false;
    if (q && !u.email.toLowerCase().includes(q.toLowerCase()) && !(u.display_name ?? "").toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Users & sign-ups</h1>
        <p className="text-sm text-muted-foreground">Approve, reject, suspend, or delete accounts.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "suspended", "rejected", "all"] as const).map((s) => (
          <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>
            {s}
          </Button>
        ))}
        <Input className="ml-auto w-64" placeholder="Search email or name" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="space-y-2">
        {filtered.map((u) => (
          <Card key={u.id}>
            <CardContent className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{u.display_name ?? u.email}</div>
                <div className="truncate text-xs text-muted-foreground">{u.email}</div>
              </div>
              <Badge variant={u.email_confirmed ? "default" : "secondary"}>{u.email_confirmed ? "email ok" : "email pending"}</Badge>
              <StatusBadge status={u.account_status} />
              <div className="flex flex-wrap gap-1">
                {u.account_status !== "approved" && (
                  <Button size="sm" variant="default" onClick={() => act(u.id, "approved")}>
                    <Check className="mr-1 h-3 w-3" />Approve
                  </Button>
                )}
                {u.account_status === "pending" && (
                  <Button size="sm" variant="outline" onClick={() => act(u.id, "rejected")}>
                    <X className="mr-1 h-3 w-3" />Reject
                  </Button>
                )}
                {u.account_status === "approved" && (
                  <Button size="sm" variant="outline" onClick={() => act(u.id, "suspended")}>
                    <Ban className="mr-1 h-3 w-3" />Suspend
                  </Button>
                )}
                {(u.account_status === "suspended" || u.account_status === "rejected") && (
                  <Button size="sm" variant="outline" onClick={() => act(u.id, "approved")}>
                    <RotateCcw className="mr-1 h-3 w-3" />Reinstate
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => destroy(u.id, u.email)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No users match.</p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "approved" ? "default" : status === "pending" ? "secondary" : "destructive";
  return <Badge variant={variant as "default" | "secondary" | "destructive"}>{status}</Badge>;
}
