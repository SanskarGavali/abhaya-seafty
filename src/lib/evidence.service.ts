import { supabase } from "@/integrations/supabase/client";
import type { Evidence, EvidenceKind } from "./models";

const BUCKET = "evidence";
export const MAX_EVIDENCE_BYTES = 50 * 1024 * 1024;

const ALLOWED_PREFIX = ["image/", "video/", "audio/"];
const ALLOWED_EXACT = [
  "application/pdf", "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export class EvidenceError extends Error {
  constructor(public kind: "unsupported" | "too_large" | "offline" | "upload" | "auth" | "unknown", msg: string) {
    super(msg);
  }
}

export function kindFromMime(mime: string): EvidenceKind {
  if (mime.startsWith("image/")) return "photo";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (ALLOWED_EXACT.includes(mime)) return "document";
  return "other";
}

export function validateFile(file: File) {
  const mime = file.type || "";
  if (!ALLOWED_PREFIX.some((p) => mime.startsWith(p)) && !ALLOWED_EXACT.includes(mime)) {
    throw new EvidenceError("unsupported", `"${file.name}" is not a supported file type. Use photos, videos, audio, PDF or text files.`);
  }
  if (file.size > MAX_EVIDENCE_BYTES) {
    throw new EvidenceError("too_large", `"${file.name}" is larger than 50 MB.`);
  }
}

export function formatBytes(n: number | null | undefined) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new EvidenceError("auth", "Please sign in again.");
  return data.user.id;
}

export async function listEvidence(): Promise<Evidence[]> {
  const { data, error } = await supabase.from("evidence_items").select("*").order("created_at", { ascending: false });
  if (error) throw new EvidenceError("unknown", "Could not load your evidence.");
  return (data ?? []) as Evidence[];
}

export async function getEvidence(id: string): Promise<Evidence | null> {
  const { data, error } = await supabase.from("evidence_items").select("*").eq("id", id).maybeSingle();
  if (error) throw new EvidenceError("unknown", "Could not load this item.");
  return (data as Evidence) ?? null;
}

export async function uploadEvidence(
  file: File,
  meta: { title?: string; notes?: string; category?: string; location?: { lat: number; lng: number; accuracy?: number } | null },
): Promise<Evidence> {
  validateFile(file);
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new EvidenceError("offline", "You're offline. Connect to the internet to save evidence to your vault.");
  }
  const user = await uid();
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${user}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw new EvidenceError("upload", `Upload failed: ${upErr.message}`);
  const { data, error } = await supabase
    .from("evidence_items")
    .insert({
      user_id: user,
      title: meta.title?.trim() || file.name,
      kind: kindFromMime(file.type),
      mime_type: file.type,
      size_bytes: file.size,
      storage_path: path,
      notes: meta.notes || null,
      category: meta.category || null,
      latitude: meta.location?.lat ?? null,
      longitude: meta.location?.lng ?? null,
      accuracy_m: meta.location?.accuracy ?? null,
      captured_at: new Date(file.lastModified || Date.now()).toISOString(),
    })
    .select("*")
    .single();
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw new EvidenceError("upload", "Saved the file but could not record its details. Please try again.");
  }
  return data as Evidence;
}

export async function updateEvidence(id: string, patch: Partial<Pick<Evidence, "title" | "notes" | "category" | "incident_id">>) {
  const { error } = await supabase.from("evidence_items").update(patch).eq("id", id);
  if (error) throw new EvidenceError("unknown", "Could not save changes.");
}

export async function deleteEvidence(item: Evidence) {
  const { error: sErr } = await supabase.storage.from(BUCKET).remove([item.storage_path]);
  if (sErr) throw new EvidenceError("unknown", "Could not delete the file. Please try again.");
  const { error } = await supabase.from("evidence_items").delete().eq("id", item.id);
  if (error) throw new EvidenceError("unknown", "File deleted, but its record could not be removed.");
}

/** Short-lived private link (10 min) for preview/download. */
export async function evidenceUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 600);
  if (error) return null;
  return data.signedUrl;
}
