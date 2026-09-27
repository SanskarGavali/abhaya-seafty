// Routing + geocoding via public OpenStreetMap services (no API key needed).
// Nominatim: geocoding/autocomplete. OSRM: route calculation with alternatives.
// Base URLs can be overridden via VITE_GEOCODER_URL / VITE_ROUTER_URL.
import type { GeoPoint, RouteOption } from "./models";

const GEOCODER = (import.meta.env["VITE_GEOCODER_URL"] as string | undefined) || "https://nominatim.openstreetmap.org";
const ROUTER = (import.meta.env["VITE_ROUTER_URL"] as string | undefined) || "https://router.project-osrm.org";

export class RouteError extends Error {
  constructor(public kind: "network" | "timeout" | "rate_limit" | "no_route" | "server", msg: string) { super(msg); }
}

async function timedFetch(url: string, ms: number, signal?: AbortSignal) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  signal?.addEventListener("abort", () => ctrl.abort());
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (res.status === 429) throw new RouteError("rate_limit", "Too many requests. Please wait a moment and retry.");
    if (!res.ok) throw new RouteError("server", "The map service returned an error.");
    return res;
  } catch (e) {
    if (e instanceof RouteError) throw e;
    if ((e as Error).name === "AbortError") throw new RouteError("timeout", "The map service took too long to respond.");
    throw new RouteError("network", "Couldn't reach the map service. Check your internet connection.");
  } finally { clearTimeout(t); }
}

export async function searchPlaces(q: string, near?: GeoPoint, signal?: AbortSignal): Promise<GeoPoint[]> {
  if (q.trim().length < 3) return [];
  const params = new URLSearchParams({ q, format: "jsonv2", limit: "6", countrycodes: "in" });
  if (near) {
    const d = 0.5;
    params.set("viewbox", `${near.lng - d},${near.lat + d},${near.lng + d},${near.lat - d}`);
  }
  const res = await timedFetch(`${GEOCODER}/search?${params}`, 8000, signal);
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  return data.map((d) => ({ lat: Number(d.lat), lng: Number(d.lon), label: d.display_name }));
}

export async function computeRoutes(from: GeoPoint, to: GeoPoint, mode: "foot" | "driving" = "driving"): Promise<RouteOption[]> {
  const profile = mode === "foot" ? "foot" : "driving";
  const url = `${ROUTER}/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?alternatives=true&overview=full&geometries=geojson`;
  const res = await timedFetch(url, 12000);
  const data = (await res.json()) as { code: string; routes?: Array<{ distance: number; duration: number; geometry: { coordinates: [number, number][] } }> };
  if (data.code !== "Ok" || !data.routes?.length) throw new RouteError("no_route", "No route found between these places.");
  return data.routes.map((r, i) => ({
    id: `r${i}`,
    distanceM: r.distance,
    // Public OSRM demo only ships a car profile; estimate walking at 5 km/h.
    durationS: mode === "foot" ? (r.distance / 1000 / 5) * 3600 : r.duration,
    coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
  }));
}

/** Count police/hospital facilities (OSM) within ~300 m of sampled route points. Null if unavailable. */
export async function countFacilitiesNear(coords: [number, number][]): Promise<number | null> {
  try {
    const step = Math.max(1, Math.floor(coords.length / 12));
    const pts = coords.filter((_, i) => i % step === 0).slice(0, 14);
    const parts = pts.map(([la, ln]) => `node["amenity"~"police|hospital"](around:300,${la},${ln});`).join("");
    const q = `[out:json][timeout:10];(${parts});out ids;`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST", body: `data=${encodeURIComponent(q)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const d = (await res.json()) as { elements?: { id: number }[] };
    return new Set((d.elements ?? []).map((e) => e.id)).size;
  } catch { return null; }
}

export function gmapsDirUrl(from: GeoPoint, to: GeoPoint, mode: "foot" | "driving") {
  return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=${mode === "foot" ? "walking" : "driving"}`;
}

export function fmtDistance(m: number) { return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`; }
export function fmtDuration(s: number) {
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}
