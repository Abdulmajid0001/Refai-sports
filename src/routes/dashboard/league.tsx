import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  ClipboardList,
  Landmark,
  PlusCircle,
  Radio,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { InviteManager } from '@/components/onboarding/InviteManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SiteAdSlot } from '@/components/SiteAdSlot';

export const Route = createFileRoute('/dashboard/league')({
  component: LeagueDashboard,
});

const modules = [
  {
    title: 'Overview',
    href: '/dashboard/league',
    icon: Trophy,
    desc: 'View league summary, approval status, live matches and key activity.',
  },
  {
    title: 'Teams',
    href: '/dashboard/league/teams',
    icon: Users,
    desc: 'Review team registrations, approve teams, reject teams and manage team records.',
  },
  {
    title: 'Matches',
    href: '/dashboard/league/matches',
    icon: CalendarDays,
    desc: 'Manage fixtures, schedules, standings, brackets and match records.',
  },
  {
    title: 'Wallet',
    href: '/dashboard/league/wallet',
    icon: Wallet,
    desc: 'Track payments, taxes, settlements, refunds, fines and wallet ledger activity.',
  },
  {
    title: 'Moderators',
    href: '/dashboard/league/moderators',
    icon: ShieldCheck,
    desc: 'Create moderators, assign permissions and prepare live match control roles.',
  },
  {
    title: 'Broadcast',
    href: '/dashboard/league/broadcast',
    icon: Radio,
    desc: 'Manage cameras, commentators, overlays, graphics, replay assets and stream setup.',
  },
  {
    title: 'Rules',
    href: '/dashboard/league/rules',
    icon: ClipboardList,
    desc: 'Upload or edit league rules, match rules, player eligibility and suspension logic.',
  },
  {
    title: 'Settings',
    href: '/dashboard/league/settings',
    icon: Settings,
    desc: 'Edit branding, venues, automation, AI preferences, subscription and safe settings.',
  },
];

function LeagueDashboard() {
  const { user } = useAuth();
  const location = useLocation();

  const pathname = location.pathname.replace(/\/$/, '');

  if (pathname !== '/dashboard/league') {
    return (
      <RoleGuard allow="league_owner" requireApproved={false}>
        <Outlet />
      </RoleGuard>
    );
  }

  const { data: leagues, isLoading } = useQuery({
    queryKey: ['league-registrations', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_registrations')
        .select('*')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const primaryLeague = leagues?.[0] as any | undefined;

  return (
    <RoleGuard allow="league_owner" requireApproved={false}>
      <div className="space-y-6">
        <SiteAdSlot placement="moving_text" pageGroup="role_dashboards" />
        <SiteAdSlot placement="top" pageGroup="role_dashboards" />
        
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">League Owner Dashboard</h1>
            <p className="text-muted-foreground">
              Register leagues, manage teams, wallets, broadcasts, moderators, rules, branding and automation.
            </p>
          </div>

          <Button asChild>
            <a href="/dashboard/league/register">
              <PlusCircle className="mr-2 h-4 w-4" />
              Register new league
            </a>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <a key={module.title} href={module.href} className="block">
                <Card className="h-full cursor-pointer transition hover:border-primary hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-4 w-4 text-primary" />
                      {module.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted-foreground">{module.desc}</p>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
        
        <SiteAdSlot placement="middle" pageGroup="role_dashboards" />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              My Leagues
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading your leagues...</p>
            ) : (leagues ?? []).length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  No league yet. Use the button above to register your first league.
                </p>

                <Button asChild>
                  <a href="/dashboard/league/register">Register new league</a>
                </Button>
              </div>
            ) : (
              leagues!.map((league: any) => (
                <div
                  key={league.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                >
                  <Link
                    to="/dashboard/league/$leagueId"
                    params={{ leagueId: league.id }}
                    className="block hover:text-primary"
                  >
                    <div className="font-medium">{league.league_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {league.sport_type} / {league.competition_type}
                    </div>
                  </Link>

                  <span className="rounded bg-muted px-2 py-1 text-xs capitalize">
                    {String(league.status ?? 'draft').replace(/_/g, ' ')}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <InviteManager leagueId={primaryLeague?.id ?? null} />

        <SiteAdSlot placement="bottom" pageGroup="role_dashboards" />
        <SiteAdSlot placement="popup" pageGroup="role_dashboards" />
        <SiteAdSlot placement="slide_in" pageGroup="role_dashboards" />
      
      </div>
    </RoleGuard>
  );
}
