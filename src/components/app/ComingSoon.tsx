import { AppHeader } from "@/components/app/AppHeader";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function ComingSoon({ title, back = "/home", blurb }: { title: string; back?: string; blurb: string }) {
  return (
    <div>
      <AppHeader title={title} back={back} />
      <main className="mx-auto max-w-lg px-4 pt-6">
        <div className="rounded-3xl bg-gradient-brand-soft p-6 text-center shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand text-brand-foreground shadow-glow">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{blurb}</p>
          <Button asChild variant="brand" className="mt-6">
            <Link to="/home">Back to Home</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
