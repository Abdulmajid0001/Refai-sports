import { createFileRoute } from '@tanstack/react-router';
import { ModeratorControlCenter } from '@/components/moderator.$matchId';

export const Route = createFileRoute('/moderator/$matchId')({
  component: ModeratorControlCenter,
});
