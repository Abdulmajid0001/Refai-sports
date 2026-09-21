import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageStub } from '@/components/dashboard/DashboardPageStub';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const Route = createFileRoute('/dashboard/team/formations')({
  component: FormationsPage,
});

function FormationsPage() {
  return (
    <RoleGuard allow="team_owner" requireApproved={false}>
      <DashboardPageStub
        title="Formations"
        description="Build and save tactical formations for your team."
        backTo="/dashboard/team"
        backLabel="Back to Team dashboard"
      />
    </RoleGuard>
  );
}
