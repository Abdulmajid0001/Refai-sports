import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageStub } from '@/components/dashboard/DashboardPageStub';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const Route = createFileRoute('/dashboard/viewer/predictions')({
  component: PredictionsPage,
});

function PredictionsPage() {
  return (
    <RoleGuard allow="viewer" requireApproved={false}>
      <DashboardPageStub
        title="Predictions"
        description="Submit score predictions, polls and match outcome forecasts."
        backTo="/dashboard/viewer"
        backLabel="Back to Viewer dashboard"
      />
    </RoleGuard>
  );
}
