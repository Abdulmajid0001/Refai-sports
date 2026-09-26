import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/viewer/$')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/viewer' });
  },
});
