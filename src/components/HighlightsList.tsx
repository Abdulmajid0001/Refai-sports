import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Film, Share2, Play } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HighlightsList({ matchId }: { matchId: string }) {
  const q = useQuery({
    queryKey: ["highlights", matchId],
    queryFn: async () => {
      const { data } = await supabase
        .from("match_highlights")
        .select("id, title, description, minute, video_url, thumbnail_url, created_at")
        .eq("match_id", matchId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  function share(id: string, title: string) {
    const url = `${window.location.origin}/share/match/${matchId}?h=${id}`;
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => navigator.clipboard.writeText(url));
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Share link copied");
    }
  }

  const items = q.data ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Film className="h-4 w-4 text-primary" /> Highlights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No highlights yet. They appear as referees mark them in.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-2 rounded border p-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {h.minute != null && <Badge variant="secondary">{h.minute}&apos;</Badge>}
                    <span className="truncate text-sm font-medium">{h.title}</span>
                  </div>
                  {h.description && <p className="truncate text-xs text-muted-foreground">{h.description}</p>}
                </div>
                <div className="flex gap-1">
                  {h.video_url && (
                    <Button asChild size="icon" variant="ghost">
                      <a href={h.video_url} target="_blank" rel="noreferrer"><Play className="h-4 w-4" /></a>
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => share(h.id, h.title)}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <Button asChild size="sm" variant="outline">
            <Link to="/share/match/$id" params={{ id: matchId }}>
              <Share2 className="mr-1 h-4 w-4" />Open shareable card
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
