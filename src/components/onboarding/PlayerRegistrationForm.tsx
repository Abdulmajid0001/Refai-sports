import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function PlayerRegistrationForm({ teamId }: { teamId: string | null }) {
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!teamId) return toast.error('Register a team before adding players');
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const media = { home: { standing_video: fd.get('home_standing_video'), celebration_video: fd.get('home_celebration_video') }, away: { standing_video: fd.get('away_standing_video'), celebration_video: fd.get('away_celebration_video') }, third: { standing_video: fd.get('third_standing_video'), celebration_video: fd.get('third_celebration_video') } };
      const { error } = await supabase.from('player_registrations').insert({ team_registration_id: teamId, full_name: String(fd.get('full_name') || ''), passport_photo_url: String(fd.get('passport_photo_url') || ''), full_body_photo_url: String(fd.get('full_body_photo_url') || ''), jersey_number: Number(fd.get('jersey_number') || 0), dob: String(fd.get('dob') || ''), nationality: String(fd.get('nationality') || ''), position: String(fd.get('position') || ''), preferred_foot: String(fd.get('preferred_foot') || 'right'), height_cm: Number(fd.get('height_cm') || 0) || null, weight_kg: Number(fd.get('weight_kg') || 0) || null, contract_info: String(fd.get('contract_info') || ''), emergency_contact: String(fd.get('emergency_contact') || ''), media });
      if (error) throw error;
      toast.success('Player added');
      e.currentTarget.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add player');
    } finally {
      setSaving(false);
    }
  }

  return <Card><CardHeader><CardTitle>Player Registration</CardTitle></CardHeader><CardContent><form className="space-y-6" onSubmit={submit}><div className="grid gap-4 md:grid-cols-2"><Field name="full_name" label="Full Name" required /><Field name="jersey_number" label="Jersey Number" type="number" min={1} max={99} required /><Field name="dob" label="Date of Birth" type="date" required /><Field name="nationality" label="Nationality" required /><Field name="position" label="Position" required /><div><Label>Preferred Foot</Label><Select name="preferred_foot" defaultValue="right"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="right">Right</SelectItem><SelectItem value="both">Both</SelectItem></SelectContent></Select></div><Field name="height_cm" label="Height (cm)" type="number" /><Field name="weight_kg" label="Weight (kg)" type="number" /><Field name="passport_photo_url" label="Passport Photo URL" /><Field name="full_body_photo_url" label="Full Body Photo URL" /></div><div className="grid gap-4 md:grid-cols-2"><Field name="home_standing_video" label="Home Standing Video URL" /><Field name="home_celebration_video" label="Home Celebration Video URL" /><Field name="away_standing_video" label="Away Standing Video URL" /><Field name="away_celebration_video" label="Away Celebration Video URL" /><Field name="third_standing_video" label="Third Standing Video URL" /><Field name="third_celebration_video" label="Third Celebration Video URL" /></div><div><Label>Contract Info</Label><Textarea name="contract_info" rows={2} /></div><div><Label>Emergency Contact</Label><Textarea name="emergency_contact" rows={2} /></div><Button disabled={saving || !teamId}>{saving ? 'Saving...' : 'Add player'}</Button></form></CardContent></Card>;
}
function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) { const { label, ...inputProps } = props; return <div><Label>{label}</Label><Input {...inputProps} /></div>; }
