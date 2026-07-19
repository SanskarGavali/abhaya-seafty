import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { MapPin, Navigation, Phone, RefreshCw, Search, Filter, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAccuracy } from "@/lib/geo";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({ meta: [{ title: "Safe Places Nearby — Abhaya" }] }),
  component: MapPage,
});

type Category = "police" | "women_police" | "hospital" | "one_stop" | "shelter" | "ngo";

type Place = {
  id: string;
  name: string;
  category: Category;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  distanceKm: number;
};

const CATEGORY_META: Record<Category, { label: string; short: string; priority: number; color: string }> = {
  police: { label: "Police Station", short: "Police", priority: 1, color: "bg-blue-500/10 text-blue-600" },
  women_police: { label: "Women Police Station", short: "Women Police", priority: 2, color: "bg-pink-500/10 text-pink-600" },
  hospital: { label: "Hospital", short: "Hospital", priority: 3, color: "bg-red-500/10 text-red-600" },
  one_stop: { label: "One Stop Centre (Sakhi)", short: "One Stop", priority: 4, color: "bg-purple-500/10 text-purple-600" },
  shelter: { label: "Shelter Home", short: "Shelter", priority: 5, color: "bg-amber-500/10 text-amber-600" },
  ngo: { label: "Women NGO", short: "NGO", priority: 6, color: "bg-emerald-500/10 text-emerald-600" },
};

const LAST_LOC_KEY = "abhaya:lastKnownLocation";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function classify(tags: Record<string, string>): Category | null {
  const amenity = tags.amenity;
  const name = (tags.name || "").toLowerCase();
  const operator = (tags.operator || "").toLowerCase();
  const social = tags["social_facility"] || tags["social_facility:for"] || "";
  if (amenity === "police") {
    if (name.includes("women") || name.includes("mahila") || operator.includes("women")) return "women_police";
    return "police";
  }
  if (amenity === "hospital" || amenity === "clinic") return "hospital";
  if (amenity === "shelter" || /shelter/.test(social)) return "shelter";
  if (name.includes("one stop") || name.includes("sakhi") || name.includes("osc")) return "one_stop";
  if (tags.office === "ngo" || tags["office:ngo"] || name.includes("ngo") || name.includes("women")) return "ngo";
  return null;
}

async function fetchNearby(lat: number, lng: number, radiusM = 5000): Promise<Place[]> {
  const query = `
    [out:json][timeout:20];
    (
      node["amenity"~"police|hospital|clinic|shelter"](around:${radiusM},${lat},${lng});
      way["amenity"~"police|hospital|clinic|shelter"](around:${radiusM},${lat},${lng});
      node["office"="ngo"](around:${radiusM},${lat},${lng});
      node["social_facility"](around:${radiusM},${lat},${lng});
    );
    out center tags 80;
  `.trim();

  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];

  let lastErr: unknown = null;
  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { elements: Array<{ id: number; type: string; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }> };
      const out: Place[] = [];
      for (const el of data.elements ?? []) {
        const tags = el.tags ?? {};
        const cat = classify(tags);
        if (!cat) continue;
        const plat = el.lat ?? el.center?.lat;
        const plng = el.lon ?? el.center?.lon;
        if (plat == null || plng == null) continue;
        const name = tags.name || tags["name:en"] || CATEGORY_META[cat].label;
        const addressParts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:suburb"], tags["addr:city"]].filter(Boolean);
        out.push({
          id: `${el.type}/${el.id}`,
          name,
          category: cat,
          lat: plat,
          lng: plng,
          address: addressParts.length ? addressParts.join(", ") : undefined,
          phone: tags.phone || tags["contact:phone"] || undefined,
          distanceKm: haversineKm(lat, lng, plat, plng),
        });
      }
      return out;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("Failed to fetch nearby places");
}

function walkMinutes(km: number): number {
  // Approx: 5 km/h walking, but for driving we don't know traffic — show walking as a friendly baseline.
  return Math.max(1, Math.round((km / 5) * 60));
}

