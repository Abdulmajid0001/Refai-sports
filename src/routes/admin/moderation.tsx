import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/moderation')({
  beforeLoad: () => {
    throw redirect({ to: '/admin' });
  },
});
