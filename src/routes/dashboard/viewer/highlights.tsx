import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageStub } from '@/components/dashboard/DashboardPageStub';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const Route = createFileRoute('/dashboard/viewer/highlights')({
  component: HighlightsPage,
});

function HighlightsPage() {
  return (
    <RoleGuard allow="viewer" requireApproved={false}>
      <DashboardPageStub
        title="Highlights"
        description="Watch top moments, goals, replays and match highlight clips."
        backTo="/dashboard/viewer"
        backLabel="Back to Viewer dashboard"
      />
    </RoleGuard>
  );
}
