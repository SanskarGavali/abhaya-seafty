import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { LocationPermissionGate } from "@/components/app/LocationPermissionGate";
import {
  MapPin, Navigation, Phone, RefreshCw, Search, Filter, Loader2, AlertTriangle, WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAccuracy } from "@/lib/geo";
import { toast } from "sonner";
import { cacheGet, cacheSet } from "@/lib/offline-cache";


export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({ meta: [{ title: "Safe Places Nearby — Abhaya" }] }),
  component: MapPage,
});

type Category =
  | "police" | "women_police" | "hospital" | "gov_hospital" | "fire" | "bus" | "railway"
  | "petrol" | "pharmacy" | "hotel" | "mall" | "temple" | "college" | "university"
  | "library" | "bank" | "atm" | "gov_office" | "municipal";

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
  police:        { label: "Police Station",         short: "Police",       priority: 1, color: "bg-blue-500/10 text-blue-600" },
  women_police:  { label: "Women Police Station",   short: "Women Police", priority: 1, color: "bg-pink-500/10 text-pink-600" },
  hospital:      { label: "Hospital",               short: "Hospital",     priority: 2, color: "bg-red-500/10 text-red-600" },
  gov_hospital:  { label: "Government Hospital",    short: "Govt Hospital",priority: 2, color: "bg-red-600/10 text-red-700" },
  fire:          { label: "Fire Station",           short: "Fire",         priority: 2, color: "bg-orange-500/10 text-orange-600" },
  pharmacy:      { label: "Pharmacy",               short: "Pharmacy",     priority: 3, color: "bg-emerald-500/10 text-emerald-600" },
  bus:           { label: "Bus Stand",              short: "Bus",          priority: 4, color: "bg-cyan-500/10 text-cyan-600" },
  railway:       { label: "Railway Station",        short: "Railway",      priority: 4, color: "bg-cyan-600/10 text-cyan-700" },
  petrol:        { label: "Petrol Pump",            short: "Petrol",       priority: 5, color: "bg-yellow-600/10 text-yellow-700" },
  atm:           { label: "ATM",                    short: "ATM",          priority: 5, color: "bg-lime-600/10 text-lime-700" },
  bank:          { label: "Bank",                   short: "Bank",         priority: 5, color: "bg-lime-500/10 text-lime-600" },
  hotel:         { label: "Hotel / Lodge",          short: "Hotel",        priority: 6, color: "bg-indigo-500/10 text-indigo-600" },
  mall:          { label: "Shopping Mall",          short: "Mall",         priority: 6, color: "bg-purple-500/10 text-purple-600" },
  temple:        { label: "Temple",                 short: "Temple",       priority: 6, color: "bg-amber-500/10 text-amber-600" },
  college:       { label: "College",                short: "College",      priority: 6, color: "bg-sky-500/10 text-sky-600" },
  university:    { label: "University",             short: "University",   priority: 6, color: "bg-sky-600/10 text-sky-700" },
  library:       { label: "Public Library",         short: "Library",      priority: 6, color: "bg-teal-500/10 text-teal-600" },
  gov_office:    { label: "Government Office",      short: "Govt Office",  priority: 6, color: "bg-slate-500/10 text-slate-600" },
  municipal:     { label: "Municipal Office",       short: "Municipal",    priority: 6, color: "bg-slate-600/10 text-slate-700" },
};

const LAST_LOC_KEY = "abhaya:lastKnownLocation";
const PLACES_TTL_MS = 30 * 60 * 1000; // 30 minutes before we re-query Overpass

