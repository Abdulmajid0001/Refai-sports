import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { uploadFile } from '@/lib/upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SiteAdSlot } from "@/components/SiteAdSlot";

export const Route = createFileRoute('/dashboard/sponsor')({ component: SponsorDashboard });

function SponsorDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const location = useLocation();
const pathname = location.pathname.replace(/\/$/, '');

if (pathname !== '/dashboard/sponsor') {
  return (
    <RoleGuard allow="sponsor" requireApproved={false}>
      <Outlet />
    </RoleGuard>
  );
}

  const { data: campaigns } = useQuery({
    queryKey: ['sponsor-campaigns', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('sponsor_campaigns').select('*').eq('owner_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const createCampaign = useMutation({
    mutationFn: async (form: FormData) => {
      if (!user) throw new Error('Sign in first');
      const file = form.get('media') as File;
      const media_url = file?.size ? await uploadFile('broadcast-assets', file, 'sponsor-campaigns') : null;
      const { error } = await supabase.from('sponsor_campaigns').insert({
        owner_id: user.id,
        campaign_type: String(form.get('campaign_type') || 'advertisement'),
        campaign_name: String(form.get('campaign_name') || '').trim(),
        company: String(form.get('company') || '').trim(),
        website: String(form.get('website') || '').trim(),
        contact_person: String(form.get('contact_person') || '').trim(),
        email: String(form.get('email') || '').trim(),
        phone: String(form.get('phone') || '').trim(),
        country: String(form.get('country') || '').trim(),
        industry: String(form.get('industry') || '').trim(),
        plan: String(form.get('plan') || 'starter'),
        media_url,
        destination_url: String(form.get('destination_url') || '').trim(),
        placements: String(form.get('placements') || '').split(',').map((p) => p.trim()).filter(Boolean),
        payment_status: 'draft',
        approval_status: 'pending_approval',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Campaign submitted for Super Admin approval');
      qc.invalidateQueries({ queryKey: ['sponsor-campaigns'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not create campaign'),
  });

  return (
    <RoleGuard allow="sponsor" requireApproved={false}>
      <div className="space-y-6">

        <SiteAdSlot placement="moving_text" pageGroup="role_dashboards" />
        <SiteAdSlot placement="top" pageGroup="role_dashboards" />
        
        <div><h1 className="text-2xl font-bold">Sponsor / Advertiser</h1><p className="text-muted-foreground">Create campaigns, upload creatives, manage placements and wait for Super Admin approval.</p></div>
        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Campaigns" value={campaigns?.length ?? 0} />
          <Metric label="Pending Approval" value={(campaigns ?? []).filter((c: any) => c.approval_status === 'pending_approval').length} />
          <Metric label="Active" value={(campaigns ?? []).filter((c: any) => c.approval_status === 'approved').length} />
          <Metric label="Rejected" value={(campaigns ?? []).filter((c: any) => c.approval_status === 'rejected').length} />
        </div>
        
        <SiteAdSlot placement="middle" pageGroup="role_dashboards" />
        
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" />New Campaign</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); createCampaign.mutate(new FormData(e.currentTarget)); }}>
              <Field name="campaign_type" label="Campaign Type" placeholder="advertisement or sponsorship" required />
              <Field name="campaign_name" label="Campaign Name" required />
              <Field name="company" label="Company" required />
              <Field name="website" label="Website" />
              <Field name="contact_person" label="Contact Person" />
              <Field name="email" label="Email" type="email" />
              <Field name="phone" label="Phone" />
              <Field name="country" label="Country" />
              <Field name="industry" label="Industry" />
              <Field name="plan" label="Plan" placeholder="starter, professional, enterprise" />
              <Field name="destination_url" label="Destination URL" />
              <Field name="placements" label="Placements, comma separated" placeholder="homepage, live match, scoreboard" />
              <div><Label>Media</Label><Input name="media" type="file" accept="image/*,video/*,.gif,.svg" /></div>
              <div className="md:col-span-2"><Label>Notes</Label><Textarea name="notes" rows={3} /></div>
              <Button className="md:col-span-2" disabled={createCampaign.isPending}><Megaphone className="mr-2 h-4 w-4" />Submit campaign</Button>
            </form>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>My Campaigns</CardTitle></CardHeader><CardContent className="space-y-3">{(campaigns ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No campaigns yet.</p> : campaigns!.map((c: any) => <div key={c.id} className="rounded-md border p-3"><p className="font-medium">{c.campaign_name}</p><p className="text-sm text-muted-foreground">{c.plan} / {c.approval_status}</p></div>)}</CardContent></Card>

        <SiteAdSlot placement="bottom" pageGroup="role_dashboards" />
        <SiteAdSlot placement="popup" pageGroup="role_dashboards" />
        <SiteAdSlot placement="slide_in" pageGroup="role_dashboards" />
        
      </div>
    </RoleGuard>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></CardContent></Card>;
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, ...inputProps } = props;
  return <div><Label>{label}</Label><Input {...inputProps} /></div>;
}
