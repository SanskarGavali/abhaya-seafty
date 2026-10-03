// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Build-time fallback for the PUBLIC backend values. .env is git-ignored, so builds made
// from the repository would otherwise inline empty values and crash at startup.
// These are browser-safe (URL + publishable key). Never add secret/service-role keys here.
const PUBLIC_BACKEND_FALLBACK = {
  VITE_SUPABASE_URL: "https://vlvjppubmvsvtztzlkfy.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x7rLHvK287cmIEanGkgI1A_u04qYHXX",
  VITE_SUPABASE_PROJECT_ID: "vlvjppubmvsvtztzlkfy",
};

const env = { ...loadEnv(process.env.NODE_ENV ?? "production", process.cwd(), "VITE_"), ...process.env };
const define = Object.fromEntries(
  Object.entries(PUBLIC_BACKEND_FALLBACK).map(([key, fallback]) => [
    `import.meta.env.${key}`,
    JSON.stringify(env[key] || fallback),
  ]),
);

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: { define },
});
