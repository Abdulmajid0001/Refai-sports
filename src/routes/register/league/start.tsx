import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/register/league/start')({
  beforeLoad: () => { throw redirect({ to: '/register/league' }); },
});
