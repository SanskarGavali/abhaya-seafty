import { AppHeader } from "@/components/app/AppHeader";
import { ChevronRight, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

export type InfoSection = {
  icon?: LucideIcon;
  title: string;
  body: string | string[];
  tone?: "brand" | "pink" | "emergency" | "neutral";
};

export type QuickAction = {
  label: string;
  href?: string;
  to?: string;
  tone?: "brand" | "emergency";
  icon?: LucideIcon;
};

export function InfoPage({
  title,
  back = "/home",
  hero,
  sections,
  actions = [],
}: {
  title: string;
  back?: string;
  hero?: { title: string; subtitle?: string; icon?: LucideIcon; tone?: "brand" | "emergency" };
  sections: InfoSection[];
  actions?: QuickAction[];
}) {
  return (
    <div>
      <AppHeader title={title} back={back} />
      <main className="mx-auto max-w-lg space-y-4 px-4 pt-4 pb-10">
        {hero && (
          <section
            className={`rounded-3xl p-5 shadow-card ${
              hero.tone === "emergency" ? "bg-gradient-emergency text-emergency-foreground" : "bg-gradient-brand-soft"
            }`}
          >
            <div className="flex items-start gap-3">
              {hero.icon && (
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${hero.tone === "emergency" ? "bg-white/20" : "bg-gradient-brand text-brand-foreground shadow-glow"}`}>
                  <hero.icon className="h-6 w-6" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="font-display text-xl font-semibold leading-tight">{hero.title}</h2>
                {hero.subtitle && <p className="mt-1 text-sm opacity-90">{hero.subtitle}</p>}
              </div>
            </div>
          </section>
        )}

        {actions.length > 0 && (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {actions.map((a) => {
              const cls = `flex items-center justify-between gap-3 rounded-2xl p-4 text-sm font-semibold shadow-card ${
                a.tone === "emergency"
                  ? "bg-gradient-emergency text-emergency-foreground"
                  : "bg-gradient-brand text-brand-foreground"
              }`;
              const inner = (
                <>
                  <span className="flex items-center gap-2">
                    {a.icon ? <a.icon className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                    {a.label}
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-80" />
                </>
              );
              if (a.href) return <a key={a.label} href={a.href} className={cls}>{inner}</a>;
              if (a.to) return <Link key={a.label} to={a.to} className={cls}>{inner}</Link>;
              return <div key={a.label} className={cls}>{inner}</div>;
            })}
          </section>
        )}

        <section className="space-y-3">
          {sections.map((s, i) => (
            <article key={i} className="rounded-3xl bg-surface p-5 shadow-card ring-1 ring-border/60">
              <div className="flex items-start gap-3">
                {s.icon && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <s.icon className="h-5 w-5" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-display text-base font-semibold">{s.title}</h3>
                  {Array.isArray(s.body) ? (
                    <ul className="mt-2 space-y-1.5 text-sm text-foreground/80">
                      {s.body.map((line, j) => (
                        <li key={j} className="flex gap-2">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-foreground/80">{s.body}</p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
