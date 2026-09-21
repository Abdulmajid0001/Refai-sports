import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageStub } from '@/components/dashboard/DashboardPageStub';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const Route = createFileRoute('/dashboard/team/matches')({
  component: MatchesPage,
});

function MatchesPage() {
  return (
    <RoleGuard allow="team_owner" requireApproved={false}>
      <DashboardPageStub
        title="Matches"
        description="View scheduled fixtures, submit lineups and review opponents."
        backTo="/dashboard/team"
        backLabel="Back to Team dashboard"
      />
    </RoleGuard>
  );
}
