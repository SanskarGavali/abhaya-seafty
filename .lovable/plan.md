# Abhaya — Full Build Plan

Building Task 1 + Task 2 as one app on TanStack Start + Lovable Cloud + Lovable AI. This is ~15+ screens with real backend, live location, SOS chain, and an AI assistant. I'll execute it in phases across multiple turns so each phase ships working and testable.

## Design system (built once, reused everywhere)

- Purple → pink brand gradient matching the reference (Abhaya logo). Coral/red for emergency states.
- Tokens in `src/styles.css` (oklch): `--brand`, `--brand-pink`, `--emergency`, `--gradient-brand`, `--gradient-emergency`, `--shadow-soft`, `--shadow-emergency`, glassmorphism card surface, generous radius (`1rem`), Poppins-style display + Inter body via Google Fonts `<link>` in `__root.tsx`.
- Extended shadcn Button variants: `brand`, `emergency`, `glass`. Reusable `AppHeader`, `BottomNav`, `TileCard`, `SectionCard`, `EmptyState`, `LoadingScreen`.
- Generated hero illustrations (imagegen) matching the reference art style for splash, DV, cyber, following-me screens.

## Phase 1 — Foundation & Task 1 (this turn)

1. Design tokens + fonts + shadcn variant extensions
2. Auth: email/password + Google (Lovable Cloud managed), `/auth` route, `_authenticated` layout (integration-managed)
3. DB migration: `profiles`, `user_settings` (language), `emergency_contacts`, `incident_reports`, `pinned_helplines`, `ai_conversations`, `ai_messages`, `saved_articles`, `user_roles` + `has_role` — all with RLS + GRANTs
4. Screens: Splash → Language Selection → Onboarding → Login/Signup/Forgot → Dashboard (Home) with SOS card + Quick Access tiles + AI Assistant strip → Bottom Nav (Home/Map/Report/Learn/Profile) → Profile → Settings → Notifications

## Phase 2 — Emergency core

5. Emergency Contacts manager (add, drag-reorder priority, edit, delete)
6. SOS full-screen Emergency UI: siren (WebAudio), screen-flash + flashlight (torch API with fallback), Wake Lock, live GPS via `watchPosition`, elapsed timer, battery + network status
7. Smart Call Chain: sequential `tel:` prompts, per-contact status, Pause/Skip/Next/Stop, 112 fallback
8. Live Location screen with map + share indicator + Stop Sharing

## Phase 3 — Modules & content

9. Someone Is Following Me (panic flow + fake incoming call simulator)
10. Domestic Violence hub (5 abuse types + legal rights + FIR/Zero-FIR guides + evidence guide + NGO/shelter map)
11. Cyber Safety hub (all topics + 1930 helpline + Report Cyber Crime CTA)
12. Emergency Helpline (fixed numbers + nearest police/hospital/shelter, search, filter, favorite/pin)
13. Safe Places Nearby (map + list of Police/Hospital/NGO/Shelter with Directions)
14. Report Incident (multi-step: category → location → media → review, anonymous + emergency toggles, save draft/submit, Supabase Storage bucket for evidence)
15. Learning Centre (article cards, filters, saved-articles)
16. Women's Rights / Legal Awareness Centre (DV Act, POSH, BNS/BNSS/BSA, POCSO, IT Act, Zero FIR, property rights, legal aid, schemes, FAQ)

## Phase 4 — AI Assistant

17. `/api/chat` streaming route via Lovable AI Gateway (`google/gemini-3-flash-preview` primary, `openai/gpt-5-mini` fallback). Server-only, no client keys.
18. Persistent conversation history in `ai_conversations` / `ai_messages` (RLS scoped to user)
19. Chat UI with the Abhaya assistant persona system prompt, markdown rendering, voice input (Web Speech API), TTS playback, deep-links into Helpline/SOS/Live Location, EN/HI/MR language switch honoring user setting

## Technical details

- Maps: use free OpenStreetMap tiles + Leaflet (via CDN link) rather than Google Maps to avoid a paid key — user hasn't provided one and this preserves full functionality. "Directions" opens `https://www.google.com/maps/dir/?...` in a new tab (no key needed).
- All server logic via `createServerFn`; `/api/public/*` only for webhooks (none needed here). AI chat uses a server route for streaming.
- Wake Lock, Torch, Battery, Network Info APIs are used with feature-detection + graceful fallback.
- Language: `user_settings.language` (`en`|`hi`|`mr`) with a lightweight i18n dictionary in `src/lib/i18n.ts` — English complete, HI/MR seeded for core nav/CTAs (full-content translation of legal text is out of scope for a single build; assistant handles multilingual dynamically).
- PWA manifest + service worker with Workbox in a later polish pass if requested.

## Out of scope for the initial build (call out early)

- Real SMS/push to emergency contacts requires a paid provider (Twilio) — the chain uses `tel:` links + on-screen instructions instead, matching PWA reality.
- Full legal-content translation to HI/MR (assistant handles it live; static screens ship English).
- Native flashlight on iOS Safari (API unsupported) — falls back to full-screen flash.

## What ships at the end of this turn

Phase 1 only — design system, auth, DB schema, and all Task 1 screens working end-to-end. Then I continue Phase 2–4 in follow-up turns. Reply "go" to proceed, or tell me to reshape (e.g. "skip Task 1 splash/onboarding polish, jump straight to SOS").
