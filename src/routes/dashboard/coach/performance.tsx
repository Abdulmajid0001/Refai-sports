import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageStub } from '@/components/dashboard/DashboardPageStub';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const Route = createFileRoute('/dashboard/coach/performance')({
  component: PerformancePage,
});

function PerformancePage() {
  return (
    <RoleGuard allow="coach" requireApproved={false}>
      <DashboardPageStub
        title="Performance"
        description="Analyze player stats, heatmaps, minute distributions and trends."
        backTo="/dashboard/coach"
        backLabel="Back to Coach dashboard"
      />
    </RoleGuard>
  );
}
