// Centralized geolocation helpers. Every user-facing message here is
// friendly — never raw browser text like "User denied Geolocation" or
// "Signal is aborted without reason". Callers can safely display the
// returned `message` field directly in the UI.

export type FriendlyGeoError =
  | "unsupported"
  | "denied"
  | "denied_permanent"
  | "unavailable"
  | "timeout"
  | "poor_accuracy"
  | "unknown";

export type GeoErrorInfo = {
  kind: FriendlyGeoError;
  message: string;
  canOpenSettings: boolean;
};

export function friendlyGeoError(kind: FriendlyGeoError): GeoErrorInfo {
  switch (kind) {
    case "unsupported":
      return {
        kind,
        message: "Your browser doesn't support location. Try a different browser or use the app.",
        canOpenSettings: false,
      };
    case "denied":
      return {
        kind,
        message: "Location access was blocked. Please allow it to see safe places nearby.",
        canOpenSettings: true,
      };
    case "denied_permanent":
      return {
        kind,
        message: "Location is turned off for this app. Open settings and allow location, then try again.",
        canOpenSettings: true,
      };
    case "unavailable":
      return {
        kind,
        message: "GPS signal is unavailable right now. Move to an open area and try again.",
        canOpenSettings: false,
      };
    case "timeout":
      return {
        kind,
        message: "Getting your location is taking too long. Please try again in a moment.",
        canOpenSettings: false,
      };
    case "poor_accuracy":
      return {
        kind,
        message: "Waiting for a better GPS signal…",
        canOpenSettings: false,
      };
    default:
      return {
        kind: "unknown",
        message: "Couldn't get your location. Please try again.",
        canOpenSettings: false,
      };
  }
}

export function mapPositionError(err: GeolocationPositionError): GeoErrorInfo {
  if (err.code === err.PERMISSION_DENIED) return friendlyGeoError("denied");
  if (err.code === err.POSITION_UNAVAILABLE) return friendlyGeoError("unavailable");
  if (err.code === err.TIMEOUT) return friendlyGeoError("timeout");
  return friendlyGeoError("unknown");
}

export type PermissionState = "granted" | "prompt" | "denied" | "unknown";

export async function queryLocationPermission(): Promise<PermissionState> {
  if (typeof navigator === "undefined") return "unknown";
  const nav = navigator as Navigator & {
    permissions?: { query: (p: { name: PermissionName }) => Promise<PermissionStatus> };
  };
  if (!nav.permissions?.query) return "unknown";
  try {
    const s = await nav.permissions.query({ name: "geolocation" as PermissionName });
    return s.state as PermissionState;
  } catch {
    return "unknown";
  }
}

// One-shot fix with friendly errors. Fast if permission is already granted.
export function getCurrentPositionFriendly(opts: PositionOptions = {}): Promise<
  { ok: true; coords: GeolocationCoordinates } | { ok: false; error: GeoErrorInfo }
> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve({ ok: false, error: friendlyGeoError("unsupported") });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ ok: true, coords: p.coords }),
      (e) => resolve({ ok: false, error: mapPositionError(e) }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000, ...opts },
    );
  });
}

// Best-effort "open OS settings" hint. Browsers can't open native settings,
// so we return brief platform-specific guidance the UI can show as a hint.
export function openSettingsHint(): string {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return "iPhone: Settings → Privacy & Security → Location Services → Safari";
  }
  if (/Android/i.test(ua)) {
    return "Android: Settings → Apps → Browser → Permissions → Location → Allow";
  }
  return "Open your browser's site settings and allow Location for this site.";
}
