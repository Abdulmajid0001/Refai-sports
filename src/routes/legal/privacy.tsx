import { createFileRoute, Link } from '@tanstack/react-router';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/legal/privacy')({
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <PageShell>
      <div className="space-y-8">
        <div className="space-y-3">
          <h1 className="font-display text-3xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Refai respects your privacy. This page explains how we collect and use your data when you use our platform.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What we collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We collect account information, match preferences, team registrations, and activity data to deliver personalized sports management services.</p>
            <p>Any payment or media uploads are handled securely, and we only share data with third parties when required for service delivery or legal compliance.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How we use data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Data is used to power match scheduling, team onboarding, moderator tools, broadcasting, and fan experiences on the platform.</p>
            <p>We also use analytics and notifications to improve match coverage, refereeing accuracy, and spectator engagement.</p>
          </CardContent>
        </Card>

        <Button asChild>
          <Link to="/">Return home</Link>
        </Button>
      </div>
    </PageShell>
  );
}
