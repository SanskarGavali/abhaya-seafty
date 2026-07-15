import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { Phone, Star, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { copyText } from "@/lib/share";

const helplines = [
  { key: "112", label: "Emergency", number: "112", desc: "All-India Emergency" },
  { key: "1091", label: "Women Helpline", number: "1091", desc: "National Women Helpline" },
  { key: "181", label: "Women in Distress", number: "181", desc: "Women in distress" },
  { key: "100", label: "Police", number: "100", desc: "Police helpline" },
  { key: "108", label: "Ambulance", number: "108", desc: "Medical emergency" },
  { key: "1098", label: "Child Helpline", number: "1098", desc: "Children in need" },
  { key: "1930", label: "Cyber Crime", number: "1930", desc: "Report cyber crime" },
  { key: "1073", label: "Road Accident", number: "1073", desc: "Road Accident Emergency" },
  { key: "1096", label: "Anti-Poison", number: "1096", desc: "National Anti-Poison" },
];

export const Route = createFileRoute("/_authenticated/helpline")({
  head: () => ({ meta: [{ title: "Helpline Numbers — Abhaya" }] }),
  component: HelplinePage,
});

function HelplinePage() {
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("pinned_helplines").select("helpline_key").eq("user_id", u.user.id);
      setPinned(new Set((data ?? []).map((r) => r.helpline_key)));
    })();
  }, []);

  const togglePin = async (key: string) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return toast.error("Sign in required");
    const next = new Set(pinned);
    if (next.has(key)) {
      next.delete(key);
      await supabase.from("pinned_helplines").delete().eq("user_id", u.user.id).eq("helpline_key", key);
    } else {
      next.add(key);
      await supabase.from("pinned_helplines").insert({ user_id: u.user.id, helpline_key: key });
    }
    setPinned(next);
  };

  const share = async (label: string, number: string) => {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    const text = `${label} helpline: ${number}`;
    if (nav.share) { try { await nav.share({ text }); return; } catch { /* fall */ } }
    if (await copyText(text)) toast.success("Copied to clipboard");
  };

  const rows = helplines
    .filter((h) => !query || h.label.toLowerCase().includes(query.toLowerCase()) || h.number.includes(query))
    .sort((a, b) => Number(pinned.has(b.key)) - Number(pinned.has(a.key)));

  return (
    <div>
      <AppHeader title="Helpline Numbers" back="/home" />
      <main className="mx-auto max-w-lg space-y-3 px-4 pt-4 pb-8">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search helplines…"
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-brand"
        />
        {rows.map((h) => {
          const isPinned = pinned.has(h.key);
          return (
            <div key={h.key} className="flex items-center gap-3 rounded-3xl bg-surface p-4 shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand text-brand-foreground shadow-soft">
                <Phone className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{h.label}</div>
                <div className="text-xs text-muted-foreground">{h.desc}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => togglePin(h.key)} aria-label="Favorite" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-brand-soft">
                  <Star className={`h-4 w-4 ${isPinned ? "fill-brand text-brand" : "text-muted-foreground"}`} />
                </button>
                <button onClick={async () => { if (await copyText(h.number)) toast.success("Number copied"); }} aria-label="Copy" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-brand-soft">
                  <Copy className="h-4 w-4" />
                </button>
                <button onClick={() => share(h.label, h.number)} aria-label="Share" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-brand-soft">
                  <Share2 className="h-4 w-4" />
                </button>
                <Button asChild variant="brand" size="sm" className="ml-1">
                  <a href={`tel:${h.number}`}>{h.number}</a>
                </Button>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
