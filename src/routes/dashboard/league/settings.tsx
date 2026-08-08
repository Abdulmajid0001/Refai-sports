import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import type { InputHTMLAttributes } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { uploadFile } from '@/lib/upload';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const Route = createFileRoute('/dashboard/league/settings')({
  component: LeagueSettingsPage,
});

function LeagueSettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: leagues } = useQuery({
    queryKey: ['league-owner-leagues', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_registrations')
        .select('*')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const league = leagues?.[0] as any | undefined;

  const updateLeague = useMutation({
    mutationFn: async (form: FormData) => {
      if (!league?.id) throw new Error('Create a league first');

      const payload = {
        league_name: String(form.get('league_name') || '').trim(),
        short_name: String(form.get('short_name') || '').trim(),
        league_description: String(form.get('league_description') || '').trim(),
        slogan: String(form.get('slogan') || '').trim(),
        phone: String(form.get('phone') || '').trim(),
        country: String(form.get('country') || '').trim(),
        state: String(form.get('state') || '').trim(),
        city: String(form.get('city') || '').trim(),
        address: String(form.get('address') || '').trim(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('league_registrations')
        .update(payload)
        .eq('id', league.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('League settings saved');
      qc.invalidateQueries({ queryKey: ['league-owner-leagues'] });
      qc.invalidateQueries({ queryKey: ['league-registrations'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save settings'),
  });

  async function uploadAsset(file: File, column: string, folder: string) {
    if (!league?.id) {
      toast.error('Create a league first');
      return;
    }

    try {
      const url = await uploadFile('league-assets', file, folder);

      const { error } = await supabase
        .from('league_registrations')
        .update({ [column]: url })
        .eq('id', league.id);

      if (error) throw error;

      toast.success('Asset updated');
      qc.invalidateQueries({ queryKey: ['league-owner-leagues'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    }
  }

  return (
    <RoleGuard allow="league_owner" requireApproved={false}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Edit safe league details. System generated records, history, standings and wallet ledger remain locked.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/dashboard/league">Back to dashboard</Link>
          </Button>
        </div>

        {!league ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Create a league before editing settings.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Editable League Details</CardTitle>
              </CardHeader>

              <CardContent>
                <form
                  className="grid gap-4 md:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateLeague.mutate(new FormData(e.currentTarget));
                  }}
                >
                  <Field name="league_name" label="League Name" defaultValue={league.league_name || ''} required />
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

                  <Button className="md:col-span-2" disabled={updateLeague.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    Save settings
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Branding Uploads</CardTitle>
              </CardHeader>

              <CardContent className="grid gap-4 md:grid-cols-3">
                <Upload label="Logo" accept="image/*" onFile={(file) => uploadAsset(file, 'logo_url', 'logos')} />
                <Upload label="Banner" accept="image/*" onFile={(file) => uploadAsset(file, 'banner_url', 'banners')} />
                <Upload label="Intro Video" accept="video/*" onFile={(file) => uploadAsset(file, 'intro_video_url', 'videos')} />
                <Upload label="Anthem" accept="audio/*" onFile={(file) => uploadAsset(file, 'anthem_url', 'audio')} />
                <Upload label="Replay Transition" accept="video/*,image/*" onFile={(file) => uploadAsset(file, 'replay_transition_url', 'graphics')} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Locked Details</CardTitle>
              </CardHeader>

              <CardContent className="grid gap-3 text-sm md:grid-cols-3">
                <Locked label="League ID" value={league.id} />
                <Locked label="Status" value={league.status} />
                <Locked label="Created At" value={league.created_at} />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </RoleGuard>
  );
}

function Field(props: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, ...inputProps } = props;

  return (
    <div>
      <Label>{label}</Label>
      <Input {...inputProps} />
    </div>
  );
}

function Upload({
  label,
  accept,
  onFile,
}: {
  label: string;
  accept: string;
  onFile: (file: File) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
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
