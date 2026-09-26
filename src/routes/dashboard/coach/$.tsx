import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/coach/$')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/coach' });
  },
});
