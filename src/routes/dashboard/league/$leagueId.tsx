import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const Route = createFileRoute('/dashboard/league/$leagueId')({
  component: LeagueDetailsPage,
});

function LeagueDetailsPage() {
  const { leagueId } = Route.useParams();
  const qc = useQueryClient();

  const { data: league } = useQuery({
    queryKey: ['league-details', leagueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_registrations')
        .select('*')
        .eq('id', leagueId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const submitEditRequest = useMutation({
    mutationFn: async (form: FormData) => {
      if (!league) throw new Error('League not found');

      const requested_data = {
        league_name: String(form.get('league_name') || '').trim(),
        short_name: String(form.get('short_name') || '').trim(),
        league_description: String(form.get('league_description') || '').trim(),
        slogan: String(form.get('slogan') || '').trim(),
        phone: String(form.get('phone') || '').trim(),
        country: String(form.get('country') || '').trim(),
        state: String(form.get('state') || '').trim(),
        city: String(form.get('city') || '').trim(),
        address: String(form.get('address') || '').trim(),
      };

      const previous_data = {
        league_name: league.league_name,
        short_name: league.short_name,
        league_description: league.league_description,
        slogan: league.slogan,
        phone: league.phone,
        country: league.country,
        state: league.state,
        city: league.city,
        address: league.address,
      };

      const { error } = await supabase.from('league_edit_requests').insert({
        league_registration_id: league.id,
        previous_data,
        requested_data,
        status: 'pending_approval',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Edit request sent to Super Admin for approval');
      qc.invalidateQueries({ queryKey: ['league-details', leagueId] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not submit edit request'),
  });

  if (!league) {
    return (
      <RoleGuard allow="league_owner" requireApproved={false}>
        <p className="text-sm text-muted-foreground">Loading league...</p>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allow="league_owner" requireApproved={false}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{league.league_name}</h1>
            <p className="text-muted-foreground">
              View league details and request safe edits.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/dashboard/league">Back to dashboard</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Editable League Details</CardTitle>
          </CardHeader>

          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                submitEditRequest.mutate(new FormData(e.currentTarget));
              }}
            >
              <Field name="league_name" label="League Name" defaultValue={league.league_name || ''} />
              <Field name="short_name" label="Short Name" defaultValue={league.short_name || ''} />
              <Field name="slogan" label="Slogan" defaultValue={league.slogan || ''} />
              <Field name="phone" label="Phone" defaultValue={league.phone || ''} />
              <Field name="country" label="Country" defaultValue={league.country || ''} />
              <Field name="state" label="State" defaultValue={league.state || ''} />
              <Field name="city" label="City" defaultValue={league.city || ''} />
              <Field name="address" label="Address" defaultValue={league.address || ''} />

              <div className="md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  name="league_description"
                  rows={4}
                  defaultValue={league.league_description || ''}
                />
              </div>

              <Button className="md:col-span-2" disabled={submitEditRequest.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Submit edit request
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Locked Details</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-3 md:grid-cols-3">
            <Locked label="League ID" value={league.id} />
            <Locked label="Approval Status" value={league.status} />
            <Locked label="Created At" value={league.created_at} />
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, ...inputProps } = props;

  return (
    <div>
      <Label>{label}</Label>
      <Input {...inputProps} />
    </div>
  );
}

function Locked({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-all font-medium">{value || 'Not available'}</p>
    </div>
  );
}
