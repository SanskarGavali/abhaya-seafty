// Discreet Mode: a UI-only privacy mode. It swaps the colour theme to a
// neutral palette and softens branding. It does NOT hide the app from the
// OS, touch data, or change SOS behaviour.
import { useEffect, useState } from "react";

const KEY = "abhaya:discreet";
const EVT = "abhaya:discreet-change";

export function isDiscreet(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}

export function applyDiscreet(on: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("discreet", on);
}

export function setDiscreet(on: boolean) {
  try { localStorage.setItem(KEY, on ? "1" : "0"); } catch { /* ignore */ }
  applyDiscreet(on);
  window.dispatchEvent(new Event(EVT));
}

export function useDiscreet(): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => { const v = isDiscreet(); setOn(v); applyDiscreet(v); };
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", sync); };
  }, []);
  return [on, setDiscreet];
}
