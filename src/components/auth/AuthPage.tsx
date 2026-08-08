import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  Building2,
  Camera,
  Headphones,
  Megaphone,
  Shield,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import {
  dashboardForRole,
  inviteOnlyRoles,
  publicSignupRoles,
  roleLabels,
  type UserRole,
} from '@/lib/roles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const roleCards = [
  {
    role: 'league_owner',
    icon: Trophy,
    title: 'League Owner',
    subtitle: 'Create and operate leagues, competitions, teams, payments and broadcasts.',
    features: ['Register leagues', 'Manage teams', 'Create fixtures', 'Assign moderators', 'Control league wallet'],
    button: 'Continue as League Owner',
  },
  {
    role: 'team_owner',
    icon: Building2,
    title: 'Team Owner',
    subtitle: 'Register your team, manage players, staff, jerseys, formations and match lineups.',
    features: ['Register team', 'Manage players', 'Upload jerseys', 'Build formations', 'Submit lineups'],
    button: 'Continue as Team Owner',
  },
  {
    role: 'coach',
    icon: Users,
    title: 'Coach',
    subtitle: 'Manage squad tactics, formations, tactical notes and match preparation.',
    features: ['View squad', 'Edit tactics', 'Build formations', 'Prepare lineup', 'Review player data'],
    button: 'Continue as Coach',
  },
  {
    role: 'moderator',
    icon: Shield,
    title: 'Moderator',
    subtitle: 'Operate live match control, score updates, VAR, graphics, replays and announcements.',
    features: ['Control live match', 'Update scoreboard', 'Operate VAR', 'Trigger graphics', 'Manage replay markers'],
    button: 'Continue as Moderator',
    inviteOnly: true,
  },
  {
    role: 'camera_operator',
    icon: Camera,
    title: 'Camera Operator',
    subtitle: 'Capture every moment with professional broadcast controls.',
    features: ['Live camera streaming', 'Replay markers', 'PTZ camera controls', 'OBS & RTMP integration', 'Multi-camera assignments'],
    button: 'Continue as Camera Operator',
    inviteOnly: true,
  },
  {
    role: 'commentator',
    icon: Headphones,
    title: 'Commentator',
    subtitle: 'Deliver live match commentary with AI-assisted insights.',
    features: ['Live commentary editor', 'Speech-to-text', 'AI commentary assistant', 'Live statistics', 'Match notes'],
    button: 'Continue as Commentator',
    inviteOnly: true,
  },
  {
    role: 'viewer',
    icon: UserRound,
    title: 'Viewer / Fan',
    subtitle: 'Watch matches, interact with your favorite teams, and enjoy the full fan experience.',
    features: ['Live streaming', 'Predictions', 'Fan chat', 'Highlights', 'Team following', 'Notifications'],
    button: 'Join as Fan',
  },
  {
    role: 'sponsor',
    icon: Megaphone,
    title: 'Sponsor / Advertiser',
    subtitle: 'Promote your brand during live broadcasts and competitions with advanced campaign management.',
    features: ['Campaign manager', 'Broadcast advertising', 'Analytics dashboard', 'Replay sponsorship', 'Billing & invoices'],
    button: 'Continue as Sponsor',
  },
] as const;

export function AuthPage() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    inviteToken: '',
  });

  const selectedCard = useMemo(
    () => roleCards.find((card) => card.role === selectedRole),
    [selectedRole],
  );

  const inviteOnly = selectedRole ? inviteOnlyRoles.includes(selectedRole) : false;
  const publicRole = selectedRole ? publicSignupRoles.includes(selectedRole) : false;

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (mode === 'signup' && !selectedRole) {
      toast.error('Choose a role first');
      return;
    }

    if (mode === 'signup' && selectedRole === 'super_admin') {
      toast.error('Super Admin accounts are created internally only');
      return;
    }

    if (mode === 'signup' && selectedRole && inviteOnlyRoles.includes(selectedRole) && !form.inviteToken.trim()) {
      toast.error('This role requires a secure invite token');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });

        if (error) throw error;

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profile?.role) {
          toast.error('Account profile not found. Contact support.');
          return;
        }

        navigate({ to: dashboardForRole(profile.role) as never });
        return;
      }

      const displayName = `${form.firstName} ${form.lastName}`.trim();

      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            display_name: displayName,
            phone: form.phone.trim(),
            role: selectedRole,
            invite_token: form.inviteToken.trim() || null,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Signup did not return a user');

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        display_name: displayName,
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: selectedRole,
        account_status: selectedRole === 'viewer' ? 'approved' : 'pending_verification',
        mfa_enabled: false,
      });

      if (profileError) throw profileError;

      if (!data.session) {
        toast.success('Account created. Please confirm your email, then sign in.');
        setMode('signin');
        return;
      }

      toast.success('Account created. Continue onboarding.');
      navigate({ to: dashboardForRole(selectedRole!) as never });
    } catch (err: any) {
      console.error('Auth error:', err);

      const message =
        err?.message ||
        err?.error_description ||
        err?.error ||
        'Authentication failed';

      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <h1 className="text-3xl font-bold tracking-tight">Choose Your Role</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Select what you are registering for. RefAI creates the correct account type and sends you to the right onboarding dashboard.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_420px]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {roleCards.map((card) => {
            const Icon = card.icon;
            const locked = inviteOnlyRoles.includes(card.role);

            return (
              <button
                type="button"
                key={card.role}
                onClick={() => setSelectedRole(card.role)}
                className={
                  'rounded-lg border bg-card p-5 text-left transition hover:border-primary ' +
                  (selectedRole === card.role ? 'border-primary ring-2 ring-primary/20' : '')
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <Icon className="h-6 w-6 text-primary" />
                  {locked && (
                    <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                      Invite
                    </span>
                  )}
                </div>

                <h2 className="mt-4 font-semibold">{card.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{card.subtitle}</p>

                <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
                  {card.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>

                <p className="mt-4 text-sm font-medium text-primary">{card.button}</p>
              </button>
            );
          })}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>
              {selectedCard
                ? `${mode === 'signup' ? 'Create' : 'Sign in to'} ${selectedCard.title}`
                : 'Select a role'}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {!selectedRole ? (
              <p className="text-sm text-muted-foreground">Pick a card to continue.</p>
            ) : (
              <form className="space-y-4" onSubmit={submit}>
                <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
                  <Button type="button" variant={mode === 'signup' ? 'default' : 'ghost'} onClick={() => setMode('signup')}>
                    Sign up
                  </Button>
                  <Button type="button" variant={mode === 'signin' ? 'default' : 'ghost'} onClick={() => setMode('signin')}>
                    Sign in
                  </Button>
                </div>

                {mode === 'signup' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>First name</Label>
                        <Input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required />
                      </div>

                      <div>
                        <Label>Last name</Label>
                        <Input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required />
                      </div>
                    </div>

                    <div>
                      <Label>Phone</Label>
                      <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} required />
                    </div>
                  </>
                )}

                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
                </div>

                <div>
                  <Label>Password</Label>
                  <Input type="password" minLength={8} value={form.password} onChange={(e) => update('password', e.target.value)} required />
                </div>

                {mode === 'signup' && inviteOnly && (
                  <div>
                    <Label>Invite token</Label>
                    <Input value={form.inviteToken} onChange={(e) => update('inviteToken', e.target.value)} required />
                  </div>
                )}

                {mode === 'signup' && publicRole && selectedRole !== 'viewer' && (
                  <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-900">
                    This role requires verification and approval before full tools unlock.
                  </p>
                )}

                <Button className="w-full" disabled={loading}>
                  {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
