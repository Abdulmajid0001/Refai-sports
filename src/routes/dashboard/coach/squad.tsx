import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageStub } from '@/components/dashboard/DashboardPageStub';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const Route = createFileRoute('/dashboard/coach/squad')({
  component: SquadPage,
});

function SquadPage() {
  return (
    <RoleGuard allow="coach" requireApproved={false}>
      <DashboardPageStub
        title="Squad Management"
        description="Manage players, positions, availability, injuries and selection for upcoming matches."
        backTo="/dashboard/coach"
        backLabel="Back to Coach dashboard"
      />
    </RoleGuard>
  );
}
