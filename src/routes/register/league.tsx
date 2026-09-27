import { createFileRoute } from '@tanstack/react-router';
import { PageShell } from '@/components/PageShell';
import { LeagueRegistrationCheckout } from '@/components/onboarding/LeagueRegistrationCheckout';

export const Route = createFileRoute('/register/league')({ component: LeagueRegistrationPage });

function LeagueRegistrationPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-4xl py-8">
        <LeagueRegistrationCheckout />
      </div>
    </PageShell>
  );
}
