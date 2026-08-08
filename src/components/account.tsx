import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationPreferencesCard } from "@/components/notifications/NotificationPreferencesCard";

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  const { user, roles, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      setDisplayName(data?.display_name ?? "");
    });
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  }

  if (!user) return null;

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Email</Label><Input value={user.email ?? ""} disabled /></div>
            <div>
              <Label>Display name</Label>
              <Input value={displayName} maxLength={80} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div>
              <Label>Roles</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {roles.length === 0 ? <span className="text-sm text-muted-foreground">No roles assigned yet.</span> :
                  roles.map((r) => <Badge key={r} variant="secondary" className="capitalize">{r.replace("_", " ")}</Badge>)}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
              <Button variant="outline" onClick={() => signOut().then(() => navigate({ to: "/" }))}>Sign out</Button>
            </div>
          </CardContent>
        </Card>
        <NotificationPreferencesCard />
      </div>
    </PageShell>
  );
}
