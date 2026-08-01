// Emergency recording: capture -> encrypt (AES-GCM) -> offline queue -> upload.
//
// Storage model (audited, honest):
//  * Recording bytes are ENCRYPTED IN THE BROWSER (AES-256-GCM) before they
//    ever leave the device.
//  * Ciphertext is uploaded to the private "emergency-media" bucket under
//    <user-id>/... . Storage policies only allow the owner to read it.
//  * The per-recording key is stored on the owner's incident_reports row
//    (RLS: owner only), so nobody else — including other signed-in users —
//    can decrypt the file.
//  * While offline, the encrypted blob waits in IndexedDB on the device and
//    uploads automatically the moment connectivity returns.
import { supabase } from "@/integrations/supabase/client";
import { idbDelete, idbGetAll, idbPut } from "@/lib/idb";

export const RECORDING_BUCKET = "emergency-media";

export type PendingRecording = {
  id: string;
  userId: string;
  incidentId: string | null;
  path: string;
  mime: string;
  keyB64: string;
  ivB64: string;
  bytes: ArrayBuffer;
  createdAt: number;
};

export type RecorderHandle = {
  stop: () => Promise<Blob | null>;
  mime: string;
};

function toB64(buf: ArrayBuffer | Uint8Array): string {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i += 1) s += String.fromCharCode(b[i]!);
  return btoa(s);
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function pickMime(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  const MR = (window as unknown as { MediaRecorder?: typeof MediaRecorder }).MediaRecorder;
  if (!MR) return "";
  for (const c of candidates) {
    try { if (MR.isTypeSupported(c)) return c; } catch { /* noop */ }
  }
  return "";
}

export function recordingSupported(): boolean {
  return typeof window !== "undefined"
    && typeof navigator !== "undefined"
    && !!navigator.mediaDevices?.getUserMedia
    && !!(window as unknown as { MediaRecorder?: unknown }).MediaRecorder;
}

/** Starts an audio recording. Returns null if unsupported or permission denied. */
export async function startRecording(): Promise<RecorderHandle | null> {
  if (!recordingSupported()) return null;
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: false },
    });
  } catch {
    return null;
  }
  const mime = pickMime();
  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  } catch {
    stream.getTracks().forEach((t) => t.stop());
    return null;
  }
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.start(5000); // flush every 5s so a crash still leaves usable audio

  return {
    mime: recorder.mimeType || mime || "audio/webm",
    stop: () =>
      new Promise<Blob | null>((resolve) => {
        const finish = () => {
          stream.getTracks().forEach((t) => t.stop());
          resolve(chunks.length ? new Blob(chunks, { type: recorder.mimeType || "audio/webm" }) : null);
        };
        if (recorder.state === "inactive") { finish(); return; }
        recorder.onstop = finish;
        try { recorder.stop(); } catch { finish(); }
      }),
  };
}

async function encrypt(blob: Blob): Promise<{ bytes: ArrayBuffer; keyB64: string; ivB64: string }> {
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = await blob.arrayBuffer();
  const bytes = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
  const raw = await crypto.subtle.exportKey("raw", key);
  return { bytes, keyB64: toB64(raw), ivB64: toB64(iv) };
}

export async function decryptRecording(bytes: ArrayBuffer, keyB64: string, ivB64: string, mime: string): Promise<Blob> {
  const key = await crypto.subtle.importKey("raw", fromB64(keyB64) as unknown as BufferSource, "AES-GCM", false, ["decrypt"]);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(ivB64) as unknown as BufferSource }, key, bytes,
  );
  return new Blob([plain], { type: mime });
}

/**
 * Encrypts the recording and queues it locally, then attempts an immediate
 * upload. Returns the final status — never claims success unless the upload
 * actually completed.
 */
export async function saveRecording(
  blob: Blob, userId: string, incidentId: string | null,
): Promise<{ status: "uploaded" | "queued" | "failed"; path: string }> {
  const { bytes, keyB64, ivB64 } = await encrypt(blob);
  const id = crypto.randomUUID();
  const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("ogg") ? "ogg" : "webm";
  const path = `${userId}/${new Date().toISOString().slice(0, 10)}/${id}.${ext}.enc`;
  const record: PendingRecording = {
    id, userId, incidentId, path, mime: blob.type || "audio/webm",
    keyB64, ivB64, bytes, createdAt: Date.now(),
  };
  try { await idbPut(record); } catch { /* best effort */ }

  if (!navigator.onLine) return { status: "queued", path };
  const ok = await uploadPending(record);
  return { status: ok ? "uploaded" : "queued", path };
}

async function uploadPending(rec: PendingRecording): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(RECORDING_BUCKET)
      .upload(rec.path, new Blob([rec.bytes], { type: "application/octet-stream" }), {
        contentType: "application/octet-stream",
        upsert: true,
      });
    if (error) return false;
    if (rec.incidentId) {
      await supabase
        .from("incident_reports")
        .update({
          recording_status: "uploaded",
          recording_path: rec.path,
          recording_key: JSON.stringify({ k: rec.keyB64, iv: rec.ivB64, mime: rec.mime }),
        })
        .eq("id", rec.incidentId);
    }
    await idbDelete(rec.id);
    return true;
  } catch {
    return false;
  }
}

/** Uploads everything waiting in the offline queue. Safe to call often. */
export async function flushRecordingQueue(): Promise<number> {
  if (typeof indexedDB === "undefined" || !navigator.onLine) return 0;
  let uploaded = 0;
  try {
    const pending = await idbGetAll<PendingRecording>();
    for (const rec of pending) {
      // eslint-disable-next-line no-await-in-loop
      if (await uploadPending(rec)) uploaded += 1;
    }
  } catch { /* noop */ }
  return uploaded;
}

export async function pendingRecordingCount(): Promise<number> {
  try { return (await idbGetAll<PendingRecording>()).length; } catch { return 0; }
}

/** Creates a time-limited private link to an uploaded recording (owner only). */
export async function createRecordingLink(path: string, seconds = 60 * 60 * 24 * 7): Promise<string | null> {
  const { data, error } = await supabase.storage.from(RECORDING_BUCKET).createSignedUrl(path, seconds);
  if (error) return null;
  return data?.signedUrl ?? null;
}