function MapPage() {
  const [pos, setPos] = useState<{ lat: number; lng: number; accuracy?: number; stale?: boolean } | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [sosActive, setSosActive] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Detect SOS active state (best-effort — the SOS page sets this flag).
  useEffect(() => {
    try {
      setSosActive(sessionStorage.getItem("abhaya:sosActive") === "1");
    } catch { /* ignore */ }
  }, []);

  // Load last known location immediately (never crash if unavailable).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAST_LOC_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { lat: number; lng: number; accuracy?: number; ts: number };
        if (Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng)) {
          setPos({ lat: parsed.lat, lng: parsed.lng, accuracy: parsed.accuracy, stale: true });
        }
      }
    } catch { /* ignore */ }
  }, []);

  const acquireLocation = useCallback((opts: { silent?: boolean } = {}) => {
    if (!("geolocation" in navigator)) {
      if (!opts.silent) setError("Location services are not available on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const acc = p.coords.accuracy;
        const next = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: acc, stale: false };
        setPos(next);
        try {
          localStorage.setItem(LAST_LOC_KEY, JSON.stringify({ ...next, ts: Date.now() }));
        } catch { /* ignore */ }
      },
      (e) => {
        if (!opts.silent) {
          setError(
            e.code === e.PERMISSION_DENIED
              ? "Location permission is off. Enable it in your browser to find safe places near you."
              : "Couldn't get your current location. Showing your last known area if available.",
          );
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }, []);

  useEffect(() => { acquireLocation(); }, [acquireLocation]);

  const loadPlaces = useCallback(async (lat: number, lng: number) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const results = await fetchNearby(lat, lng);
      if (ctrl.signal.aborted) return;
      setPlaces(results);
      if (results.length === 0) {
        setError("No safe places found within 5 km. Try widening your search area or check your connection.");
      }
    } catch (e) {
      if (ctrl.signal.aborted) return;
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(`Couldn't load nearby places (${msg}). You can still call emergency numbers directly.`);
      setPlaces([]);
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pos && !pos.stale) loadPlaces(pos.lat, pos.lng);
  }, [pos, loadPlaces]);

  const refresh = () => {
    setError(null);
    acquireLocation();
    if (pos) loadPlaces(pos.lat, pos.lng);
  };

  const filtered = useMemo(() => {
    let list = places.slice();
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.address ?? "").toLowerCase().includes(q));
    }
    if (sosActive) {
      list.sort((a, b) => {
        const pa = CATEGORY_META[a.category].priority - CATEGORY_META[b.category].priority;
        if (pa !== 0) return pa;
        return a.distanceKm - b.distanceKm;
      });
    } else {
      list.sort((a, b) => a.distanceKm - b.distanceKm);
    }
    return list;
  }, [places, category, query, sosActive]);

  const categories: (Category | "all")[] = ["all", "police", "women_police", "hospital", "one_stop", "shelter", "ngo"];

  return (
    <div className="pb-24">
      <AppHeader title="Safe Places Nearby" />
      <main className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        {sosActive && (
          <div className="flex items-center gap-2 rounded-2xl bg-emergency/10 px-3 py-2 text-xs font-semibold text-emergency">
            <AlertTriangle className="h-4 w-4" /> SOS active — prioritizing police & hospitals
          </div>
        )}

        {/* Location status */}
        <div className="rounded-3xl bg-surface p-4 shadow-card ring-1 ring-border/60">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">
                {pos ? (pos.stale ? "Last known location" : "Your current location") : "Locating…"}
              </div>
              <div className="text-xs text-muted-foreground">
                {pos ? (
                  <>
                    {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)} · {formatAccuracy(pos.accuracy)}
                  </>
                ) : (
                  "Waiting for GPS…"
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or area…"
            className="w-full rounded-2xl border border-border bg-surface py-3 pl-9 pr-3 text-sm outline-none focus:border-brand"
          />
        </div>

        {/* Category filter */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {categories.map((c) => {
            const active = category === c;
            const label = c === "all" ? "All" : CATEGORY_META[c].short;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border bg-surface text-foreground/70 hover:bg-brand-soft"
                }`}
              >
                {c === "all" && <Filter className="mr-1 inline h-3 w-3" />}
                {label}
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="rounded-2xl bg-emergency/10 p-3 text-sm text-emergency">{error}</div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-surface p-6 text-sm text-muted-foreground shadow-card">
            <Loader2 className="h-4 w-4 animate-spin" /> Finding safe places near you…
          </div>
        )}

        {/* List */}
        {!loading && filtered.length > 0 && (
          <ul className="space-y-3">
            {filtered.map((p) => {
              const meta = CATEGORY_META[p.category];
              const km = p.distanceKm < 1 ? `${Math.round(p.distanceKm * 1000)} m` : `${p.distanceKm.toFixed(1)} km`;
              const mins = walkMinutes(p.distanceKm);
              const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`;
              return (
                <li key={p.id} className="rounded-3xl bg-surface p-4 shadow-card ring-1 ring-border/60">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.color}`}>
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{meta.label}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-sm font-semibold text-brand">{km}</div>
                          <div className="text-[11px] text-muted-foreground">~{mins} min</div>
                        </div>
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {p.address ?? "Address not listed. Use directions to navigate."}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button asChild variant="brand" size="sm">
                          <a href={mapsUrl} target="_blank" rel="noreferrer">
                            <Navigation className="h-4 w-4" /> Directions
                          </a>
                        </Button>
                        {p.phone ? (
                          <Button asChild variant="outline" size="sm">
                            <a href={`tel:${p.phone.replace(/\s+/g, "")}`}>
                              <Phone className="h-4 w-4" /> Call
                            </a>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toast.info("Phone not listed. Try 112 for emergency assistance.")}
                          >
                            <Phone className="h-4 w-4" /> No number
                          </Button>
                        )}
                        <Button asChild variant="ghost" size="sm">
                          <a href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=17/${p.lat}/${p.lng}`} target="_blank" rel="noreferrer">
                            Open map
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!loading && !error && filtered.length === 0 && places.length > 0 && (
          <div className="rounded-2xl bg-surface p-6 text-center text-sm text-muted-foreground shadow-card">
            No places match your filters. Try clearing the search or picking "All".
          </div>
        )}

        {!pos && !loading && (
          <div className="rounded-2xl bg-brand-soft p-4 text-sm text-foreground/80">
            We need your location to show safe places nearby. In an emergency call{" "}
            <a href="tel:112" className="font-semibold text-emergency underline">112</a>.
          </div>
        )}
      </main>
    </div>
  );
}
