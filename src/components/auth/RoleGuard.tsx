import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { useAuth } from '@/hooks/use-auth';
import type { UserRole } from '@/lib/roles';
import { roleLabels } from '@/lib/roles';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/button';

export function RoleGuard({ allow, requireApproved = true, children }: { allow: UserRole | UserRole[]; requireApproved?: boolean; children: ReactNode }) {
  const { user, profile, loading, hasRole } = useAuth();
  const roles = Array.isArray(allow) ? allow : [allow];

  if (loading) return <PageShell><div className="mx-auto max-w-5xl px-4 py-12">Loading secure area...</div></PageShell>;

  if (!user) {
    return <PageShell><div className="mx-auto max-w-xl px-4 py-16 text-center"><h1 className="text-2xl font-bold">Sign in required</h1><p className="mt-2 text-muted-foreground">This page is protected.</p><Button asChild className="mt-5"><Link to="/auth">Sign in</Link></Button></div></PageShell>;
  }

  if (!hasRole(roles)) {
    return <PageShell><div className="mx-auto max-w-xl px-4 py-16 text-center"><h1 className="text-2xl font-bold">Access denied</h1><p className="mt-2 text-muted-foreground">Your role is {profile?.role ? roleLabels[profile.role] : 'unknown'}.</p><Button asChild className="mt-5"><Link to="/dashboard">Go to dashboard</Link></Button></div></PageShell>;
  }

  if (requireApproved && profile?.account_status !== 'approved') {
    return <PageShell><div className="mx-auto max-w-xl px-4 py-16 text-center"><h1 className="text-2xl font-bold">Approval pending</h1><p className="mt-2 text-muted-foreground">Your account is {profile?.account_status?.replace(/_/g, ' ')}.</p></div></PageShell>;
  }

  return <>{children}</>;
}
