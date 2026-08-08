import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Mic, Send, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { LIVEKIT_CLIENT_ENABLED } from "@/utils/featureFlags";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HalfTimeBriefPanel } from "@/components/match/HalfTimeBriefPanel";

export const Route = createFileRoute("/commentate/$matchId")({ component: CommentatorBooth });

type Line = { id: string; author: string; text: string; ts: number };

export function CommentatorBooth() {
  const { matchId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  const matchQ = useQuery({
    queryKey: ["commentate-match", matchId],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("matches").select("id, home_team_id, away_team_id, home_score, away_score, status").eq("id", matchId).maybeSingle();
      if (!data) return null;
      const [{ data: home }, { data: away }] = await Promise.all([
        supabase.from("teams").select("id, name").eq("id", data.home_team_id).maybeSingle(),
        supabase.from("teams").select("id, name").eq("id", data.away_team_id).maybeSingle(),
      ]);
      return { ...data, home, away };
    },
  });

  const [lines, setLines] = useState<Line[]>([]);
  const [text, setText] = useState("");
  const [presence, setPresence] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const profileQ = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("display_name").eq("id", user!.id).maybeSingle();
      return data;
    },
  });
  const authorName = profileQ.data?.display_name || user?.email?.split("@")[0] || "Commentator";
  const liveKitEnabled = LIVEKIT_CLIENT_ENABLED;

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`commentary-${matchId}`, { config: { presence: { key: user.id } } });
    ch.on("broadcast", { event: "line" }, ({ payload }) => {
      setLines((prev) => [...prev.slice(-200), payload as Line]);
    });
    ch.on("presence", { event: "sync" }, () => {
      setPresence(Object.keys(ch.presenceState()).length);
    });
    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") await ch.track({ name: authorName, role: "commentator" });
    });
    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [matchId, user, authorName]);

  function send() {
    const t = text.trim();
    if (!t || !channelRef.current) return;
    const line: Line = { id: crypto.randomUUID(), author: authorName, text: t, ts: Date.now() };
    channelRef.current.send({ type: "broadcast", event: "line", payload: line });
    setLines((prev) => [...prev.slice(-200), line]);
    setText("");
  }

  // Mic capture for self-monitoring (commentator hears their own input)
  const audioRef = useRef<HTMLAudioElement>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(false);
  async function toggleMic() {
    if (micOn) {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      if (audioRef.current) audioRef.current.srcObject = null;
      setMicOn(false);
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = s;
      if (audioRef.current) { audioRef.current.srcObject = s; audioRef.current.muted = true; }
      setMicOn(true);
      toast.success(
        `Mic active (local). ${liveKitEnabled ? "Live audio streaming is available via LiveKit." : "LiveKit is not configured yet."}`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Mic denied");
    }
  }
  useEffect(() => () => micStreamRef.current?.getTracks().forEach((t) => t.stop()), []);

  if (loading || matchQ.isLoading) return <PageShell><div className="mx-auto max-w-3xl px-4 py-10">Loading…</div></PageShell>;
  const m = matchQ.data;
  if (!m) return <PageShell><div className="mx-auto max-w-3xl px-4 py-10">Match not found.</div></PageShell>;

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Commentator booth</h1>
            <p className="text-sm text-muted-foreground">{m.home?.name} {m.home_score} – {m.away_score} {m.away?.name}</p>
          </div>
          <Badge variant="secondary"><Users className="mr-1 h-3 w-3" />{presence} in booth</Badge>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Live ticker</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="h-72 overflow-y-auto rounded border bg-muted/30 p-3">
              {lines.length === 0 && <p className="text-sm text-muted-foreground">Your commentary will appear here in real time for all viewers.</p>}
              {lines.map((l) => (
                <div key={l.id} className="mb-2">
                  <span className="text-xs font-semibold text-primary">{l.author}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{new Date(l.ts).toLocaleTimeString()}</span>
                  <p className="text-sm">{l.text}</p>
                </div>
              ))}
            </div>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type live commentary…" maxLength={400} />
              <Button type="submit"><Send className="h-4 w-4" /></Button>
            </form>
            <div className="flex items-center gap-2">
              <Button size="sm" variant={micOn ? "destructive" : "outline"} onClick={toggleMic}>
                <Mic className="mr-1 h-4 w-4" />{micOn ? "Mic on" : "Activate mic"}
              </Button>
              <audio ref={audioRef} autoPlay />
              <span className="text-xs text-muted-foreground">
                Audio capture ready — live audio broadcast to viewers {liveKitEnabled ? "is available via LiveKit." : "requires LiveKit configuration."}
              </span>
            </div>
          </CardContent>
        </Card>

        <HalfTimeBriefPanel
          home={m.home?.name ?? "Home"}
          away={m.away?.name ?? "Away"}
          homeScore={m.home_score}
          awayScore={m.away_score}
          events={lines.slice(-20).map((l) => `${l.author}: ${l.text}`)}
        />
      </div>

    </PageShell>
  );
}
