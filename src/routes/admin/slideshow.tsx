import { createFileRoute } from '@tanstack/react-router';
import { AdminSlideshow } from '@/components/admin.slideshow';

export const Route = createFileRoute('/admin/slideshow')({
  component: AdminSlideshow,
});
