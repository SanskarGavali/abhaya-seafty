// Shared beforeinstallprompt capture so any UI (auto popup + profile button)
// can trigger the browser install dialog.

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BIPEvent | null = null;
const listeners = new Set<(available: boolean) => void>();

function isBrowser() {
  return typeof window !== "undefined";
}

if (isBrowser()) {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BIPEvent;
    listeners.forEach((l) => l(true));
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((l) => l(false));
  });
}

export function isInstallAvailable() {
  return !!deferred;
}

export function isStandalone() {
  if (!isBrowser()) return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.("(display-mode: standalone)").matches || !!nav.standalone;
}

export function onInstallAvailabilityChange(cb: (available: boolean) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferred) return "unavailable";
  try {
    await deferred.prompt();
    const choice = await deferred.userChoice;
    deferred = null;
    listeners.forEach((l) => l(false));
    return choice.outcome;
  } catch {
    return "dismissed";
  }
}
