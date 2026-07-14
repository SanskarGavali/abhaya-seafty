import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Phone, MapPin, Share2, X, Volume2, VolumeX, Zap, ZapOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/sos")({
  head: () => ({ meta: [{ title: "Emergency SOS — Abhaya" }, { name: "robots", content: "noindex" }] }),
  component: SosPage,
});

type Contact = { id: string; name: string; phone: string; priority: number };
type Pos = { lat: number; lng: number; accuracy: number };

function SosPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [pos, setPos] = useState<Pos | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [callIdx, setCallIdx] = useState(0);
  const [siren, setSiren] = useState(true);
  const [flash, setFlash] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sirenTimerRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const watchRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  // Load contacts
  useEffect(() => {
    supabase
      .from("emergency_contacts")
      .select("id, name, phone, priority")
      .order("priority", { ascending: true })
      .then(({ data }) => setContacts(data ?? []));
  }, []);

  const startSiren = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = 800;
      gain.gain.value = 0.25;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      audioCtxRef.current = ctx;
      oscRef.current = osc;
      gainRef.current = gain;
      let up = true;
      sirenTimerRef.current = window.setInterval(() => {
        if (!oscRef.current) return;
        oscRef.current.frequency.linearRampToValueAtTime(up ? 1400 : 700, ctx.currentTime + 0.35);
        up = !up;
      }, 350);
    } catch {
      // ignore
    }
  };

  const stopSiren = () => {
    if (sirenTimerRef.current) clearInterval(sirenTimerRef.current);
    sirenTimerRef.current = null;
    try { oscRef.current?.stop(); } catch { /* noop */ }
    oscRef.current?.disconnect();
    gainRef.current?.disconnect();
    audioCtxRef.current?.close();
    oscRef.current = null;
    gainRef.current = null;
    audioCtxRef.current = null;
  };

  const requestWakeLock = async () => {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLockSentinel> } };
      if (nav.wakeLock) wakeLockRef.current = await nav.wakeLock.request("screen");
    } catch { /* noop */ }
  };

  const releaseWakeLock = async () => {
    try { await wakeLockRef.current?.release(); } catch { /* noop */ }
    wakeLockRef.current = null;
  };

  const startGeo = () => {
    if (!navigator.geolocation) { setGeoError("Geolocation not available"); return; }
    watchRef.current = navigator.geolocation.watchPosition(
      (p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }); setGeoError(null); },
      (e) => setGeoError(e.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  };

  const stopGeo = () => {
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
  };

  const logIncident = async (lat: number | null, lng: number | null) => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    await supabase.from("incident_reports").insert({
      user_id: uid,
      category: "sos",
      description: "Emergency SOS activated from device.",
      latitude: lat,
      longitude: lng,
      status: "active",
      is_emergency: true,
      submitted_at: new Date().toISOString(),
    });
  };

  const activate = async () => {
    setActive(true);
    setSeconds(0);
    setCallIdx(0);
    tickRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    if (siren) startSiren();
    requestWakeLock();
    startGeo();
    // Wait a moment for first fix, then log
    setTimeout(() => {
      setPos((cur) => { logIncident(cur?.lat ?? null, cur?.lng ?? null); return cur; });
    }, 1500);
    toast.error("SOS Active — help is on the way", { duration: 3000 });
  };

  const deactivate = () => {
    setActive(false);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    stopSiren();
    stopGeo();
    releaseWakeLock();
    toast.success("SOS deactivated");
  };

  useEffect(() => () => { stopSiren(); stopGeo(); releaseWakeLock(); if (tickRef.current) clearInterval(tickRef.current); }, []);

  const toggleSiren = () => {
    const next = !siren;
    setSiren(next);
    if (active) { if (next) startSiren(); else stopSiren(); }
  };

  const callNumber = (phone: string) => {
    window.location.href = `tel:${phone.replace(/\s+/g, "")}`;
  };

  const callNext = () => {
    if (contacts.length === 0) return callNumber("112");
    const c = contacts[callIdx];
    if (!c) return callNumber("112");
    callNumber(c.phone);
    setCallIdx((i) => i + 1);
  };

  const shareLocation = async () => {
    if (!pos) return toast.error("Waiting for GPS…");
    const mapUrl = `https://www.openstreetmap.org/?mlat=${pos.lat}&mlon=${pos.lng}#map=18/${pos.lat}/${pos.lng}`;
    const text = `🚨 EMERGENCY — I need help. My live location: ${mapUrl}`;
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) {
      try { await nav.share({ title: "Abhaya SOS", text }); return; } catch { /* fall through */ }
    }
    await navigator.clipboard.writeText(text);
    toast.success("Location copied — paste in your messages");
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className={`min-h-[100dvh] transition-colors ${active ? "bg-emergency text-emergency-foreground" : "bg-background"}`}>
      {active && flash && <FlashOverlay />}

      <header className="flex items-center justify-between px-4 pt-4">
        <button onClick={() => (active ? deactivate() : navigate({ to: "/home" }))} className={`flex h-10 w-10 items-center justify-center rounded-full ${active ? "bg-white/20 text-white" : "bg-surface"}`} aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        {active && (
          <div className="rounded-full bg-white/20 px-3 py-1 font-mono text-sm">{mm}:{ss}</div>
        )}
        <div className="w-10" />
      </header>

      <main className="mx-auto max-w-lg px-4 pt-4">
        {!active ? (
          <div className="space-y-6 pt-6">
            <div className="text-center">
              <h1 className="font-display text-3xl font-semibold">Emergency SOS</h1>
              <p className="mt-2 text-sm text-muted-foreground">Tap the button to activate siren, share your live location and start the call chain.</p>
            </div>

            <button
              onClick={activate}
              className="group relative mx-auto flex h-64 w-64 items-center justify-center rounded-full bg-gradient-emergency text-emergency-foreground shadow-emergency active:scale-95"
            >
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-emergency/40" />
              <span className="absolute inset-2 animate-pulse-ring rounded-full bg-emergency/30" style={{ animationDelay: "0.6s" }} />
              <div className="relative flex flex-col items-center">
                <AlertTriangle className="h-16 w-16" strokeWidth={2.4} />
                <div className="mt-2 font-display text-2xl font-semibold">TAP SOS</div>
                <div className="text-xs opacity-90">Hold your phone tightly</div>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={toggleSiren} className={`flex items-center justify-center gap-2 rounded-2xl p-3 text-sm font-medium ring-1 ring-border ${siren ? "bg-brand-soft text-brand" : "bg-surface text-muted-foreground"}`}>
                {siren ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />} Siren {siren ? "on" : "off"}
              </button>
              <button onClick={() => setFlash((v) => !v)} className={`flex items-center justify-center gap-2 rounded-2xl p-3 text-sm font-medium ring-1 ring-border ${flash ? "bg-brand-soft text-brand" : "bg-surface text-muted-foreground"}`}>
                {flash ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />} Screen flash {flash ? "on" : "off"}
              </button>
            </div>

            <div className="rounded-2xl bg-surface p-4 ring-1 ring-border/60">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Call chain</div>
              {contacts.length === 0 ? (
                <div className="mt-2 text-sm text-muted-foreground">No contacts yet — SOS will call <b>112</b> (emergency). <button className="text-brand underline" onClick={() => navigate({ to: "/contacts" })}>Add contacts</button></div>
              ) : (
                <ol className="mt-2 space-y-1 text-sm">
                  {contacts.map((c, i) => (
                    <li key={c.id} className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">{i + 1}</span>{c.name} <span className="text-muted-foreground">· {c.phone}</span></li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-8 pt-2">
            <div className="rounded-3xl bg-white/15 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-90"><MapPin className="h-3.5 w-3.5" /> Live location</div>
              {pos ? (
                <>
                  <div className="mt-1 font-mono text-lg">{pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}</div>
                  <div className="text-xs opacity-80">Accuracy ±{Math.round(pos.accuracy)} m</div>
                </>
              ) : (
                <div className="mt-1 text-sm opacity-90">{geoError ? geoError : "Acquiring GPS fix…"}</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="glass" size="lg" onClick={callNext} className="!bg-white/95 !text-emergency">
                <Phone className="h-5 w-5" /> Call {contacts[callIdx]?.name ?? "112"}
              </Button>
              <Button variant="glass" size="lg" onClick={shareLocation} className="!bg-white/20 !text-white !border-white/30">
                <Share2 className="h-5 w-5" /> Share location
              </Button>
            </div>

            <div className="rounded-3xl bg-white/10 p-4 text-sm">
              <div className="font-semibold">Call chain in progress</div>
              <div className="mt-1 opacity-90">
                {contacts.length === 0
                  ? "No contacts added. Tap to call national emergency 112."
                  : callIdx < contacts.length
                  ? `Next: ${contacts[callIdx].name} (${callIdx + 1}/${contacts.length})`
                  : "All contacts tried. Tap to call 112."}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={toggleSiren} className="flex items-center justify-center gap-2 rounded-2xl bg-white/15 p-3 text-sm font-medium">
                {siren ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />} Siren
              </button>
              <button onClick={() => setFlash((v) => !v)} className="flex items-center justify-center gap-2 rounded-2xl bg-white/15 p-3 text-sm font-medium">
                {flash ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />} Flash
              </button>
            </div>

            <button onClick={deactivate} className="w-full rounded-full bg-white py-4 font-display text-lg font-semibold text-emergency shadow-xl active:scale-[0.98]">
              I'm Safe — Deactivate SOS
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function FlashOverlay() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = window.setInterval(() => setOn((v) => !v), 500);
    return () => clearInterval(id);
  }, []);
  return <div className={`pointer-events-none fixed inset-0 z-40 transition-opacity duration-300 ${on ? "bg-white/25 opacity-100" : "opacity-0"}`} />;
}
