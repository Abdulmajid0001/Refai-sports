import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Trophy, Megaphone, CreditCard, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

function AdminOverview() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [pending, leagues, teams, ads, payments] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "pending"),
        supabase.from("leagues").select("id", { count: "exact", head: true }),
        supabase.from("teams").select("id", { count: "exact", head: true }),
        supabase.from("ads").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("payments").select("id", { count: "exact", head: true }),
      ]);
      return {
        pending: pending.count ?? 0,
        leagues: leagues.count ?? 0,
        teams: teams.count ?? 0,
        ads: ads.count ?? 0,
        payments: payments.count ?? 0,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Control center</h1>
        <p className="text-sm text-muted-foreground">Approve sign-ups, moderate content, schedule ads, manage plans.</p>
      </div>

      {data && data.pending > 0 && (
        <Link to="/admin/users" className="block">
          <Card className="border-amber-500/40 bg-amber-500/5 transition-colors hover:bg-amber-500/10">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div className="flex-1 text-sm">
                <strong>{data.pending}</strong> sign-up{data.pending === 1 ? "" : "s"} waiting for your review.
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Users className="h-4 w-4" />} label="Pending users" value={data?.pending} />
        <Stat icon={<Trophy className="h-4 w-4" />} label="Leagues" value={data?.leagues} />
        <Stat icon={<Trophy className="h-4 w-4" />} label="Teams" value={data?.teams} />
        <Stat icon={<Megaphone className="h-4 w-4" />} label="Active ads" value={data?.ads} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {data?.payments ?? 0} transaction{data?.payments === 1 ? "" : "s"} on record.
          <Link to="/admin/payments" className="ml-2 text-primary underline">Open ledger →</Link>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number | undefined }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        {icon}
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value ?? "—"}</div>
      </CardContent>
    </Card>
  );
}
