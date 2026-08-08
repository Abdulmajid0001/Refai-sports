import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  GalleryVerticalEnd,
  LineChart,
  Save,
  Shirt,
  Users,
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

export const Route = createFileRoute('/dashboard/coach')({
  component: CoachDashboard,
});

const modules = [
  {
    title: 'Squad',
    href: '/dashboard/coach/squad',
    icon: Users,
    desc: 'View players, positions, availability, injuries, cards and eligibility.',
  },
  {
    title: 'Formations',
    href: '/dashboard/coach/formations',
    icon: GalleryVerticalEnd,
    desc: 'Build 11-aside, 7-aside, 5-aside and custom tactical formations.',
  },
  {
    title: 'Tactics',
    href: '/dashboard/coach/tactics',
    icon: ClipboardList,
    desc: 'Prepare match plans, pressing triggers, team instructions and notes.',
  },
  {
    title: 'Lineups',
    href: '/dashboard/coach/lineups',
    icon: Shirt,
    desc: 'Prepare lineup drafts for team owner approval and match submission.',
  },
  {
    title: 'Training',
    href: '/dashboard/coach/training',
    icon: Dumbbell,
    desc: 'Plan sessions, drills, conditioning, recovery and match preparation.',
  },
  {
    title: 'Matches',
    href: '/dashboard/coach/matches',
    icon: CalendarDays,
    desc: 'Review upcoming fixtures, opponents, scouting notes and match reports.',
  },
  {
    title: 'Performance',
    href: '/dashboard/coach/performance',
    icon: LineChart,
    desc: 'Review goals, assists, cards, player minutes, xG, heatmaps and trends.',
  },
  {
    title: 'Medical',
    href: '/dashboard/coach/medical',
    icon: Activity,
    desc: 'Track injuries, return dates, fatigue, fitness and player readiness.',
  },
];

function CoachDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const pathname = location.pathname.replace(/\/$/, '');
  const qc = useQueryClient();

  if (pathname !== '/dashboard/coach') {
    return (
      <RoleGuard allow="coach" requireApproved={false}>
        <Outlet />
      </RoleGuard>
    );
  }

  const { data: profile } = useQuery({
    queryKey: ['coach-profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ['coach-match-assignments', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_assignments')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: tacticalNotes } = useQuery({
    queryKey: ['coach-tactical-notes', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_operations')
        .select('*')
        .eq('user_id', user!.id)
        .eq('role', 'coach')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data ?? [];
    },
  });

  const saveCoachAction = useMutation({
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
        role: 'coach',
        action_type,
        payload,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Saved');
      qc.invalidateQueries({ queryKey: ['coach-tactical-notes'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save'),
  });

  return (
    <RoleGuard allow="coach" requireApproved={false}>
      <div className="space-y-6">
        <SiteAdSlot placement="moving_text" pageGroup="role_dashboards" />
        <SiteAdSlot placement="top" pageGroup="role_dashboards" />

        <div>
          <h1 className="text-2xl font-bold">Coach Dashboard</h1>
          <p className="text-muted-foreground">
            Manage squad preparation, formations, tactics, training plans, lineup drafts and performance review.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Coach" value={profile?.display_name || profile?.email || 'Coach'} />
          <Metric label="Assignments" value={assignments?.length ?? 0} />
          <Metric label="Saved Notes" value={tacticalNotes?.length ?? 0} />
          <Metric label="Status" value={profile?.account_status || 'pending'} />
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

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <Card>
            <CardHeader>
              <CardTitle>Quick Tactical Plan</CardTitle>
            </CardHeader>

            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);

                  saveCoachAction.mutate({
                    action_type: 'tactical_plan',
                    payload: {
                      title: String(fd.get('title') || '').trim(),
                      formation: String(fd.get('formation') || '').trim(),
                      match_plan: String(fd.get('match_plan') || '').trim(),
                      pressing_plan: String(fd.get('pressing_plan') || '').trim(),
                      set_pieces: String(fd.get('set_pieces') || '').trim(),
                      notes: String(fd.get('notes') || '').trim(),
                    },
                  });

                  e.currentTarget.reset();
                }}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Field name="title" label="Plan Title" required />
                  <Field name="formation" label="Formation" placeholder="4-3-3, 4-4-2, 2-1-1..." required />
                </div>

                <div>
                  <Label>Match Plan</Label>
                  <Textarea name="match_plan" rows={4} placeholder="How should the team play?" />
                </div>

                <div>
                  <Label>Pressing Plan</Label>
                  <Textarea name="pressing_plan" rows={3} placeholder="Pressing triggers, defensive shape, transition plan..." />
                </div>

                <div>
                  <Label>Set Pieces</Label>
                  <Textarea name="set_pieces" rows={3} placeholder="Corners, free kicks, penalties, throw-ins..." />
                </div>

                <div>
                  <Label>Private Coach Notes</Label>
                  <Textarea name="notes" rows={3} placeholder="Player reminders, opponent weakness, substitution plan..." />
                </div>

                <Button disabled={saveCoachAction.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Save tactical plan
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Coach Permissions</CardTitle>
              </CardHeader>

              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Can view squad and player readiness.</p>
                <p>Can prepare tactics and formations.</p>
                <p>Can draft lineups and notes.</p>
                <p>Cannot approve leagues, payments, ads or user roles.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Tactical Notes</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {(tacticalNotes ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tactical notes saved yet.</p>
                ) : (
                  tacticalNotes!.map((note: any) => (
                    <div key={note.id} className="rounded-md border p-3">
                      <p className="font-medium">{note.payload?.title || note.action_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
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

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, ...inputProps } = props;

  return (
    <div>
      <Label>{label}</Label>
      <Input {...inputProps} />
    </div>
  );
}
