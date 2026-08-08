import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardPageStubProps {
  title: string;
  description: string;
  details?: string;
  backTo?: string;
  backLabel?: string;
}

export function DashboardPageStub({
  title,
  description,
  details,
  backTo = '/dashboard',
  backLabel = 'Back to dashboard',
}: DashboardPageStubProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <Button asChild variant="outline">
          <Link to={backTo}>{backLabel}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>{details ?? `This page is part of the ${title.toLowerCase()} workflow and will provide tools for your dashboard.`}</p>
          <p>Use the cards and links in the parent dashboard to navigate to the next workflow step.</p>
        </CardContent>
      </Card>
    </div>
  );
}
