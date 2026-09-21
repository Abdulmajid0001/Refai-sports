import { createFileRoute } from '@tanstack/react-router';
import { ModeratorControlCenter } from '@/components/moderator.$matchId';
import { MatchAccessGate } from '@/components/auth/MatchAccessGate';

export const Route = createFileRoute('/moderator/$matchId')({
  component: () => {
    const { matchId } = Route.useParams();
    return <MatchAccessGate matchId={matchId} roles={['general_moderator', 'moderator', 'assistant_moderator']}>
      <ModeratorControlCenter />
    </MatchAccessGate>;
  },
});
