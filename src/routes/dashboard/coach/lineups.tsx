import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageStub } from '@/components/dashboard/DashboardPageStub';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const Route = createFileRoute('/dashboard/coach/lineups')({
  component: LineupsPage,
});

function LineupsPage() {
  return (
    <RoleGuard allow="coach" requireApproved={false}>
      <DashboardPageStub
        title="Lineups"
        description="Prepare starting lineups and match-day substitute options."
        backTo="/dashboard/coach"
        backLabel="Back to Coach dashboard"
      />
    </RoleGuard>
  );
}
