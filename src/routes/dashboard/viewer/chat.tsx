import { createFileRoute } from '@tanstack/react-router';

import { DashboardPageStub } from '@/components/dashboard/DashboardPageStub';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const Route = createFileRoute('/dashboard/viewer/chat')({
  component: ChatPage,
});

function ChatPage() {
  return (
    <RoleGuard allow="viewer" requireApproved={false}>
      <DashboardPageStub
        title="Chat"
        description="Join fan chat rooms, match discussions and moderated conversations."
        backTo="/dashboard/viewer"
        backLabel="Back to Viewer dashboard"
      />
    </RoleGuard>
  );
}
