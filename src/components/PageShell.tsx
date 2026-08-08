import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SiteAdSlot } from '@/components/SiteAdSlot';
import { SiteNotificationBanner } from '@/components/SiteNotificationBanner';

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNotificationBanner />
      <SiteAdSlot placement="moving_text" />
      <SiteAdSlot placement="top" />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <SiteAdSlot placement="bottom" />
      <SiteAdSlot placement="popup" />
      <SiteAdSlot placement="slide_in" />
    </div>
  );
}
