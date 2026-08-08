import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export function SiteNotificationBanner() {
  const { data } = useQuery({
    queryKey: ['active-site-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_notifications')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data ?? [];
    },
  });

  const item = data?.[0] as any;
  if (!item) return null;

  const content = (
    <div className="border-b bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
      <strong>{item.title}</strong>: {item.message}
    </div>
  );

  if (item.link_url) {
    return <Link to={item.link_url as never}>{content}</Link>;
  }

  return content;
}
