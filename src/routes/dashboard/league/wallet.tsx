import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/dashboard/league/wallet')({
  component: LeagueWalletPage,
});

function LeagueWalletPage() {
  const { user } = useAuth();

  const { data: leagues } = useQuery({
    queryKey: ['league-owner-leagues', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_registrations')
        .select('id, league_name')
        .eq('owner_id', user!.id);

      if (error) throw error;
      return data ?? [];
    },
  });

  const leagueIds = (leagues ?? []).map((league) => league.id);

  const { data: wallets } = useQuery({
    queryKey: ['league-wallets', leagueIds],
    enabled: leagueIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_wallets')
        .select('*')
        .in('league_registration_id', leagueIds);

      if (error) throw error;
      return data ?? [];
    },
  });

  const walletIds = (wallets ?? []).map((wallet) => wallet.id);

  const { data: ledger } = useQuery({
    queryKey: ['league-wallet-ledger', walletIds],
    enabled: walletIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallet_ledger_entries')
        .select('*')
        .in('wallet_id', walletIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const balance = (wallets ?? []).reduce(
    (sum: number, wallet: any) => sum + Number(wallet.balance || 0),
    0,
  );

  return (
    <RoleGuard allow="league_owner" requireApproved={false}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Wallet</h1>
            <p className="text-muted-foreground">
              View league payments, taxes, settlements, refunds and audit ledger records.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/dashboard/league">Back to dashboard</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Balance</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              ₦{balance.toLocaleString()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wallets</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{wallets?.length ?? 0}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ledger Entries</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{ledger?.length ?? 0}</CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Immutable Ledger
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {(ledger ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No wallet activity yet.</p>
            ) : (
              ledger!.map((entry: any) => (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div>
                    <div className="font-medium">{entry.description || entry.entry_type}</div>
                    <div className="text-sm text-muted-foreground">{entry.created_at}</div>
                  </div>

                  <div className="font-semibold">
                    ₦{Number(entry.amount || 0).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
