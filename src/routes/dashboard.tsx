import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { LayoutDashboard, Trophy, Users } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { user } = useAuth();

  if (!user) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold">Sign in required</h1>
          <p className="mt-2 text-muted-foreground">Please sign in to access your dashboard.</p>
          <Link
            to="/auth"
            className="mt-4 inline-block rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Sign in
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex gap-6">
          <aside className="w-48 shrink-0">
            <nav className="space-y-1">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                activeProps={{ className: "bg-muted" }}
              >
                <LayoutDashboard className="h-4 w-4" />
                Overview
              </Link>
              <Link
                to="/dashboard/leagues"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                activeProps={{ className: "bg-muted" }}
              >
                <Trophy className="h-4 w-4" />
                My leagues
              </Link>
              <Link
                to="/dashboard/teams"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                activeProps={{ className: "bg-muted" }}
              >
                <Users className="h-4 w-4" />
                My teams
              </Link>
            </nav>
          </aside>
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </PageShell>
  );
}
