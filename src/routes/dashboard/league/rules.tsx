import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export const Route = createFileRoute('/dashboard/league/rules')({
  component: LeagueRulesPage,
});

function LeagueRulesPage() {
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

  const leagueId = leagues?.[0]?.id;

  const { data: rules } = useQuery({
    queryKey: ['league-rules', leagueId],
    enabled: !!leagueId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_rules')
        .select('*')
        .eq('league_registration_id', leagueId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const saveRules = useMutation({
    mutationFn: async (form: FormData) => {
      if (!leagueId) throw new Error('Create a league first');

      const payload = {
        league_registration_id: leagueId,
        rules_text: String(form.get('rules_text') || '').trim(),
        ai_processing_enabled: form.get('ai_processing_enabled') === 'on',
      };

      const { error } = await supabase
        .from('league_rules')
        .upsert(payload, { onConflict: 'league_registration_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Rules saved');
      qc.invalidateQueries({ queryKey: ['league-rules'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save rules'),
  });

  return (
    <RoleGuard allow="league_owner" requireApproved={false}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Rules</h1>
            <p className="text-muted-foreground">
              Write match rules, player eligibility, suspensions, protest process and tie-break logic.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/dashboard/league">Back to dashboard</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>League Rules</CardTitle>
          </CardHeader>

          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveRules.mutate(new FormData(e.currentTarget));
              }}
            >
              <Textarea
                name="rules_text"
                rows={14}
                defaultValue={rules?.rules_text || ''}
                placeholder="Example: 3 yellow cards equals one match suspension..."
              />

              <label className="flex items-center gap-2 text-sm">
                <input
                  name="ai_processing_enabled"
                  type="checkbox"
                  defaultChecked={!!rules?.ai_processing_enabled}
                />
                Allow AI to convert rules into enforceable logic later
              </label>

              <Button disabled={saveRules.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Save rules
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
