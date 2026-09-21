import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageStub } from '@/components/dashboard/DashboardPageStub';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const Route = createFileRoute('/dashboard/coach/formations')({
  component: FormationsPage,
});

function FormationsPage() {
  return (
    <RoleGuard allow="coach" requireApproved={false}>
      <DashboardPageStub
        title="Formations"
        description="Build tactical formations and save strategies for your team."
        backTo="/dashboard/coach"
        backLabel="Back to Coach dashboard"
      />
    </RoleGuard>
  );
}
