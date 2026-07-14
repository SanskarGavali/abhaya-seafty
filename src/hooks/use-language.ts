import { useEffect, useState } from "react";
import type { Language } from "@/lib/i18n";

const KEY = "abhaya.lang";

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem(KEY);
  return v === "hi" || v === "mr" ? v : "en";
}

export function setStoredLanguage(lang: Language) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, lang);
}

export function useLanguage(): [Language, (l: Language) => void] {
  const [lang, setLang] = useState<Language>("en");
  useEffect(() => {
    setLang(getStoredLanguage());
    const handler = () => setLang(getStoredLanguage());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  const update = (l: Language) => {
    setStoredLanguage(l);
    setLang(l);
  };
  return [lang, update];
}
