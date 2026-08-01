// Small TTL cache backed by localStorage, used to keep the app usable offline.
type Entry<T> = { v: T; ts: number };

export function cacheSet<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify({ v: value, ts: Date.now() } as Entry<T>)); }
  catch { /* quota / private mode — non fatal */ }
}

export function cacheGet<T>(key: string, maxAgeMs = Infinity): { value: T; ageMs: number } | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Entry<T>;
    if (!parsed || typeof parsed.ts !== "number") return null;
    const ageMs = Date.now() - parsed.ts;
    if (ageMs > maxAgeMs) return { value: parsed.v, ageMs }; // stale-but-usable
    return { value: parsed.v, ageMs };
  } catch {
    return null;
  }
}

export function isStale(ageMs: number, maxAgeMs: number) {
  return ageMs > maxAgeMs;
}

export function useOnlineStatus(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}
