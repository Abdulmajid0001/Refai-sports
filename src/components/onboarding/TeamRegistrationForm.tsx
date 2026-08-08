import { useState } from 'react';
import type { FormEvent, InputHTMLAttributes, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { uploadFile } from '@/lib/upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type TeamUploads = {
  logo_url?: string;
  badge_url?: string;
  banner_url?: string;
  home_shirt_front?: string;
  home_shirt_back?: string;
  home_shorts?: string;
  home_socks?: string;
  away_shirt_front?: string;
  away_shirt_back?: string;
  away_shorts?: string;
  away_socks?: string;
  third_shirt_front?: string;
  third_shirt_back?: string;
  third_shorts?: string;
  third_socks?: string;
};

export function TeamRegistrationForm() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState<TeamUploads>({});

  function setUpload(key: keyof TeamUploads, url: string) {
    setUploads((current) => ({ ...current, [key]: url }));
  }

 async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!user) {
      toast.error('You must be signed in to register a team.');
      return;
    }

    if (!uploads.logo_url) {
      toast.error('Please upload a team logo.');
      return;
    }

    if (!uploads.home_shirt_front || !uploads.home_shirt_back || !uploads.home_shorts || !uploads.home_socks) {
      toast.error('Please upload all required home kit images.');
      return;
    }

    if (!uploads.away_shirt_front || !uploads.away_shirt_back || !uploads.away_shorts || !uploads.away_socks) {
      toast.error('Please upload all required away kit images.');
      return;
    }

    const fd = new FormData(e.currentTarget);
    setSaving(true);

    try {
      const inviteToken = String(fd.get('invite_token') || '').trim();

      const { data: invite, error: inviteError } = await supabase
        .from('team_invites')
        .select('*')
        .eq('token', inviteToken)
        .maybeSingle();

      if (inviteError) throw inviteError;
      if (!invite) throw new Error('Invalid invite token');
      if (invite.used_at) throw new Error('This invite token has already been used');

      const jerseys = {
        home: {
          shirt_front: uploads.home_shirt_front,
          shirt_back: uploads.home_shirt_back,
          shorts: uploads.home_shorts,
          socks: uploads.home_socks,
          colors: fd.get('home_colors'),
        },
        away: {
          shirt_front: uploads.away_shirt_front,
          shirt_back: uploads.away_shirt_back,
          shorts: uploads.away_shorts,
          socks: uploads.away_socks,
          colors: fd.get('away_colors'),
        },
        third: {
          shirt_front: uploads.third_shirt_front || null,
          shirt_back: uploads.third_shirt_back || null,
          shorts: uploads.third_shorts || null,
          socks: uploads.third_socks || null,
          colors: fd.get('third_colors'),
        },
      };

      const payload = {
        league_registration_id: invite.league_registration_id,
        invite_id: invite.id,
        owner_id: user.id,
        status: 'pending_approval',

        team_name: String(fd.get('team_name') || '').trim(),
        short_name: String(fd.get('short_name') || '').trim(),
        logo_url: uploads.logo_url,
        badge_url: uploads.badge_url || null,
        banner_url: uploads.banner_url || null,
        motto: String(fd.get('motto') || '').trim(),
        description: String(fd.get('description') || '').trim(),

        owner_name: String(fd.get('owner_name') || '').trim(),
        owner_email: String(fd.get('owner_email') || user.email || '').trim(),
        owner_phone: String(fd.get('owner_phone') || '').trim(),

        head_coach: String(fd.get('head_coach') || '').trim(),
        assistant_coach: String(fd.get('assistant_coach') || '').trim(),
        team_manager: String(fd.get('team_manager') || '').trim(),
        medical_staff: String(fd.get('medical_staff') || '').trim(),

        sponsor_logos: String(fd.get('sponsor_logos') || '')
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),

        jerseys,

        home_ground: String(fd.get('home_ground') || '').trim(),
        training_ground: String(fd.get('training_ground') || '').trim(),
      };

      const { error } = await supabase.from('team_registrations').insert(payload);

      if (error) throw error;

      await supabase
        .from('team_invites')
        .update({ used_at: new Date().toISOString() })
        .eq('id', invite.id);

      toast.success('Team submitted for league owner approval');
      e.currentTarget.reset();
      setUploads({});
      qc.invalidateQueries({ queryKey: ['team-registrations'] });
    } catch (err) {
      console.error('Team registration error:', err);
      toast.error(err instanceof Error ? err.message : 'Could not register team');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register Team From Invite</CardTitle>
      </CardHeader>

      <CardContent>
        <form className="space-y-8" onSubmit={submit}>
          <Section title="Invite">
            <Field name="invite_token" label="League Invite Token" required />
          </Section>

          <Section title="Team Identity">
            <Field name="team_name" label="Team Name" required />
            <Field name="short_name" label="Short Name" required />

            <UploadField
              label="Team Logo"
              folder="logos"
              accept="image/*"
              value={uploads.logo_url}
              onUploaded={(url) => setUpload('logo_url', url)}
            />

            <UploadField
              label="Team Badge"
              folder="badges"
              accept="image/*"
              value={uploads.badge_url}
              onUploaded={(url) => setUpload('badge_url', url)}
            />

            <UploadField
              label="Team Banner"
              folder="banners"
              accept="image/*"
              value={uploads.banner_url}
              onUploaded={(url) => setUpload('banner_url', url)}
            />

            <Field name="motto" label="Motto" />

            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea name="description" rows={3} />
            </div>
          </Section>

          <Section title="Ownership">
            <Field name="owner_name" label="Team Owner Name" required />
            <Field name="owner_email" label="Email" type="email" required />
            <Field name="owner_phone" label="Phone" required />
          </Section>

          <Section title="Staff">
            <Field name="head_coach" label="Head Coach" required />
            <Field name="assistant_coach" label="Assistant Coach" />
            <Field name="team_manager" label="Team Manager" required />
            <Field name="medical_staff" label="Medical Staff" />
          </Section>

          <Section title="Branding">
            <div className="md:col-span-2">
              <Label>Sponsor Logo URLs, one per line</Label>
              <Textarea name="sponsor_logos" rows={3} />
            </div>
          </Section>

          <Section title="Home Kit">
            <UploadField label="Home Shirt Front" folder="kits/home" accept="image/*" value={uploads.home_shirt_front} onUploaded={(url) => setUpload('home_shirt_front', url)} />
            <UploadField label="Home Shirt Back" folder="kits/home" accept="image/*" value={uploads.home_shirt_back} onUploaded={(url) => setUpload('home_shirt_back', url)} />
            <UploadField label="Home Shorts" folder="kits/home" accept="image/*" value={uploads.home_shorts} onUploaded={(url) => setUpload('home_shorts', url)} />
            <UploadField label="Home Socks" folder="kits/home" accept="image/*" value={uploads.home_socks} onUploaded={(url) => setUpload('home_socks', url)} />
            <Field name="home_colors" label="Home Kit Colors" required />
          </Section>

          <Section title="Away Kit">
            <UploadField label="Away Shirt Front" folder="kits/away" accept="image/*" value={uploads.away_shirt_front} onUploaded={(url) => setUpload('away_shirt_front', url)} />
            <UploadField label="Away Shirt Back" folder="kits/away" accept="image/*" value={uploads.away_shirt_back} onUploaded={(url) => setUpload('away_shirt_back', url)} />
            <UploadField label="Away Shorts" folder="kits/away" accept="image/*" value={uploads.away_shorts} onUploaded={(url) => setUpload('away_shorts', url)} />
            <UploadField label="Away Socks" folder="kits/away" accept="image/*" value={uploads.away_socks} onUploaded={(url) => setUpload('away_socks', url)} />
            <Field name="away_colors" label="Away Kit Colors" required />
          </Section>

          <Section title="Third / Special Kit">
            <UploadField label="Third Shirt Front" folder="kits/third" accept="image/*" value={uploads.third_shirt_front} onUploaded={(url) => setUpload('third_shirt_front', url)} />
            <UploadField label="Third Shirt Back" folder="kits/third" accept="image/*" value={uploads.third_shirt_back} onUploaded={(url) => setUpload('third_shirt_back', url)} />
            <UploadField label="Third Shorts" folder="kits/third" accept="image/*" value={uploads.third_shorts} onUploaded={(url) => setUpload('third_shorts', url)} />
            <UploadField label="Third Socks" folder="kits/third" accept="image/*" value={uploads.third_socks} onUploaded={(url) => setUpload('third_socks', url)} />
            <Field name="third_colors" label="Third Kit Colors" />
          </Section>

          <Section title="Team Venue">
            <Field name="home_ground" label="Home Ground" />
            <Field name="training_ground" label="Training Ground" />
          </Section>

          <Button disabled={saving}>
            {saving ? 'Submitting...' : 'Submit team for approval'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function UploadField({
  label,
  folder,
  accept,
  value,
  onUploaded,
}: {
  label: string;
  folder: string;
  accept: string;
  value?: string;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="file"
        accept={accept}
        disabled={uploading}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          setUploading(true);
          try {
            const url = await uploadFile('team-assets', file, folder);
            onUploaded(url);
            toast.success(`${label} uploaded`);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Upload failed');
          } finally {
            setUploading(false);
          }
        }}
      />
      {uploading && <p className="mt-1 text-xs text-muted-foreground">Uploading...</p>}
      {value && <p className="mt-1 truncate text-xs text-emerald-600">Uploaded</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
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
