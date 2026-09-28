import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Image as ImageIcon, Loader2, MapPin, Mic, Trash2, Upload, Video, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app/AppHeader";
import { Button } from "@/components/ui/button";
import {
  deleteEvidence, EvidenceError, evidenceUrl, formatBytes, listEvidence, MAX_EVIDENCE_BYTES, uploadEvidence, validateFile,
} from "@/lib/evidence.service";
import { INCIDENT_CATEGORIES, categoryLabel, type Evidence, type EvidenceKind } from "@/lib/models";

export const Route = createFileRoute("/_authenticated/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence Vault — Abhaya" },
      { name: "description", content: "Privately store photos, videos, audio and documents as safety evidence only you can access." },
      { property: "og:title", content: "Evidence Vault — Abhaya" },
      { property: "og:description", content: "A private vault for your safety evidence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EvidenceVaultPage,
});

const KIND_ICON: Record<EvidenceKind, typeof FileText> = {
  photo: ImageIcon, video: Video, audio: Mic, document: FileText, other: FileText,
};
const FILTERS: { key: "all" | EvidenceKind; label: string }[] = [
  { key: "all", label: "All" }, { key: "photo", label: "Photos" }, { key: "video", label: "Videos" },
  { key: "audio", label: "Audio" }, { key: "document", label: "Docs" },
];

function EvidenceVaultPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | EvidenceKind>("all");
  const [pending, setPending] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("");
  const [withLocation, setWithLocation] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setItems(await listEvidence()); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load your evidence."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try { validateFile(f); setPending(f); setTitle(f.name.replace(/\.[^.]+$/, "")); }
    catch (err) { toast.error(err instanceof Error ? err.message : "File not supported"); }
  };

  const getLoc = () => new Promise<{ lat: number; lng: number; accuracy?: number } | null>((res) => {
    if (!withLocation || !("geolocation" in navigator)) return res(null);
    navigator.geolocation.getCurrentPosition(
      (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      () => res(null), { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  });

  const save = async () => {
    if (!pending) return;
    setUploading(true);
    try {
      const location = await getLoc();
      const item = await uploadEvidence(pending, { title, notes, category, location });
      setItems((xs) => [item, ...xs]);
      setPending(null); setTitle(""); setNotes(""); setCategory("");
      toast.success("Saved to your vault");
    } catch (e) {
      toast.error(e instanceof EvidenceError || e instanceof Error ? e.message : "Upload failed");
    } finally { setUploading(false); }
  };

  const open = async (it: Evidence) => {
    setBusyId(it.id);
    const url = await evidenceUrl(it.storage_path);
    setBusyId(null);
    if (!url) return toast.error("Could not open this file.");
    window.open(url, "_blank", "noopener");
  };

  const remove = async (it: Evidence) => {
    if (!confirm(`Delete "${it.title}" permanently?`)) return;
    setBusyId(it.id);
    try { await deleteEvidence(it); setItems((xs) => xs.filter((x) => x.id !== it.id)); toast.success("Deleted"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Delete failed"); }
    finally { setBusyId(null); }
  };

  const shown = filter === "all" ? items : items.filter((i) => i.kind === filter);

  return (
    <div className="min-h-screen pb-28">
      <AppHeader title="Evidence Vault" back="/home" />
      <main className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
        <div className="flex items-start gap-3 rounded-2xl border bg-card p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Files here are private to your account. Nobody else — including other Abhaya users — can see them.
            Max {MAX_EVIDENCE_BYTES / 1024 / 1024} MB per file.
          </p>
        </div>

        <input ref={fileRef} type="file" hidden accept="image/*,video/*,audio/*,application/pdf,text/plain,.doc,.docx" onChange={onPick} />

        {!pending ? (
          <Button className="w-full" size="lg" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Add evidence
          </Button>
        ) : (
          <div className="space-y-3 rounded-2xl border bg-card p-4">
            <p className="text-sm font-medium">{pending.name} · {formatBytes(pending.size)}</p>
            <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
            <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Category (optional)</option>
              {INCIDENT_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <textarea className="w-full rounded-lg border bg-background px-3 py-2 text-sm" rows={3} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={withLocation} onChange={(e) => setWithLocation(e.target.checked)} /> Attach my current location
            </label>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPending(null)} disabled={uploading}>Cancel</Button>
              <Button className="flex-1" onClick={save} disabled={uploading}>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Save
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs ${filter === f.key ? "bg-primary text-primary-foreground" : "bg-card"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : error ? (
          <div className="rounded-2xl border bg-card p-4 text-center text-sm">
            <p className="mb-3 text-destructive">{error}</p>
            <Button variant="outline" onClick={load}>Try again</Button>
          </div>
        ) : shown.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No evidence yet. Tap “Add evidence” to store your first file.</p>
        ) : (
          <ul className="space-y-2">
            {shown.map((it) => {
              const Icon = KIND_ICON[it.kind] ?? FileText;
              return (
                <li key={it.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{it.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {new Date(it.created_at).toLocaleString()} · {formatBytes(it.size_bytes)}
                      {it.category ? ` · ${categoryLabel(it.category)}` : ""}
                    </p>
                    {it.latitude != null && it.longitude != null && (
                      <a className="inline-flex items-center gap-1 text-xs text-primary" target="_blank" rel="noopener"
                        href={`https://www.google.com/maps?q=${it.latitude},${it.longitude}`}>
                        <MapPin className="h-3 w-3" /> Location
                      </a>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" aria-label="Open" onClick={() => open(it)} disabled={busyId === it.id}>
                    {busyId === it.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => remove(it)} disabled={busyId === it.id}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
