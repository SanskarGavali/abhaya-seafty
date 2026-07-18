import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Settings as SettingsIcon, LogOut, Phone, ShieldCheck, ChevronRight, Bell, Info, Download } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app/AppHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { t } from "@/lib/i18n";
import { isInstallAvailable, isStandalone, onInstallAvailabilityChange, promptInstall } from "@/lib/pwa-install";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Abhaya" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [lang] = useLanguage();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata as { full_name?: string } | undefined;
      setUser({ email: data.user?.email ?? "", name: meta?.full_name });
    });
  }, []);

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  const initial = (user?.name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <div>
      <AppHeader title={t("profile", lang)} />
      <main className="mx-auto max-w-lg space-y-4 px-4 pt-6">
        <section className="rounded-3xl bg-gradient-brand-soft p-6 shadow-card">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white shadow-glow">
              <AvatarFallback className="bg-gradient-brand text-lg font-semibold text-brand-foreground">{initial}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate font-display text-lg font-semibold">{user?.name || "Welcome"}</div>
              <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
            </div>
          </div>
        </section>

        <nav className="overflow-hidden rounded-3xl bg-surface shadow-card">
          {[
            { to: "/contacts" as const, icon: Phone, label: "Emergency Contacts", desc: "Manage priority contacts" },
            { to: "/settings" as const, icon: SettingsIcon, label: t("settings", lang), desc: "Language, alerts, privacy" },
            { to: "/notifications" as const, icon: Bell, label: t("notifications", lang), desc: "Alert history" },
            { to: "/about" as const, icon: Info, label: "About Abhaya", desc: "Version & credits" },
          ].map(({ to, icon: Icon, label, desc }) => (
            <Link key={to} to={to} className="flex items-center gap-4 border-b border-border/60 px-4 py-4 last:border-0 hover:bg-brand-soft/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </nav>

        <div className="rounded-3xl bg-surface p-4 shadow-card">
          <div className="flex items-center gap-3 text-sm">
            <ShieldCheck className="h-5 w-5 text-brand" />
            <div className="text-muted-foreground">Your data is encrypted and only visible to you.</div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-destructive/30 bg-surface px-6 py-3 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" /> {t("logout", lang)}
        </button>
      </main>
    </div>
  );
}
