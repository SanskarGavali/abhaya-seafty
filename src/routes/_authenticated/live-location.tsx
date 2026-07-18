import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MapPin, Share2, Play, Square, Copy } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app/AppHeader";
import { Button } from "@/components/ui/button";
import { formatAccuracy } from "@/lib/geo";

export const Route = createFileRoute("/_authenticated/live-location")({
  head: () => ({ meta: [{ title: "Live Location — Abhaya" }] }),
  component: LiveLocationPage,
});

type Pos = { lat: number; lng: number; accuracy: number; ts: number };

function LiveLocationPage() {
  const [sharing, setSharing] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const watchRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  const start = () => {
    if (!navigator.geolocation) { setError("Geolocation not available on this device"); return; }
    setError(null);
    setSharing(true);
    setElapsed(0);
    tickRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    watchRef.current = navigator.geolocation.watchPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, ts: p.timestamp }),
      (e) => setError(e.message),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 },
    );
  };

  const stop = () => {
    setSharing(false);
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    watchRef.current = null;
    tickRef.current = null;
  };

  useEffect(() => () => { if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current); if (tickRef.current) clearInterval(tickRef.current); }, []);

  const mapUrl = pos
    ? `https://www.openstreetmap.org/?mlat=${pos.lat}&mlon=${pos.lng}#map=17/${pos.lat}/${pos.lng}`
    : "";

  const shareText = pos ? `📍 I'm sharing my live location with you — ${mapUrl}` : "";

  const share = async () => {
    if (!pos) return toast.error("Waiting for GPS…");
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) {
      try { await nav.share({ title: "My live location", text: shareText, url: mapUrl }); return; } catch { /* fallthrough */ }
    }
    await navigator.clipboard.writeText(shareText);
    toast.success("Location copied to clipboard");
  };

  const copy = async () => {
    if (!pos) return;
    await navigator.clipboard.writeText(mapUrl);
    toast.success("Link copied");
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const iframeSrc = pos
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${pos.lng - 0.005},${pos.lat - 0.003},${pos.lng + 0.005},${pos.lat + 0.003}&layer=mapnik&marker=${pos.lat},${pos.lng}`
    : null;

  return (
    <div className="pb-24">
      <AppHeader title="Live Location" back="/home" />
      <main className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        <div className="rounded-3xl bg-brand-soft p-4 text-sm text-foreground/80">
          Share your real-time location with trusted people. Updates continue as long as this screen is open.
        </div>

        <div className="overflow-hidden rounded-3xl bg-surface shadow-card ring-1 ring-border/60">
          <div className="aspect-[4/3] w-full bg-muted">
            {iframeSrc ? (
              <iframe title="Map" src={iframeSrc} className="h-full w-full border-0" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {sharing ? "Fetching your location…" : "Start sharing to see the map"}
              </div>
            )}
          </div>
          <div className="space-y-2 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> Coordinates
            </div>
            {pos ? (
              <>
                <div className="font-mono text-sm">{pos.lat.toFixed(6)}, {pos.lng.toFixed(6)}</div>
                <div className="text-xs text-muted-foreground">Accuracy ±{Math.round(pos.accuracy)} m · updated {new Date(pos.ts).toLocaleTimeString()}</div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">{error ?? "Not sharing yet"}</div>
            )}
          </div>
        </div>

        {sharing && (
          <div className="flex items-center justify-between rounded-2xl bg-emergency/10 px-4 py-3 text-sm text-emergency">
            <div className="flex items-center gap-2 font-semibold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emergency opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emergency" />
              </span>
              Sharing live
            </div>
            <div className="font-mono">{mm}:{ss}</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button variant="brand" size="lg" onClick={share} disabled={!pos}><Share2 className="h-5 w-5" /> Share link</Button>
          <Button variant="outline" size="lg" onClick={copy} disabled={!pos}><Copy className="h-5 w-5" /> Copy</Button>
        </div>

        {sharing ? (
          <Button variant="emergency" size="lg" className="w-full" onClick={stop}><Square className="h-5 w-5" /> Stop sharing</Button>
        ) : (
          <Button variant="brand" size="lg" className="w-full" onClick={start}><Play className="h-5 w-5" /> Start sharing</Button>
        )}

        {error && <div className="rounded-2xl bg-emergency/10 p-3 text-sm text-emergency">{error}</div>}
      </main>
    </div>
  );
}
