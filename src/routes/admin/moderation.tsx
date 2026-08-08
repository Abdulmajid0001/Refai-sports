import { createFileRoute } from '@tanstack/react-router';
import { AdminModeration } from '@/components/admin.moderation';

export const Route = createFileRoute('/admin/moderation')({
  component: AdminModeration,
});
