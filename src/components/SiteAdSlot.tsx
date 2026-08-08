import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

type SiteAdSlotProps = {
  placement: 'top' | 'middle' | 'bottom' | 'popup' | 'slide_in' | 'moving_text' | 'sidebar';
  pagePath?: string;
  pageGroup?: string;
};

export function SiteAdSlot({ placement, pagePath, pageGroup = 'all' }: SiteAdSlotProps) {
  const [closed, setClosed] = useState(false);

  const path = useMemo(() => {
    if (pagePath) return pagePath;
    if (typeof window === 'undefined') return '*';
    return window.location.pathname;
  }, [pagePath]);

  const { data: ads } = useQuery({
    queryKey: ['site-ads', placement, path, pageGroup],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_ads')
        .select('*')
        .eq('is_active', true)
        .eq('placement', placement)
        .or(
          `show_on_all_pages.eq.true,page_path.eq.*,page_path.eq.${path},page_group.eq.${pageGroup}`,
        )
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data ?? [];
    },
  });

  const ad = ads?.[0] as any;

  if (!ad || closed) return null;

  const isVideo = String(ad.media_url || '').match(/\.(mp4|webm|mov)$/i);

  if (placement === 'moving_text') {
    return (
      <div className="overflow-hidden border-y bg-primary py-2 text-primary-foreground">
        <div className="animate-[marquee_22s_linear_infinite] whitespace-nowrap text-sm font-medium">
          {ad.text_content || ad.name}
        </div>
      </div>
    );
  }

  const wrapperClass =
    placement === 'popup'
      ? 'fixed inset-x-4 bottom-4 z-50 rounded-lg border bg-background p-3 shadow-xl md:left-auto md:right-6 md:w-96'
      : placement === 'slide_in'
        ? 'fixed right-4 top-24 z-50 w-80 rounded-lg border bg-background p-3 shadow-xl'
        : placement === 'top'
          ? 'my-3 rounded-md border bg-muted/20 p-3'
          : placement === 'middle'
            ? 'my-6 rounded-md border bg-muted/20 p-3'
            : placement === 'bottom'
              ? 'my-3 rounded-md border bg-muted/20 p-3'
              : 'rounded-md border bg-muted/20 p-3';

  return (
    <aside className={wrapperClass}>
      {ad.closeable && ['popup', 'slide_in'].includes(placement) && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-2 top-2 h-7 w-7"
          onClick={() => setClosed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {ad.media_url ? (
        <a href={ad.destination_url || '#'} target="_blank" rel="noreferrer">
          {isVideo ? (
            <video src={ad.media_url} controls className="w-full rounded" />
          ) : (
            <img src={ad.media_url} alt={ad.name} className="w-full rounded object-cover" />
          )}
        </a>
      ) : ad.html_code ? (
        <div dangerouslySetInnerHTML={{ __html: ad.html_code }} />
      ) : (
        <a href={ad.destination_url || '#'} target="_blank" rel="noreferrer">
          <p className="text-sm font-medium">{ad.text_content || ad.name}</p>
        </a>
      )}
    </aside>
  );
}
