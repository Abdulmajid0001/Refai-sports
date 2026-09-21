import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageStub } from '@/components/dashboard/DashboardPageStub';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const Route = createFileRoute('/dashboard/team/squad')({
  component: SquadPage,
});

function SquadPage() {
  return (
    <RoleGuard allow="team_owner" requireApproved={false}>
      <DashboardPageStub
        title="Squad"
        description="Manage players, registration details, availability and roster status."
        backTo="/dashboard/team"
        backLabel="Back to Team dashboard"
      />
    </RoleGuard>
  );
}
