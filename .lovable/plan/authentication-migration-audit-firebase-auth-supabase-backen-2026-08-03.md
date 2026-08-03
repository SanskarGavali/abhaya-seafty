# Authentication Migration Audit — Firebase Auth + Supabase Backend

No code has been changed. This is the audit and plan you asked for, plus one blocking
issue you must decide on before I start.

## 1. Current architecture

```text
┌───────────────┐   email/password, Google (via Lovable broker)
│  Abhaya PWA   │──────────────────────────────► Supabase Auth
│ (TanStack)    │◄──── JWT (sub = user uuid) ────┘
│               │
│               │  every DB/storage call carries that JWT
│               │──────────────────────────────► Postgres (RLS: auth.uid() = user_id)
└───────────────┘──────────────────────────────► Storage bucket emergency-media
                                                  (policy: folder = auth.uid())
```

## 2. Where the backend is used today

Auth (to be replaced)
- `src/routes/auth.tsx` — signup, signin, resend verification, forgot password, Google
- `src/routes/reset-password.tsx` — recovery link handling (token_hash / PKCE / hash)
- `src/routes/_authenticated/route.tsx` — route gate (`getUser`)
- `src/routes/__root.tsx` — `onAuthStateChange` → router invalidate
- `src/routes/index.tsx`, `src/routes/language.tsx` — session redirects
- `src/routes/_authenticated/profile.tsx` — current user + sign out
- `src/integrations/lovable/index.ts` — Google OAuth broker
- `src/integrations/supabase/auth-attacher.ts`, `auth-middleware.ts`, `src/start.ts` — bearer token plumbing

Database (stays)
- `emergency_contacts` (contacts.tsx, sos.tsx), `incident_reports` (sos.tsx, incidents.tsx, recording.ts),
  `pinned_helplines` (helpline.tsx), `user_settings` (settings.tsx), `profiles` (profile.tsx),
  plus unused-yet tables: `user_roles`, `saved_articles`, `ai_conversations`, `ai_messages`

Storage (stays)
- private bucket `emergency-media`, signed URLs in `src/lib/recording.ts`

Policies (stays, but see risk)
- every table: `auth.uid() = user_id`; `user_roles` + `has_role()` security-definer;
  `handle_new_user()` trigger on `auth.users` auto-creates profile/settings/role rows

Edge functions: none. Server functions: none. Env vars: `VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` (+ server twins).

## 3. The blocking issue

Every row and every stored file is protected by `auth.uid()`, which comes from a
Supabase-issued JWT. A Firebase login does not produce one. So the moment auth moves to
Firebase, **all reads and writes fail** unless Supabase is told to trust Firebase tokens.

There are only three ways out:

- **A. Supabase third-party auth (Firebase)** — the correct way. Requires configuring the
  Firebase project as a trusted token issuer in the Supabase dashboard. This project runs on
  Lovable Cloud, where that dashboard is not available to us, so I cannot enable it.
- **B. Custom-JWT bridge** — a server function verifies the Firebase ID token and mints a
  Supabase JWT. Requires the Supabase JWT signing secret, which is also not accessible on
  Lovable Cloud.
- **C. Service-role proxy** — every DB/storage call is rewritten to go through server
  functions that verify the Firebase token and use the admin client, with ownership checks
  re-implemented in code. RLS stops protecting anything; a single missed check leaks another
  user's SOS recordings. This touches all 8 data screens, `recording.ts`, and adds ~15 server
  functions.

Only C is technically possible here, and it is the one I'd advise against for a safety app.

## 4. If we proceed with C — future architecture

```text
┌───────────────┐  login/signup/reset/Google
│  Abhaya PWA   │──────────────────────────────► Firebase Auth
│               │◄──── Firebase ID token ───────┘
│               │
│               │  ID token in Authorization header
│               │──► TanStack server functions ──► Supabase (service role)
│                     verify token, map uid,        RLS bypassed;
│                     enforce ownership in code     ownership enforced in code
└───────────────┘
```

User mapping: `profiles` gains a `firebase_uid` text unique column; a server function
upserts the profile on first login and returns the internal uuid used by all other tables.
That is a one-column additive change — no existing row is touched or deleted.

## 5. Files that change / stay

Modified: `auth.tsx`, `reset-password.tsx`, `_authenticated/route.tsx`, `__root.tsx`,
`index.tsx`, `language.tsx`, `profile.tsx`, `start.ts`, plus new
`src/integrations/firebase/*` and `src/lib/*.functions.ts` per data domain.
Rewritten to call server functions: `contacts.tsx`, `sos.tsx`, `incidents.tsx`,
`helpline.tsx`, `settings.tsx`, `lib/recording.ts`.
Untouched: all UI components, styles, branding, i18n, map, learn/report/knowledge screens,
PWA files, geo/location/torch/share/idb/offline-cache libs, database rows, storage objects.

## 6. Migration safety

No table is dropped, no rows deleted, no bucket touched. Existing users, reports, SOS
records, recordings and profiles remain intact. The real exposure is access, not data:
existing accounts live in Supabase Auth and cannot sign in through Firebase — every current
user must re-register or be bulk-imported into Firebase (password hashes are not exportable
from Supabase on Lovable Cloud, so in practice: password reset for everyone).

## 7. Effort and risk

Effort: large — roughly a full rebuild of the data access layer (auth pages ~1 pass, server
function layer + 6 screen rewrites ~3–4 passes), not a drop-in swap.

Risks: loss of RLS as a safety net on emergency recordings and SOS locations; all existing
users locked out until they reset; two auth systems to keep in sync; Google sign-in must be
reconfigured in Firebase; recovery links change domain.

## 8. Confirmation

Yes — only authentication would move. Database, Postgres, profiles, storage buckets, media,
reports, SOS events, location history, safe places, admin data and all future modules stay
on Supabase.

## 9. Recommendation

I'd keep authentication where it is. Everything on your Firebase list — email/password,
verification, forgot/reset password, Google sign-in, persistent sessions, auto-login,
logout, account recovery — already exists in this app today and keeps RLS protecting
emergency data. If something specific about the current login is failing (verification mail,
reset link on Android, Google button), tell me which and I'll fix that instead.

Say "proceed with C" if you want the Firebase migration anyway, and I'll start with the
Firebase project setup and the profile-mapping column.
