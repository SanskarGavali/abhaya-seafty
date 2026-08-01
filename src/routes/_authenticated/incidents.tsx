import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Loader2, MapPin, Mic, RefreshCw, Share2, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app/AppHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cacheGet, cacheSet } from "@/lib/offline-cache";
import { copyText } from "@/lib/share";
import {
  downloadReport, formatReport, recordingLabel, type IncidentReport,
} from "@/lib/incident-report";
import { createRecordingLink, flushRecordingQueue, pendingRecordingCount } from "@/lib/recording";

export const Route = createFileRoute("/_authenticated/incidents")({
  head: () => ({
    meta: [
      { title: "Incident Reports — Abhaya" },
      { name: "description", content: "Review and download the automatic incident report generated after each Abhaya SOS event." },
      { property: "og:title", content: "Incident Reports — Abhaya" },
      { property: "og:description", content: "Automatic SOS incident reports with time, location, contacts notified and recording status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: IncidentsPage,
});

const CACHE_KEY = "abhaya:incidents:cache";

function IncidentsPage() {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    const { data, error } = await supabase
      .from("incident_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) {
      const list = data as unknown as IncidentReport[];
      setReports(list);
      cacheSet(CACHE_KEY, list);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const cached = cacheGet<IncidentReport[]>(CACHE_KEY);
    if (cached?.value?.length) { setReports(cached.value); setLoading(false); }
    load(!cached);
    pendingRecordingCount().then(setPending);
  }, [load]);

  useEffect(() => {
    const onOnline = async () => {
      setOnline(true);
      const n = await flushRecordingQueue();
      setPending(await pendingRecordingCount());
      if (n > 0) { toast.success(`${n} emergency recording${n > 1 ? "s" : ""} uploaded securely`); load(false); }
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [load]);

  const share = async (r: IncidentReport) => {
    const text = formatReport(r);
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) {
      try { await nav.share({ title: "Abhaya Incident Report", text }); return; } catch { /* fallthrough */ }
    }
    if (await copyText(text)) toast.success("Report copied to clipboard");
    else toast.error("Could not share the report — use Download instead");
  };

  const openRecording = async (r: IncidentReport) => {
    if (!r.recording_path) return;
    const url = await createRecordingLink(r.recording_path);
    if (!url) { toast.error("Could not open the recording right now"); return; }
    const a = document.createElement("a");
    a.href = url;
    a.download = r.recording_path.split("/").pop() ?? "recording.enc";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.info("Encrypted recording downloaded. Keep the decryption key saved with the report.");
  };

  return (
    <div className="pb-24">
      <AppHeader title="Incident Reports" />
      <main className="mx-auto max-w-lg px-4 pt-4">
        <p className="text-sm text-muted-foreground">
          Every SOS creates an automatic report with time, GPS location, device details, contacts notified and recording status.
        </p>

        {!online && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-surface p-3 text-sm text-muted-foreground ring-1 ring-border">
            <WifiOff className="h-4 w-4" /> You're offline — showing saved reports.
          </div>
        )}
        {pending > 0 && (
          <div className="mt-3 rounded-2xl bg-brand-soft/60 p-3 text-sm">
            {pending} recording{pending > 1 ? "s" : ""} stored securely on this device, waiting for internet to upload.
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
          </Button>
        </div>

        {loading && reports.length === 0 ? (
          <div className="mt-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
        ) : reports.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-surface p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
            <FileText className="mx-auto mb-2 h-8 w-8 text-brand" />
            No incident reports yet. One is created automatically whenever you activate SOS.
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {reports.map((r) => {
              const when = new Date(r.submitted_at ?? r.created_at);
              return (
                <li key={r.id} className="rounded-2xl bg-surface p-4 ring-1 ring-border/60">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-display text-base font-semibold capitalize">{r.category} · {r.status}</div>
                      <div className="text-xs text-muted-foreground">{when.toLocaleDateString()} · {when.toLocaleTimeString()}</div>
                    </div>
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                      {r.trigger_method ?? "Manual SOS"}
                    </span>
                  </div>

                  <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        {r.latitude != null && r.longitude != null
                          ? `${r.latitude.toFixed(5)}, ${r.longitude.toFixed(5)}${r.accuracy_m ? ` (±${Math.round(r.accuracy_m)} m)` : ""}`
                          : "Location not available"}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Mic className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{recordingLabel(r.recording_status)}</span>
                    </div>
                    <div>Contacts notified: {r.contacts_notified?.length ? r.contacts_notified.map((c) => c.name).join(", ") : "None"}</div>
                    <div>Network: {r.network_status ?? "Unknown"}</div>
                  </dl>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="brand" onClick={() => downloadReport(r)}>
                      <Download className="h-4 w-4" /> Download
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => share(r)}>
                      <Share2 className="h-4 w-4" /> Share
                    </Button>
                    {r.recording_status === "uploaded" && r.recording_path && (
                      <Button size="sm" variant="outline" onClick={() => openRecording(r)}>
                        <Mic className="h-4 w-4" /> Recording
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
