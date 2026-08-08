import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageStub } from '@/components/dashboard/DashboardPageStub';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const Route = createFileRoute('/dashboard/team/media')({
  component: MediaPage,
});

function MediaPage() {
  return (
    <RoleGuard allow="team_owner" requireApproved={false}>
      <DashboardPageStub
        title="Media"
        description="Upload and manage team photos, videos and promotional media."
        backTo="/dashboard/team"
        backLabel="Back to Team dashboard"
      />
    </RoleGuard>
  );
}
