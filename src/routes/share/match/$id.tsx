import { createFileRoute, Link, useLocation } from '@tanstack/react-router';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/share/match/$id')({
  component: ShareMatchPage,
});

function ShareMatchPage() {
  const { id } = Route.useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const highlightId = searchParams.get('h');

  return (
    <PageShell>
      <div className="space-y-8">
        <div className="space-y-3">
          <h1 className="font-display text-3xl font-bold">Shared Match</h1>
          <p className="text-muted-foreground">
            This match was shared with you. Use the links below to open the match page or directly view the highlighted moment.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Match link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Match ID: {id}</p>
            {highlightId ? (
              <p>Highlight reference: {highlightId}</p>
            ) : (
              <p>No specific highlight was selected for this shared link.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/matches/$id" params={{ id }}>Open match</Link>
          </Button>
          {highlightId ? (
            <Button variant="outline" asChild>
              <Link to="/matches/$id" params={{ id }}>Open match highlights</Link>
            </Button>
          ) : null}
          <Button variant="outline" asChild>
            <Link to="/">Return home</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
