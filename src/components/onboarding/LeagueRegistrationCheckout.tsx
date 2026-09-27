import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type CatalogRow = { plan_id: string; code: string; name: string; description: string; currency: string; max_teams: number | null; max_matches: number | null; max_live_matches: number | null; features: Record<string, string>; duration_id: string; duration_label: string; duration_months: number | null; price: number; discount_amount: number };

const initial = { league_name: '', description: '', owner_full_name: '', owner_email: '', owner_phone: '', country: '', state: '', city: '', address: '', expected_teams: 8, competition_type: 'league', fixture_format: 'home_away', opening_date: '', closing_date: '', team_registration_deadline: '' };

export function LeagueRegistrationCheckout() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial);
  const [selection, setSelection] = useState<{ planId: string; durationId: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const catalog = useQuery({
    queryKey: ['public-league-subscription-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_public_league_subscription_plans' as never);
      if (error) throw error;
      return (data ?? []) as unknown as CatalogRow[];
    },
  });
  const matches = useMemo(() => {
    const teams = Math.max(Number(form.expected_teams) || 0, 0);
    return form.fixture_format === 'home_away' ? teams * Math.max(teams - 1, 0) : (teams * Math.max(teams - 1, 0)) / 2;
  }, [form.expected_teams, form.fixture_format]);
  const selected = catalog.data?.find((item) => item.plan_id === selection?.planId && item.duration_id === selection?.durationId);
  const plans = useMemo(() => [...new Map((catalog.data ?? []).map((item) => [item.plan_id, item])).values()], [catalog.data]);

  function update<K extends keyof typeof initial>(key: K, value: (typeof initial)[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function next() {
    if (step === 1 && (!form.league_name || !form.owner_full_name || !form.owner_email || !form.owner_phone || !form.country || !form.state || !form.city || !form.address || !form.opening_date || !form.closing_date)) return toast.error('Complete all required league and owner details.');
    if (step === 2 && !selection) return toast.error('Select a subscription plan and duration.');
    setStep((current) => Math.min(current + 1, 3));
  }
  async function createOrder() {
    if (!selected) return;
    setSaving(true);
    try {
      const payload = { ...form, expected_teams: Number(form.expected_teams), expected_matches: matches, football_format: '11-aside' };
      const { data, error } = await supabase.rpc('create_league_registration_order' as never, { p_payload: payload, p_plan_id: selected.plan_id, p_duration_id: selected.duration_id } as never);
      if (error) throw error;
      const order = (data as unknown as Array<{ public_token: string }> | null)?.[0];
      if (!order?.public_token) throw new Error('The registration order could not be created.');
      window.location.assign(`/register/payment?order=${encodeURIComponent(order.public_token)}`);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not create registration order.'); } finally { setSaving(false); }
  }

  return <Card><CardHeader><CardTitle>League Registration</CardTitle><p className="text-sm text-muted-foreground">Step {step} of 3</p></CardHeader><CardContent className="space-y-6">
    {step === 1 && <div className="grid gap-4 md:grid-cols-2">
      <Field label="League name" value={form.league_name} onChange={(value) => update('league_name', value)} required />
      <Field label="League type" value={form.competition_type} onChange={(value) => update('competition_type', value)} />
      <Field label="Owner full name" value={form.owner_full_name} onChange={(value) => update('owner_full_name', value)} required />
      <Field label="Owner email" type="email" value={form.owner_email} onChange={(value) => update('owner_email', value)} required />
      <Field label="Owner phone" value={form.owner_phone} onChange={(value) => update('owner_phone', value)} required />
      <Field label="Country" value={form.country} onChange={(value) => update('country', value)} required />
      <Field label="State / region" value={form.state} onChange={(value) => update('state', value)} required />
      <Field label="City" value={form.city} onChange={(value) => update('city', value)} required />
      <Field label="Address" value={form.address} onChange={(value) => update('address', value)} required />
      <Field label="Competition start" type="date" value={form.opening_date} onChange={(value) => update('opening_date', value)} required />
      <Field label="Competition end" type="date" value={form.closing_date} onChange={(value) => update('closing_date', value)} required />
      <Field label="Team registration deadline" type="date" value={form.team_registration_deadline} onChange={(value) => update('team_registration_deadline', value)} />
      <div><Label>Number of teams</Label><Input type="number" min={2} value={form.expected_teams} onChange={(event) => update('expected_teams', Number(event.target.value))} /></div>
      <div><Label>Fixture format</Label><Select value={form.fixture_format} onValueChange={(value) => update('fixture_format', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="home_away">Home & away</SelectItem><SelectItem value="single_round">Single round robin</SelectItem></SelectContent></Select></div>
      <div className="md:col-span-2"><Label>Additional information</Label><Textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows={3} /></div>
      <div className="md:col-span-2 rounded-md border bg-muted/30 p-4 text-sm"><strong>{matches}</strong> estimated league matches / {form.fixture_format === 'home_away' ? Math.max(Number(form.expected_teams) - 1, 0) * 2 : Math.max(Number(form.expected_teams) - 1, 0)} matches per team.</div>
    </div>}
    {step === 2 && <div className="space-y-4"><p className="text-sm text-muted-foreground">Only active plans that can cover your league are available.</p>{catalog.isLoading ? <p>Loading plans...</p> : <div className="grid gap-3 md:grid-cols-2">{plans.map((plan) => { const eligible = !plan.max_teams || (Number(form.expected_teams) <= plan.max_teams && (!plan.max_matches || matches <= plan.max_matches)); const durations = (catalog.data ?? []).filter((item) => item.plan_id === plan.plan_id); return <div key={plan.plan_id} className="rounded-md border p-4"><h3 className="font-semibold">{plan.name}</h3><p className="mt-1 text-sm text-muted-foreground">{plan.description}</p><p className="mt-2 text-xs">{eligible ? `Up to ${plan.max_teams ?? 'custom'} teams / ${plan.max_matches ?? 'custom'} matches` : 'Upgrade required for this league'}</p><div className="mt-3 flex flex-wrap gap-2">{durations.map((duration) => <Button key={duration.duration_id} type="button" size="sm" variant={selection?.durationId === duration.duration_id ? 'default' : 'outline'} disabled={!eligible} onClick={() => setSelection({ planId: plan.plan_id, durationId: duration.duration_id })}>{duration.duration_label}</Button>)}</div></div>; })}</div>}</div>}
    {step === 3 && selected && <div className="space-y-4"><div className="rounded-md border p-4"><h3 className="font-semibold">Order Summary</h3><dl className="mt-3 grid gap-2 text-sm md:grid-cols-2"><div><dt className="text-muted-foreground">League</dt><dd>{form.league_name}</dd></div><div><dt className="text-muted-foreground">Subscription</dt><dd>{selected.name} / {selected.duration_label}</dd></div><div><dt className="text-muted-foreground">League demand</dt><dd>{form.expected_teams} teams / {matches} matches</dd></div><div><dt className="text-muted-foreground">Total</dt><dd>{selected.currency} {Number(selected.price - selected.discount_amount).toLocaleString()}</dd></div></dl></div><p className="text-sm text-muted-foreground">Payment verification is server-controlled. A pending payment lets you continue to sign up after the waiting window, but never activates platform access.</p></div>}
    <div className="flex justify-between"><Button type="button" variant="outline" disabled={step === 1} onClick={() => setStep((current) => current - 1)}><ChevronLeft className="mr-1 h-4 w-4" />Back</Button>{step < 3 ? <Button type="button" onClick={next}>Continue<ChevronRight className="ml-1 h-4 w-4" /></Button> : <Button type="button" disabled={saving} onClick={createOrder}><CreditCard className="mr-2 h-4 w-4" />{saving ? 'Creating order...' : 'Proceed to payment'}</Button>}</div>
  </CardContent></Card>;
}
function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <div><Label>{label}{required ? ' *' : ''}</Label><Input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></div>; }
