/**
 * TEMP_PRANK_SECURITY_ERROR
 *
 * TEMPORARY, FRONTEND-ONLY, PURELY VISUAL overlay. It performs NO network
 * requests, touches NO backend / Supabase / Firebase / auth / router state,
 * and holds NO business logic. Delete this file and its single mount line in
 * src/routes/__root.tsx to remove the prank completely.
 *
 * Arming (never auto-shows for normal users):
 *   add ?TEMP_PRANK_SECURITY_ERROR=1 to any URL
 * Escape hatches (emergency safety): Esc key, or the "Emergency — skip" link.
 */
import { useEffect, useRef, useState } from "react";

const TEMP_PRANK_SECURITY_ERROR_PARAM = "TEMP_PRANK_SECURITY_ERROR";
const TEMP_PRANK_SECURITY_ERROR_SESSION_KEY = "TEMP_PRANK_SECURITY_ERROR_shown";
const TEMP_PRANK_SECURITY_ERROR_TOTAL_MS = 60_000;
const TEMP_PRANK_SECURITY_ERROR_RECONNECT_AT_MS = 50_000;
const TEMP_PRANK_SECURITY_ERROR_RESTORED_AT_MS = 58_000;

type PrankPhase = "error" | "reconnecting" | "restored";

export function TempPrankSecurityError() {
  const [armed, setArmed] = useState(false);
  const [phase, setPhase] = useState<PrankPhase>("error");
  const [retrying, setRetrying] = useState(false);
  const timers = useRef<number[]>([]);

  // Arm only from the explicit query flag, once per session.
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      if (params.get(TEMP_PRANK_SECURITY_ERROR_PARAM) !== "1") return;
      if (window.sessionStorage.getItem(TEMP_PRANK_SECURITY_ERROR_SESSION_KEY) === "1") return;
      window.sessionStorage.setItem(TEMP_PRANK_SECURITY_ERROR_SESSION_KEY, "1");
      setArmed(true);
    } catch {
      setArmed(false); // fail safe
    }
  }, []);

  useEffect(() => {
    if (!armed) return;
    const dismiss = () => setArmed(false);
    try {
      timers.current.push(
        window.setTimeout(() => setPhase("reconnecting"), TEMP_PRANK_SECURITY_ERROR_RECONNECT_AT_MS),
        window.setTimeout(() => setPhase("restored"), TEMP_PRANK_SECURITY_ERROR_RESTORED_AT_MS),
        window.setTimeout(dismiss, TEMP_PRANK_SECURITY_ERROR_TOTAL_MS),
        // hard fail-safe: never outlive 70s under any circumstance
        window.setTimeout(dismiss, TEMP_PRANK_SECURITY_ERROR_TOTAL_MS + 10_000),
      );
    } catch {
      dismiss();
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss(); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
  }, [armed]);

  if (!armed) return null;

  return (
    <div
      data-temp-prank-security-error=""
      role="alertdialog"
      aria-label="ABHAYA Security Service"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 px-6 backdrop-blur-xl"
    >
      <div className="w-full max-w-sm rounded-3xl bg-surface p-6 text-center shadow-card ring-1 ring-border/60">
        {phase === "error" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emergency/10 text-3xl">
              ⚠️
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">ABHAYA Security Service</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn&apos;t complete the security verification.
            </p>
            <div className="mt-4 space-y-1 rounded-2xl bg-muted/50 p-3 text-xs">
              <div className="font-mono font-semibold">Error Code: ABH-403</div>
              <div className="text-muted-foreground">Status: Temporary service interruption</div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (retrying) return;
                setRetrying(true);
                try {
                  timers.current.push(window.setTimeout(() => setRetrying(false), 2200));
                } catch {
                  setRetrying(false);
                }
              }}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gradient-brand px-6 py-3 text-sm font-medium text-brand-foreground shadow-glow disabled:opacity-70"
              disabled={retrying}
            >
              {retrying ? "Retrying…" : "Retry Connection"}
            </button>
          </>
        )}

        {phase === "reconnecting" && (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-brand/25 border-t-brand" />
            <h2 className="mt-5 font-display text-lg font-semibold">Re-establishing secure connection…</h2>
            <p className="mt-2 text-sm text-muted-foreground">Please hold on for a moment.</p>
          </>
        )}

        {phase === "restored" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-3xl text-brand">
              ✓
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">Connection Restored ✓</h2>
            <p className="mt-2 text-sm text-muted-foreground">Returning you to Abhaya…</p>
          </>
        )}

        <button
          type="button"
          onClick={() => setArmed(false)}
          className="mt-5 text-xs font-medium text-muted-foreground underline underline-offset-4"
        >
          Emergency — skip
        </button>
      </div>
    </div>
  );
}
