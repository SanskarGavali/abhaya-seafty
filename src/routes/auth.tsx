import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, User as UserIcon, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/app/BrandLogo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useLanguage } from "@/hooks/use-language";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Abhaya" }] }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [lang] = useLanguage();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home" });
    });
  }, [navigate]);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
            data: { full_name: fullName.trim() || email.trim() },
          },
        });
        if (error) {
          // Duplicate detection when Supabase surfaces it
          const msg = error.message.toLowerCase();
          if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
            toast.error("An account with this email already exists. Please sign in or reset your password.");
            setMode("signin");
            return;
          }
          throw error;
        }
        // Supabase security: when confirmations are on, existing emails return a
        // user object with an EMPTY identities array. Detect and treat as duplicate.
        const identities = data.user?.identities ?? [];
        if (data.user && identities.length === 0) {
          toast.error("An account with this email already exists. Please sign in or reset your password.");
          setMode("signin");
          return;
        }
        if (data.session) {
          toast.success("Welcome to Abhaya!");
          navigate({ to: "/home" });
          return;
        }
        setPendingVerifyEmail(email.trim());
        toast.success("Verification email sent — check your inbox (and spam).");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes("email not confirmed")) {
            setPendingVerifyEmail(email.trim());
            toast.error("Please verify your email first. We can resend the link.");
            return;
          }
          if (msg.includes("invalid login")) {
            toast.error("Incorrect email or password.");
            return;
          }
          throw error;
        }
        toast.success("Welcome back!");
        navigate({ to: "/home" });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setResetSent(true);
        toast.success("Password reset link sent to your email.");
      }
    } catch (err) {
      console.error("[auth]", err);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingVerifyEmail || loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: pendingVerifyEmail,
        options: { emailRedirectTo: `${window.location.origin}/home` },
      });
      if (error) throw error;
      toast.success("Verification email resent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend email");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (!result.redirected) navigate({ to: "/home" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setPendingVerifyEmail(null);
    setResetSent(false);
  };

  const title =
    mode === "signin" ? t("signIn", lang)
      : mode === "signup" ? t("signUp", lang)
      : "Reset password";
  const subtitle =
    mode === "signin" ? "Welcome back to Abhaya."
      : mode === "signup" ? "Join Abhaya. It only takes a moment."
      : "Enter your email and we'll send a reset link.";

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-hero px-6 py-10">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brand-pink/20 blur-3xl" />
      <div className="mx-auto max-w-md">
        <div className="flex flex-col items-center">
          <BrandLogo size="md" />
        </div>

        <div className="animate-float-up mt-8 rounded-3xl bg-surface p-6 shadow-card">
          {mode === "forgot" && (
            <button
              onClick={() => switchMode("signin")}
              className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-brand"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </button>
          )}
          <h1 className="text-center font-display text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">{subtitle}</p>

          {pendingVerifyEmail && mode !== "forgot" ? (
            <div className="mt-6 space-y-4 rounded-2xl bg-brand-soft/60 p-4 text-center">
              <Mail className="mx-auto h-8 w-8 text-brand" />
              <div>
                <div className="font-medium">Check your inbox</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  We sent a verification link to <b>{pendingVerifyEmail}</b>. Click it to activate your account, then sign in.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button type="button" variant="brand" onClick={handleResendVerification} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend verification email"}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setPendingVerifyEmail(null); setMode("signin"); }}>
                  Back to sign in
                </Button>
              </div>
            </div>
          ) : resetSent && mode === "forgot" ? (
            <div className="mt-6 space-y-4 rounded-2xl bg-brand-soft/60 p-4 text-center">
              <Mail className="mx-auto h-8 w-8 text-brand" />
              <div>
                <div className="font-medium">Password reset link sent</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Check <b>{email}</b> for the reset link. It expires in 1 hour.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button type="button" variant="brand" onClick={handleSubmit as unknown as () => void} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend reset email"}
                </Button>
                <Button type="button" variant="outline" onClick={() => switchMode("signin")}>
                  Back to sign in
                </Button>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">{t("fullName", lang)}</Label>
                    <div className="relative">
                      <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11 pl-10 rounded-xl" placeholder="Your name" />
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t("email", lang)}</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 pl-10 rounded-xl" placeholder="you@example.com" />
                  </div>
                </div>
                {mode !== "forgot" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">{t("password", lang)}</Label>
                      {mode === "signin" && (
                        <button
                          type="button"
                          onClick={() => switchMode("forgot")}
                          className="text-xs font-medium text-brand hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pl-10 rounded-xl" placeholder="••••••••" />
                    </div>
                  </div>
                )}

                <Button type="submit" variant="brand" size="lg" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" />
                    : mode === "signin" ? t("signIn", lang)
                    : mode === "signup" ? t("signUp", lang)
                    : "Send reset link"}
                </Button>
              </form>

              {mode !== "forgot" && (
                <>
                  <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
                  </div>

                  <Button type="button" variant="outline" size="lg" className="w-full" onClick={handleGoogle} disabled={loading}>
                    <GoogleIcon /> {t("signInGoogle", lang)}
                  </Button>

                  <div className="mt-6 text-center text-sm text-muted-foreground">
                    {mode === "signin" ? (
                      <>
                        Don't have an account?{" "}
                        <button className="font-medium text-brand hover:underline" onClick={() => switchMode("signup")}>
                          {t("signUp", lang)}
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{" "}
                        <button className="font-medium text-brand hover:underline" onClick={() => switchMode("signin")}>
                          {t("signIn", lang)}
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/language" className="hover:text-brand">Change language</Link>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
