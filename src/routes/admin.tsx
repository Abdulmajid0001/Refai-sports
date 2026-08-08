import { createFileRoute } from '@tanstack/react-router';
import { AdminLayout } from '@/components/admin';

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
});
