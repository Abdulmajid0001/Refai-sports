import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageStub } from '@/components/dashboard/DashboardPageStub';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const Route = createFileRoute('/dashboard/viewer/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <RoleGuard allow="viewer" requireApproved={false}>
      <DashboardPageStub
        title="Profile"
        description="Manage your fan profile, notifications, badges and watch history."
        backTo="/dashboard/viewer"
        backLabel="Back to Viewer dashboard"
      />
    </RoleGuard>
  );
}
