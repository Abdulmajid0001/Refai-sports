import { createFileRoute, Link } from '@tanstack/react-router';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/legal/terms')({
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  return (
    <PageShell>
      <div className="space-y-8">
        <div className="space-y-3">
          <h1 className="font-display text-3xl font-bold">Terms of Service</h1>
          <p className="text-muted-foreground">
            These terms explain how you may use Refai, what we expect from you, and how we protect the platform for all users.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Platform use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Your account must be used for lawful sports management, match moderation, league operation, team registration, and fan interaction.</p>
            <p>Abusive behavior, data scraping, and unauthorized broadcast misuse are prohibited.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content ownership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Teams, referees, commentators, and leagues retain ownership of their own media and match content while granting Refai permission to host and display it on the platform.</p>
            <p>Users are responsible for ensuring they have the proper rights to any uploaded logos, photos, and videos.</p>
          </CardContent>
        </Card>

        <Button asChild>
          <Link to="/">Return home</Link>
        </Button>
      </div>
    </PageShell>
  );
}
