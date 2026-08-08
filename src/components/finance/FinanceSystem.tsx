import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Wallet, CreditCard, DollarSign, TrendingUp, TrendingDown,
  Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw,
  ArrowUpRight, ArrowDownLeft, FileText, Download, Filter,
  Calendar, PieChart, BarChart3, Shield, Zap
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  category: string;
  status: "completed" | "pending" | "failed";
  timestamp: Date;
  reference?: string;
}

interface Subscription {
  id: string;
  plan: "free" | "pro" | "enterprise";
  status: "active" | "past_due" | "canceled" | "trialing";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  amount: number;
  interval: "month" | "year";
}

interface WalletBalance {
  available: number;
  pending: number;
  total: number;
  currency: string;
}

interface Payout {
  id: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed";
  method: "bank_transfer" | "paypal" | "stripe";
  createdAt: Date;
  processedAt?: Date;
  reference?: string;
}

interface FinanceSystemProps {
  leagueId: string;
}

const PLAN_FEATURES = {
  free: { leagues: 1, matches: 10, storage: "1GB", support: "Community" },
  pro: { leagues: 5, matches: 100, storage: "50GB", support: "Priority" },
  enterprise: { leagues: -1, matches: -1, storage: "Unlimited", support: "Dedicated" },
};

const PLAN_PRICES = {
  free: 0,
  pro: 49,
  enterprise: 299,
};

