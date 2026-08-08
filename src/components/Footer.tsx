import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="border-t bg-card/40 mt-16">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-xs">
            AI-assisted officiating, live streaming, and competition management for every level of sport.
          </p>
        </div>
        <FooterCol title="Platform" links={[
          { to: "/leagues", label: "Leagues" },
          { to: "/live", label: "Live matches" },
          { to: "/matches", label: "Schedule" },
        ]} />
        <FooterCol title="Get involved" links={[
          { to: "/register/team", label: "Register a team" },
          { to: "/dashboard/leagues", label: "Create a league" },
          { to: "/about", label: "About Refai" },
        ]} />
        <FooterCol title="Legal" links={[
          { to: "/legal/privacy", label: "Privacy" },
          { to: "/legal/terms", label: "Terms" },
        ]} />
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} Refai. All rights reserved.</span>
          <span>Built for the game.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <ul className="space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.to}>
            <a href={l.to} className="text-muted-foreground hover:text-foreground">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
