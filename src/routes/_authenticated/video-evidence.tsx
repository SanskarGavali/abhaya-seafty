import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Circle, Download, HardDrive, Play, Send, Square, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app/AppHeader";
import { Button } from "@/components/ui/button";
import {
  deleteVideo, downloadBlobAs, downloadVideo, formatDuration, formatSize, listVideos, mp4FileName,
  saveVideo, shareVideoFile, toVideoFile, videoStorageSupported, WHATSAPP_CONTACT_URL,
  type StoredVideo,
} from "@/lib/video-store";
import { convertToMp4, isMp4 } from "@/lib/video-convert";


export const Route = createFileRoute("/_authenticated/video-evidence")({
  head: () => ({
    meta: [
      { title: "Video Evidence — Abhaya" },
      { name: "description", content: "Record safety video evidence that stays stored privately on your own device, then share it yourself when you choose." },
      { property: "og:title", content: "Video Evidence — Abhaya" },
      { property: "og:description", content: "Record, store offline and share safety video evidence from your device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VideoEvidencePage,
});

function pickVideoMime(): string {
  const MR = (window as unknown as { MediaRecorder?: typeof MediaRecorder }).MediaRecorder;
  if (!MR) return "";
  // Prefer MP4/H.264 when the browser can record it — WhatsApp rejects WebM.
  const candidates = [
    "video/mp4;codecs=h264,aac",
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const c of candidates) {
    try { if (MR.isTypeSupported(c)) return c; } catch { /* noop */ }
  }
  return "";
}


function VideoEvidencePage() {
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef(0);

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [videos, setVideos] = useState<StoredVideo[]>([]);
  const [playing, setPlaying] = useState<{ id: string; url: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ id: string; pct: number } | null>(null);
  const [noShare, setNoShare] = useState<Record<string, boolean>>({});
  const mp4Cache = useRef<Map<string, Blob>>(new Map());


  const refresh = useCallback(async () => setVideos(await listVideos()), []);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!recording) return;
    const i = window.setInterval(() => setElapsed(Date.now() - startedAtRef.current), 250);
    return () => window.clearInterval(i);
  }, [recording]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (playing) URL.revokeObjectURL(playing.url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) {
      toast.error("This browser cannot record video");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
    } catch {
      toast.error("Camera or microphone permission denied");
      return;
    }
    streamRef.current = stream;
    if (previewRef.current) {
      previewRef.current.srcObject = stream;
      previewRef.current.muted = true;
      try { await previewRef.current.play(); } catch { /* noop */ }
    }
    const mime = pickVideoMime();
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      toast.error("Recording is not supported on this device");
      return;
    }
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = async () => {
      const type = rec.mimeType || mime || "video/webm";
      const blob = new Blob(chunksRef.current, { type });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (previewRef.current) previewRef.current.srcObject = null;
      if (!blob.size) { toast.error("Nothing was recorded"); return; }
      try {
        await saveVideo(blob, Date.now() - startedAtRef.current);
        await refresh();
        toast.success("Saved on this device");
      } catch {
        toast.error("Could not save the video on this device");
      }
    };
    startedAtRef.current = Date.now();
    setElapsed(0);
    rec.start(2000); // periodic flush so a crash still leaves usable video
    recorderRef.current = rec;
    setRecording(true);
  };

  const stop = () => {
    setRecording(false);
    const rec = recorderRef.current;
    recorderRef.current = null;
    if (rec && rec.state !== "inactive") { try { rec.stop(); } catch { /* noop */ } }
  };

  const play = (v: StoredVideo) => {
    if (playing?.id === v.id) return;
    if (playing) URL.revokeObjectURL(playing.url);
    setPlaying({ id: v.id, url: URL.createObjectURL(v.blob) });
  };

  const remove = async (v: StoredVideo) => {
    if (playing?.id === v.id) { URL.revokeObjectURL(playing.url); setPlaying(null); }
    await deleteVideo(v.id);
    await refresh();
    toast.success("Video deleted from this device");
  };

  /** Returns a WhatsApp-friendly MP4 for this recording (converting if needed). */
  const getMp4 = async (v: StoredVideo): Promise<Blob | null> => {
    if (isMp4(v.mime)) return v.blob;
    const cached = mp4Cache.current.get(v.id);
    if (cached) return cached;
    setProgress({ id: v.id, pct: 0 });
    const out = await convertToMp4(v.blob, (r) => setProgress({ id: v.id, pct: Math.round(r * 100) }));
    setProgress(null);
    if (out) mp4Cache.current.set(v.id, out);
    return out;
  };

  const downloadMp4 = async (v: StoredVideo) => {
    setBusy(v.id);
    try {
      const mp4 = await getMp4(v);
      if (mp4) downloadBlobAs(mp4, mp4FileName(v));
      else {
        downloadVideo(v);
        toast.info("Could not convert to MP4 — downloaded the original recording instead.");
      }
    } finally {
      setBusy(null);
    }
  };

  const send = async (v: StoredVideo) => {
    setBusy(v.id);
    try {
      const mp4 = await getMp4(v);
      const file = mp4
        ? new File([mp4], mp4FileName(v), { type: "video/mp4" })
        : toVideoFile(v);
      if (!mp4) toast.info("MP4 conversion unavailable — sharing the original recording.");
      const result = await shareVideoFile(file);
      if (result === "shared") {
        toast.success("Share sheet opened — pick WhatsApp and press Send");
      } else if (result === "unsupported") {
        setNoShare((s) => ({ ...s, [v.id]: true }));
        toast.info("This browser can't share files directly. Download the MP4, then attach it in WhatsApp.");
      }
    } catch {
      toast.error("Sharing failed — your video is still saved on this device");
    } finally {
      setBusy(null);
    }
  };


  return (
    <div className="pb-24">
      <AppHeader title="Video Evidence" back="/home" />
      <main className="mx-auto max-w-lg px-4 pt-4">
        <p className="text-sm text-muted-foreground">
          Records with your camera and microphone and saves the video privately on this device — even offline.
          Nothing is uploaded anywhere unless you choose to share it.
        </p>

        <div className="mt-4 overflow-hidden rounded-3xl bg-black ring-1 ring-border">
          <video
            ref={previewRef}
            playsInline
            muted
            className="aspect-video w-full object-cover"
          />
        </div>

        <div className="mt-4 flex items-center justify-center gap-3">
          {!recording ? (
            <Button variant="brand" size="lg" onClick={start}>
              <Circle className="h-4 w-4 fill-current" /> Start Recording
            </Button>
          ) : (
            <Button variant="destructive" size="lg" onClick={stop}>
              <Square className="h-4 w-4 fill-current" /> Stop · {formatDuration(elapsed)}
            </Button>
          )}
        </div>

        {!videoStorageSupported() && (
          <p className="mt-3 text-center text-xs text-emergency">
            This browser cannot store videos offline — download each recording right away.
          </p>
        )}

        <h2 className="mt-8 font-display text-lg font-semibold">Saved on this device</h2>
        {videos.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-surface p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
            <Video className="mx-auto mb-2 h-8 w-8 text-brand" />
            No videos yet. Recordings stay here on your device until you delete them.
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {videos.map((v) => (
              <li key={v.id} className="rounded-2xl bg-surface p-4 ring-1 ring-border/60">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{new Date(v.createdAt).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDuration(v.durationMs)} · {formatSize(v.size)} · {v.mime.split(";")[0]}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                    <HardDrive className="h-3 w-3" /> Saved on Device
                  </span>
                </div>

                {playing?.id === v.id && (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video src={playing.url} controls playsInline className="mt-3 w-full rounded-2xl bg-black" />
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => play(v)}>
                    <Play className="h-4 w-4" /> View Video
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => downloadVideo(v)}>
                    <Download className="h-4 w-4" /> Download
                  </Button>
                  {!isMp4(v.mime) && (
                    <Button size="sm" variant="outline" disabled={busy === v.id} onClick={() => void downloadMp4(v)}>
                      <Download className="h-4 w-4" /> Download MP4
                    </Button>
                  )}
                  <Button size="sm" variant="brand" disabled={busy === v.id} onClick={() => void send(v)}>
                    <Send className="h-4 w-4" /> Send Video
                  </Button>
                  {noShare[v.id] && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(WHATSAPP_CONTACT_URL, "_blank", "noopener,noreferrer")}
                    >
                      <Send className="h-4 w-4" /> Share via WhatsApp
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(v)}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>

                {progress?.id === v.id && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Converting to MP4 for WhatsApp… {progress.pct}%
                  </p>
                )}
                {noShare[v.id] && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    This browser can’t attach files directly. Download the MP4, then attach it in WhatsApp.
                  </p>
                )}

              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
