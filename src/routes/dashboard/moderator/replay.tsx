import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageStub } from '@/components/dashboard/DashboardPageStub';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const Route = createFileRoute('/dashboard/moderator/replay')({
  component: ReplayPage,
});

function ReplayPage() {
  return (
    <RoleGuard allow="moderator" requireApproved={false}>
      <DashboardPageStub
        title="Replay"
        description="Queue replays, mark clips and manage camera angles for review."
        backTo="/dashboard/moderator"
        backLabel="Back to Moderator dashboard"
      />
    </RoleGuard>
  );
}
