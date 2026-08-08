import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import { Battery, Camera, Radio, Upload, Wifi } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export const Route = createFileRoute('/dashboard/camera')({ component: CameraDashboard });

function CameraDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const pathname = location.pathname.replace(/\/$/, '');

  if (pathname !== '/dashboard/camera') {
  return (
    <RoleGuard allow="camera_operator" requireApproved={false}>
      <Outlet />
    </RoleGuard>
  );
}

  async function log(action_type: string, payload: Record<string, unknown> = {}) {
    if (!user) return;
    const { error } = await supabase.from('match_operations').insert({
      user_id: user.id,
      role: 'camera_operator',
      action_type,
      payload,
    });
    if (error) toast.error(error.message);
    else toast.success('Action saved');
  }

  return (
    <RoleGuard allow="camera_operator" requireApproved={false}>
      <div className="space-y-6">

        <SiteAdSlot placement="moving_text" pageGroup="role_dashboards" />
        <SiteAdSlot placement="top" pageGroup="role_dashboards" />
        
        <div>
          <h1 className="text-2xl font-bold">Camera Operator</h1>
          <p className="text-muted-foreground">Capture feeds, mark replays, upload clips and monitor stream quality.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Metric icon={Camera} label="Assigned Match" value="Awaiting assignment" />
          <Metric icon={Radio} label="Stream Quality" value="1080p / 60fps" />
          <Metric icon={Battery} label="Battery" value="87%" />
          <Metric icon={Wifi} label="Network" value="Stable" />
        </div>

        <Card>
          <CardHeader><CardTitle>Live Preview</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex aspect-video items-center justify-center rounded-md border bg-black text-white">Camera preview will appear here</div>
            <div className="flex flex-wrap gap-2">
              {['Fullscreen','Focus','Zoom','Snapshot','Record','Mark Replay','Mute Audio'].map((item) => (
                <Button key={item} variant="outline" onClick={() => log(item.toLowerCase().replaceAll(' ', '_'))}>{item}</Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Panel title="Camera Controls" actions={['Pan Left','Pan Right','Tilt Up','Tilt Down','Zoom In','Zoom Out','Focus','Exposure','White Balance','Brightness','Contrast']} onAction={log} />
        <SiteAdSlot placement="middle" pageGroup="role_dashboards" />
        <Panel title="Replay Marker" actions={['Goal','Foul','Penalty','Corner','VAR','Great Save','Injury','Substitution']} onAction={log} />
        <Panel title="Camera Assignment" actions={['Main Camera','Goal Camera Left','Goal Camera Right','Bench Camera','Crowd Camera','Drone','Tunnel Camera','VAR Camera']} onAction={log} />

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" />Upload Center</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Input type="file" accept="image/*" />
            <Input type="file" accept="video/*" />
            <Input type="file" accept="video/*" />
          </CardContent>
        </Card>

        <SiteAdSlot placement="bottom" pageGroup="role_dashboards" />
        <SiteAdSlot placement="popup" pageGroup="role_dashboards" />
        <SiteAdSlot placement="slide_in" pageGroup="role_dashboards" />
      </div>
    </RoleGuard>
  );
}

function Metric({ icon: Icon, label, value }: any) {
  return <Card><CardContent className="flex items-center gap-3 pt-6"><Icon className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold">{value}</p></div></CardContent></Card>;
}

function Panel({ title, actions, onAction }: { title: string; actions: string[]; onAction: (a: string) => void }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{actions.map((a) => <Button key={a} variant="outline" size="sm" onClick={() => onAction(a.toLowerCase().replaceAll(' ', '_'))}>{a}</Button>)}</CardContent></Card>;
}
