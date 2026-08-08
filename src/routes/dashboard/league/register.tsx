import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { LeagueRegistrationForm } from '@/components/onboarding/LeagueRegistrationForm';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/dashboard/league/register')({
  component: LeagueRegisterPage,
});

function LeagueRegisterPage() {
  return (
    <RoleGuard allow="league_owner" requireApproved={false}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Register League</h1>
            <p className="text-muted-foreground">
              Create a new league and submit it for Super Admin approval.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/dashboard/league">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
        </div>

        <LeagueRegistrationForm />
      </div>
    </RoleGuard>
  );
}
