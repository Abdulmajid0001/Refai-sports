import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageStub } from '@/components/dashboard/DashboardPageStub';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const Route = createFileRoute('/dashboard/moderator/cameras')({
  component: CamerasPage,
});

function CamerasPage() {
  return (
    <RoleGuard allow="moderator" requireApproved={false}>
      <DashboardPageStub
        title="Cameras"
        description="Monitor camera feeds, angle statuses and replay source health."
        backTo="/dashboard/moderator"
        backLabel="Back to Moderator dashboard"
      />
    </RoleGuard>
  );
}
