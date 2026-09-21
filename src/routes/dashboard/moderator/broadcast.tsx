import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageStub } from '@/components/dashboard/DashboardPageStub';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const Route = createFileRoute('/dashboard/moderator/broadcast')({
  component: BroadcastPage,
});

function BroadcastPage() {
  return (
    <RoleGuard allow="moderator" requireApproved={false}>
      <DashboardPageStub
        title="Broadcast"
        description="Manage stream health, overlays, audio and live broadcast controls."
        backTo="/dashboard/moderator"
        backLabel="Back to Moderator dashboard"
      />
    </RoleGuard>
  );
}
