import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  ClipboardList,
  GalleryVerticalEnd,
  ShieldAlert,
  Shirt,
  Users,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { SiteAdSlot } from '@/components/SiteAdSlot';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/dashboard/team')({
  component: TeamDashboard,
});

const modules = [
  {
    title: 'Team Profile',
    href: '/dashboard/team/profile',
    icon: Shirt,
    desc: 'Edit team identity, branding, sponsor logos, ownership and staff details.',
  },
  {
    title: 'Squad',
    href: '/dashboard/team/squad',
    icon: Users,
    desc: 'Manage players, photos, videos, eligibility and squad records.',
  },
  {
    title: 'Register Team',
    href: '/dashboard/team/register',
    icon: ClipboardList,
    desc: 'Register a team using a league invite token.',
  },
  {
    title: 'Register Player',
    href: '/dashboard/team/players/register',
    icon: Users,
    desc: 'Add new players, passport photos, body photos and player media.',
  },
  {
    title: 'Formations',
    href: '/dashboard/team/formations',
    icon: GalleryVerticalEnd,
    desc: 'Build and save tactical formations for all football formats.',
  },
  {
    title: 'Matches',
    href: '/dashboard/team/matches',
    icon: CalendarDays,
    desc: 'View fixtures, assigned matches and submit match lineups.',
  },
  {
    title: 'Media',
    href: '/dashboard/team/media',
    icon: GalleryVerticalEnd,
    desc: 'Upload lineup reveal, player intro, celebration and kit media.',
  },
];

function TeamDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const pathname = location.pathname.replace(/\/$/, '');

  if (pathname !== '/dashboard/team') {
    return (
      <RoleGuard allow="team_owner" requireApproved={false}>
        <Outlet />
      </RoleGuard>
    );
  }

  const {
    data: teams,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['team-owner-dashboard-teams', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_registrations')
        .select('*')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <RoleGuard allow="team_owner" requireApproved={false}>
      <div className="space-y-6">
        <SiteAdSlot placement="moving_text" pageGroup="role_dashboards" />
        <SiteAdSlot placement="top" pageGroup="role_dashboards" />

        <div>
          <h1 className="text-2xl font-bold">Team Owner Dashboard</h1>
          <p className="text-muted-foreground">
            Manage team registration, players, staff, jerseys, formations, media and match submissions.
          </p>
        </div>

        {isError && (
          <Card className="border-destructive">
            <CardContent className="flex gap-2 pt-6 text-sm">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              {(error as Error).message}
            </CardContent>
          </Card>
        )}

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
            <CardTitle>My Teams</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading your teams...</p>
            ) : (teams ?? []).length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  No team registered yet. Use your league invite token to register a team.
                </p>

                <Button asChild>
                  <a href="/dashboard/team/register">Register team</a>
                </Button>
              </div>
            ) : (
              teams!.map((team: any) => (
                <div
                  key={team.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{team.team_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {team.short_name || 'No short name'} / {team.owner_email}
                    </p>
                  </div>

                  <span className="rounded bg-muted px-2 py-1 text-xs capitalize">
                    {String(team.status ?? 'draft').replace(/_/g, ' ')}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <SiteAdSlot placement="bottom" pageGroup="role_dashboards" />
        <SiteAdSlot placement="popup" pageGroup="role_dashboards" />
        <SiteAdSlot placement="slide_in" pageGroup="role_dashboards" />
      </div>
    </RoleGuard>
  );
}
