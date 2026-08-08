import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, HeartOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

type Props = {
  targetType: "team" | "league";
  targetId: string;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "secondary" | "ghost";
};

export function FollowButton({ targetType, targetId, size = "sm", variant = "outline" }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["follow", targetType, targetId, user?.id];

  const q = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_follows")
        .select("id")
        .eq("user_id", user!.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .maybeSingle();
      return data;
    },
  });

  const countQ = useQuery({
    queryKey: ["follow-count", targetType, targetId],
    queryFn: async () => {
      const { count } = await supabase
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("target_type", targetType)
        .eq("target_id", targetId);
      return count ?? 0;
    },
  });

  const following = !!q.data;

  async function toggle() {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    if (following) {
      const { error } = await supabase
        .from("user_follows")
        .delete()
        .eq("user_id", user.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId);
      if (error) return toast.error(error.message);
      toast.success("Unfollowed");
    } else {
      const { error } = await supabase
        .from("user_follows")
        .insert({ user_id: user.id, target_type: targetType, target_id: targetId });
      if (error) return toast.error(error.message);
      toast.success("Following");
    }
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["follow-count", targetType, targetId] });
  }

  return (
    <Button onClick={toggle} size={size} variant={following ? "secondary" : variant} className="gap-1">
      {following ? <HeartOff className="h-3.5 w-3.5" /> : <Heart className="h-3.5 w-3.5" />}
      {following ? "Following" : "Follow"}
      {countQ.data != null && <span className="ml-1 text-xs text-muted-foreground">· {countQ.data}</span>}
    </Button>
  );
}
