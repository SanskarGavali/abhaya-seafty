import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app/AppHeader";
import { BrandLogo } from "@/components/app/BrandLogo";
import { Shield, HeartHandshake, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/about")({
  head: () => ({ meta: [{ title: "About Abhaya" }] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      <AppHeader title="About Abhaya" back="/profile" />
      <main className="mx-auto max-w-lg space-y-5 px-4 pt-6">
        <section className="flex flex-col items-center rounded-3xl bg-gradient-brand-soft p-6 text-center shadow-card">
          <BrandLogo size="lg" />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Abhaya means "fearless". Built to be India's most complete women's safety companion.
          </p>
        </section>
        <div className="grid grid-cols-1 gap-3">
          {[
            { Icon: Shield, title: "Privacy first", body: "Your data is encrypted, scoped to you, and never sold." },
            { Icon: HeartHandshake, title: "Built with care", body: "Designed with survivors, advocates, and safety experts." },
            { Icon: Sparkles, title: "Always improving", body: "New modules and languages roll out continuously." },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="flex items-start gap-3 rounded-3xl bg-surface p-4 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">{title}</div>
                <div className="text-sm text-muted-foreground">{body}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="pt-2 text-center text-xs text-muted-foreground">v0.1 · Made with 💜 by Team Abhaya</p>
      </main>
    </div>
  );
}
