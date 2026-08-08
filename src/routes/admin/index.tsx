import { createFileRoute } from '@tanstack/react-router';
import { SuperAdminDashboard } from '@/components/admin/SuperAdminDashboard';

export const Route = createFileRoute('/admin/')({
  component: AdminIndexPage,
});

function AdminIndexPage() {
  return <SuperAdminDashboard />;
}
