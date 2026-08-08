import { useState } from 'react';
import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminContentManager } from '@/components/admin/AdminContentManager';
import { toast } from 'sonner';
import {
  BadgeDollarSign,
  Headphones,
  Megaphone,
  Shield,
  TicketCheck,
  Trash2,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

type StatusAction = 'approved' | 'rejected' | 'changes_requested' | 'suspended';

export function SuperAdminDashboard() {
  return (
    <RoleGuard allow="super_admin" requireApproved>
      <SuperAdminControl />
    </RoleGuard>
  );
}

function SuperAdminControl() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [note, setNote] = useState('');

  const usersQ = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const leaguesQ = useQuery({
    queryKey: ['admin-leagues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const leagueEditRequestsQ = useQuery({
    queryKey: ['admin-league-edit-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_edit_requests')
        .select('*')
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const teamsQ = useQuery({
    queryKey: ['admin-teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const walletsQ = useQuery({
    queryKey: ['admin-wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_wallets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const campaignsQ = useQuery({
    queryKey: ['admin-sponsor-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsor_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const ticketsQ = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const updateLeague = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusAction }) => {
      const { error } = await supabase
        .from('league_registrations')
        .update({
          status,
          review_note: note || null,
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      if (status === 'approved') {
        const { data: league } = await supabase
          .from('league_registrations')
          .select('id, owner_id')
          .eq('id', id)
          .maybeSingle();

        if (league) {
          await supabase.from('league_wallets').upsert(
            {
              league_registration_id: league.id,
              owner_id: league.owner_id,
              currency: 'NGN',
            },
            { onConflict: 'league_registration_id' },
          );
        }
      }
    },
    onSuccess: () => {
      toast.success('League updated');
      qc.invalidateQueries({ queryKey: ['admin-leagues'] });
      qc.invalidateQueries({ queryKey: ['admin-wallets'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'League update failed'),
  });

  const updateTeam = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusAction }) => {
      const { error } = await supabase
        .from('team_registrations')
        .update({
          status,
          review_note: note || null,
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Team updated');
      qc.invalidateQueries({ queryKey: ['admin-teams'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Team update failed'),
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, account_status }: { id: string; account_status: string }) => {
      const { error } = await supabase.from('profiles').update({ account_status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('User updated');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'User update failed'),
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, approval_status }: { id: string; approval_status: string }) => {
      const { error } = await supabase
        .from('sponsor_campaigns')
        .update({
          approval_status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Campaign updated');
      qc.invalidateQueries({ queryKey: ['admin-sponsor-campaigns'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Campaign update failed'),
  });

  const updateTicket = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Ticket updated');
      qc.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Ticket update failed'),
  });

  const approveLeagueEdit = useMutation({
    mutationFn: async (request: any) => {
      const { error: updateError } = await supabase
        .from('league_registrations')
        .update({
          ...request.requested_data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.league_registration_id);

      if (updateError) throw updateError;

      const { error } = await supabase
        .from('league_edit_requests')
        .update({
          status: 'approved',
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('League edit approved');
      qc.invalidateQueries({ queryKey: ['admin-league-edit-requests'] });
      qc.invalidateQueries({ queryKey: ['admin-leagues'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'League edit approval failed'),
  });

  const rejectLeagueEdit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('league_edit_requests')
        .update({
          status: 'rejected',
          rejection_reason: note || null,
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('League edit rejected');
      qc.invalidateQueries({ queryKey: ['admin-league-edit-requests'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'League edit rejection failed'),
  });

  const deleteRecord = useMutation({
    mutationFn: async ({
      table,
      id,
    }: {
      table: 'league_registrations' | 'team_registrations' | 'sponsor_campaigns';
      id: string;
    }) => {
      if (!window.confirm('Delete this record permanently?')) return;

      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Deleted');
      qc.invalidateQueries({ queryKey: ['admin-leagues'] });
      qc.invalidateQueries({ queryKey: ['admin-teams'] });
      qc.invalidateQueries({ queryKey: ['admin-sponsor-campaigns'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Delete failed'),
  });

  return (
    <div className="min-h-screen bg-[#07130d] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-xl border border-emerald-900 bg-[#0b1711] p-6">
          <div className="flex items-center gap-2 text-emerald-300">
            <Shield />
            Super Admin Control Center
          </div>
          <h1 className="mt-2 text-3xl font-bold">Platform command dashboard</h1>
          <p className="text-emerald-50/80">
            Approve, reject, suspend, delete, monitor wallets, manage adverts, and control platform activity.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Metric icon={Users} label="Users" value={usersQ.data?.length ?? 0} />
          <Metric icon={Trophy} label="Leagues" value={leaguesQ.data?.length ?? 0} />
          <Metric icon={Users} label="Teams" value={teamsQ.data?.length ?? 0} />
          <Metric icon={Wallet} label="Wallets" value={walletsQ.data?.length ?? 0} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <AdminFeatureCard
            icon={Megaphone}
            title="Advertisement Approvals"
            description="Approve, reject, suspend, preview and delete sponsor campaigns from sponsor_campaigns."
          />
          <AdminFeatureCard
            icon={BadgeDollarSign}
            title="Advertisement Payments"
            description="Approve payments, reject payments, request more information, view receipts and process refunds."
          />
          <AdminFeatureCard
            icon={Headphones}
            title="Customer Care"
            description="Manage support tickets, AI configuration, knowledge base, live chat, satisfaction reports and support staff."
          />
        </div>

        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Review note for approvals, rejections, suspensions or requested changes"
          className="bg-slate-950 text-white"
        />

        <Tabs defaultValue="leagues">
          <TabsList className="grid grid-cols-8 bg-slate-950">
            <TabsTrigger value="leagues">Leagues</TabsTrigger>
            <TabsTrigger value="edits">League Edits</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="wallets">Wallets</TabsTrigger>
            <TabsTrigger value="ads">Ads</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="site-control">Site Control</TabsTrigger>
          </TabsList>

          <TabsContent value="leagues">
            {(leaguesQ.data ?? []).map((l: any) => (
              <Row key={l.id} title={l.league_name} subtitle={l.owner_email} status={l.status}>
                <Button onClick={() => updateLeague.mutate({ id: l.id, status: 'approved' })}>Approve</Button>
                <Button variant="outline" onClick={() => updateLeague.mutate({ id: l.id, status: 'changes_requested' })}>
                  Request changes
                </Button>
                <Button variant="secondary" onClick={() => updateLeague.mutate({ id: l.id, status: 'suspended' })}>
                  Suspend
                </Button>
                <Button variant="destructive" onClick={() => updateLeague.mutate({ id: l.id, status: 'rejected' })}>
                  Reject
                </Button>
                <Button variant="destructive" onClick={() => deleteRecord.mutate({ table: 'league_registrations', id: l.id })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Row>
            ))}
          </TabsContent>

          <TabsContent value="edits">
            {(leagueEditRequestsQ.data ?? []).length === 0 ? (
              <Empty text="No pending league edit requests." />
            ) : (
              leagueEditRequestsQ.data!.map((request: any) => (
                <Row
                  key={request.id}
                  title={`League edit request ${request.id.slice(0, 8)}`}
                  subtitle={`League ID: ${request.league_registration_id}`}
                  status={request.status}
                >
                  <div className="grid w-full gap-3 md:grid-cols-2">
                    <JsonBox title="Previous Details" value={request.previous_data} />
                    <JsonBox title="Requested Details" value={request.requested_data} />
                  </div>

                  <Button onClick={() => approveLeagueEdit.mutate(request)}>Approve all edits</Button>
                  <Button variant="destructive" onClick={() => rejectLeagueEdit.mutate(request.id)}>
                    Reject all edits
                  </Button>
                </Row>
              ))
            )}
          </TabsContent>

          <TabsContent value="teams">
            {(teamsQ.data ?? []).map((t: any) => (
              <Row key={t.id} title={t.team_name} subtitle={t.owner_email} status={t.status}>
                <Button onClick={() => updateTeam.mutate({ id: t.id, status: 'approved' })}>Approve</Button>
                <Button variant="outline" onClick={() => updateTeam.mutate({ id: t.id, status: 'changes_requested' })}>
                  Request edits
                </Button>
                <Button variant="secondary" onClick={() => updateTeam.mutate({ id: t.id, status: 'suspended' })}>
                  Suspend
                </Button>
                <Button variant="destructive" onClick={() => updateTeam.mutate({ id: t.id, status: 'rejected' })}>
                  Reject
                </Button>
                <Button variant="destructive" onClick={() => deleteRecord.mutate({ table: 'team_registrations', id: t.id })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Row>
            ))}
          </TabsContent>

          <TabsContent value="users">
            {(usersQ.data ?? []).map((u: any) => (
              <Row key={u.id} title={u.email} subtitle={u.role} status={u.account_status}>
                <Button onClick={() => updateUser.mutate({ id: u.id, account_status: 'approved' })}>Approve</Button>
                <Button variant="secondary" onClick={() => updateUser.mutate({ id: u.id, account_status: 'suspended' })}>
                  Suspend
                </Button>
                <Button variant="destructive" onClick={() => updateUser.mutate({ id: u.id, account_status: 'rejected' })}>
                  Reject
                </Button>
              </Row>
            ))}
          </TabsContent>

          <TabsContent value="wallets">
            {(walletsQ.data ?? []).map((w: any) => (
              <Row key={w.id} title={`Wallet ${w.id.slice(0, 8)}`} subtitle={w.owner_id} status={`NGN ${w.ledger_balance ?? 0}`} />
            ))}
          </TabsContent>

          <TabsContent value="ads">
            {(campaignsQ.data ?? []).length === 0 ? (
              <Empty text="No sponsor or advertisement campaigns yet." />
            ) : (
              campaignsQ.data!.map((campaign: any) => (
                <Row
                  key={campaign.id}
                  title={campaign.campaign_name}
                  subtitle={`${campaign.company} / ${campaign.plan}`}
                  status={campaign.approval_status}
                >
                  <Button onClick={() => updateCampaign.mutate({ id: campaign.id, approval_status: 'approved' })}>
                    Approve campaign
                  </Button>
                  <Button variant="outline" onClick={() => updateCampaign.mutate({ id: campaign.id, approval_status: 'changes_requested' })}>
                    Return for changes
                  </Button>
                  <Button variant="secondary" onClick={() => updateCampaign.mutate({ id: campaign.id, approval_status: 'suspended' })}>
                    Suspend
                  </Button>
                  <Button variant="destructive" onClick={() => updateCampaign.mutate({ id: campaign.id, approval_status: 'rejected' })}>
                    Reject
                  </Button>
                  {campaign.media_url && (
                    <Button asChild variant="outline">
                      <a href={campaign.media_url} target="_blank" rel="noreferrer">
                        Preview media
                      </a>
                    </Button>
                  )}
                  <Button variant="destructive" onClick={() => deleteRecord.mutate({ table: 'sponsor_campaigns', id: campaign.id })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Row>
              ))
            )}
          </TabsContent>

          <TabsContent value="support">
            {(ticketsQ.data ?? []).length === 0 ? (
              <Empty text="No support tickets yet." />
            ) : (
              ticketsQ.data!.map((ticket: any) => (
                <Row key={ticket.id} title={ticket.subject} subtitle={ticket.email || ticket.user_id} status={ticket.status}>
                  <p className="w-full text-sm text-slate-300">{ticket.description}</p>
                  <Button onClick={() => updateTicket.mutate({ id: ticket.id, status: 'open' })}>Open</Button>
                  <Button variant="outline" onClick={() => updateTicket.mutate({ id: ticket.id, status: 'investigating' })}>
                    Investigating
                  </Button>
                  <Button variant="secondary" onClick={() => updateTicket.mutate({ id: ticket.id, status: 'resolved' })}>
                    Resolve
                  </Button>
                  <Button variant="destructive" onClick={() => updateTicket.mutate({ id: ticket.id, status: 'closed' })}>
                    Close
                  </Button>
                </Row>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

        <TabsContent value="site-control">
  <AdminContentManager />
</TabsContent>

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="border-emerald-900 bg-slate-950 text-white">
      <CardContent className="p-4">
        <Icon className="mb-2 h-5 w-5 text-emerald-300" />
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-slate-400">{label}</div>
      </CardContent>
    </Card>
  );
}

function AdminFeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-emerald-900 bg-slate-950 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-5 w-5 text-emerald-300" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-300">{description}</p>
      </CardContent>
    </Card>
  );
}

function Row({
  title,
  subtitle,
  status,
  children,
}: {
  title: string;
  subtitle: string;
  status: string;
  children?: ReactNode;
}) {
  return (
    <div className="my-3 rounded-lg border border-emerald-900 bg-slate-950 p-4">
      <div className="font-semibold text-white">{title}</div>
      <div className="text-sm text-slate-400">{subtitle}</div>
      <Badge className="my-3 capitalize">{status?.replace?.(/_/g, ' ') ?? status}</Badge>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function JsonBox({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-md border border-emerald-900 bg-[#07130d] p-3">
      <p className="mb-2 text-sm font-semibold text-emerald-300">{title}</p>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-200">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Card className="border-emerald-900 bg-slate-950 text-white">
      <CardContent className="pt-6 text-sm text-slate-300">{text}</CardContent>
    </Card>
  );
}
