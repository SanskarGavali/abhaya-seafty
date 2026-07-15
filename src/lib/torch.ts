// Attempts to control the device flashlight via the camera torch capability.
// Silently no-ops on unsupported browsers/devices — no fake screen flash fallback.

let track: MediaStreamTrack | null = null;

type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean };
type TorchConstraint = MediaTrackConstraintSet & { torch?: boolean };

export async function isTorchSupported(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return false;
  return true; // capability check requires opening the camera; we do it lazily.
}

export async function enableTorch(): Promise<boolean> {
  try {
    if (track) return true;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
    const t = stream.getVideoTracks()[0];
    const caps = (t.getCapabilities?.() ?? {}) as TorchCapabilities;
    if (!caps.torch) {
      t.stop();
      return false;
    }
    await t.applyConstraints({ advanced: [{ torch: true } as TorchConstraint] });
    track = t;
    return true;
  } catch {
    return false;
  }
}

export async function disableTorch(): Promise<void> {
  try {
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: false } as TorchConstraint] });
    } catch {
      /* ignore */
    }
    track.stop();
  } finally {
    track = null;
  }
}
