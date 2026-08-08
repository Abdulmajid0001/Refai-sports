import { createFileRoute, Link } from '@tanstack/react-router';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/register/team')({
  component: RegisterTeamPage,
});

function RegisterTeamPage() {
  return (
    <PageShell>
      <div className="space-y-8">
        <div className="space-y-3">
          <h1 className="font-display text-3xl font-bold">Register a Team</h1>
          <p className="text-muted-foreground">
            Use a league invitation token to add your team, submit player details, and join competition management on Refai.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team registration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>New teams need a valid league invite token from a league organizer. Once registered, you can manage players, formations, media and match submissions.</p>
            <p>Click through to the team registration dashboard to begin.</p>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/dashboard/team/register">Continue to team registration</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Return home</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
