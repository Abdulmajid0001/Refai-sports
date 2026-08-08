import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageStub } from '@/components/dashboard/DashboardPageStub';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const Route = createFileRoute('/dashboard/viewer/following')({
  component: FollowingPage,
});

function FollowingPage() {
  return (
    <RoleGuard allow="viewer" requireApproved={false}>
      <DashboardPageStub
        title="Following"
        description="Follow teams, players and leagues and track your favorites."
        backTo="/dashboard/viewer"
        backLabel="Back to Viewer dashboard"
      />
    </RoleGuard>
  );
}
