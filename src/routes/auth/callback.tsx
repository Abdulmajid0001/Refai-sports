import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { dashboardForRole, type UserRole } from '@/lib/roles';

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    async function finishAuth() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        toast.error(error.message);
        navigate({ to: '/auth' });
        return;
      }

      if (!data.session?.user) {
        toast.error('Confirmation failed. Please sign in again.');
        navigate({ to: '/auth' });
        return;
      }

      const inviteToken = new URLSearchParams(window.location.search).get('invite');
      if (inviteToken) {
        const { error: inviteError } = await supabase.rpc('accept_staff_invitation', { p_token: inviteToken });
        if (inviteError) {
          toast.error(inviteError.message);
          navigate({ to: '/auth' });
          return;
        }
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.session.user.id)
        .maybeSingle();

      toast.success('Account confirmed successfully');

      navigate({ to: dashboardForRole(profile?.role as UserRole | undefined) as never });
    }

    finishAuth();
  }, [navigate]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-sm text-muted-foreground">Confirming your account...</p>
    </div>
  );
}
