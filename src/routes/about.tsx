import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "About Refai — AI-powered sports officiating platform" },
      { name: "description", content: "Refai blends AI-assisted refereeing, live streaming, multi-commentator audio and full competition management into one trusted platform." },
    ],
  }),
});

function About() {
  return (
    <PageShell>
      <section className="border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h1 className="font-display text-4xl font-bold">About Refai</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Refai is the all-in-one platform for AI-assisted officiating, live streaming, multi-commentator audio and
            competition management — built for local, school, semi-pro and professional leagues alike.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-4xl gap-8 px-4 py-12 md:grid-cols-2">
        <Block title="Our mission">
          Bring the broadcast quality of the world's top leagues to every team on the planet — without the broadcast budget.
        </Block>
        <Block title="What we do">
          League and team management, live HD streaming, real-time commentary, VAR replay tooling, AI refereeing assistance,
          fantasy leagues, fan predictions and integrated monetization.
        </Block>
        <Block title="Built for trust">
          Verified clubs, transparent decisions, full activity logs, GDPR-friendly data handling and accessibility-first UI.
        </Block>
        <Block title="Open to every sport">
          Football first — basketball, futsal, handball, rugby, cricket and esports next.
        </Block>
      </section>
    </PageShell>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-primary">{title}</h2>
      <p className="mt-2 text-muted-foreground">{children}</p>
    </div>
  );
}
