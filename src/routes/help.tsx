import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { LifeBuoy, Send } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const Route = createFileRoute('/help')({ component: HelpCenter });

function HelpCenter() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const { data: articles } = useQuery({
    queryKey: ['support-articles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('support_articles').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  const createTicket = useMutation({
    mutationFn: async (form: FormData) => {
      const { error } = await supabase.from('support_tickets').insert({
        user_id: user?.id ?? null,
        email: String(form.get('email') || user?.email || '').trim(),
        subject: String(form.get('subject') || '').trim(),
        description: String(form.get('description') || '').trim(),
        priority: 'normal',
        status: 'new',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Support ticket created');
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not create ticket'),
  });

  const askAssistant = useMutation({
    mutationFn: async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) throw new Error('Sign in to use AI support');
      const response = await fetch('/.netlify/functions/support-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ question }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'AI support is unavailable');
      return String(payload.answer || 'No response was generated.');
    },
    onSuccess: setAnswer,
    onError: (error) => toast.error(error instanceof Error ? error.message : 'AI support is unavailable'),
  });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">RefAI Help Center</h1><p className="text-muted-foreground">Ask questions, read guides, or create a support ticket.</p></div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><LifeBuoy className="h-5 w-5 text-primary" />AI Customer Care</CardTitle></CardHeader><CardContent className="space-y-3"><Textarea rows={6} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about league creation, payments, streaming, VAR, ads, login problems..." /><Button disabled={askAssistant.isPending || question.trim().length < 4} onClick={() => askAssistant.mutate()}><Send className="mr-2 h-4 w-4" />{askAssistant.isPending ? 'Asking...' : 'Ask AI Assistant'}</Button>{answer && <p className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-sm">{answer}</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Create Support Ticket</CardTitle></CardHeader><CardContent><form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); createTicket.mutate(new FormData(e.currentTarget)); e.currentTarget.reset(); }}><Field name="email" label="Email" type="email" defaultValue={user?.email || ''} /><Field name="subject" label="Subject" required /><div className="md:col-span-2"><Label>Description</Label><Textarea name="description" rows={6} required /></div><Button className="md:col-span-2" disabled={createTicket.isPending}>Create ticket</Button></form></CardContent></Card>
      <Card><CardHeader><CardTitle>Knowledge Base</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{(articles ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No help articles yet.</p> : articles!.map((a: any) => <div key={a.id} className="rounded-md border p-3"><p className="font-medium">{a.title}</p><p className="line-clamp-3 text-sm text-muted-foreground">{a.body}</p></div>)}</CardContent></Card>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, ...inputProps } = props;
  return <div><Label>{label}</Label><Input {...inputProps} /></div>;
}
