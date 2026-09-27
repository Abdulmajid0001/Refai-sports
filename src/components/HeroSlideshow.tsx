import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Slide = { id: string; image_url: string; title: string | null; subtitle: string | null; link_url: string | null };

const FALLBACK: Slide[] = [
  { id: "f1", image_url: "/images/hero-1.jpg", title: "Every match. Every decision.", subtitle: "AI-assisted refereeing, broadcast-grade streaming.", link_url: "/live" },
  { id: "f2", image_url: "/images/hero-2.jpg", title: "Built for officials.", subtitle: "VAR replay, decision logs, instant overrides.", link_url: "/about" },
  { id: "f3", image_url: "/images/hero-3.jpg", title: "From local courts to the big stage.", subtitle: "Football, basketball, volleyball and beyond.", link_url: "/leagues" },
  { id: "f4", image_url: "/images/hero-4.jpg", title: "Run your league like a pro.", subtitle: "Registration, scheduling, standings — all in one.", link_url: "/register/league" },
];

export function HeroSlideshow() {
  const { data } = useQuery({
    queryKey: ["homepage_slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_slides")
        .select("id,image_url,title,subtitle,link_url,position")
        .eq("is_active", true)
        .order("position", { ascending: true })
        .limit(20);
      if (error) throw error;
      return data as Slide[];
    },
  });

  const slides = (data && data.length > 0 ? data : FALLBACK).slice(0, 20);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, [slides.length]);

  const s = slides[i];

  return (
    <section className="relative h-[560px] w-full overflow-hidden md:h-[640px]">
      {slides.map((slide, idx) => (
        <img
          key={slide.id}
          src={slide.image_url}
          alt={slide.title ?? "Refai"}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${idx === i ? "opacity-100" : "opacity-0"}`}
          width={1920}
          height={1080}
          loading={idx === 0 ? "eager" : "lazy"}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-16">
        <div className="max-w-2xl text-white">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <span className="live-dot" /> AI-powered officiating platform
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
            {s.title}
          </h1>
          <p className="mt-3 text-lg text-white/85 md:text-xl">{s.subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href={s.link_url ?? "/live"}>Watch live</a>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href="/register/league">Run a league</a>
            </Button>
          </div>
        </div>
        <div className="mt-8 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Slide ${idx + 1}`}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-white" : "w-4 bg-white/40"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
