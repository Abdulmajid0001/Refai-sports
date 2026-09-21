import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageStub } from '@/components/dashboard/DashboardPageStub';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const Route = createFileRoute('/dashboard/moderator/var')({
  component: VarPage,
});

function VarPage() {
  return (
    <RoleGuard allow="moderator" requireApproved={false}>
      <DashboardPageStub
        title="VAR Center"
        description="Manage video assistant referee reviews, checks and decisions."
        backTo="/dashboard/moderator"
        backLabel="Back to Moderator dashboard"
      />
    </RoleGuard>
  );
}
