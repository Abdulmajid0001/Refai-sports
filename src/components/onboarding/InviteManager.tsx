import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function InviteManager({ leagueId }: { leagueId: string | null }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [email, setEmail] = useState('');

  const { data } = useQuery({
    queryKey: ['team-invites', leagueId],
    enabled: !!leagueId,
    queryFn: async () => {
      const { data, error } = await supabase.from('team_invites').select('*').eq('league_registration_id', leagueId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function createInvite() {
    if (!user || !leagueId) return toast.error('Create a league first');
    const token = crypto.randomUUID();
    const { error } = await supabase.from('team_invites').insert({ league_registration_id: leagueId, created_by: user.id, email, token, role: 'team_owner' });
    if (error) return toast.error(error.message);
    setEmail('');
    toast.success('Team invite created');
    qc.invalidateQueries({ queryKey: ['team-invites', leagueId] });
  }

  return (
    <Card>
      <CardHeader><CardTitle>Team Invite Links</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]"><div><Label>Team owner email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div><Button className="self-end" onClick={createInvite}>Create invite</Button></div>
        <div className="space-y-2">{(data ?? []).map((invite: any) => <div key={invite.id} className="rounded border p-3 text-sm"><div className="font-mono">{invite.token}</div><div className="text-muted-foreground">{invite.email || 'No email'} / {invite.used_at ? 'Used' : 'Unused'}</div></div>)}</div>
      </CardContent>
    </Card>
  );
}
