// Browser-side WebM -> MP4 (H.264 + AAC) conversion for share compatibility.
//
// Safety notes:
//  * Nothing here touches the recorder, camera, mic or any upload path.
//  * Conversion is lazy: ffmpeg.wasm is only fetched when the user actually
//    needs an MP4 (i.e. the recording is not already MP4).
//  * Every failure path is non-fatal — callers fall back to the original file,
//    which is always still saved on the device.
import type { FFmpeg } from "@ffmpeg/ffmpeg";

const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

export function isMp4(mime: string): boolean {
  return /mp4|quicktime/i.test(mime);
}

let ffmpegPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const [{ FFmpeg: FF }, { toBlobURL }] = await Promise.all([
        import("@ffmpeg/ffmpeg"),
        import("@ffmpeg/util"),
      ]);
      const ff = new FF();
      await ff.load({
        coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return ff;
    })().catch((err) => {
      ffmpegPromise = null;
      throw err;
    });
  }
  return ffmpegPromise;
}

/**
 * Converts a recording to MP4 (H.264 video, AAC audio).
 * Returns null when conversion is impossible — never throws.
 */
export async function convertToMp4(
  blob: Blob,
  onProgress?: (ratio: number) => void,
): Promise<Blob | null> {
  if (typeof window === "undefined" || typeof WebAssembly === "undefined") return null;
  try {
    const ff = await getFFmpeg();
    const handler = ({ progress }: { progress: number }) => {
      if (onProgress) onProgress(Math.max(0, Math.min(1, progress)));
    };
    ff.on("progress", handler);
    const input = "in.dat";
    const output = "out.mp4";
    await ff.writeFile(input, new Uint8Array(await blob.arrayBuffer()));
    await ff.exec([
      "-i", input,
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-pix_fmt", "yuv420p",
      "-profile:v", "baseline",
      "-level", "3.1",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      output,
    ]);
    const data = await ff.readFile(output);
    ff.off("progress", handler);
    try { await ff.deleteFile(input); await ff.deleteFile(output); } catch { /* noop */ }
    const bytes = data as Uint8Array;
    if (!bytes || bytes.length === 0) return null;
    return new Blob([bytes as unknown as BlobPart], { type: "video/mp4" });
  } catch {
    return null;
  }
}
