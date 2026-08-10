// Local-only video evidence storage.
//
// Videos NEVER leave the device unless the user explicitly taps "Send Video".
// Blobs live in IndexedDB (never localStorage), so recordings survive refresh
// and work fully offline on Android, iOS, Windows and macOS browsers.
const DB_NAME = "abhaya-video";
const DB_VERSION = 1;
const STORE = "videos";

export type StoredVideo = {
  id: string;
  createdAt: number;
  mime: string;
  durationMs: number;
  size: number;
  blob: Blob;
};

export type VideoMeta = Omit<StoredVideo, "blob">;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

export function videoStorageSupported(): boolean {
  return typeof indexedDB !== "undefined";
}

export async function saveVideo(blob: Blob, durationMs: number): Promise<StoredVideo> {
  const rec: StoredVideo = {
    id: (crypto.randomUUID?.() ?? String(Date.now())),
    createdAt: Date.now(),
    mime: blob.type || "video/webm",
    durationMs,
    size: blob.size,
    blob,
  };
  await tx("readwrite", (s) => s.put(rec) as IDBRequest<unknown>);
  return rec;
}

export async function listVideos(): Promise<StoredVideo[]> {
  try {
    const all = await tx<StoredVideo[]>("readonly", (s) => s.getAll() as IDBRequest<StoredVideo[]>);
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function deleteVideo(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id) as IDBRequest<unknown>);
}

export function videoExtension(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("quicktime")) return "mov";
  if (mime.includes("ogg")) return "ogv";
  return "webm";
}

export function videoFileName(v: VideoMeta): string {
  const d = new Date(v.createdAt);
  const stamp = d.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `abhaya-video-${stamp}.${videoExtension(v.mime)}`;
}

export function toVideoFile(v: StoredVideo): File {
  return new File([v.blob], videoFileName(v), { type: v.mime || "video/webm" });
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function downloadVideo(v: StoredVideo): void {
  const url = URL.createObjectURL(v.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = videoFileName(v);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export const WHATSAPP_CONTACT_URL = "https://wa.me/qr/MNKSIEOB4GCDP1";

/**
 * Shares the recorded video. Never uploads anywhere — it hands the file to the
 * OS share sheet so the user picks WhatsApp and presses Send themselves.
 * Falls back to downloading + opening the WhatsApp contact when the browser
 * cannot share files. The local copy is always kept.
 */
export async function sendVideo(v: StoredVideo): Promise<"shared" | "cancelled" | "fallback"> {
  const file = toVideoFile(v);
  const nav = navigator as Navigator & {
    share?: (d: ShareData) => Promise<void>;
    canShare?: (d: ShareData) => boolean;
  };
  const data: ShareData = {
    files: [file],
    title: "Abhaya Safety Video",
    text: "Safety video recorded using Abhaya.",
  };
  if (nav.share && nav.canShare?.(data)) {
    try {
      await nav.share(data);
      return "shared";
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name === "AbortError") return "cancelled";
    }
  }
  downloadVideo(v);
  window.open(WHATSAPP_CONTACT_URL, "_blank", "noopener,noreferrer");
  return "fallback";
}
