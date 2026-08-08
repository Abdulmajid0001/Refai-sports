import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect , type ReactNode } from "react";
import {
  ShieldCheck,
  Users,
  Trophy,
  Images,
  Megaphone,
  CreditCard,
  Home,
  Lock,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  errorComponent: ({ error }) => (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Lock className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 text-xl font-semibold">Admin area unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </PageShell>
  ),
});

export function AdminLayout() {
  const { user, loading, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (!hasRole("super_admin")) navigate({ to: "/" });
  }, [loading, user, hasRole, navigate]);

  if (loading || !user || !hasRole("super_admin")) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">
          Verifying access…
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-1">
          <div className="mb-3 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Super admin
          </div>
          <SideLink to="/admin" icon={<Home className="h-4 w-4" />}>Overview</SideLink>
          <SideLink to="/admin/users" icon={<Users className="h-4 w-4" />}>Users & sign-ups</SideLink>
          <SideLink to="/admin/moderation" icon={<Trophy className="h-4 w-4" />}>Leagues & teams</SideLink>
          <SideLink to="/admin/slideshow" icon={<Images className="h-4 w-4" />}>Homepage slideshow</SideLink>
          <SideLink to="/admin/ads" icon={<Megaphone className="h-4 w-4" />}>Ads & overlays</SideLink>
          <SideLink to="/admin/payments" icon={<CreditCard className="h-4 w-4" />}>Payments & plans</SideLink>
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
      activeOptions={{ exact: to === "/admin" }}
      activeProps={{ className: "bg-accent text-foreground" }}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {icon}
      {children}
    </Link>
  );
}
