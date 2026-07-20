import { useEffect, useState } from "react";
import { MapPin, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  queryLocationPermission,
  getCurrentPositionFriendly,
  friendlyGeoError,
  openSettingsHint,
  type GeoErrorInfo,
} from "@/lib/location";

// Reusable permission gate. Renders {children} once permission is granted
// and a fix is available. Handles first-time explanation, denials, and
// permanently-denied recovery — all in friendly language.
export function LocationPermissionGate({
  children,
  purpose,
}: {
  children: (pos: { lat: number; lng: number; accuracy: number }) => React.ReactNode;
  purpose: string;
}) {
  const [state, setState] = useState<"checking" | "prompt" | "requesting" | "denied" | "ready" | "notnow">("checking");
  const [pos, setPos] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [error, setError] = useState<GeoErrorInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!("geolocation" in navigator)) {
        if (!cancelled) { setError(friendlyGeoError("unsupported")); setState("denied"); }
        return;
      }
      const perm = await queryLocationPermission();
      if (cancelled) return;
      if (perm === "granted") {
        const r = await getCurrentPositionFriendly();
        if (cancelled) return;
        if (r.ok) {
          setPos({ lat: r.coords.latitude, lng: r.coords.longitude, accuracy: r.coords.accuracy });
          setState("ready");
        } else {
          setError(r.error);
          setState("denied");
        }
      } else if (perm === "denied") {
        setError(friendlyGeoError("denied_permanent"));
        setState("denied");
      } else {
        setState("prompt");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const request = async () => {
    setState("requesting");
    setError(null);
    const r = await getCurrentPositionFriendly();
    if (r.ok) {
      setPos({ lat: r.coords.latitude, lng: r.coords.longitude, accuracy: r.coords.accuracy });
      setState("ready");
    } else {
      setError(r.error);
      setState("denied");
    }
  };

  if (state === "ready" && pos) return <>{children(pos)}</>;

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <div className="rounded-3xl bg-surface p-6 text-center shadow-card ring-1 ring-border/60">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          {state === "denied" ? <AlertCircle className="h-8 w-8" /> : <MapPin className="h-8 w-8" />}
        </div>
        <h2 className="mt-4 font-display text-lg font-semibold">
          {state === "denied" ? "Location access needed" : "Allow location access"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {state === "denied" && error ? error.message : purpose}
        </p>

        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-brand-soft/60 p-3 text-left text-xs text-foreground/80">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <span>Your location is used only inside this app to help you. It is never sold or shared without your action.</span>
        </div>

        {state === "denied" && error?.canOpenSettings && (
          <div className="mt-3 rounded-2xl bg-muted/60 p-3 text-left text-[11px] text-muted-foreground">
            <b>How to enable:</b> {openSettingsHint()}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="outline" size="lg" onClick={() => setState("notnow")}>Not now</Button>
          <Button variant="brand" size="lg" onClick={request} disabled={state === "requesting"}>
            {state === "requesting" ? "Requesting…" : state === "denied" ? "Try again" : "Allow location"}
          </Button>
        </div>

        {state === "notnow" && (
          <p className="mt-4 text-xs text-muted-foreground">
            You can enable location any time from this screen. In an emergency, call <a href="tel:112" className="font-semibold text-emergency underline">112</a>.
          </p>
        )}
      </div>
    </div>
  );
}
