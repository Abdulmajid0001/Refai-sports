import { createFileRoute, Link } from '@tanstack/react-router';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/register/league')({
  component: RegisterLeaguePage,
});

function RegisterLeaguePage() {
  return (
    <PageShell>
      <div className="space-y-8">
        <div className="space-y-3">
          <h1 className="font-display text-3xl font-bold">Register a League</h1>
          <p className="text-muted-foreground">
            Create a new league on Refai and manage teams, fixtures, broadcast tools, and match operations.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Sign in and submit your league details using our registration form. Your league will then be reviewed by the Refai team.</p>
            <p>If you are already signed in, continue to the league registration dashboard to complete your setup.</p>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/dashboard/league/register">Continue to league registration</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Return home</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
