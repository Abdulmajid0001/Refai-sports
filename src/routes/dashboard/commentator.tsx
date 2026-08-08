import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import { Mic, Send } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { SiteAdSlot } from "@/components/SiteAdSlot";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export const Route = createFileRoute('/dashboard/commentator')({ component: CommentatorDashboard });

function CommentatorDashboard() {
  const { user } = useAuth();
  const location = useLocation();
const pathname = location.pathname.replace(/\/$/, '');

if (pathname !== '/dashboard/commentator') {
  return (
    <RoleGuard allow="commentator" requireApproved={false}>
      <Outlet />
    </RoleGuard>
  );
}

  async function publish(form: FormData) {
    if (!user) return;
    const text = String(form.get('commentary') || '').trim();
    if (!text) return toast.error('Write commentary first');
    const { error } = await supabase.from('match_operations').insert({
      user_id: user.id,
      role: 'commentator',
      action_type: 'publish_commentary',
      payload: { text },
    });
    if (error) toast.error(error.message);
    else toast.success('Commentary published');
  }

  return (
    <RoleGuard allow="commentator" requireApproved={false}>
      <div className="space-y-6">
        
        <SiteAdSlot placement="moving_text" pageGroup="role_dashboards" />
        <SiteAdSlot placement="top" pageGroup="role_dashboards" />
          
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <main className="space-y-6">
          <Card><CardHeader><CardTitle>Match Header</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-4"><Stat label="Score" value="0 - 0" /><Stat label="Minute" value="00:00" /><Stat label="Weather" value="Clear" /><Stat label="Attendance" value="Pending" /></CardContent></Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Mic className="h-5 w-5 text-primary" />Live Commentary</CardTitle></CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); publish(new FormData(e.currentTarget)); e.currentTarget.reset(); }}>
                <Textarea name="commentary" rows={10} placeholder="Write live commentary, notes, or match updates..." />
                <div className="flex flex-wrap gap-2">
                  <Button><Send className="mr-2 h-4 w-4" />Publish</Button>
                  <Button type="button" variant="outline">Mute Mic</Button>
                  <Button type="button" variant="outline">Noise Reduction</Button>
                  <Button type="button" variant="outline">Backup Recording</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <SiteAdSlot placement="middle" pageGroup="role_dashboards" />
          <Panel title="AI Commentary Assistant" items={['Interesting statistics','Player facts','Historical records','Goal probabilities','Substitution insights','VAR explanation']} />
          <Panel title="Timeline" items={['Goal','Cards','VAR','Substitution','Announcements']} />
        </main>
        <aside className="space-y-6">
          <Panel title="Statistics Sidebar" items={['Possession','Shots','Corners','Cards','Pass Accuracy','Top Scorer','Heatmaps','Expected Goals']} />
          <Card><CardHeader><CardTitle>Match Notes</CardTitle></CardHeader><CardContent><Textarea rows={8} placeholder="Private notes..." /></CardContent></Card>
        </aside>
      </div>
        <SiteAdSlot placement="bottom" pageGroup="role_dashboards" />
        <SiteAdSlot placement="popup" pageGroup="role_dashboards" />
        <SiteAdSlot placement="slide_in" pageGroup="role_dashboards" />
      </div>
    </RoleGuard>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold">{value}</p></div>;
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{items.map((item) => <Button key={item} variant="outline" size="sm">{item}</Button>)}</CardContent></Card>;
}
