import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/app/BrandLogo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Abhaya" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase recovery flow: session is set via URL fragment automatically.
    // Wait a tick, then verify a recovery session exists.
    const sub = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else {
        // Give the hash-based token exchange a moment
        setTimeout(async () => {
          const { data: d2 } = await supabase.auth.getSession();
          if (d2.session) setReady(true);
          else setError("This reset link is invalid or has expired. Please request a new one.");
        }, 800);
      }
    });
    return () => { sub.data.subscription.unsubscribe(); };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
      toast.success("Password updated successfully. Please sign in.");
      await supabase.auth.signOut();
      setTimeout(() => navigate({ to: "/auth" }), 1200);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
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
                <Button variant="brand" onClick={() => navigate({ to: "/auth" })}>Back to sign in</Button>
              </div>
            </div>
          ) : done ? (
            <div className="mt-6 rounded-2xl bg-brand-soft/60 p-4 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-brand" />
              <div className="mt-2 font-medium">Password updated successfully.</div>
              <p className="mt-1 text-sm text-muted-foreground">Please sign in with your new password.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pw">New password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="pw" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pl-10 rounded-xl" placeholder="••••••••" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw2">Confirm password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="pw2" type="password" autoComplete="new-password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11 pl-10 rounded-xl" placeholder="••••••••" />
                </div>
              </div>
              <Button type="submit" variant="brand" size="lg" className="w-full" disabled={loading || !ready}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : ready ? "Update password" : "Verifying link…"}
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
