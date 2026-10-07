import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Home as HomeIcon, ShieldAlert, Hand, Shield, Phone, MapPin, MessageCircleHeart, ChevronRight, Sparkles, Video, Lock } from "lucide-react";
import { AppHeader } from "@/components/app/AppHeader";
import { TileCard } from "@/components/app/TileCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/use-language";
import { t } from "@/lib/i18n";
import { SafetyBackdrop } from "@/components/app/SafetyBackdrop";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [
    { title: "Home — Abhaya" },
    { name: "description", content: "Your Abhaya safety essentials, emergency help and trusted contacts." },
    { property: "og:title", content: "Home — Abhaya" },
    { property: "og:description", content: "Your safety essentials and emergency help in Abhaya." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [lang] = useLanguage();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata as { full_name?: string } | undefined;
      setName(meta?.full_name || data.user?.email?.split("@")[0] || "there");
    });
  }, []);

  return (
    <div className="safety-screen home-screen">
      <SafetyBackdrop />
      <AppHeader showLogo />
      <main className="mx-auto max-w-lg space-y-5 px-4 pt-4">
        {/* Greeting */}
        <section className="page-intro animate-float-up">
          <h1 className="font-display text-3xl font-semibold drop-shadow">
            {t("hello", lang)}, {name} <span className="align-middle">👋</span>
          </h1>
          <p className="text-sm text-muted-foreground">{t("stayAlert", lang)}</p>
        </section>

        {/* SOS card */}
        <Button variant="emergency"
          onClick={() => navigate({ to: "/sos" })}
          className="home-sos animate-float-up group relative w-full overflow-hidden text-left"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider opacity-90">{t("emergencySos", lang)}</div>
              <div className="mt-1 font-display text-2xl font-semibold">{t("oneTapForHelp", lang)}</div>
              <div className="mt-1 text-sm opacity-90">{t("tapToAlert", lang)}</div>
            </div>
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
              <span className="sos-ring absolute inset-0 animate-pulse-ring rounded-full opacity-40" />
              <span className="sos-ring absolute inset-0 animate-pulse-ring rounded-full opacity-30" style={{ animationDelay: "0.6s" }} />
              <span className="sos-disc relative flex h-20 w-20 items-center justify-center rounded-full text-emergency shadow-xl">
                <AlertTriangle className="h-9 w-9" strokeWidth={2.6} />
              </span>
            </div>
          </div>
          <div className="sos-tag mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium">
            SOS <ChevronRight className="h-3 w-3" />
          </div>
        </Button>

        {/* Quick access */}
        <section>
          <div className="quick-access-heading mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">{t("quickAccess", lang)}</h2>
            <Link to="/learn" className="text-xs font-medium text-brand hover:underline">{t("viewAll", lang)}</Link>
          </div>
          <div className="quick-access-grid grid grid-cols-3 gap-3">
            <TileCard to="/following-me" icon={HomeIcon} label={t("followingMe", lang)} tone="brand" />
            <TileCard to="/domestic-violence" icon={ShieldAlert} label={t("domesticViolence", lang)} tone="pink" />
            <TileCard to="/harassment" icon={Hand} label={t("harassment", lang)} tone="emergency" />
            <TileCard to="/cyber-safety" icon={Shield} label={t("cyberSafety", lang)} tone="brand" />
            <TileCard to="/helpline" icon={Phone} label={t("helplineNumbers", lang)} tone="pink" />
            <TileCard to="/map" icon={MapPin} label={t("safePlaces", lang)} tone="brand" />
            <TileCard to="/video-evidence" icon={Video} label="Video Evidence" tone="pink" />
            <TileCard to="/evidence" icon={Lock} label="Evidence Vault" tone="brand" />
          </div>
        </section>

        {/* AI Assistant strip */}
        <Link
          to="/assistant"
          className="animate-float-up flex items-center justify-between gap-3 rounded-3xl bg-surface p-4 shadow-card ring-1 ring-border/60"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand text-brand-foreground shadow-glow">
              <MessageCircleHeart className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-semibold">
                {t("aiAssistant", lang)} <Sparkles className="h-3.5 w-3.5 text-brand-pink" />
              </div>
              <div className="text-xs text-muted-foreground">{t("aiSubtitle", lang)}</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>

        {/* Live-location shortcut */}
        <Link to="/live-location" className="home-shortcut flex items-center justify-between gap-3 rounded-3xl bg-surface p-4 shadow-card">
          <div>
            <div className="text-sm font-semibold text-brand">Share Live Location</div>
            <div className="text-xs text-muted-foreground">Let trusted contacts see where you are, in real time.</div>
          </div>
          <Button variant="brand" size="sm">Open</Button>
        </Link>
      </main>
    </div>
  );
}
