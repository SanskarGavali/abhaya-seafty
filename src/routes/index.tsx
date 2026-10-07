import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BrandLogo } from "@/components/app/BrandLogo";
import { getStoredLanguage, useLanguage } from "@/hooks/use-language";
import { t } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Abhaya — Fear Less. Live Free." },
    { name: "description", content: "Abhaya brings emergency help, trusted contacts and practical safety guidance together." },
    { property: "og:title", content: "Abhaya — Fear Less. Live Free." },
    { property: "og:description", content: "Emergency help, trusted contacts and practical safety guidance." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const [lang] = useLanguage();

  useEffect(() => {
    // Password-recovery links sometimes land on "/" (Site URL) instead of the
    // configured redirect. Forward them, preserving the token in query/hash.
    if (typeof window !== "undefined") {
      const { search, hash } = window.location;
      const params = new URLSearchParams(search);
      const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
      const isRecovery =
        params.get("type") === "recovery" ||
        hashParams.get("type") === "recovery" ||
        params.has("token_hash") ||
        params.has("code");
      if (isRecovery) {
        window.location.replace(`/reset-password${search}${hash}`);
        return;
      }
    }
    const timer = setTimeout(async () => {
      const stored = getStoredLanguage();
      const { data } = await supabase.auth.getSession();
      if (!stored) {
        navigate({ to: "/language" });
      } else if (data.session) {
        navigate({ to: "/home" });
      } else {
        navigate({ to: "/onboarding" });
      }
    }, 1600);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-hero px-6">
      <div className="pointer-events-none absolute -top-32 -left-24 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-brand-pink/25 blur-3xl" />
      <div className="animate-float-up flex flex-col items-center text-center">
        <BrandLogo size="xl" showWord={false} />
        <h1 className="mt-6 font-display text-6xl font-semibold" style={{ backgroundImage: "var(--gradient-brand)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          Abhaya
        </h1>
        <p className="mt-3 text-sm font-medium tracking-wide text-brand">{t("tagline", lang)}</p>
        <div className="mt-10 h-1 w-24 overflow-hidden rounded-full bg-brand-soft">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-brand" />
        </div>
      </div>
    </div>
  );
}
