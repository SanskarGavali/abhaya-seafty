import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/app/BrandLogo";
import { LANGUAGES, type Language, t } from "@/lib/i18n";
import { setStoredLanguage } from "@/hooks/use-language";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/language")({
  head: () => ({ meta: [{ title: "Choose your language — Abhaya" }] }),
  component: LanguagePage,
});

function LanguagePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Language>("en");

  const handleContinue = async () => {
    setStoredLanguage(selected);
    const { data } = await supabase.auth.getSession();
    navigate({ to: data.session ? "/home" : "/onboarding" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-hero px-5 pb-10 pt-10">
      <div className="pointer-events-none absolute -top-32 -left-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-brand-pink/20 blur-3xl" />
      <div className="mx-auto flex max-w-md flex-col items-center">
        <BrandLogo size="lg" />
        <p className="mt-2 text-xs font-medium tracking-widest text-brand-pink">{t("tagline", selected)}</p>

        <section className="animate-float-up mt-8 w-full rounded-3xl bg-surface/90 p-6 shadow-card backdrop-blur-xl">
          <h2 className="text-center font-display text-2xl font-semibold">{t("welcome", selected)}</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">{t("companion", selected)}</p>
        </section>

        <section className="animate-float-up mt-6 w-full rounded-3xl bg-surface p-6 shadow-card">
          <h3 className="text-center font-display text-lg font-semibold">{t("chooseLanguage", selected)}</h3>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {LANGUAGES.map((l) => {
              const isActive = selected === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => setSelected(l.code)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all",
                    isActive ? "border-brand bg-brand-soft shadow-soft" : "border-transparent bg-brand-soft/40 hover:border-brand/40",
                  )}
                >
                  <div className="text-3xl">{l.flag}</div>
                  <div className="text-sm font-semibold">{l.native}</div>
                  <div className="text-[11px] text-muted-foreground">{l.label}</div>
                  {isActive && (
                    <div className="absolute -bottom-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground shadow-glow">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <Button variant="brand" size="lg" className="mt-8 w-full" onClick={handleContinue}>
            {t("continue", selected)} <ArrowRight className="h-4 w-4" />
          </Button>
        </section>

        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          {t("privacyPriority", selected)}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">{t("developedBy", selected)}</div>
      </div>
    </div>
  );
}
