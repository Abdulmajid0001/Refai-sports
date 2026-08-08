import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Settings, Mail, Calendar, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["user-roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role);
    },
  });

  if (!user) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold">Sign in required</h1>
          <p className="mt-2 text-muted-foreground">Please sign in to access your account settings.</p>
          <Button asChild className="mt-4">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <Settings className="h-6 w-6 text-primary mb-3" />
          <h1 className="font-display text-3xl font-bold">Account settings</h1>
          <p className="mt-1 text-muted-foreground">Manage your profile and preferences.</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{user.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(roles ?? []).length === 0 ? (
                <Badge variant="outline">No special roles</Badge>
              ) : (
                roles!.map((role) => (
                  <Badge key={role} variant="secondary" className="capitalize">
                    {role.replace(/_/g, " ")}
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {profile?.created_at && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Member since
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}

        <Button
          variant="destructive"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </Button>
      </section>
    </PageShell>
  );
}
