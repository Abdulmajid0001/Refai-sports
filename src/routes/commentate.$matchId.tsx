import { createFileRoute } from '@tanstack/react-router';
import { CommentatorBooth } from '@/components/commentate.$matchId';

export const Route = createFileRoute('/commentate/$matchId')({
  component: CommentatorBooth,
});
