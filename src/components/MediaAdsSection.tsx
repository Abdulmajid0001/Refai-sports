import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Item = {
  id: string;
  kind: "video_upload" | "external_link" | "ad_image" | "ad_html";
  title: string | null;
  url: string | null;
  html: string | null;
};

/**
 * Super-admin controlled strip. 20% viewport height x 90% width.
 * Collapses to a thin bar when empty.
 */
export function MediaAdsSection() {
  const { data } = useQuery({
    queryKey: ["media_ads_section_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_ads_section")
        .select("id,kind,title,url,html")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Item | null;
    },
    refetchInterval: 60_000,
  });

  if (!data) {
    return (
      <div className="mx-auto my-8 h-1.5 w-[90%] rounded-full bg-muted" aria-hidden />
    );
  }

  return (
    <section className="mx-auto my-8 w-[90%] overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="h-[20vh] min-h-[140px] w-full">
        {data.kind === "video_upload" && data.url && (
          <video src={data.url} controls className="h-full w-full bg-black object-cover" />
        )}
        {data.kind === "external_link" && data.url && (
          <iframe src={data.url} title={data.title ?? "Media"} className="h-full w-full" allow="autoplay; encrypted-media" />
        )}
        {data.kind === "ad_image" && data.url && (
          <img src={data.url} alt={data.title ?? "Ad"} className="h-full w-full object-cover" />
        )}
        {data.kind === "ad_html" && data.html && (
          <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: data.html }} />
        )}
      </div>
    </section>
  );
}
