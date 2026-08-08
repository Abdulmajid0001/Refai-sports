import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Trophy, Users } from 'lucide-react'

import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { PageShell } from '@/components/PageShell'
import { FollowButton } from '@/components/FollowButton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/teams/$slug')({ component: TeamDetail })

function TeamDetail() {
  const { slug } = Route.useParams()
  const { user } = useAuth()

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, slug, logo_url, banner_url, primary_color, city, country, description, home_venue')
        .eq('slug', slug)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  const { data: matches } = useQuery({
    queryKey: ['team-matches', team?.id],
    enabled: !!team?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('id, status, kickoff_at, home_score, away_score, home_team_id, away_team_id, league_id, matchday')
        .or(`home_team_id.eq.${team!.id},away_team_id.eq.${team!.id}`)
        .order('kickoff_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })

  const { data: roster } = useQuery({
    queryKey: ['team-roster', team?.id],
    enabled: !!team?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, display_name, jersey_number, position')
        .eq('team_id', team!.id)
        .order('jersey_number', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })

  if (isLoading) return <PageShell><div className="mx-auto max-w-7xl px-4 py-16">Loading team…</div></PageShell>
  if (!team) return <PageShell><div className="mx-auto max-w-7xl px-4 py-16">Team not found.</div></PageShell>

  return (
    <PageShell>
      <section className="relative overflow-hidden rounded-3xl bg-slate-950/80">
        {team.banner_url && (
          <img src={team.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        )}
        <div className="relative mx-auto max-w-7xl px-4 py-14">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-slate-900 text-white" style={{ background: team.primary_color || undefined }}>
                {team.logo_url ? <img src={team.logo_url} alt={team.name} className="h-full w-full rounded-3xl object-cover" /> : <Trophy className="h-8 w-8" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold">{team.name}</h1>
                  <Badge variant="secondary">Team profile</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{[team.city, team.country].filter(Boolean).join(' • ') || 'Club profile'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <FollowButton targetType="team" targetId={team.id} />
              {user && (
                <Button asChild variant="outline">
                  <Link to="/matches/$id" params={{ id: matches?.[0]?.id ?? '' }}>Latest match</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{team.description || 'This team has not published a description yet.'}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {team.home_venue && <KeyFact label="Home venue" value={team.home_venue} />}
                {team.city && <KeyFact label="Base" value={`${team.city}${team.country ? `, ${team.country}` : ''}`} />}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming and recent matches</CardTitle>
            </CardHeader>
            <CardContent>
              {matches?.length ? (
                <div className="space-y-3">
                  {matches.map((match) => (
                    <Link key={match.id} to="/matches/$id" params={{ id: match.id }} className="block rounded-xl border border-muted/50 p-4 transition hover:border-primary hover:bg-muted/10">
                      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                        <span>{match.matchday ? `MD ${match.matchday}` : match.status}</span>
                        <Badge variant="outline" className="capitalize">{match.status}</Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3 font-semibold">
                        <span>{match.home_team_id === team.id ? team.name : 'Opponent'}</span>
                        <span className="font-mono tabular-nums">{match.home_score} – {match.away_score}</span>
                        <span>{match.away_team_id === team.id ? team.name : 'Opponent'}</span>
                      </div>
                      {match.kickoff_at && <div className="mt-2 text-xs text-muted-foreground">{new Date(match.kickoff_at).toLocaleString()}</div>}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No matches found for this team yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Roster</CardTitle>
            </CardHeader>
            <CardContent>
              {roster?.length ? (
                <div className="space-y-2">
                  {roster.map((member) => (
                    <div key={member.id} className="flex items-center justify-between rounded-xl border border-muted/30 px-4 py-3">
                      <div>
                        <p className="font-medium">{member.display_name}</p>
                        <p className="text-xs text-muted-foreground">{member.position || 'Player'}</p>
                      </div>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold tabular-nums">#{member.jersey_number ?? '—'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No roster details available yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Follow this team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Follow this team to receive updates on upcoming matches, live results and highlights.</p>
              <div className="flex flex-wrap gap-2">
                <FollowButton targetType="team" targetId={team.id} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}

function KeyFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/10 p-3 text-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}
