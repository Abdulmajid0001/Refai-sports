import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageStub } from '@/components/dashboard/DashboardPageStub';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const Route = createFileRoute('/dashboard/coach/matches')({
  component: MatchesPage,
});

function MatchesPage() {
  return (
    <RoleGuard allow="coach" requireApproved={false}>
      <DashboardPageStub
        title="Matches"
        description="Review fixtures, opponent reports and match preparation notes."
        backTo="/dashboard/coach"
        backLabel="Back to Coach dashboard"
      />
    </RoleGuard>
  );
}
