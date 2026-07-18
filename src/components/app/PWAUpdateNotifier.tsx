import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import type { Language } from "@/lib/i18n";

// Detects new deployments without a service worker by watching the served
// index.html for changes via ETag / Last-Modified headers. This is safe for
// Lovable's HTML revalidation model and never deletes user data — a reload
// pulls the fresh bundle while auth session in localStorage is preserved.

const copy = {
  title: { en: "🚀 A new version of Abhaya is available.", hi: "🚀 अभया का नया संस्करण उपलब्ध है।", mr: "🚀 अभयाची नवीन आवृत्ती उपलब्ध आहे." },
  update: { en: "Update Now", hi: "अभी अपडेट करें", mr: "आत्ता अपडेट करा" },
  later: { en: "Later", hi: "बाद में", mr: "नंतर" },
};
function tr<K extends keyof typeof copy>(k: K, l: Language) { return copy[k][l] ?? copy[k].en; }

const POLL_MS = 5 * 60 * 1000; // 5 min
const DISMISS_MS = 30 * 60 * 1000; // 30 min snooze

async function fetchTag(): Promise<string | null> {
  try {
    const res = await fetch("/", { method: "HEAD", cache: "no-store" });
    return (
      res.headers.get("etag") ||
      res.headers.get("last-modified") ||
      res.headers.get("x-vercel-id") ||
      null
    );
  } catch {
    return null;
  }
}

export function PWAUpdateNotifier() {
  const [lang] = useLanguage();
  const [available, setAvailable] = useState(false);
  const initialTag = useRef<string | null>(null);
  const snoozedUntil = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    const check = async () => {
      if (Date.now() < snoozedUntil.current) return;
      const tag = await fetchTag();
      if (cancelled || !tag) return;
      if (initialTag.current == null) {
        initialTag.current = tag;
        return;
      }
      if (tag !== initialTag.current) setAvailable(true);
    };

    check();
    timer = window.setInterval(check, POLL_MS);
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  if (!available) return null;

  const apply = () => window.location.reload();
  const snooze = () => {
    snoozedUntil.current = Date.now() + DISMISS_MS;
    setAvailable(false);
  };

  return (
    <div className="fixed inset-x-3 top-3 z-[80] mx-auto max-w-md rounded-2xl bg-surface p-3 shadow-2xl ring-1 ring-border animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 text-sm font-medium">{tr("title", lang)}</div>
        <button onClick={apply} className="rounded-full bg-gradient-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground shadow-glow">
          {tr("update", lang)}
        </button>
        <button onClick={snooze} aria-label={tr("later", lang)} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-brand-soft">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
