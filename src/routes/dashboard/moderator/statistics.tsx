import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageStub } from '@/components/dashboard/DashboardPageStub';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const Route = createFileRoute('/dashboard/moderator/statistics')({
  component: StatisticsPage,
});

function StatisticsPage() {
  return (
    <RoleGuard allow="moderator" requireApproved={false}>
      <DashboardPageStub
        title="Statistics"
        description="Monitor match metrics, possession, shots, cards and trends."
        backTo="/dashboard/moderator"
        backLabel="Back to Moderator dashboard"
      />
    </RoleGuard>
  );
}
