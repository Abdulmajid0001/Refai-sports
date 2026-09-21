import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function AIRefereePanel({ sport = "football", context }: { sport?: string; context?: string }) {
  const [situation, setSituation] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!situation.trim()) return;
    setBusy(true);
    setAnswer("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) throw new Error("Sign in to use the referee assistant");
      const response = await fetch("/.netlify/functions/ai-referee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ sport, incident: situation, context }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "AI analysis failed");
      setAnswer(String(payload.result || "No analysis returned."));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" /> AI referee assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          placeholder="Describe the incident: e.g. 'Attacker shielding ball in box, defender steps on heel. Contact minimal.'"
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          rows={3}
          maxLength={1000}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={run} disabled={busy || !situation.trim()}>
            {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
            Get ruling
          </Button>
        </div>
        {answer && (
          <div className="whitespace-pre-wrap rounded border bg-muted/40 p-3 text-sm">{answer}</div>
        )}
        <p className="text-xs text-muted-foreground">Guidance only — final decision rests with the on-field referee.</p>
      </CardContent>
    </Card>
  );
}
