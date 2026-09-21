import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { InputHTMLAttributes } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Team = { id: string; name: string };
type League = { id: string; league_registration_id: string };

export const Route = createFileRoute('/dashboard/league/matches')({ component: LeagueMatchesPage });

function LeagueMatchesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const registrations = useQuery({
    queryKey: ['owner-registrations', user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('league_registrations').select('id').eq('owner_id', user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });
  const registrationIds = registrations.data?.map((row) => row.id) ?? [];
  const operationalLeagues = useQuery({
    queryKey: ['operational-leagues', registrationIds], enabled: registrationIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('leagues').select('id, league_registration_id').in('league_registration_id', registrationIds);
      if (error) throw error;
      return (data ?? []) as League[];
    },
  });
  const league = operationalLeagues.data?.[0];
  const teams = useQuery({
    queryKey: ['operational-teams', league?.id], enabled: !!league,
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('id, name').eq('league_id', league!.id).order('name');
      if (error) throw error;
      return (data ?? []) as Team[];
    },
  });
  const matches = useQuery({
    queryKey: ['operational-matches', league?.league_registration_id], enabled: !!league,
    queryFn: async () => {
      const { data, error } = await supabase.from('matches').select('id, kickoff_at, venue, home_team_id, away_team_id').eq('league_registration_id', league!.league_registration_id).order('kickoff_at');
      if (error) throw error;
      return data ?? [];
    },
  });
  const createFixture = useMutation({
    mutationFn: async (form: FormData) => {
      if (!league) throw new Error('Your approved league must be activated by Super Admin first');
      const home = String(form.get('home_team_id') || '');
      const away = String(form.get('away_team_id') || '');
      const kickoff = String(form.get('kickoff_at') || '');
      if (!home || !away || !kickoff) throw new Error('Choose both teams and a kickoff time');
      const { error } = await supabase.rpc('create_operational_match', {
        p_league_registration_id: league.league_registration_id, p_home_team_id: home, p_away_team_id: away,
        p_kickoff_at: new Date(kickoff).toISOString(), p_venue: String(form.get('venue') || ''),
        p_matchday: Number(form.get('matchday') || 0) || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Fixture created and ready for operations and public viewing.'); queryClient.invalidateQueries({ queryKey: ['operational-matches'] }); },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not create fixture'),
  });
  const teamById = new Map((teams.data ?? []).map((team) => [team.id, team.name]));
  const canSchedule = !!league && (teams.data?.length ?? 0) >= 2;

  return <RoleGuard allow="league_owner" requireApproved={false}><div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Fixtures</h1><p className="text-muted-foreground">Operational matches flow directly to live control and public pages.</p></div><Button asChild variant="outline"><Link to="/dashboard/league">Back to dashboard</Link></Button></div>
    {!league && <Card><CardContent className="pt-6 text-sm text-muted-foreground">Your league must be approved and activated by Super Admin before fixtures can be created.</CardContent></Card>}
    {league && !canSchedule && <Card><CardContent className="pt-6 text-sm text-muted-foreground">Approve and activate at least two teams before scheduling a fixture.</CardContent></Card>}
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarPlus className="h-5 w-5 text-primary" />Create Fixture</CardTitle></CardHeader><CardContent><form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); createFixture.mutate(new FormData(event.currentTarget)); event.currentTarget.reset(); }}>
      <TeamSelect name="home_team_id" label="Home Team" teams={teams.data ?? []} disabled={!canSchedule} />
      <TeamSelect name="away_team_id" label="Away Team" teams={teams.data ?? []} disabled={!canSchedule} />
      <Field name="kickoff_at" label="Kickoff" type="datetime-local" required disabled={!canSchedule} />
      <Field name="venue" label="Venue" required disabled={!canSchedule} />
      <Field name="matchday" label="Matchday" type="number" min="1" disabled={!canSchedule} />
      <Button className="self-end" disabled={!canSchedule || createFixture.isPending}>{createFixture.isPending ? 'Creating...' : 'Create operational fixture'}</Button>
    </form></CardContent></Card>
    <Card><CardHeader><CardTitle>Scheduled Fixtures</CardTitle></CardHeader><CardContent className="space-y-3">{matches.isLoading ? <p className="text-sm text-muted-foreground">Loading fixtures...</p> : (matches.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No operational fixtures yet.</p> : matches.data!.map((match) => <div key={match.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"><div><div className="font-medium">{teamById.get(match.home_team_id) ?? 'Home team'} vs {teamById.get(match.away_team_id) ?? 'Away team'}</div><div className="text-sm text-muted-foreground">{match.kickoff_at ? new Date(match.kickoff_at).toLocaleString() : 'Kickoff TBD'}{match.venue ? ' / ' + match.venue : ''}</div></div><Button size="sm" variant="outline" asChild><Link to="/matches/$id" params={{ id: match.id }}><ExternalLink className="mr-2 h-4 w-4" />View match</Link></Button></div>)}</CardContent></Card>
  </div></RoleGuard>;
}
function TeamSelect({ name, label, teams, disabled }: { name: string; label: string; teams: Team[]; disabled: boolean }) { return <div><Label>{label}</Label><Select name={name} disabled={disabled}><SelectTrigger><SelectValue placeholder="Choose team" /></SelectTrigger><SelectContent>{teams.map((team) => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}</SelectContent></Select></div>; }
function Field(props: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) { const { label, ...inputProps } = props; return <div><Label>{label}</Label><Input {...inputProps} /></div>; }