/** Cache bucket ~1.1 km so small movements reuse the same saved results. */
function placesCacheKey(lat: number, lng: number, radiusKm: number) {
  return `abhaya:places:${lat.toFixed(2)}:${lng.toFixed(2)}:${radiusKm}`;
}


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
  const opType = (tags["operator:type"] || "").toLowerCase();
  const office = tags.office;
  const shop = tags.shop;
  const tourism = tags.tourism;
  const railway = tags.railway;
  const govType = (tags.government || "").toLowerCase();

  if (amenity === "police") {
    if (name.includes("women") || name.includes("mahila") || operator.includes("women")) return "women_police";
    return "police";
  }
  if (amenity === "hospital") {
    if (opType.includes("government") || operator.includes("government") || name.includes("civil") || name.includes("district")) return "gov_hospital";
    return "hospital";
  }
  if (amenity === "clinic") return "hospital";
  if (amenity === "fire_station") return "fire";
  if (amenity === "pharmacy") return "pharmacy";
  if (amenity === "bus_station") return "bus";
  if (railway === "station") return "railway";
  if (amenity === "fuel") return "petrol";
  if (amenity === "atm") return "atm";
  if (amenity === "bank") return "bank";
  if (tourism === "hotel" || tourism === "guest_house" || tourism === "hostel") return "hotel";
  if (shop === "mall") return "mall";
  if (amenity === "place_of_worship" && (tags.religion === "hindu" || name.includes("temple") || name.includes("mandir"))) return "temple";
  if (amenity === "college") return "college";
  if (amenity === "university") return "university";
  if (amenity === "library") return "library";
  if (amenity === "townhall") return "municipal";
  if (office === "government") {
    if (govType.includes("municipal") || name.includes("municipal") || name.includes("nagar")) return "municipal";
    return "gov_office";
  }
  return null;
}

// Custom error kinds so the UI can render friendly messages, never raw
// browser strings like "The user aborted a request".
class PlacesError extends Error {
  kind: "network" | "timeout" | "server" | "unknown";
  constructor(kind: "network" | "timeout" | "server" | "unknown", msg: string) {
    super(msg);
    this.kind = kind;
  }
}

