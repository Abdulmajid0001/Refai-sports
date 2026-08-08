import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect , type ReactNode } from "react";
import { Trophy, Users, Settings, Home } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard")({ component: DashboardLayout });

function DashboardLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) return <PageShell><div className="mx-auto max-w-7xl px-4 py-10">Loading…</div></PageShell>;

  return (
    <PageShell>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-1">
          <SideLink to="/dashboard" icon={<Home className="h-4 w-4" />}>Overview</SideLink>
          <SideLink to="/dashboard/leagues" icon={<Trophy className="h-4 w-4" />}>My leagues</SideLink>
          <SideLink to="/dashboard/teams" icon={<Users className="h-4 w-4" />}>My teams</SideLink>
          <SideLink to="/account" icon={<Settings className="h-4 w-4" />}>Account</SideLink>
        </aside>
        <div>
          <Outlet />
        </div>
      </div>
    </PageShell>
  );
}

function SideLink({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link
      to={to}
      activeProps={{ className: "bg-accent text-foreground" }}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {icon}
      {children}
    </Link>
  );
}
