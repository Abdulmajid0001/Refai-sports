import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/auth")({ component: AuthPage });

const signInSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
});
const signUpSchema = signInSchema.extend({
  displayName: z.string().trim().min(2).max(80),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleSignIn(formData: FormData) {
    setLoading(true);
    try {
      const parsed = signInSchema.parse({
        email: formData.get("email"),
        password: formData.get("password"),
      });
      const { error } = await supabase.auth.signInWithPassword(parsed);
      if (error) throw error;
      toast.success("Signed in");
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(formData: FormData) {
    setLoading(true);
    try {
      const parsed = signUpSchema.parse({
        email: formData.get("email"),
        password: formData.get("password"),
        displayName: formData.get("displayName"),
      });
      const { error } = await supabase.auth.signUp({
        email: parsed.email,
        password: parsed.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { display_name: parsed.displayName },
        },
      });
      if (error) throw error;
      toast.success("Account created — check your email to verify.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <div className="mx-auto flex max-w-md flex-col px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Welcome to Refai</CardTitle>
            <CardDescription>Sign in or create an account to manage leagues, teams and matches.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="mt-4">
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSignIn(new FormData(e.currentTarget));
                  }}
                >
                  <div>
                    <Label htmlFor="si-email">Email</Label>
                    <Input id="si-email" name="email" type="email" required maxLength={255} />
                  </div>
                  <div>
                    <Label htmlFor="si-password">Password</Label>
                    <Input id="si-password" name="password" type="password" required minLength={6} maxLength={72} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup" className="mt-4">
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSignUp(new FormData(e.currentTarget));
                  }}
                >
                  <div>
                    <Label htmlFor="su-name">Display name</Label>
                    <Input id="su-name" name="displayName" required minLength={2} maxLength={80} />
                  </div>
                  <div>
                    <Label htmlFor="su-email">Email</Label>
                    <Input id="su-email" name="email" type="email" required maxLength={255} />
                  </div>
                  <div>
                    <Label htmlFor="su-password">Password</Label>
                    <Input id="su-password" name="password" type="password" required minLength={6} maxLength={72} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating…" : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
