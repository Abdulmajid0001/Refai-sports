import { createFileRoute, Link } from '@tanstack/react-router';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { TeamRegistrationForm } from '@/components/onboarding/TeamRegistrationForm';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/dashboard/team/register')({
  component: TeamRegisterPage,
});

function TeamRegisterPage() {
  return (
    <RoleGuard allow="team_owner" requireApproved={false}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Register Team</h1>
            <p className="text-muted-foreground">
              Register your team using a league invite token.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/dashboard/team">Back to dashboard</Link>
          </Button>
        </div>

        <TeamRegistrationForm />
      </div>
    </RoleGuard>
  );
}
