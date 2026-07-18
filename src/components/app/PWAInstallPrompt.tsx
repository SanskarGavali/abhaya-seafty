import { useEffect, useState } from "react";
import { Download, ShieldCheck, X } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import type { Language } from "@/lib/i18n";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const SESSION_DISMISSED = "abhaya.installDismissed.session";

const copy = {
  title: { en: "Install Abhaya", hi: "अभया इंस्टॉल करें", mr: "अभया स्थापित करा" },
  body: {
    en: "Add Abhaya to your home screen for instant SOS access, offline shortcuts and a full-screen app experience.",
    hi: "तुरंत SOS पहुँच, ऑफ़लाइन शॉर्टकट और पूर्ण-स्क्रीन ऐप अनुभव के लिए अभया को अपनी होम स्क्रीन पर जोड़ें।",
    mr: "त्वरित SOS प्रवेश, ऑफलाइन शॉर्टकट आणि पूर्ण-स्क्रीन अ‍ॅप अनुभवासाठी अभया आपल्या होम स्क्रीनवर जोडा.",
  },
  install: { en: "Install Now", hi: "अभी इंस्टॉल करें", mr: "आत्ता स्थापित करा" },
  later: { en: "Maybe Later", hi: "बाद में", mr: "नंतर" },
  safe: { en: "Free · No extra permissions", hi: "मुफ्त · कोई अतिरिक्त अनुमति नहीं", mr: "मोफत · अतिरिक्त परवानगी नाही" },
};

function tr<K extends keyof typeof copy>(k: K, lang: Language) {
  return copy[k][lang] ?? copy[k].en;
}

export function PWAInstallPrompt() {
  const [lang] = useLanguage();
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_DISMISSED)) return;

    const nav = window.navigator as Navigator & { standalone?: boolean };
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches || nav.standalone;
    if (standalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      // Spec: show the popup ~2s after the home dashboard is reached.
      window.setTimeout(() => {
        if (!sessionStorage.getItem(SESSION_DISMISSED)) setShow(true);
      }, 2000);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const onInstalled = () => { setShow(false); setEvt(null); };
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(SESSION_DISMISSED, "1");
    setShow(false);
  };

  const install = async () => {
    if (!evt) { dismiss(); return; }
    try {
      await evt.prompt();
      await evt.userChoice;
    } finally {
      sessionStorage.setItem(SESSION_DISMISSED, "1");
      setShow(false);
      setEvt(null);
    }
  };

  if (!show || !evt) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-5">
      <button
        aria-label="Close"
        onClick={dismiss}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm animate-in fade-in"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl ring-1 ring-border animate-in zoom-in-95 fade-in"
      >
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-brand-soft"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand text-brand-foreground shadow-glow">
          <Download className="h-8 w-8" />
        </div>

        <h2 className="text-center font-display text-xl font-semibold">{tr("title", lang)}</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">{tr("body", lang)}</p>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-brand" /> {tr("safe", lang)}
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={install}
            className="w-full rounded-full bg-gradient-brand py-3 text-sm font-semibold text-brand-foreground shadow-glow active:scale-[0.98]"
          >
            {tr("install", lang)}
          </button>
          <button
            onClick={dismiss}
            className="w-full rounded-full py-3 text-sm font-medium text-muted-foreground hover:bg-brand-soft"
          >
            {tr("later", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
