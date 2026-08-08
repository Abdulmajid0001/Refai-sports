import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteAdSlot } from "@/components/SiteAdSlot";

export const Route = createFileRoute("/leagues")({ component: LeaguesIndex });

function LeaguesIndex() {
  const { data, isLoading } = useQuery({
    queryKey: ["leagues", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
      .from('league_registrations')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <PageShell>
      <section className="border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-14">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="font-display text-3xl font-bold md:text-4xl">Leagues</h1>
          </div>
          <p className="max-w-2xl text-muted-foreground">
            Discover competitions, follow standings, watch matches live and register your team.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/dashboard/league">Create a league</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard/team">Register a team</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        {isLoading ? (
          <p className="text-muted-foreground">Loading matches...</p>
        ) : (data?.length ?? 0) === 0 ? (
          <p className="text-center text-muted-foreground">No matches scheduled yet.</p>
        ) : (
          <>
            <SiteAdSlot placement="middle" pageGroup="matches" />
      
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data!.map((l) => (
              <Link key={l.id} to="/leagues/$slug" params={{ slug: l.slug }}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader className="flex flex-row items-center gap-3">
                    {l.logo_url ? (
                      <img src={l.logo_url} alt="" className="h-12 w-12 rounded-md object-cover" />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-md bg-primary/10 text-primary">
                        <Trophy className="h-5 w-5" />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{l.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {[l.sport, l.country, l.region].filter(Boolean).join(" • ")}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{l.status.replace("_", " ")}</Badge>
                  </CardHeader>
                  {l.description && (
                    <CardContent>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{l.description}</p>
                    </CardContent>
                  )}
                </Card>
              </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </PageShell>
  );
}
