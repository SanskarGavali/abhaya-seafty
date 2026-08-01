import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/app/BrandLogo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Abhaya" }, { name: "robots", content: "noindex" }] }),
  component: ResetPasswordPage,
});

/**
 * Establishes a recovery session from whichever link format Supabase used.
 * Supabase recovery links arrive in three shapes depending on project/mail
 * settings and on how the mobile browser handles the redirect:
 *   1. ?token_hash=...&type=recovery         (verifyOtp)
 *   2. ?code=...                             (PKCE exchange)
 *   3. #access_token=...&refresh_token=...   (implicit hash)
 * Android Chrome / PWA sometimes strip the hash on the first hop, so all
 * three are handled and the URL is cleaned up afterwards.
 */
async function establishRecoverySession(): Promise<boolean> {
  const url = new URL(window.location.href);
  const qs = url.searchParams;
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));

  const clean = () => {
    window.history.replaceState({}, "", `${url.origin}${url.pathname}`);
  };

  // Already signed in via detectSessionInUrl or an existing recovery session.
  const existing = await supabase.auth.getSession();
  if (existing.data.session) { clean(); return true; }

  const errDesc = qs.get("error_description") || hash.get("error_description");
  if (errDesc) return false;

  const tokenHash = qs.get("token_hash") || hash.get("token_hash");
  const type = (qs.get("type") || hash.get("type")) as "recovery" | null;
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type ?? "recovery" });
    if (!error) { clean(); return true; }
    return false;
  }

  const code = qs.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) { clean(); return true; }
    return false;
  }

  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (!error) { clean(); return true; }
  }
  return false;
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const settled = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const markReady = () => {
      if (cancelled || settled.current) return;
      settled.current = true;
      setReady(true);
      setChecking(false);
      setError(null);
    };

    const sub = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        markReady();
      }
    });

    (async () => {
      const ok = await establishRecoverySession();
      if (cancelled) return;
      if (ok) { markReady(); return; }
      // Give the client's own URL detection a final chance (slow mobile hops).
      setTimeout(async () => {
        if (cancelled || settled.current) return;
        const { data } = await supabase.auth.getSession();
        if (data.session) { markReady(); return; }
        settled.current = true;
        setChecking(false);
        setError("This reset link is invalid or has expired. Please request a new password reset email.");
      }, 1500);
    })();

    return () => { cancelled = true; sub.data.subscription.unsubscribe(); };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !ready) return;
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
      toast.success("Password updated. Please sign in with your new password.");
      await supabase.auth.signOut();
      setTimeout(() => navigate({ to: "/auth" }), 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not update password";
      toast.error(/same/i.test(msg) ? "Please choose a password different from your old one." : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-hero px-6 py-10">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brand-pink/20 blur-3xl" />
      <div className="mx-auto max-w-md">
        <div className="flex flex-col items-center"><BrandLogo size="md" /></div>
        <div className="animate-float-up mt-8 rounded-3xl bg-surface p-6 shadow-card">
          <h1 className="text-center font-display text-2xl font-semibold">Set a new password</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">Choose a strong password you haven't used before.</p>

          {error ? (
            <div className="mt-6 rounded-2xl bg-emergency/10 p-4 text-center text-sm text-emergency">
              {error}
              <div className="mt-3">
                <Button variant="brand" onClick={() => navigate({ to: "/auth" })}>Request a new link</Button>
              </div>
            </div>
          ) : done ? (
            <div className="mt-6 rounded-2xl bg-brand-soft/60 p-4 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-brand" />
              <div className="mt-2 font-medium">Password updated successfully.</div>
              <p className="mt-1 text-sm text-muted-foreground">Taking you to sign in…</p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pw">New password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="pw" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pl-10 rounded-xl" placeholder="••••••••" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw2">Confirm password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="pw2" type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11 pl-10 rounded-xl" placeholder="••••••••" />
                </div>
              </div>
              <Button type="submit" variant="brand" size="lg" className="w-full" disabled={loading || !ready}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : checking ? "Verifying link…" : "Update password"}
              </Button>
              <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => navigate({ to: "/auth" })}>
                Back to sign in
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
