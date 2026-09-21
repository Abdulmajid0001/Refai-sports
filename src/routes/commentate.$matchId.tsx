import { createFileRoute } from '@tanstack/react-router';
import { CommentatorBooth } from '@/components/commentate.$matchId';
import { MatchAccessGate } from '@/components/auth/MatchAccessGate';

export const Route = createFileRoute('/commentate/$matchId')({
  component: () => {
    const { matchId } = Route.useParams();
    return <MatchAccessGate matchId={matchId} roles={['commentator']}>
      <CommentatorBooth />
    </MatchAccessGate>;
  },
});
