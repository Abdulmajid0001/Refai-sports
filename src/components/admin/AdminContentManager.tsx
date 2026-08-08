import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mail, Megaphone, MonitorPlay, Plus, Trash2 } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { uploadFile } from '@/lib/upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AdminContentManager() {
  return (
    <Tabs defaultValue="slideshow">
      <TabsList className="grid grid-cols-5 bg-slate-950">
        <TabsTrigger value="slideshow">Slideshow</TabsTrigger>
        <TabsTrigger value="ads">Ads</TabsTrigger>
        <TabsTrigger value="adsense">AdSense</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
      </TabsList>

      <TabsContent value="slideshow"><SlideshowAdmin /></TabsContent>
      <TabsContent value="ads"><AdsAdmin /></TabsContent>
      <TabsContent value="adsense"><AdSenseAdmin /></TabsContent>
      <TabsContent value="notifications"><NotificationsAdmin /></TabsContent>
      <TabsContent value="email"><EmailAdmin /></TabsContent>
    </Tabs>
  );
}

function SlideshowAdmin() {
  const { profile } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['admin-slideshow-items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('slideshow_items').select('*').order('position');
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (form: FormData) => {
      const file = form.get('media') as File;
      if (!file?.size) throw new Error('Upload image or video first');
      const mediaType = file.type.startsWith('video') ? 'video' : 'image';
      const mediaUrl = await uploadFile('broadcast-assets', file, 'slideshow');

      const { error } = await supabase.from('slideshow_items').insert({
        title: String(form.get('title') || '').trim(),
        subtitle: String(form.get('subtitle') || '').trim(),
        media_url: mediaUrl,
        media_type: mediaType,
        link_url: String(form.get('link_url') || '').trim() || null,
        position: Number(form.get('position') || 0),
        is_active: true,
        created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Slideshow item added');
      qc.invalidateQueries({ queryKey: ['admin-slideshow-items'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not add slideshow item'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('slideshow_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Slideshow item removed');
      qc.invalidateQueries({ queryKey: ['admin-slideshow-items'] });
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('slideshow_items').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-slideshow-items'] }),
  });

  return (
    <Card className="border-emerald-900 bg-slate-950 text-white">
      <CardHeader><CardTitle className="flex items-center gap-2"><MonitorPlay /> Slideshow Control</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); create.mutate(new FormData(e.currentTarget)); e.currentTarget.reset(); }}>
          <Field name="title" label="Title" />
          <Field name="subtitle" label="Subtitle" />
          <Field name="link_url" label="Optional Link URL" />
          <Field name="position" label="Position" type="number" defaultValue={0} />
          <div><Label>Image or Video</Label><Input name="media" type="file" accept="image/*,video/*" required /></div>
          <Button className="md:col-span-2" disabled={create.isPending}><Plus className="mr-2 h-4 w-4" />Add slideshow item</Button>
        </form>

        {(q.data ?? []).map((item: any) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-emerald-900 p-3">
            <div>
              <p className="font-medium">{item.title || 'Untitled'}</p>
              <p className="text-xs text-slate-400">{item.media_type} / {item.is_active ? 'active' : 'hidden'}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => toggle.mutate({ id: item.id, is_active: !item.is_active })}>{item.is_active ? 'Hide' : 'Show'}</Button>
              <Button size="sm" variant="outline" asChild><a href={item.media_url} target="_blank" rel="noreferrer">Open</a></Button>
              <Button size="sm" variant="destructive" onClick={() => remove.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AdsAdmin() {
  const { profile } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['admin-site-ads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_ads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (form: FormData) => {
      const file = form.get('media') as File;
      const media_url = file?.size ? await uploadFile('broadcast-assets', file, 'site-ads') : null;

      const { error } = await supabase.from('site_ads').insert({
      name: String(form.get('name') || '').trim(),
      page_path: String(form.get('page_path') || '*').trim(),
      page_group: String(form.get('page_group') || 'all').trim(),
      placement: String(form.get('placement') || 'banner').trim(),
      display_type: String(form.get('display_type') || 'banner').trim(),
      size: String(form.get('size') || 'responsive').trim(),
      animation_type: String(form.get('animation_type') || 'none').trim(),
      text_content: String(form.get('text_content') || '').trim() || null,
      media_url,
      html_code: String(form.get('html_code') || '').trim() || null,
      destination_url: String(form.get('destination_url') || '').trim() || null,
      show_on_all_pages: form.get('show_on_all_pages') === 'on',
      closeable: form.get('closeable') === 'on',
      is_active: form.get('is_active') === 'on',
      created_by: profile?.id,
      approved_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Ad created');
      qc.invalidateQueries({ queryKey: ['admin-site-ads'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not create ad'),
  });

  const update = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('site_ads').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-site-ads'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('site_ads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-site-ads'] }),
  });

  return (
    <Card className="border-emerald-900 bg-slate-950 text-white">
      <CardHeader><CardTitle className="flex items-center gap-2"><Megaphone /> Site Advertisement Control</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); create.mutate(new FormData(e.currentTarget)); e.currentTarget.reset(); }}>
          <Field name="name" label="Ad Name" required />
          <Field name="page_path" label="Page Path" placeholder="*, /, /live, /dashboard/viewer" defaultValue="*" />
          <Field name="placement" label="Placement" placeholder="top, bottom, sidebar, hero, content" />
          <Field name="display_type" label="Display Type" placeholder="banner, popup, slide_in, overlay, watermark" />
          <Field name="size" label="Size" placeholder="responsive, 300x250, 728x90, fullscreen" />
          <Field
  name="page_group"
  label="Page Group"
  placeholder="all, homepage, role_dashboards, live, leagues, teams, viewer"
/>

<Field
  name="animation_type"
  label="Animation Type"
  placeholder="none, fade, slide, popup, marquee"
/>

<Field
  name="text_content"
  label="Moving Text / Ad Text"
/>

<label className="flex items-center gap-2 text-sm">
  <input name="show_on_all_pages" type="checkbox" />
  Show on all pages
</label>

<label className="flex items-center gap-2 text-sm">
  <input name="closeable" type="checkbox" defaultChecked />
  Closeable popup / slide-in
</label>
          <Field name="destination_url" label="Destination URL" />
          <div><Label>Media</Label><Input name="media" type="file" accept="image/*,video/*,.gif,.svg" /></div>
          <label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" /> Active immediately</label>
          <div className="md:col-span-2"><Label>HTML / Ad Code</Label><Textarea name="html_code" rows={4} /></div>
          <Button className="md:col-span-2" disabled={create.isPending}>Create ad</Button>
        </form>

        {(q.data ?? []).map((ad: any) => (
          <div key={ad.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-emerald-900 p-3">
            <div>
              <p className="font-medium">{ad.name}</p>
              <p className="text-xs text-slate-400">{ad.page_path} / {ad.placement} / {ad.display_type} / {ad.is_active ? 'active' : 'hidden'}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => update.mutate({ id: ad.id, is_active: !ad.is_active })}>{ad.is_active ? 'Pause' : 'Activate'}</Button>
              {ad.media_url && <Button size="sm" variant="outline" asChild><a href={ad.media_url} target="_blank" rel="noreferrer">Preview</a></Button>}
              <Button size="sm" variant="destructive" onClick={() => remove.mutate(ad.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AdSenseAdmin() {
  const { profile } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['admin-adsense-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('google_adsense_settings').select('*').limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (form: FormData) => {
      const payload = {
        id: q.data?.id,
        publisher_id: String(form.get('publisher_id') || '').trim(),
        client_id: String(form.get('client_id') || '').trim(),
        ad_slot: String(form.get('ad_slot') || '').trim(),
        verification_code: String(form.get('verification_code') || '').trim(),
        script_code: String(form.get('script_code') || '').trim(),
        mode: String(form.get('mode') || 'test'),
        is_enabled: form.get('is_enabled') === 'on',
        updated_by: profile?.id,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('google_adsense_settings').upsert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('AdSense settings saved');
      qc.invalidateQueries({ queryKey: ['admin-adsense-settings'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not save AdSense settings'),
  });

  return (
    <Card className="border-emerald-900 bg-slate-950 text-white">
      <CardHeader><CardTitle>Google AdSense Center</CardTitle></CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(new FormData(e.currentTarget)); }}>
          <Field name="publisher_id" label="Publisher ID" defaultValue={q.data?.publisher_id || ''} />
          <Field name="client_id" label="Client ID" defaultValue={q.data?.client_id || ''} />
          <Field name="ad_slot" label="Ad Slot" defaultValue={q.data?.ad_slot || ''} />
          <Field name="mode" label="Mode" defaultValue={q.data?.mode || 'test'} />
          <div className="md:col-span-2"><Label>Verification Code</Label><Textarea name="verification_code" rows={3} defaultValue={q.data?.verification_code || ''} /></div>
          <div className="md:col-span-2"><Label>Script Code</Label><Textarea name="script_code" rows={5} defaultValue={q.data?.script_code || ''} /></div>
          <label className="flex items-center gap-2 text-sm"><input name="is_enabled" type="checkbox" defaultChecked={!!q.data?.is_enabled} /> Enable AdSense</label>
          <Button className="md:col-span-2" disabled={save.isPending}>Save AdSense settings</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function NotificationsAdmin() {
  const { profile } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['admin-site-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_notifications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const send = useMutation({
    mutationFn: async (form: FormData) => {
      const { error } = await supabase.from('site_notifications').insert({
        title: String(form.get('title') || '').trim(),
        message: String(form.get('message') || '').trim(),
        audience: String(form.get('audience') || 'all'),
        priority: String(form.get('priority') || 'normal'),
        link_url: String(form.get('link_url') || '').trim() || null,
        created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Notification posted');
      qc.invalidateQueries({ queryKey: ['admin-site-notifications'] });
    },
  });

  return (
    <Card className="border-emerald-900 bg-slate-950 text-white">
      <CardHeader><CardTitle>Notification Center</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); send.mutate(new FormData(e.currentTarget)); e.currentTarget.reset(); }}>
          <Field name="title" label="Title" required />
          <Field name="audience" label="Audience" defaultValue="all" placeholder="all, viewers, league_owner" />
          <Field name="priority" label="Priority" defaultValue="normal" placeholder="normal, important, critical" />
          <Field name="link_url" label="Optional Link" />
          <div className="md:col-span-2"><Label>Message</Label><Textarea name="message" rows={4} required /></div>
          <Button className="md:col-span-2">Send notification</Button>
        </form>
        {(q.data ?? []).map((n: any) => <div key={n.id} className="rounded-md border border-emerald-900 p-3"><p className="font-medium">{n.title}</p><p className="text-sm text-slate-300">{n.message}</p></div>)}
      </CardContent>
    </Card>
  );
}

function EmailAdmin() {
  const { profile } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['admin-outbound-email-logs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('outbound_email_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const queue = useMutation({
    mutationFn: async (form: FormData) => {
      const { error } = await supabase.from('outbound_email_logs').insert({
        recipient_email: String(form.get('recipient_email') || '').trim(),
        subject: String(form.get('subject') || '').trim(),
        body: String(form.get('body') || '').trim(),
        status: 'queued',
        sent_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Email queued. Connect Resend function to send it automatically.');
      qc.invalidateQueries({ queryKey: ['admin-outbound-email-logs'] });
    },
  });

  return (
    <Card className="border-emerald-900 bg-slate-950 text-white">
      <CardHeader><CardTitle className="flex items-center gap-2"><Mail /> Email Center</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); queue.mutate(new FormData(e.currentTarget)); e.currentTarget.reset(); }}>
          <Field name="recipient_email" label="Recipient Email" type="email" required />
          <Field name="subject" label="Subject" required />
          <div className="md:col-span-2"><Label>Body</Label><Textarea name="body" rows={6} required /></div>
          <Button className="md:col-span-2">Queue email</Button>
        </form>
        {(q.data ?? []).map((email: any) => <div key={email.id} className="rounded-md border border-emerald-900 p-3"><p className="font-medium">{email.subject}</p><p className="text-xs text-slate-400">{email.recipient_email} / {email.status}</p></div>)}
      </CardContent>
    </Card>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, ...inputProps } = props;
  return <div><Label>{label}</Label><Input {...inputProps} /></div>;
}
