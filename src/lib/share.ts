// Cross-platform "share to contacts" utilities.
export type SharePos = { lat: number; lng: number; accuracy?: number };

export function mapsUrl(pos: SharePos): string {
  return `https://www.google.com/maps?q=${pos.lat},${pos.lng}`;
}

export function emergencyMessage(pos: SharePos | null, name?: string): string {
  const who = name?.trim() ? name.trim() : "I";
  if (!pos) return `🚨 EMERGENCY — ${who} need help. Please call me immediately.`;
  return `🚨 EMERGENCY — ${who} need help. My live location: ${mapsUrl(pos)} (±${Math.round(
    pos.accuracy ?? 0,
  )}m). Please call me immediately.`;
}

export async function shareEmergency(
  pos: SharePos | null, phones: string[], name?: string, extra?: string,
) {
  const text = emergencyMessage(pos, name) + (extra ?? "");

  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
  if (nav.share) {
    try {
      await nav.share({ title: "Abhaya SOS", text });
      return "shared" as const;
    } catch {
      /* fallthrough */
    }
  }
  if (phones.length > 0) {
    // sms: with multiple recipients — best effort per platform.
    const to = phones.map((p) => p.replace(/\s+/g, "")).join(",");
    // iOS uses &, Android uses ?
    const sep = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? "&" : "?";
    window.location.href = `sms:${to}${sep}body=${encodeURIComponent(text)}`;
    return "sms" as const;
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied" as const;
  } catch {
    return "failed" as const;
  }
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
