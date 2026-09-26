import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/moderator/$')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/moderator' });
  },
});
