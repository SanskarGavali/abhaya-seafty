import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Bell, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/app/BrandLogo";
import { useLanguage } from "@/hooks/use-language";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — Abhaya" }] }),
  component: Onboarding,
});

function Onboarding() {
  const [lang] = useLanguage();
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-hero px-6 pb-10 pt-8">
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-brand/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-brand-pink/20 blur-3xl" />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col">
        <div className="flex flex-col items-center">
          <BrandLogo size="lg" />
        </div>

        <div className="mx-auto mt-10 flex flex-1 flex-col items-center text-center">
          <div className="relative h-56 w-56">
            <div className="absolute inset-4 rounded-full bg-gradient-brand shadow-glow" />
            <div className="absolute inset-8 rounded-full bg-surface" />
            <Shield className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 text-brand" strokeWidth={2} fill="currentColor" fillOpacity={0.15} />
            {[
              { Icon: Bell, pos: "left-0 top-8" },
              { Icon: Shield, pos: "right-0 top-8" },
              { Icon: MapPin, pos: "left-0 bottom-8" },
              { Icon: Users, pos: "right-0 bottom-8" },
            ].map(({ Icon, pos }, i) => (
              <div key={i} className={`absolute ${pos} flex h-11 w-11 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground shadow-glow`}>
                <Icon className="h-5 w-5" />
              </div>
            ))}
          </div>

          <h1 className="mt-10 font-display text-3xl font-semibold">
            Your safety, <br />
            <span style={{ backgroundImage: "var(--gradient-brand)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>our priority.</span>
          </h1>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{t("companion", lang)}</p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Button asChild variant="brand" size="xl">
            <Link to="/auth">{t("getStarted", lang)}</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/language">{t("chooseLanguage", lang)}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
