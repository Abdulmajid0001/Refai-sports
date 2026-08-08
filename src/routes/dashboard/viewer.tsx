import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CalendarDays,
  Heart,
  MessageCircle,
  Play,
  Star,
  Trophy,
  UserRound,
  Vote,
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

export const Route = createFileRoute('/dashboard/viewer')({
  component: ViewerDashboard,
});

const modules = [
  { title: 'Live Matches', href: '/live', icon: Play, desc: 'Watch live matches and replay streams.' },
  { title: 'Upcoming Matches', href: '/matches', icon: CalendarDays, desc: 'See schedules, fixtures and match reminders.' },
  { title: 'Leagues', href: '/leagues', icon: Trophy, desc: 'Browse standings, fixtures, results and awards.' },
  { title: 'Following', href: '/dashboard/viewer/following', icon: Heart, desc: 'Follow favorite teams, players and leagues.' },
  { title: 'Predictions', href: '/dashboard/viewer/predictions', icon: Vote, desc: 'Predict scores, goals, cards and match outcomes.' },
  { title: 'Chat', href: '/dashboard/viewer/chat', icon: MessageCircle, desc: 'Join moderated fan conversations.' },
  { title: 'Highlights', href: '/dashboard/viewer/highlights', icon: Star, desc: 'Watch goals, replays and top moments.' },
  { title: 'Profile', href: '/dashboard/viewer/profile', icon: UserRound, desc: 'Manage fan profile, badges, watch history and alerts.' },
];

function ViewerDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const pathname = location.pathname.replace(/\/$/, '');
  const qc = useQueryClient();

  if (pathname !== '/dashboard/viewer') {
    return (
      <RoleGuard allow="viewer" requireApproved={false}>
        <Outlet />
      </RoleGuard>
    );
  }

  const { data: notifications } = useQuery({
    queryKey: ['viewer-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_notifications')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data ?? [];
    },
  });

  const saveInteraction = useMutation({
    mutationFn: async ({
      action_type,
      payload,
    }: {
      action_type: string;
      payload: Record<string, unknown>;
    }) => {
      if (!user) throw new Error('Sign in required');

      const { error } = await supabase.from('match_operations').insert({
        user_id: user.id,
        role: 'viewer',
        action_type,
        payload,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Saved');
      qc.invalidateQueries({ queryKey: ['viewer-activity'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save'),
  });

  return (
    <RoleGuard allow="viewer" requireApproved={false}>
      <div className="space-y-6">
        <SiteAdSlot placement="moving_text" pageGroup="viewer" />
        <SiteAdSlot placement="top" pageGroup="viewer" />

        <div>
          <h1 className="text-2xl font-bold">Viewer / Fan Dashboard</h1>
          <p className="text-muted-foreground">
            Watch matches, follow teams, vote, chat, predict outcomes and receive match alerts.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Metric icon={Play} label="Live Matches" value="Open" />
          <Metric icon={Heart} label="Following" value="Teams & Players" />
          <Metric icon={Vote} label="Predictions" value="Available" />
          <Metric icon={Bell} label="Notifications" value={notifications?.length ?? 0} />
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

        <SiteAdSlot placement="middle" pageGroup="viewer" />

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <main className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fan Interaction</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {['Man of the Match', 'Predict Score', 'Predict Next Goal', 'Predict Cards', 'Polls', 'Trivia'].map((item) => (
                  <Button
                    key={item}
                    variant="outline"
                    onClick={() =>
                      saveInteraction.mutate({
                        action_type: 'fan_interaction',
                        payload: { action: item, created_at: new Date().toISOString() },
                      })
                    }
                  >
                    {item}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Score Prediction</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-4 md:grid-cols-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);

                    saveInteraction.mutate({
                      action_type: 'score_prediction',
                      payload: {
                        home_score: fd.get('home_score'),
                        away_score: fd.get('away_score'),
                        note: fd.get('note'),
                      },
                    });

                    e.currentTarget.reset();
                  }}
                >
                  <Field name="home_score" label="Home Score" type="number" />
                  <Field name="away_score" label="Away Score" type="number" />
                  <Field name="note" label="Prediction Note" />
                  <Button className="md:col-span-3">Submit prediction</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Continue Watching</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Your watch history and recent matches will appear here.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Highlights</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Goals, saves, VAR reviews and top moments will appear here.
              </CardContent>
            </Card>
          </main>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(notifications ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notifications yet.</p>
                ) : (
                  notifications!.map((item: any) => (
                    <div key={item.id} className="rounded-md border p-3">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.message}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Premium Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Ad-free viewing</p>
                <p>Multi-camera access</p>
                <p>4K streaming</p>
                <p>Advanced replay</p>
                <p>AI match insights</p>
              </CardContent>
            </Card>
          </aside>
        </div>

        <SiteAdSlot placement="bottom" pageGroup="viewer" />
        <SiteAdSlot placement="popup" pageGroup="viewer" />
        <SiteAdSlot placement="slide_in" pageGroup="viewer" />
      </div>
    </RoleGuard>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Icon className="mb-2 h-5 w-5 text-primary" />
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
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
