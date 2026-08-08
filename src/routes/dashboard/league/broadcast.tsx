import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Radio, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { uploadFile } from '@/lib/upload';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/dashboard/league/broadcast')({
  component: LeagueBroadcastPage,
});

function LeagueBroadcastPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: leagues } = useQuery({
    queryKey: ['league-owner-leagues', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_registrations')
        .select('id, league_name')
        .eq('owner_id', user!.id);

      if (error) throw error;
      return data ?? [];
    },
  });

  const leagueIds = (leagues ?? []).map((league) => league.id);

  const { data: assets } = useQuery({
    queryKey: ['league-broadcast-assets', leagueIds],
    enabled: leagueIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_broadcast_assets')
        .select('*')
        .in('league_registration_id', leagueIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const saveAsset = useMutation({
    mutationFn: async ({ file, assetType }: { file: File; assetType: string }) => {
      if (!leagues?.[0]?.id) throw new Error('Create a league first');

      const url = await uploadFile('broadcast-assets', file, assetType);

      const { error } = await supabase.from('league_broadcast_assets').insert({
        league_registration_id: leagues[0].id,
        asset_type: assetType,
        asset_url: url,
        status: 'active',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Broadcast asset uploaded');
      qc.invalidateQueries({ queryKey: ['league-broadcast-assets'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Upload failed'),
  });

  return (
    <RoleGuard allow="league_owner" requireApproved={false}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Broadcast</h1>
            <p className="text-muted-foreground">
              Manage cameras, commentators, overlays, graphics, replay assets and stream preparation.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/dashboard/league">Back to dashboard</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Broadcast Asset
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-3">
            {[
              'scoreboard',
              'goal_graphic',
              'card_graphic',
              'replay_transition',
              'halftime_stats',
              'fulltime_stats',
            ].map((type) => (
              <div key={type}>
                <Label className="capitalize">{type.replace(/_/g, ' ')}</Label>
                <Input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) saveAsset.mutate({ file, assetType: type });
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              Broadcast Assets
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {(assets ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No broadcast assets uploaded yet.</p>
            ) : (
              assets!.map((asset: any) => (
                <div
                  key={asset.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                >
                  <span className="font-medium capitalize">
                    {asset.asset_type?.replace(/_/g, ' ')}
                  </span>

                  <Button size="sm" variant="outline" asChild>
                    <a href={asset.asset_url} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
