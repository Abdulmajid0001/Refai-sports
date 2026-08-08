import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Users, Trophy } from 'lucide-react'

import { supabase } from '@/integrations/supabase/client'
import { PageShell } from '@/components/PageShell'
import { FollowButton } from '@/components/FollowButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/teams')({ component: TeamsIndex })

function TeamsIndex() {
  const { data, isLoading } = useQuery({
    queryKey: ['teams', 'public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, slug, logo_url, city, country, primary_color, description')
        .order('name', { ascending: true })
        .limit(100)

      if (error) throw error
      return data ?? []
    },
  })

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-primary">
              <Users className="h-4 w-4" /> Teams
            </div>
            <h1 className="mt-4 text-3xl font-bold">Browse Teams</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Discover clubs, follow squads, and view team profiles with live match links and roster details.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/dashboard/team">Register a team</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-muted/50 bg-muted/10 p-8 text-center text-muted-foreground">Loading teams…</div>
        ) : (data ?? []).length === 0 ? (
          <div className="rounded-3xl border border-muted/50 bg-muted/10 p-8 text-center text-muted-foreground">
            No teams found yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data!.map((team) => (
              <Card key={team.id} className="transition hover:-translate-y-0.5 hover:shadow-lg">
                <CardHeader className="flex items-center gap-3">
                  <div
                    className="grid h-12 w-12 place-items-center rounded-2xl text-white"
                    style={{ background: team.primary_color || 'hsl(var(--primary))' }}
                  >
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="h-full w-full rounded-2xl object-cover" />
                    ) : (
                      <Trophy className="h-6 w-6" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-base">{team.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {[team.city, team.country].filter(Boolean).join(' • ') || 'Club profile'}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {team.description || 'Public team page with roster, upcoming fixtures, and live match details.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild size="sm">
                      <Link to="/teams/$slug" params={{ slug: team.slug }}>View team</Link>
                    </Button>
                    <FollowButton targetType="team" targetId={team.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  )
}
