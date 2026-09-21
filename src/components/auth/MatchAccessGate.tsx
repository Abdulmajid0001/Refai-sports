import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { useAuth } from '@/hooks/use-auth';
import type { UserRole } from '@/lib/roles';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export function MatchAccessGate({ matchId, roles, children }: { matchId: string; roles: UserRole[]; children: ReactNode }) {
  const { user, loading, hasRole } = useAuth();
  const access = useQuery({
    queryKey: ['match-operation-access', matchId, user?.id],
    enabled: !!user && hasRole(roles),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('has_match_operation_access', { p_match_id: matchId });
      if (error) throw error;
      return Boolean(data);
    },
  });

  if (loading || access.isLoading) return <div className="flex min-h-screen items-center justify-center">Checking match access...</div>;
  if (!user) return <AccessDenied title="Sign in required" message="Sign in with the invited account to access this match." />;
  if (!hasRole(roles)) return <AccessDenied title="Role not authorized" message="This operational area is restricted to the assigned match role." />;
  if (access.isError || !access.data) return <AccessDenied title="Match assignment required" message="Your account does not have an active assignment for this match." />;
  return <>{children}</>;
}

function AccessDenied({ title, message }: { title: string; message: string }) {
  return <div className="flex min-h-screen items-center justify-center p-6 text-center"><div><h1 className="text-2xl font-bold">{title}</h1><p className="mt-2 text-muted-foreground">{message}</p><Button asChild className="mt-5"><Link to="/dashboard">Go to dashboard</Link></Button></div></div>;
}
