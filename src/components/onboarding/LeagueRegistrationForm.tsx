import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formats = ['3-aside', '4-aside', '5-aside', '7-aside', '8-aside', '9-aside', '11-aside'];

const automationKeys = [
  'auto_fixtures',
  'auto_standings',
  'auto_statistics',
  'auto_brackets',
];

const graphicsKeys = [
  'scoreboard',
  'halftime_stats',
  'fulltime_stats',
  'substitution',
  'cards',
  'goals',
  'announcements',
  'formations',
  'replay',
];

type Uploads = {
  logo_url?: string;
  banner_url?: string;
  intro_video_url?: string;
  anthem_url?: string;
  replay_transition_url?: string;
};

export function LeagueRegistrationForm() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [saving, setSaving] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['5-aside']);
  const [uploads, setUploads] = useState<Uploads>({});

  function setUpload(key: keyof Uploads, url: string) {
    setUploads((current) => ({ ...current, [key]: url }));
  }

  function toggleFormat(format: string) {
    setSelectedFormats((current) =>
      current.includes(format)
        ? current.filter((item) => item !== format)
        : [...current, format],
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!user) {
      toast.error('You must be signed in to register a league.');
      return;
    }

    if (!uploads.logo_url) {
      toast.error('Please upload a league logo.');
      return;
    }

    if (!uploads.banner_url) {
      toast.error('Please upload a league banner.');
      return;
    }

    if (selectedFormats.length === 0) {
      toast.error('Select at least one football format.');
      return;
    }

    const fd = new FormData(e.currentTarget);
    setSaving(true);

    try {
      const automation = Object.fromEntries(
        automationKeys.map((key) => [key, fd.get(key) === 'on']),
      );

      const graphics_preferences = {
        use_platform_graphics: fd.get('use_platform_graphics') === 'on',
        custom: Object.fromEntries(
          graphicsKeys.map((key) => [key, fd.get(`custom_${key}`) === 'on']),
        ),
      };

      const payload = {
        owner_id: user.id,
        status: 'pending_payment',

        league_name: String(fd.get('league_name') || '').trim(),
        short_name: String(fd.get('short_name') || '').trim(),
        description: String(fd.get('description') || '').trim(),
        sport_type: String(fd.get('sport_type') || 'football').trim(),

        logo_url: uploads.logo_url,
        banner_url: uploads.banner_url,
        intro_video_url: uploads.intro_video_url || null,
        anthem_url: uploads.anthem_url || null,
        slogan: String(fd.get('slogan') || '').trim(),

        owner_full_name: String(fd.get('owner_full_name') || '').trim(),
        organization_name: String(fd.get('organization_name') || '').trim(),
        owner_email: String(fd.get('owner_email') || user.email || '').trim(),
        owner_phone: String(fd.get('owner_phone') || '').trim(),
        country: String(fd.get('country') || '').trim(),
        state: String(fd.get('state') || '').trim(),
        city: String(fd.get('city') || '').trim(),
        address: String(fd.get('address') || '').trim(),

        opening_date: String(fd.get('opening_date') || ''),
        closing_date: String(fd.get('closing_date') || ''),
        team_registration_deadline: String(fd.get('team_registration_deadline') || ''),
        expected_teams: Number(fd.get('expected_teams') || 0),
        competition_type: String(fd.get('competition_type') || 'league'),

        football_formats: selectedFormats,
        venue_mode: String(fd.get('venue_mode') || 'single'),
        venues: [
          {
            name: fd.get('venue_name'),
            address: fd.get('venue_address'),
            gps: fd.get('venue_gps'),
            capacity: fd.get('venue_capacity'),
            indoor_outdoor: fd.get('indoor_outdoor'),
            surface_type: fd.get('surface_type'),
          },
        ],

        rules_text: String(fd.get('rules_text') || '').trim(),
        rules_file_url: String(fd.get('rules_file_url') || '').trim(),

        documents: String(fd.get('documents') || '')
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),

        branding_assets: {
          replay_transition: uploads.replay_transition_url || null,
          sponsor_logos: String(fd.get('sponsor_logos') || '')
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
        },

        graphics_preferences,
        automation,

        subscription_plan: String(fd.get('subscription_plan') || 'starter'),
        billing_mode: String(fd.get('billing_mode') || 'monthly'),
      };

      const { error } = await supabase.from('league_registrations').insert(payload);

      if (error) throw error;

      toast.success('League registration saved. Continue payment, then Super Admin approval.');
      e.currentTarget.reset();
      setUploads({});
      setSelectedFormats(['5-aside']);
      qc.invalidateQueries({ queryKey: ['league-registrations'] });
    } catch (err) {
      console.error('League registration error:', err);
      toast.error(err instanceof Error ? err.message : 'Could not save league');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register League</CardTitle>
      </CardHeader>

      <CardContent>
        <form className="space-y-8" onSubmit={submit}>
          <Section title="Basic League Information">
            <Field name="league_name" label="League Name" required />
            <Field name="short_name" label="Short Name" />
            <Field name="sport_type" label="Sport Type" defaultValue="football" required />

            <UploadField
              bucket="league-assets"
              folder="logos"
              label="League Logo"
              accept="image/*"
              value={uploads.logo_url}
              onUploaded={(url) => setUpload('logo_url', url)}
            />

            <UploadField
              bucket="league-assets"
              folder="banners"
              label="League Banner"
              accept="image/*"
              value={uploads.banner_url}
              onUploaded={(url) => setUpload('banner_url', url)}
            />

            <UploadField
              bucket="league-assets"
              folder="intro-videos"
              label="Intro Video"
              accept="video/*"
              value={uploads.intro_video_url}
              onUploaded={(url) => setUpload('intro_video_url', url)}
            />

            <UploadField
              bucket="league-assets"
              folder="anthems"
              label="Anthem / Audio"
              accept="audio/*,video/*"
              value={uploads.anthem_url}
              onUploaded={(url) => setUpload('anthem_url', url)}
            />

            <Field name="slogan" label="Slogan" />

            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea name="description" required rows={4} />
            </div>
          </Section>

          <Section title="Ownership Information">
            <Field name="owner_full_name" label="Owner Full Name" required />
            <Field name="organization_name" label="Organization Name" />
            <Field name="owner_email" label="Email" type="email" required />
            <Field name="owner_phone" label="Phone" required />
            <Field name="country" label="Country" required />
            <Field name="state" label="State" required />
            <Field name="city" label="City" required />
            <Field name="address" label="Address" required />
          </Section>

          <Section title="Competition Information">
            <Field name="opening_date" label="Opening Date" type="date" required />
            <Field name="closing_date" label="Closing Date" type="date" required />
            <Field name="team_registration_deadline" label="Team Registration Deadline" type="date" required />
            <Field name="expected_teams" label="Expected Teams" type="number" required />
            <SelectField name="competition_type" label="Competition Type" values={['league', 'knockout', 'cup', 'hybrid']} />
            <SelectField name="venue_mode" label="Venue Mode" values={['single', 'multiple']} />
          </Section>

          <div>
            <h3 className="mb-3 font-semibold">Football Formats</h3>
            <div className="flex flex-wrap gap-2">
              {formats.map((format) => (
                <label key={format} className="rounded border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedFormats.includes(format)}
                    onChange={() => toggleFormat(format)}
                    className="mr-2"
                  />
                  {format}
                </label>
              ))}
            </div>
          </div>

          <Section title="Venue">
            <Field name="venue_name" label="Venue Name" />
            <Field name="venue_address" label="Venue Address" />
            <Field name="venue_gps" label="GPS" />
            <Field name="venue_capacity" label="Capacity" type="number" />
            <SelectField name="indoor_outdoor" label="Indoor / Outdoor" values={['outdoor', 'indoor']} />
            <SelectField name="surface_type" label="Surface Type" values={['grass', 'turf', 'indoor court', 'hard floor']} />
          </Section>

          <div>
            <Label>League Rules</Label>
            <Textarea name="rules_text" rows={5} />
          </div>

          <Field name="rules_file_url" label="Rules File URL" />

          <div>
            <Label>Optional Document URLs, one per line</Label>
            <Textarea name="documents" rows={3} />
          </div>

          <div>
            <Label>Sponsor Logo URLs, one per line</Label>
            <Textarea name="sponsor_logos" rows={3} />
          </div>

          <UploadField
            bucket="league-assets"
            folder="replay-transitions"
            label="Replay Transition"
            accept="image/*,video/*"
            value={uploads.replay_transition_url}
            onUploaded={(url) => setUpload('replay_transition_url', url)}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Graphics Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <label className="block text-sm">
                  <input name="use_platform_graphics" type="checkbox" defaultChecked className="mr-2" />
                  Use Platform Graphics
                </label>

                {graphicsKeys.map((key) => (
                  <label key={key} className="block text-sm">
                    <input name={`custom_${key}`} type="checkbox" className="mr-2" />
                    Custom {key.replace(/_/g, ' ')}
                  </label>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Automation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {automationKeys.map((key) => (
                  <label key={key} className="block text-sm">
                    <input name={key} type="checkbox" className="mr-2" />
                    {key.replace(/_/g, ' ')}
                  </label>
                ))}
              </CardContent>
            </Card>
          </div>

          <Section title="Subscription and Billing">
            <SelectField name="subscription_plan" label="Plan" values={['starter', 'professional', 'elite']} />
            <SelectField name="billing_mode" label="Billing Mode" values={['monthly', 'league_duration', 'annual']} />
          </Section>

          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save league registration'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function UploadField({
  bucket,
  folder,
  label,
  accept,
  value,
  onUploaded,
}: {
  bucket: string;
  folder: string;
  label: string;
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
            const url = await uploadFile(bucket, file, folder);
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
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

function SelectField({ name, label, values }: { name: string; label: string; values: string[] }) {
  return (
    <div>
      <Label>{label}</Label>
      <Select name={name} defaultValue={values[0]}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {values.map((value) => (
            <SelectItem key={value} value={value}>
              {value.replace(/_/g, ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
