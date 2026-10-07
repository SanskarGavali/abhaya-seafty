<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules
- Keep reference-matched visual treatments scoped to opted-in page wrappers, with shared SafetyBackdrop artwork; preserve handlers and services so visual changes cannot alter other flows.
- Public backend values (VITE_SUPABASE_URL / PUBLISHABLE_KEY / PROJECT_ID) have a build-time fallback in vite.config.ts `define` — why: .env is git-ignored, and repo builds otherwise inline empty values and crash at startup. Only browser-safe values there; never secret keys.
