import { createFileRoute } from '@tanstack/react-router';
import { LiveViewerPage } from '@/components/live.$matchId';

export const Route = createFileRoute('/live/$matchId')({
  component: LiveViewerPage,
});
