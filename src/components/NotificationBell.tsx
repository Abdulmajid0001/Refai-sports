import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

type Notif = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      return (data ?? []) as Notif[];
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["notifications", user.id] });
          const n = payload.new as Notif;
          toast(n.title, { description: n.body ?? undefined });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  if (!user) return null;

  const items = q.data ?? [];
  const unread = items.filter((n) => !n.read_at).length;

  async function markAllRead() {
    const ids = items.filter((n) => !n.read_at).map((n) => n.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids);
    qc.invalidateQueries({ queryKey: ["notifications", user!.id] });
  }

  async function markOne(id: string) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications", user!.id] });
  }

  async function removeOne(id: string) {
    await supabase.from("notifications").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications", user!.id] });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="text-sm font-semibold">Notifications</div>
          <Button variant="ghost" size="sm" onClick={markAllRead} disabled={unread === 0} className="h-7 px-2 text-xs">
            <CheckCheck className="mr-1 h-3 w-3" /> Mark all read
          </Button>
        </div>
        <ScrollArea className="max-h-96">
          {items.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">No notifications yet.</div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id} className={`flex gap-2 px-3 py-2 ${n.read_at ? "" : "bg-accent/30"}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] capitalize">{n.kind.replace(/_/g, " ")}</Badge>
                      <span className="truncate text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {n.link ? (
                      <a href={n.link} className="mt-1 block text-sm font-medium hover:underline">{n.title}</a>
                    ) : (
                      <div className="mt-1 text-sm font-medium">{n.title}</div>
                    )}
                    {n.body && <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</div>}
                  </div>
                  <div className="flex flex-col gap-1">
                    {!n.read_at && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => markOne(n.id)} aria-label="Mark read">
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeOne(n.id)} aria-label="Delete">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <div className="border-t px-3 py-2 text-center">
          <a href="/account#notifications" className="text-xs text-muted-foreground hover:text-foreground">Notification settings</a>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