type OverpassEl = { id: number; type: string; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

function parseElements(elements: OverpassEl[], lat: number, lng: number): Place[] {
  const seen = new Set<string>();
  const out: Place[] = [];
  for (const el of elements ?? []) {
    const tags = el.tags ?? {};
    const cat = classify(tags);
    if (!cat) continue;
    const plat = el.lat ?? el.center?.lat;
    const plng = el.lon ?? el.center?.lon;
    if (plat == null || plng == null) continue;
    const id = `${el.type}/${el.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const name = tags.name || tags["name:en"] || CATEGORY_META[cat].label;
    const addressParts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:suburb"], tags["addr:city"]].filter(Boolean);
    out.push({
      id, name, category: cat,
      lat: plat, lng: plng,
      address: addressParts.length ? addressParts.join(", ") : undefined,
      phone: tags.phone || tags["contact:phone"] || undefined,
      distanceKm: haversineKm(lat, lng, plat, plng),
    });
  }
  return out;
}

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

/**
 * Performance: all mirrors are queried in parallel and the FIRST successful
 * response wins (Overpass mirrors vary from 1s to 20s). Timeout is 9s per
 * mirror instead of 18s serial-per-mirror, so worst case is ~9s not ~54s.
 */
async function fetchNearby(
  lat: number, lng: number, radiusM: number, signal: AbortSignal,
): Promise<Place[]> {
  const query = `
    [out:json][timeout:12];
    (
      node["amenity"~"police|hospital|clinic|fire_station|pharmacy|bus_station|fuel|atm|bank|college|university|library|townhall|place_of_worship"](around:${radiusM},${lat},${lng});
      way["amenity"~"police|hospital|fire_station|bus_station|college|university|library|townhall"](around:${radiusM},${lat},${lng});
      node["railway"="station"](around:${radiusM},${lat},${lng});
      node["tourism"~"hotel|guest_house|hostel"](around:${radiusM},${lat},${lng});
      way["tourism"~"hotel|guest_house|hostel"](around:${radiusM},${lat},${lng});
      node["shop"="mall"](around:${radiusM},${lat},${lng});
      way["shop"="mall"](around:${radiusM},${lat},${lng});
      node["office"="government"](around:${radiusM},${lat},${lng});
      way["office"="government"](around:${radiusM},${lat},${lng});
    );
    out center tags 200;
  `.trim();

  const kinds: Array<"network" | "timeout" | "server" | "unknown"> = [];

  const attempt = (url: string) =>
    new Promise<Place[]>((resolve, reject) => {
      const local = new AbortController();
      const onOuter = () => local.abort();
      signal.addEventListener("abort", onOuter);
      const timer = setTimeout(() => local.abort(), 9000);
      const cleanup = () => { clearTimeout(timer); signal.removeEventListener("abort", onOuter); };

      fetch(url, {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: local.signal,
        keepalive: false,
      })
        .then(async (res) => {
          if (!res.ok) { kinds.push(res.status >= 500 ? "server" : "network"); throw new Error("bad status"); }
          const data = (await res.json()) as { elements: OverpassEl[] };
          cleanup();
          resolve(parseElements(data.elements ?? [], lat, lng));
        })
        .catch((e: Error) => {
          cleanup();
          if (!signal.aborted) kinds.push(e?.name === "AbortError" ? "timeout" : "network");
          reject(e);
        });
    });

  try {
    return await Promise.any(ENDPOINTS.map(attempt));
  } catch {
    if (signal.aborted) throw new PlacesError("unknown", "cancelled");
    const kind = kinds.includes("timeout") ? "timeout" : kinds.includes("network") ? "network" : kinds[0] ?? "unknown";
    throw new PlacesError(kind, "all endpoints failed");
  }
}


function walkMinutes(km: number): number {
  return Math.max(1, Math.round((km / 5) * 60));
}

function MapPage() {
  return (
    <div className="pb-24">
      <AppHeader title="Safe Places Nearby" />
      <LocationPermissionGate purpose="We use your location to show police stations, hospitals, and other safe places nearby. You can change this any time.">
        {(initialPos) => <PlacesList initialPos={initialPos} />}
      </LocationPermissionGate>
    </div>
  );
}

function PlacesList({ initialPos }: { initialPos: { lat: number; lng: number; accuracy: number } }) {
  const [pos, setPos] = useState<{ lat: number; lng: number; accuracy?: number; stale?: boolean }>({ ...initialPos });
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [radiusKm, setRadiusKm] = useState(5);
  const [sosActive, setSosActive] = useState(false);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const abortRef = useRef<AbortController | null>(null);
  const watchRef = useRef<number | null>(null);
  const lastRefreshLoc = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    try { setSosActive(sessionStorage.getItem("abhaya:sosActive") === "1"); } catch { /* ignore */ }
  }, []);

  // Persist last known location so a returning user without a fresh GPS
  // fix still sees relevant results (also seeds the gate on next open).
  useEffect(() => {
    try {
      localStorage.setItem(LAST_LOC_KEY, JSON.stringify({ ...pos, ts: Date.now() }));
    } catch { /* ignore */ }
  }, [pos]);

  // Continuous location updates so the list refreshes as the user moves.
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (p) => {
        const acc = p.coords.accuracy;
        if (!isFinite(acc) || acc > 5000) return;
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: acc, stale: false });
      },
      () => { /* silent — we already have initialPos */ },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  const loadPlaces = useCallback(async (lat: number, lng: number, radius: number, force = false) => {
    // 1) Instant paint from cache (also what keeps the screen usable offline).
    const key = placesCacheKey(lat, lng, radius);
    const cached = cacheGet<Place[]>(key);
    if (cached?.value?.length) {
      setPlaces(cached.value.map((p: Place) => ({ ...p, distanceKm: haversineKm(lat, lng, p.lat, p.lng) })));
      lastRefreshLoc.current = { lat, lng };
      setLoading(false);
      // Fresh enough? Skip the network entirely.
      if (!force && cached.ageMs < PLACES_TTL_MS) return;
    }

    if (!navigator.onLine) {
      if (!cached?.value?.length) {
        setErrorMsg("You're offline and we have no saved places for this area yet. Emergency SOS and calling still work.");
      }
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    if (!cached?.value?.length) setLoading(true);
    setErrorMsg(null);
    try {
      const results = await fetchNearby(lat, lng, radius * 1000, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setPlaces(results);
      cacheSet(key, results);
      lastRefreshLoc.current = { lat, lng };
      if (results.length === 0) {
        setErrorMsg(`No safe places found within ${radius} km. Try a wider search.`);
      }
    } catch (e) {
      if (ctrl.signal.aborted) return; // silent, superseded
      if (cached?.value?.length) return; // we already show saved results
      const kind = (e as PlacesError).kind;
      if (kind === "timeout") {
        setErrorMsg("Loading is taking longer than expected. Please check your connection and try again.");
      } else if (kind === "network" || !navigator.onLine) {
        setErrorMsg("Unable to load nearby safe places. Please check your internet connection and try again. You can still use Emergency SOS and Emergency Calling.");
      } else {
        setErrorMsg("We couldn't load nearby places right now. Please try again in a moment.");
      }
      // Keep any existing results so the UI never blanks out.
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);


  // Initial fetch + refetch when user moves > 300 m.
  useEffect(() => {
    const last = lastRefreshLoc.current;
    const moved = !last || haversineKm(last.lat, last.lng, pos.lat, pos.lng) > 0.3;
    if (moved) loadPlaces(pos.lat, pos.lng, radiusKm);
  }, [pos.lat, pos.lng, radiusKm, loadPlaces]);

  // Auto-retry when the browser comes back online.
  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      if (errorMsg) loadPlaces(pos.lat, pos.lng, radiusKm);
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [errorMsg, pos.lat, pos.lng, radiusKm, loadPlaces]);

  const refresh = () => {
    setErrorMsg(null);
    loadPlaces(pos.lat, pos.lng, radiusKm, true);

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

  const categories: (Category | "all")[] = [
    "all", "police", "women_police", "hospital", "gov_hospital", "fire", "pharmacy",
    "bus", "railway", "petrol", "atm", "bank", "hotel", "mall", "temple",
    "college", "university", "library", "gov_office", "municipal",
  ];

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 pt-4">
      {sosActive && (
        <div className="flex items-center gap-2 rounded-2xl bg-emergency/10 px-3 py-2 text-xs font-semibold text-emergency">
          <AlertTriangle className="h-4 w-4" /> SOS active — prioritizing police & hospitals
        </div>
      )}

      {!online && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700">
          <WifiOff className="h-4 w-4" /> You're offline. Reconnect to refresh nearby places.
        </div>
      )}

      {/* Location status */}
      <div className="rounded-3xl bg-surface p-4 shadow-card ring-1 ring-border/60">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Your current location</div>
            <div className="text-xs text-muted-foreground">
              {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)} · {formatAccuracy(pos.accuracy)}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* Search + radius */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or area…"
          className="w-full rounded-2xl border border-border bg-surface py-3 pl-9 pr-3 text-sm outline-none focus:border-brand"
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Radius:</span>
        {[2, 5, 10, 20].map((r) => (
          <button
            key={r}
            onClick={() => setRadiusKm(r)}
            className={`rounded-full border px-2.5 py-1 font-medium transition-colors ${
              radiusKm === r ? "border-brand bg-brand text-brand-foreground" : "border-border bg-surface"
            }`}
          >{r} km</button>
        ))}
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
                active ? "border-brand bg-brand text-brand-foreground" : "border-border bg-surface text-foreground/70 hover:bg-brand-soft"
              }`}
            >
              {c === "all" && <Filter className="mr-1 inline h-3 w-3" />}
              {label}
            </button>
          );
        })}
      </div>

      {/* Error banner with retry */}
      {errorMsg && !loading && (
        <div className="space-y-2 rounded-2xl bg-emergency/10 p-3 text-sm text-emergency">
          <div>{errorMsg}</div>
          <div className="flex gap-2">
            <Button size="sm" variant="emergency" onClick={refresh}>
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href="tel:112">Call 112</a>
            </Button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-surface p-6 text-sm text-muted-foreground shadow-card">
          <Loader2 className="h-4 w-4 animate-spin" /> Finding safe places near you…
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <ul className="space-y-3">
          {filtered.map((p) => {
            const meta = CATEGORY_META[p.category];
            const km = p.distanceKm < 1 ? `${Math.round(p.distanceKm * 1000)} m` : `${p.distanceKm.toFixed(1)} km`;
            const mins = walkMinutes(p.distanceKm);
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`;
            const gmapsView = `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
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
                        <a href={gmapsView} target="_blank" rel="noreferrer">Open in Maps</a>
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && !errorMsg && filtered.length === 0 && places.length > 0 && (
        <div className="rounded-2xl bg-surface p-6 text-center text-sm text-muted-foreground shadow-card">
          No places match your filters. Try clearing the search or picking "All".
        </div>
      )}
    </main>
  );
}
