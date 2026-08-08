import { createFileRoute } from '@tanstack/react-router';
import { RefereeConsole } from '@/components/referee.$matchId';

export const Route = createFileRoute('/referee/$matchId')({
  component: RefereeConsole,
});
