import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app/AppHeader";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LANGUAGES, type Language } from "@/lib/i18n";
import { useLanguage } from "@/hooks/use-language";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Abhaya" }] }),
  component: SettingsPage,
});

type Settings = {
  language: Language;
  notifications_enabled: boolean;
  siren_enabled: boolean;
  flashlight_enabled: boolean;
  contact_timeout_seconds: number;
};

function SettingsPage() {
  const [lang, setLang] = useLanguage();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("user_settings").select("*").eq("user_id", u.user.id).maybeSingle();
      if (data) {
        setSettings({
          language: (data.language as Language) ?? "en",
          notifications_enabled: data.notifications_enabled ?? true,
          siren_enabled: data.siren_enabled ?? true,
          flashlight_enabled: data.flashlight_enabled ?? true,
          contact_timeout_seconds: data.contact_timeout_seconds ?? 20,
        });
      }
    })();
  }, []);

  const update = async (patch: Partial<Settings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    if (patch.language) setLang(patch.language);
    const { error } = await supabase.from("user_settings").update(patch).eq("user_id", u.user.id);
    if (error) toast.error("Could not save");
  };

  if (!settings) return <div><AppHeader title="Settings" back="/profile" /><div className="p-6 text-sm text-muted-foreground">Loading…</div></div>;

  return (
    <div>
      <AppHeader title="Settings" back="/profile" />
      <main className="mx-auto max-w-lg space-y-4 px-4 pt-6">
        <section className="rounded-3xl bg-surface p-5 shadow-card">
          <h2 className="font-display text-base font-semibold">Language</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {LANGUAGES.map((l) => {
              const active = settings.language === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => update({ language: l.code })}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-sm transition-all",
                    active ? "border-brand bg-brand-soft" : "border-transparent bg-brand-soft/40",
                  )}
                >
                  <div className="text-xl">{l.flag}</div>
                  <div className="font-medium">{l.native}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl bg-surface p-5 shadow-card">
          <h2 className="font-display text-base font-semibold">Emergency</h2>
          <div className="mt-3 space-y-4">
            <ToggleRow label="Loud siren during SOS" checked={settings.siren_enabled} onChange={(v) => update({ siren_enabled: v })} />
            <ToggleRow label="Flashlight blink during SOS" checked={settings.flashlight_enabled} onChange={(v) => update({ flashlight_enabled: v })} />
            <ToggleRow label="Push notifications" checked={settings.notifications_enabled} onChange={(v) => update({ notifications_enabled: v })} />
            <div>
              <div className="flex items-center justify-between">
                <Label>Contact timeout</Label>
                <span className="text-sm font-semibold text-brand">{settings.contact_timeout_seconds}s</span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                step={5}
                value={settings.contact_timeout_seconds}
                onChange={(e) => update({ contact_timeout_seconds: Number(e.target.value) })}
                className="mt-2 w-full accent-brand"
              />
              <p className="mt-1 text-xs text-muted-foreground">Time to wait before moving to the next contact.</p>
            </div>
          </div>
        </section>

        <p className="pt-2 text-center text-xs text-muted-foreground">Signed in as language: <b>{lang}</b></p>
      </main>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
