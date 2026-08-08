import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState , type ReactNode } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/payments")({ component: AdminPayments });

export function AdminPayments() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Payments & plans</h1>
        <p className="text-sm text-muted-foreground">Edit subscription tiers, manage payment-method slots, oversee transactions.</p>
      </div>
      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Plans & pricing</TabsTrigger>
          <TabsTrigger value="methods">Payment methods</TabsTrigger>
          <TabsTrigger value="ledger">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="plans" className="mt-4"><PlansPanel /></TabsContent>
        <TabsContent value="methods" className="mt-4"><MethodsPanel /></TabsContent>
        <TabsContent value="ledger" className="mt-4"><LedgerPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

type Plan = {
  id: string;
  slug: string;
  name: string;
  team_limit: number | null;
  price_cents: number;
  currency: string;
  interval: string;
  description: string | null;
  stripe_price_id: string | null;
  is_active: boolean;
};

function PlansPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("subscription_plans").select("*").order("display_order");
      return (data ?? []) as Plan[];
    },
  });
  return (
    <div className="space-y-3">
      {(data ?? []).map((p) => <PlanEditor key={p.id} plan={p} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-plans"] })} />)}
    </div>
  );
}

function PlanEditor({ plan, onSaved }: { plan: Plan; onSaved: () => void }) {
  const [d, setD] = useState(plan);
  async function save() {
    const { id, slug, ...rest } = d;
    void id; void slug;
    const { error } = await supabase.from("subscription_plans").update(rest).eq("id", plan.id);
    if (error) toast.error(error.message);
    else { toast.success("Saved"); onSaved(); }
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{plan.name} <Badge variant="outline">{plan.slug}</Badge></CardTitle>
        <Button size="sm" onClick={save}><Save className="mr-1 h-3 w-3" />Save</Button>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Name"><Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
        <Field label="Price (cents)"><Input type="number" value={d.price_cents} onChange={(e) => setD({ ...d, price_cents: Number(e.target.value) })} /></Field>
        <Field label="Currency"><Input value={d.currency} onChange={(e) => setD({ ...d, currency: e.target.value })} /></Field>
        <Field label="Interval"><Input value={d.interval} onChange={(e) => setD({ ...d, interval: e.target.value })} /></Field>
        <Field label="Team limit (blank = unlimited)"><Input type="number" value={d.team_limit ?? ""} onChange={(e) => setD({ ...d, team_limit: e.target.value ? Number(e.target.value) : null })} /></Field>
        <Field label="Stripe price ID"><Input value={d.stripe_price_id ?? ""} onChange={(e) => setD({ ...d, stripe_price_id: e.target.value })} /></Field>
        <Field label="Description"><Input value={d.description ?? ""} onChange={(e) => setD({ ...d, description: e.target.value })} /></Field>
        <div className="flex items-end gap-2">
          <Switch checked={d.is_active} onCheckedChange={(v) => setD({ ...d, is_active: v })} />
          <Label>Active</Label>
        </div>
      </CardContent>
    </Card>
  );
}

type Slot = {
  id: string;
  slot: number;
  label: string | null;
  provider: string | null;
  is_enabled: boolean;
  config: Record<string, unknown>;
};

function MethodsPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-methods"],
    queryFn: async () => {
      const { data } = await supabase.from("payment_method_slots").select("*").order("slot");
      return (data ?? []) as Slot[];
    },
  });

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Three placeholder slots. Fill them later with any provider (PayPal, Flutterwave, mobile money, etc.).</p>
      {(data ?? []).map((s) => <SlotEditor key={s.id} slot={s} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-methods"] })} />)}
    </div>
  );
}

function SlotEditor({ slot, onSaved }: { slot: Slot; onSaved: () => void }) {
  const [d, setD] = useState(slot);
  const [configText, setConfigText] = useState(JSON.stringify(slot.config ?? {}, null, 2));
  async function save() {
    let cfg: unknown = {};
    try { cfg = configText ? JSON.parse(configText) : {}; } catch { toast.error("Config must be valid JSON"); return; }
    const { error } = await supabase
      .from("payment_method_slots")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ label: d.label, provider: d.provider, is_enabled: d.is_enabled, config: cfg as any })
      .eq("id", slot.id);
    if (error) toast.error(error.message);
    else { toast.success("Saved"); onSaved(); }
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Slot {slot.slot}</CardTitle>
        <Button size="sm" onClick={save}><Save className="mr-1 h-3 w-3" />Save</Button>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Field label="Label"><Input value={d.label ?? ""} onChange={(e) => setD({ ...d, label: e.target.value })} /></Field>
        <Field label="Provider key"><Input value={d.provider ?? ""} onChange={(e) => setD({ ...d, provider: e.target.value })} /></Field>
        <Field label="Config (JSON)"><Textarea rows={4} value={configText} onChange={(e) => setConfigText(e.target.value)} /></Field>
        <div className="flex items-end gap-2">
          <Switch checked={d.is_enabled} onCheckedChange={(v) => setD({ ...d, is_enabled: v })} />
          <Label>Enabled</Label>
        </div>
      </CardContent>
    </Card>
  );
}

function LedgerPanel() {
  const { data } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data } = await supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(200);
      return data ?? [];
    },
  });
  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left text-xs uppercase text-muted-foreground">
              <th className="p-3">When</th>
              <th className="p-3">User</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Provider</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-3 text-xs">{new Date(p.created_at).toLocaleString()}</td>
                <td className="p-3 text-xs">{p.user_id?.slice(0, 8) ?? "—"}</td>
                <td className="p-3">{p.plan_slug ?? "—"}</td>
                <td className="p-3">{(p.amount_cents / 100).toFixed(2)} {p.currency.toUpperCase()}</td>
                <td className="p-3">{p.provider}</td>
                <td className="p-3"><Badge variant="outline">{p.status}</Badge></td>
              </tr>
            ))}
            {(data ?? []).length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">No transactions yet.</td></tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
