import { createFileRoute } from '@tanstack/react-router';
import { RefereeConsole } from '@/components/referee.$matchId';
import { MatchAccessGate } from '@/components/auth/MatchAccessGate';

export const Route = createFileRoute('/referee/$matchId')({
  component: () => {
    const { matchId } = Route.useParams();
    return <MatchAccessGate matchId={matchId} roles={['general_moderator', 'moderator', 'assistant_moderator']}>
      <RefereeConsole />
    </MatchAccessGate>;
  },
});
