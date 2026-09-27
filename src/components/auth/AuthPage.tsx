import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Trophy } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { dashboardForRole, type UserRole } from '@/lib/roles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AuthPage() {
  const navigate = useNavigate();
  const invitationToken = new URLSearchParams(window.location.search).get('invite')?.trim() ?? '';
  const registrationToken = new URLSearchParams(window.location.search).get('registration')?.trim() ?? '';
  const invitationMode = invitationToken.length > 0;
  const registrationMode = registrationToken.length > 0;
  const signupAllowed = invitationMode || registrationMode;
  const [mode, setMode] = useState<'signup' | 'signin'>(signupAllowed ? 'signup' : 'signin');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function acceptInvitation() {
    if (!invitationToken) return null;
    const { data, error } = await supabase.rpc('accept_staff_invitation', { p_token: invitationToken });
    if (error) throw error;
    return data?.[0]?.role as UserRole | undefined;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;

        const invitedRole = await acceptInvitation();
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();
        if (profileError) throw profileError;
        navigate({ to: dashboardForRole(invitedRole ?? profile?.role) as never });
        return;
      }

      const displayName = `${form.firstName} ${form.lastName}`.trim();
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback${invitationMode ? `?invite=${encodeURIComponent(invitationToken)}` : ''}`,
          data: {
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            display_name: displayName,
            phone: form.phone.trim(),
            role: invitationMode ? 'viewer' : 'league_owner',
            invite_token: invitationMode ? invitationToken : null,
            registration_token: registrationMode ? registrationToken : null,
          },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error('Signup did not return a user');

      if (!data.session) {
        toast.success('Account created. Confirm your email, then use the same invitation link to sign in.');
        setMode('signin');
        return;
      }

      const invitedRole = await acceptInvitation();
      toast.success(invitationMode ? 'Invitation accepted.' : 'League Owner account created. Your registration is awaiting approval.');
      navigate({ to: dashboardForRole(invitedRole ?? (invitationMode ? 'viewer' : 'league_owner')) as never });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-3xl font-bold">{invitationMode ? 'Accept League Invitation' : registrationMode ? 'Complete League Owner Sign Up' : 'Sign In'}</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            {invitationMode
              ? 'Create an account or sign in with the invited email address to receive the role and permissions assigned by the league owner.'
              : registrationMode
                ? 'Create the League Owner account connected to your payment and registration order. Platform access remains pending until payment verification and Super Admin approval.'
                : 'League Owner sign up begins with league registration, plan selection, and payment. Team owners, officials, staff, sponsors, and viewers must use a League Owner invitation.'}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_420px]">
        <Card className="h-fit">
          <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" />League Owner Registration</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Create your registration order, select a subscription, complete payment, then create your League Owner account.</p>
            {!signupAllowed && <Button type="button" variant="outline" onClick={() => { window.location.href = '/register/league'; }}>Register a league</Button>}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader><CardTitle>{invitationMode ? 'Invitation Access' : registrationMode ? 'Registration Sign Up' : 'Sign In'}</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
                <Button type="button" variant={mode === 'signup' ? 'default' : 'ghost'} disabled={!signupAllowed} onClick={() => setMode('signup')}>
                  {invitationMode ? 'Create account' : registrationMode ? 'Create account' : 'Register league'}
                </Button>
                <Button type="button" variant={mode === 'signin' ? 'default' : 'ghost'} onClick={() => setMode('signin')}>Sign in</Button>
              </div>

              {mode === 'signup' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>First name</Label><Input value={form.firstName} onChange={(event) => update('firstName', event.target.value)} required /></div>
                    <div><Label>Last name</Label><Input value={form.lastName} onChange={(event) => update('lastName', event.target.value)} required /></div>
                  </div>
                  <div><Label>Phone</Label><Input value={form.phone} onChange={(event) => update('phone', event.target.value)} required /></div>
                </>
              )}

              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required /></div>
              <div><Label>Password</Label><Input type="password" minLength={8} value={form.password} onChange={(event) => update('password', event.target.value)} required /></div>

              {invitationMode && <p className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">This link is restricted to the email address selected by the League Owner.</p>}

              <Button className="w-full" disabled={loading}>{loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
