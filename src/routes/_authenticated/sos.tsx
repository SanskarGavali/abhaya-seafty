import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Phone, MapPin, Share2, X, Volume2, VolumeX, Zap, ZapOff, Users, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { enableTorch, disableTorch } from "@/lib/torch";
import { shareEmergency } from "@/lib/share";
import { formatAccuracy } from "@/lib/geo";

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
  const [siren, setSiren] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRefs = useRef<OscillatorNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);
  const sirenTimerRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const watchRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const posRef = useRef<Pos | null>(null);

  useEffect(() => { posRef.current = pos; }, [pos]);

  useEffect(() => {
    let cancelled = false;
    // Prefer cached contacts for instant display; refresh in the background.
    try {
      const cached = localStorage.getItem("abhaya.contacts.cache");
      if (cached) {
        const parsed = JSON.parse(cached) as Contact[];
        if (Array.isArray(parsed)) setContacts(parsed);
      }
    } catch { /* noop */ }
    supabase
      .from("emergency_contacts")
      .select("id, name, phone, priority")
      .order("priority", { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        const list = data ?? [];
        setContacts(list);
        try { localStorage.setItem("abhaya.contacts.cache", JSON.stringify(list)); } catch { /* noop */ }
      });
    return () => { cancelled = true; };
  }, []);

  const startSiren = useCallback(() => {
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = 0.9; // as loud as we can politely go
      master.connect(ctx.destination);

      // Two detuned sawtooth oscillators for a piercing wail
      const oscs: OscillatorNode[] = [];
      for (const detune of [0, 12]) {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = 850;
        o.detune.value = detune;
        o.connect(master);
        o.start();
        oscs.push(o);
      }
      audioCtxRef.current = ctx;
      oscRefs.current = oscs;
      gainRef.current = master;
      let up = true;
      sirenTimerRef.current = window.setInterval(() => {
        const target = up ? 1500 : 650;
        oscs.forEach((o) => o.frequency.linearRampToValueAtTime(target, ctx.currentTime + 0.35));
        up = !up;
      }, 350);
    } catch {
      /* ignore */
    }
  }, []);

  const stopSiren = useCallback(() => {
    if (sirenTimerRef.current) clearInterval(sirenTimerRef.current);
    sirenTimerRef.current = null;
    oscRefs.current.forEach((o) => { try { o.stop(); o.disconnect(); } catch { /* noop */ } });
    oscRefs.current = [];
    gainRef.current?.disconnect();
    audioCtxRef.current?.close().catch(() => {});
    gainRef.current = null;
    audioCtxRef.current = null;
  }, []);

  const requestWakeLock = useCallback(async () => {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLockSentinel> } };
      if (nav.wakeLock) wakeLockRef.current = await nav.wakeLock.request("screen");
    } catch { /* noop */ }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try { await wakeLockRef.current?.release(); } catch { /* noop */ }
    wakeLockRef.current = null;
  }, []);

  const startGeo = useCallback(() => {
    if (!navigator.geolocation) { setGeoError("Geolocation not available"); return; }
    if (watchRef.current != null) return; // already watching — do not re-prompt

    const onFix = (p: GeolocationPosition) => {
      const acc = p.coords.accuracy;
      if (!isFinite(acc) || acc > 5000) { setGeoError("Waiting for a better GPS signal…"); return; }
      // Only replace an existing fix when the new one is at least as accurate
      // (or the previous fix is >30 s old) so we keep improving in background.
      setPos((prev) => {
        if (!prev) return { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: acc };
        const stale = Date.now() - (posRef.current ? Date.now() : 0) > 30_000; // always false here — kept for readability
        if (acc <= prev.accuracy || stale) {
          return { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: acc };
        }
        return prev;
      });
      setGeoError(null);
    };

    // Fast first fix from any cached position, then start high-accuracy watch.
    navigator.geolocation.getCurrentPosition(onFix, () => { /* silent — watch will retry */ }, {
      enableHighAccuracy: false, maximumAge: 60_000, timeout: 4_000,
    });
    watchRef.current = navigator.geolocation.watchPosition(
      onFix,
      (e) => setGeoError(e.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 },
    );
  }, []);

  const stopGeo = useCallback(() => {
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
  }, []);

  // Pre-arm geolocation on mount when the user has already granted permission,
  // so a fresh fix is ready the instant they tap SOS. If permission is unknown,
  // we wait for the SOS tap so we never prompt unexpectedly.
  useEffect(() => {
    const nav = navigator as Navigator & { permissions?: { query: (p: { name: PermissionName }) => Promise<PermissionStatus> } };
    if (!nav.permissions?.query) return;
    nav.permissions.query({ name: "geolocation" as PermissionName })
      .then((s) => { if (s.state === "granted") startGeo(); })
      .catch(() => { /* noop */ });
  }, [startGeo]);

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

  const tryTorch = useCallback(async () => {
    const ok = await enableTorch();
    setTorchSupported(ok);
    setTorchOn(ok);
  }, []);

  const activate = async () => {
    setActive(true);
    setSeconds(0);
    tickRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    if (siren) startSiren();
    requestWakeLock();
    startGeo();
    tryTorch();
    setTimeout(() => logIncident(posRef.current?.lat ?? null, posRef.current?.lng ?? null), 1500);
    toast.error("SOS Active — help is on the way", { duration: 3000 });
  };

  const deactivate = useCallback(() => {
    setActive(false);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    stopSiren();
    // Keep GPS watch alive so re-activation is instant; it stops on unmount.
    releaseWakeLock();
    disableTorch();
    setTorchOn(false);
    toast.success("SOS deactivated");
  }, [releaseWakeLock, stopSiren]);

  useEffect(() => () => {
    stopSiren(); stopGeo(); releaseWakeLock(); disableTorch();
    if (tickRef.current) clearInterval(tickRef.current);
  }, [releaseWakeLock, stopGeo, stopSiren]);

  const toggleSiren = () => {
    const next = !siren;
    setSiren(next);
    if (active) { if (next) startSiren(); else stopSiren(); }
  };

  const toggleTorch = async () => {
    if (torchOn) { await disableTorch(); setTorchOn(false); }
    else { const ok = await enableTorch(); setTorchOn(ok); setTorchSupported(ok); if (!ok) toast.info("Flashlight not supported on this device"); }
  };

  const callNumber = (phone: string) => { window.location.href = `tel:${phone.replace(/\s+/g, "")}`; };
  const callPrimary = () => contacts[0] ? callNumber(contacts[0].phone) : callNumber("112");

  const alertAll = async () => {
    const phones = contacts.map((c) => c.phone);
    if (phones.length === 0) {
      toast.error("No emergency contacts saved. Add contacts to enable Alert All.");
      return;
    }
    const r = await shareEmergency(pos, phones);
    if (r === "shared" || r === "sms") toast.success("Emergency message ready to send");
    else if (r === "copied") toast.success("Location copied — paste in your messages");
    else toast.error("Could not share automatically — try Share location");
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className={`min-h-[100dvh] transition-colors ${active ? "bg-emergency text-emergency-foreground" : "bg-background"}`}>
      <header className="flex items-center justify-between px-4 pt-4">
        <button onClick={() => (active ? deactivate() : navigate({ to: "/home" }))} className={`flex h-10 w-10 items-center justify-center rounded-full ${active ? "bg-white/20 text-white" : "bg-surface"}`} aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        {active && <div className="rounded-full bg-white/20 px-3 py-1 font-mono text-sm">{mm}:{ss}</div>}
        <div className="w-10" />
      </header>

      <main className="mx-auto max-w-lg px-4 pt-4 pb-8">
        {!active ? (
          <div className="space-y-6 pt-6">
            <div className="text-center">
              <h1 className="font-display text-3xl font-semibold">Emergency SOS</h1>
              <p className="mt-2 text-sm text-muted-foreground">Tap to sound the alarm, share your live location, and call for help.</p>
            </div>

            <button onClick={activate} className="group relative mx-auto flex h-64 w-64 items-center justify-center rounded-full bg-gradient-emergency text-emergency-foreground shadow-emergency active:scale-95">
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
              <button onClick={toggleTorch} className={`flex items-center justify-center gap-2 rounded-2xl p-3 text-sm font-medium ring-1 ring-border ${torchOn ? "bg-brand-soft text-brand" : "bg-surface text-muted-foreground"}`}>
                {torchOn ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />} Flashlight {torchOn ? "on" : "off"}
              </button>
            </div>
            {!torchSupported && (
              <p className="text-center text-[11px] text-muted-foreground">Flashlight isn't supported by this device/browser.</p>
            )}

            <div className="rounded-2xl bg-surface p-4 ring-1 ring-border/60">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Call chain</div>
              {contacts.length === 0 ? (
                <div className="mt-2 text-sm text-muted-foreground">No contacts yet — SOS will call <b>112</b>. <button className="text-brand underline" onClick={() => navigate({ to: "/contacts" })}>Add contacts</button></div>
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
          <div className="space-y-4 pt-2">
            <div className="rounded-3xl bg-white/15 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-90"><MapPin className="h-3.5 w-3.5" /> Live location</div>
              {pos ? (
                <>
                  <div className="mt-1 font-mono text-lg">{pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}</div>
                  <div className="text-xs opacity-80">Accuracy {formatAccuracy(pos.accuracy)} · updating live</div>
                </>
              ) : (
                <div className="mt-1 text-sm opacity-90">{geoError ? geoError : "Acquiring GPS fix…"}</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="glass" size="lg" onClick={callPrimary} className="!bg-white/95 !text-emergency">
                <PhoneCall className="h-5 w-5" /> Call {contacts[0]?.name ?? "112"}
              </Button>
              <Button variant="glass" size="lg" onClick={() => callNumber("112")} className="!bg-white/95 !text-emergency">
                <Phone className="h-5 w-5" /> Call 112
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="glass" size="lg" onClick={alertAll} className="!bg-white/20 !text-white !border-white/30">
                <Users className="h-5 w-5" /> Alert all contacts
              </Button>
              <Button variant="glass" size="lg" onClick={() => shareEmergency(pos, contacts.map((c) => c.phone))} className="!bg-white/20 !text-white !border-white/30">
                <Share2 className="h-5 w-5" /> Share location
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={toggleSiren} className="flex items-center justify-center gap-2 rounded-2xl bg-white/15 p-3 text-sm font-medium">
                {siren ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />} Siren
              </button>
              <button onClick={toggleTorch} className="flex items-center justify-center gap-2 rounded-2xl bg-white/15 p-3 text-sm font-medium">
                {torchOn ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />} Flashlight
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
