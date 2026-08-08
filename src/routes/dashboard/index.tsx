import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { dashboardForRole } from '@/lib/roles';

export const Route = createFileRoute('/dashboard/')({ component: DashboardIndex });

function DashboardIndex() {
  const navigate = useNavigate();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && profile?.role) {
      navigate({ to: dashboardForRole(profile.role) as never, replace: true });
    }
  }, [loading, profile?.role, navigate]);

  return <div className="rounded-lg border bg-card p-6">Preparing your dashboard...</div>;
}
