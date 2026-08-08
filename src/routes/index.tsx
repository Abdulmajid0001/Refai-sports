import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, LifeBuoy, Radio, Trophy, Users } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageShell } from "@/components/PageShell";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { FollowingFeed } from "@/components/FollowingFeed";
import { MediaAdsSection } from "@/components/MediaAdsSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteAdSlot } from '@/components/SiteAdSlot';

export const Route = createFileRoute("/")({ component: HomePage });

const QUICK_CARDS = [
  {
    to: "/live",
    icon: Radio,
    title: "Live now",
    desc: "Catch matches happening right now.",
  },
  {
    to: "/leagues",
    icon: Trophy,
    title: "Leagues",
    desc: "Browse competitions, standings and fixtures.",
  },
  {
    to: "/dashboard/team/register",
    icon: Users,
    title: "Register a team",
    desc: "Apply to a competition and onboard players.",
  },
  {
    to: "/dashboard/league/register",
    icon: Building2,
    title: "Run a league",
    desc: "Create a league, set rules, manage matches.",
  },
] as const;

function HomePage() {
  const { user } = useAuth();

  const { data: liveMatches } = useQuery({
    queryKey: ["live-matches-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("id, status, home_score, away_score, home_team_id, away_team_id, league_id")
        .eq("status", "live")
        .limit(6);

      if (error) throw error;
      if (!data?.length) return [];

      const teamIds = Array.from(
        new Set(data.flatMap((m) => [m.home_team_id, m.away_team_id]).filter(Boolean)),
      );

      const leagueIds = Array.from(new Set(data.map((m) => m.league_id).filter(Boolean)));

      const [teamsRes, leaguesRes] = await Promise.all([
        teamIds.length
          ? supabase.from("teams").select("id, name, slug, logo_url").in("id", teamIds)
          : { data: [] },
        leagueIds.length
          ? supabase.from("leagues").select("id, name, slug").in("id", leagueIds)
          : { data: [] },
      ]);

      const teamById = new Map((teamsRes.data ?? []).map((t) => [t.id, t]));
      const leagueById = new Map((leaguesRes.data ?? []).map((l) => [l.id, l]));

      return data.map((m) => ({
        ...m,
        home: m.home_team_id ? teamById.get(m.home_team_id) : null,
        away: m.away_team_id ? teamById.get(m.away_team_id) : null,
        league: m.league_id ? leagueById.get(m.league_id) : null,
      }));
    },
    refetchInterval: 30_000,
  });

  return (
    <PageShell>
      <HeroSlideshow />

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Explore RefAI</h2>
            <p className="text-sm text-muted-foreground">
              Watch, manage, advertise, register teams, or get support.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/help">
              <LifeBuoy className="mr-2 h-4 w-4" />
              Customer Care
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_CARDS.map(({ to, icon: Icon, title, desc }) => (
            <Link
              key={to}
              to={to as never}
              className="group rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <Icon className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <SiteAdSlot placement="middle" pageGroup="homepage" />

      {(liveMatches?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Radio className="h-5 w-5 animate-pulse text-red-500" />
              <CardTitle>Live matches</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {liveMatches!.map((m) => (
                  <Link
                    key={m.id}
                    to="/matches/$id"
                    params={{ id: m.id }}
                    className="rounded-lg border bg-muted/30 p-4 transition-colors hover:bg-muted/60"
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{m.league?.name ?? "League"}</span>
                      <Badge variant="destructive" className="animate-pulse">
                        LIVE
                      </Badge>
                    </div>

                    <div className="mt-2 flex items-center justify-between font-medium">
                      <div className="flex items-center gap-2">
                        {m.home?.logo_url && (
                          <img src={m.home.logo_url} alt="" className="h-5 w-5 rounded" />
                        )}
                        <span>{m.home?.name ?? "TBD"}</span>
                      </div>
                      <span className="font-mono tabular-nums">{m.home_score}</span>
                    </div>

                    <div className="mt-1 flex items-center justify-between font-medium">
                      <div className="flex items-center gap-2">
                        {m.away?.logo_url && (
                          <img src={m.away.logo_url} alt="" className="h-5 w-5 rounded" />
                        )}
                        <span>{m.away?.name ?? "TBD"}</span>
                      </div>
                      <span className="font-mono tabular-nums">{m.away_score}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <MediaAdsSection />

      <SiteAdSlot placement="middle" pageGroup="homepage" />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {user && <FollowingFeed />}

          <Card>
            <CardHeader>
              <CardTitle>Welcome to RefAI</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                RefAI is the all-in-one platform for AI-assisted officiating, live streaming,
                multi-commentator audio and competition management built for local, school,
                semi-pro and professional leagues alike.
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span>League and team management tools</span>
                </div>

                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-primary" />
                  <span>HD live streaming with real-time commentary</span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>VAR replay tooling and AI refereeing assistance</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {!user && (
                  <Button asChild>
                    <Link to="/auth">Get started</Link>
                  </Button>
                )}

                <Button asChild variant="outline">
                  <Link to="/help">
                    <LifeBuoy className="mr-2 h-4 w-4" />
                    Customer Care
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}
