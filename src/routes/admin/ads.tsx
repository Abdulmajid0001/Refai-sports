import { createFileRoute } from '@tanstack/react-router';
import { AdminAds } from '@/components/admin.ads';

export const Route = createFileRoute('/admin/ads')({
  component: AdminAds,
});
