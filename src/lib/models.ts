// Shared data models for Abhaya feature modules. UI imports these types;
// service modules (*.service.ts) own all network/storage logic.

export type EvidenceKind = "photo" | "video" | "audio" | "document" | "other";

export interface Evidence {
  id: string;
  user_id: string;
  title: string;
  kind: EvidenceKind;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string;
  notes: string | null;
  category: string | null;
  incident_id: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy_m: number | null;
  captured_at: string;
  created_at: string;
  updated_at: string;
}

export const INCIDENT_CATEGORIES = [
  { key: "harassment", label: "Harassment" },
  { key: "stalking", label: "Stalking" },
  { key: "domestic_violence", label: "Domestic violence" },
  { key: "unsafe_location", label: "Unsafe location" },
  { key: "cyber", label: "Cyber incident" },
  { key: "transport", label: "Transport issue" },
  { key: "threat", label: "Threat / intimidation" },
  { key: "other", label: "Other" },
] as const;
export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number]["key"];

export function categoryLabel(key: string | null | undefined): string {
  return INCIDENT_CATEGORIES.find((c) => c.key === key)?.label ?? (key ? key.replace(/_/g, " ") : "Uncategorised");
}

/** Only statuses the backend actually supports (DB check constraint). */
export type IncidentStatus = "draft" | "submitted";

export interface Incident {
  id: string;
  report_code: string | null;
  category: string;
  description: string | null;
  notes: string | null;
  occurred_at: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  contact_ref: string | null;
  evidence_ids: string[];
  status: string;
  is_emergency: boolean;
  submitted_at: string | null;
  created_at: string;
}

export interface SafePlace {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  distanceKm: number;
}

export interface GeoPoint { lat: number; lng: number; label?: string }

export interface RouteOption {
  id: string;
  distanceM: number;
  durationS: number;
  coords: [number, number][]; // [lat, lng]
  /** Count of verified public facilities (police/hospital) near the route, if fetched. */
  facilitiesNearby?: number | null;
}

export interface DiscreetSettings { enabled: boolean }