export function FinanceSystem({ leagueId }: FinanceSystemProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [wallet, setWallet] = useState<WalletBalance>({
    available: 0,
    pending: 0,
    total: 0,
    currency: "USD",
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "payouts" | "subscription">("overview");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<Payout["method"]>("bank_transfer");

  // Load finance data
  const loadFinanceData = useCallback(async () => {
    setIsLoading(true);

    // Load wallet
    const { data: walletData } = await supabase
      .from("league_wallets")
      .select("*")
      .eq("league_id", leagueId)
      .single();

    if (walletData) {
      setWallet({
        available: walletData.available_balance || 0,
        pending: walletData.pending_balance || 0,
        total: (walletData.available_balance || 0) + (walletData.pending_balance || 0),
        currency: walletData.currency || "USD",
      });
    }

    // Load transactions
    const { data: txData } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("league_id", leagueId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (txData) {
      setTransactions(
        txData.map((tx: any) => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          category: tx.category,
          status: tx.status,
          timestamp: new Date(tx.created_at),
          reference: tx.reference,
        }))
      );
    }

    // Load subscription
    const { data: subData } = await supabase
      .from("league_subscriptions")
      .select("*")
      .eq("league_id", leagueId)
      .eq("status", "active")
      .single();

    if (subData) {
      setSubscription({
        id: subData.id,
        plan: subData.plan,
        status: subData.status,
        currentPeriodStart: new Date(subData.current_period_start),
        currentPeriodEnd: new Date(subData.current_period_end),
        amount: subData.amount,
        interval: subData.interval,
      });
    }

    // Load payouts
    const { data: payoutData } = await supabase
      .from("league_payouts")
      .select("*")
      .eq("league_id", leagueId)
      .order("created_at", { ascending: false });

    if (payoutData) {
      setPayouts(
        payoutData.map((p: any) => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          method: p.method,
          createdAt: new Date(p.created_at),
          processedAt: p.processed_at ? new Date(p.processed_at) : undefined,
          reference: p.reference,
        }))
      );
    }

    setIsLoading(false);
  }, [leagueId]);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  // Request payout
  const requestPayout = useCallback(async () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    if (amount > wallet.available) {
      toast.error("Insufficient available balance");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.from("league_payouts").insert({
      league_id: leagueId,
      amount,
      method: payoutMethod,
      status: "pending",
      requested_by: user?.id,
    });

    if (error) {
      toast.error("Failed to request payout");
    } else {
      toast.success("Payout requested successfully");
      setPayoutAmount("");
      loadFinanceData();
    }

    setIsLoading(false);
  }, [leagueId, payoutAmount, payoutMethod, wallet.available, user?.id, loadFinanceData]);

  // Upgrade subscription
  const upgradeSubscription = useCallback(async (plan: "pro" | "enterprise") => {
    setIsLoading(true);

    const amount = PLAN_PRICES[plan];

    const { error } = await supabase.from("league_subscriptions").upsert({
      league_id: leagueId,
      plan,
      status: "active",
      amount,
      interval: "month",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_by: user?.id,
    });

    if (error) {
      toast.error("Failed to upgrade subscription");
    } else {
      toast.success(`Upgraded to ${plan.toUpperCase()} plan`);
      loadFinanceData();
    }

    setIsLoading(false);
  }, [leagueId, user?.id, loadFinanceData]);

  // Export transactions
  const exportTransactions = useCallback(() => {
    const csv = [
      "Date,Type,Amount,Category,Description,Status",
      ...transactions.map(
        (tx) =>
          `${tx.timestamp.toISOString()},${tx.type},${tx.amount},${tx.category},"${tx.description}",${tx.status}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${leagueId}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Transactions exported");
  }, [transactions, leagueId]);

  const getStatusIcon = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-cyan-900/50 bg-slate-950/90">
        <CardHeader className="py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-cyan-400" />
              Finance Center
            </CardTitle>
            <div className="flex gap-1">
              {(["overview", "transactions", "payouts", "subscription"] as const).map((tab) => (
                <Button
                  key={tab}
                  size="sm"
                  variant={activeTab === tab ? "default" : "ghost"}
                  onClick={() => setActiveTab(tab)}
                  className="text-xs capitalize"
                >
                  {tab}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <>
              {/* Wallet Balance */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Available</div>
                  <div className="text-2xl font-bold text-green-400">
                    ${wallet.available.toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Pending</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    ${wallet.pending.toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Total</div>
                  <div className="text-2xl font-bold text-white">
                    ${wallet.total.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <Input
                    type="number"
                    placeholder="Payout amount"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="mb-2"
                  />
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value as Payout["method"])}
                    className="w-full mb-2 px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
                    <option value="stripe">Stripe</option>
                  </select>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={requestPayout}
                    disabled={isLoading || !payoutAmount}
                  >
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    Request Payout
                  </Button>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 mb-2">Current Plan</div>
                  {subscription ? (
                    <>
                      <div className="text-lg font-bold text-white capitalize mb-1">
                        {subscription.plan}
                      </div>
                      <div className="text-xs text-slate-400">
                        ${subscription.amount}/{subscription.interval}
                      </div>
                      <Badge
                        variant={
                          subscription.status === "active" ? "default" : "destructive"
                        }
                        className="mt-2"
                      >
                        {subscription.status}
                      </Badge>
                    </>
                  ) : (
                    <div className="text-sm text-slate-400">No active subscription</div>
                  )}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Recent Activity</span>
                  <Button size="sm" variant="ghost" className="text-[10px]" onClick={() => setActiveTab("transactions")}>
                    View All
                  </Button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2 bg-slate-800/50 rounded text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {tx.type === "credit" ? (
                          <ArrowDownLeft className="h-3 w-3 text-green-400" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3 text-red-400" />
                        )}
                        <span className="text-slate-300">{tx.description}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={tx.type === "credit" ? "text-green-400" : "text-red-400"}>
                          {tx.type === "credit" ? "+" : "-"}${tx.amount.toFixed(2)}
                        </span>
                        {getStatusIcon(tx.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Transactions Tab */}
          {activeTab === "transactions" && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">{transactions.length} transactions</span>
                <Button size="sm" variant="outline" onClick={exportTransactions}>
                  <Download className="h-3 w-3 mr-1" />
                  Export CSV
                </Button>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-1.5">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded ${
                          tx.type === "credit" ? "bg-green-500/20" : "bg-red-500/20"
                        }`}
                      >
                        {tx.type === "credit" ? (
                          <ArrowDownLeft className="h-4 w-4 text-green-400" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{tx.description}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{tx.category}</span>
                          <span>•</span>
                          <span>{tx.timestamp.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          tx.type === "credit" ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {tx.type === "credit" ? "+" : "-"}${tx.amount.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        {getStatusIcon(tx.status)}
                        <span className="text-xs text-slate-400 capitalize">{tx.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Payouts Tab */}
          {activeTab === "payouts" && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Total Paid Out</div>
                  <div className="text-xl font-bold text-white">
                    ${payouts
                      .filter((p) => p.status === "completed")
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Pending Payouts</div>
                  <div className="text-xl font-bold text-yellow-400">
                    ${payouts
                      .filter((p) => p.status === "pending")
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {payouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-2 bg-slate-800/50 rounded text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-cyan-400" />
                      <span>{payout.method.replace("_", " ")}</span>
                      <span className="text-slate-400">
                        {payout.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">${payout.amount.toFixed(2)}</span>
                      <Badge
                        variant={
                          payout.status === "completed"
                            ? "default"
                            : payout.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {payout.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === "subscription" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {(["pro", "enterprise"] as const).map((plan) => (
                  <div
                    key={plan}
                    className={`p-4 rounded-lg border ${
                      subscription?.plan === plan
                        ? "border-cyan-500 bg-cyan-950/30"
                        : "border-slate-700 bg-slate-800/50"
                    }`}
                  >
                    <div className="text-lg font-bold text-white capitalize mb-1">{plan}</div>
                    <div className="text-2xl font-bold text-white mb-2">
                      ${PLAN_PRICES[plan]}
                      <span className="text-sm text-slate-400">/mo</span>
                    </div>
                    <div className="space-y-1 text-xs text-slate-400 mb-3">
                      <div>Leagues: {PLAN_FEATURES[plan].leagues === -1 ? "Unlimited" : PLAN_FEATURES[plan].leagues}</div>
                      <div>Matches: {PLAN_FEATURES[plan].matches === -1 ? "Unlimited" : PLAN_FEATURES[plan].matches}</div>
                      <div>Storage: {PLAN_FEATURES[plan].storage}</div>
                      <div>Support: {PLAN_FEATURES[plan].support}</div>
                    </div>
                    {subscription?.plan === plan ? (
                      <Badge variant="default" className="w-full justify-center">Current Plan</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => upgradeSubscription(plan)}
                        disabled={isLoading}
                      >
                        Upgrade
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {subscription && (
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Current Subscription</span>
                    <Badge variant={subscription.status === "active" ? "default" : "destructive"}>
                      {subscription.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Period Start:</span>
                      <span className="ml-2 text-white">{subscription.currentPeriodStart.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Period End:</span>
                      <span className="ml-2 text-white">{subscription.currentPeriodEnd.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
