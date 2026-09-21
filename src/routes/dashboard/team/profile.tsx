import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageStub } from '@/components/dashboard/DashboardPageStub';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const Route = createFileRoute('/dashboard/team/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <RoleGuard allow="team_owner" requireApproved={false}>
      <DashboardPageStub
        title="Team Profile"
        description="Edit team identity, branding, sponsors and owner details."
        backTo="/dashboard/team"
        backLabel="Back to Team dashboard"
      />
    </RoleGuard>
  );
}
