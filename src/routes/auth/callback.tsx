import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';

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

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.session.user.id)
        .maybeSingle();

      toast.success('Account confirmed successfully');

      if (profile?.role === 'league_owner') navigate({ to: '/dashboard/league' });
      else if (profile?.role === 'team_owner') navigate({ to: '/dashboard/team' });
      else if (profile?.role === 'moderator') navigate({ to: '/dashboard/moderator' });
      else if (profile?.role === 'super_admin') navigate({ to: '/admin' });
      else navigate({ to: '/dashboard/viewer' });
    }

    finishAuth();
  }, [navigate]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-sm text-muted-foreground">Confirming your account...</p>
    </div>
  );
}
