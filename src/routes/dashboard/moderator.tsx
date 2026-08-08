import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Camera,
  ClipboardList,
  GalleryVerticalEnd,
  Megaphone,
  Monitor,
  Radio,
  ShieldAlert,
  Siren,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { SiteAdSlot } from '@/components/SiteAdSlot';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const Route = createFileRoute('/dashboard/moderator')({
  component: ModeratorDashboard,
});

const modules = [
  { title: 'Match Events', href: '/dashboard/moderator/events', icon: ClipboardList, desc: 'Record goals, cards, substitutions, injuries and timeline events.' },
  { title: 'VAR Center', href: '/dashboard/moderator/var', icon: ShieldAlert, desc: 'Start reviews, record checks, decisions and replay references.' },
  { title: 'Graphics', href: '/dashboard/moderator/graphics', icon: GalleryVerticalEnd, desc: 'Trigger scoreboards, goals, cards, substitutions and sponsor graphics.' },
  { title: 'Replay', href: '/dashboard/moderator/replay', icon: Video, desc: 'Queue replays, mark clips, export highlights and manage angles.' },
  { title: 'Announcements', href: '/dashboard/moderator/announcements', icon: Megaphone, desc: 'Send normal, important and critical match announcements.' },
  { title: 'Statistics', href: '/dashboard/moderator/statistics', icon: BarChart3, desc: 'Monitor shots, corners, cards, possession, xG and match trends.' },
  { title: 'Cameras', href: '/dashboard/moderator/cameras', icon: Camera, desc: 'View connected feeds, camera health and replay sources.' },
  { title: 'Broadcast', href: '/dashboard/moderator/broadcast', icon: Radio, desc: 'Monitor overlays, stream health, audio, latency and emergency controls.' },
];

const eventButtons = [
  'Goal',
  'Penalty',
  'Yellow Card',
  'Red Card',
  'Second Yellow',
  'Corner',
  'Free Kick',
  'Offside',
  'Foul',
  'Injury',
  'Substitution',
  'VAR Check',
  'VAR Decision',
  'Kickoff',
  'Half Time',
  'Full Time',
  'Custom Note',
];

const varButtons = [
  'Start VAR Review',
  'Offside Check',
  'Penalty Check',
  'Red Card Review',
  'Mistaken Identity',
  'Possible Goal',
  'Handball',
  'Goal Confirmed',
  'Goal Cancelled',
  'Penalty Awarded',
  'Penalty Cancelled',
  'Red Card',
  'Yellow Card',
  'Play On',
  'Review Complete',
];

const graphicsButtons = [
  'Goal',
  'Player Intro',
  'Lineups',
  'Formation',
  'Possession',
  'Cards',
  'Substitution',
  'Sponsor',
  'VAR',
  'Statistics',
  'Half Time',
  'Full Time',
  'Announcement',
  'Countdown',
];

function ModeratorDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const pathname = location.pathname.replace(/\/$/, '');
  const qc = useQueryClient();

  if (pathname !== '/dashboard/moderator') {
    return (
      <RoleGuard allow="moderator" requireApproved={false}>
        <Outlet />
      </RoleGuard>
    );
  }

  const { data: assignments } = useQuery({
    queryKey: ['moderator-assignments', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_assignments')
        .select('*')
        .eq('user_id', user!.id)
        .eq('role', 'moderator')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: activity } = useQuery({
    queryKey: ['moderator-activity', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_operations')
        .select('*')
        .eq('user_id', user!.id)
        .eq('role', 'moderator')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data ?? [];
    },
  });

  const logAction = useMutation({
    mutationFn: async ({
      action_type,
      payload,
    }: {
      action_type: string;
      payload: Record<string, unknown>;
    }) => {
      if (!user) throw new Error('You must be signed in');

      const { error } = await supabase.from('match_operations').insert({
        user_id: user.id,
        role: 'moderator',
        action_type,
        payload,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Action recorded');
      qc.invalidateQueries({ queryKey: ['moderator-activity'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not record action'),
  });

  function record(action_type: string, payload: Record<string, unknown> = {}) {
    logAction.mutate({
      action_type,
      payload: {
        ...payload,
        timestamp: new Date().toISOString(),
      },
    });
  }

  return (
    <RoleGuard allow="moderator" requireApproved={false}>
      <div className="space-y-6">
        <SiteAdSlot placement="moving_text" pageGroup="role_dashboards" />
        <SiteAdSlot placement="top" pageGroup="role_dashboards" />

        <div>
          <h1 className="text-2xl font-bold">Moderator Match Operations Hub</h1>
          <p className="text-muted-foreground">
            Control live match events, scoreboard, VAR, replay, graphics, announcements and broadcast safety.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Assigned Matches" value={assignments?.length ?? 0} />
          <Metric label="Match Status" value="Scheduled" />
          <Metric label="Stream Status" value="Pending" />
          <Metric label="Broadcast Engine" value="Ready" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Siren className="h-5 w-5 text-destructive" />
              Match Control
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => record('match_start')}>Start Match</Button>
            <Button variant="outline" onClick={() => record('match_pause')}>Pause Match</Button>
            <Button variant="outline" onClick={() => record('match_resume')}>Resume</Button>
            <Button variant="destructive" onClick={() => record('match_end')}>End Match</Button>
            <Button variant="destructive" onClick={() => record('emergency_stop_broadcast')}>
              Emergency Stop Broadcast
            </Button>
          </CardContent>
        </Card>

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

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <main className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Scoreboard</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-center md:grid-cols-3">
                <ScoreBox team="Home Team" />
                <div className="flex items-center justify-center text-2xl font-bold">VS</div>
                <ScoreBox team="Away Team" />
              </CardContent>
            </Card>

            <Panel title="Match Event Panel" items={eventButtons} onClick={(item) => record('match_event', { event: item })} />
            <Panel title="VAR Operations Center" items={varButtons} onClick={(item) => record('var_action', { action: item })} />
            <Panel title="Broadcast Graphics Engine" items={graphicsButtons} onClick={(item) => record('broadcast_graphic', { graphic: item })} />

            <Card>
              <CardHeader>
                <CardTitle>Custom Match Note</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    record('custom_note', {
                      team: fd.get('team'),
                      player: fd.get('player'),
                      minute: fd.get('minute'),
                      description: fd.get('description'),
                    });
                    e.currentTarget.reset();
                  }}
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field name="team" label="Team" />
                    <Field name="player" label="Player" />
                    <Field name="minute" label="Minute" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea name="description" rows={4} />
                  </div>
                  <Button>Save note</Button>
                </form>
              </CardContent>
            </Card>
          </main>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-primary" />
                  Broadcast Monitor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Current graphics: none</p>
                <p>Current replay: none</p>
                <p>Audio levels: normal</p>
                <p>Latency: normal</p>
                <p>Connection health: pending</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Incident Queue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {['VAR', 'AI Flag', 'Player Injury', 'Connection Loss', 'Graphics Error', 'Replay Ready'].map((item) => (
                  <Button key={item} variant="outline" size="sm" onClick={() => record('incident_queue', { incident: item })}>
                    {item}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(activity ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                ) : (
                  activity!.map((item: any) => (
                    <div key={item.id} className="rounded-md border p-3">
                      <p className="font-medium">{item.action_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </aside>
        </div>

        <SiteAdSlot placement="bottom" pageGroup="role_dashboards" />
        <SiteAdSlot placement="popup" pageGroup="role_dashboards" />
        <SiteAdSlot placement="slide_in" pageGroup="role_dashboards" />
      </div>
    </RoleGuard>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function ScoreBox({ team }: { team: string }) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-lg font-bold">{team}</p>
      <p className="text-5xl font-black">0</p>
      <div className="mt-3 flex justify-center gap-2">
        <Button size="sm">+ Goal</Button>
        <Button size="sm" variant="outline">- Goal</Button>
      </div>
    </div>
  );
}

function Panel({
  title,
  items,
  onClick,
}: {
  title: string;
  items: string[];
  onClick: (item: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Button key={item} variant="outline" size="sm" onClick={() => onClick(item)}>
            {item}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, ...inputProps } = props;
  return (
    <div>
      <Label>{label}</Label>
      <Input {...inputProps} />
    </div>
  );
}
