import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app/AppHeader";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/report")({
  head: () => ({ meta: [{ title: "Report Incident — Abhaya" }] }),
  component: ReportPage,
});

function ReportPage() {
  return (
    <div>
      <AppHeader title="Report Incident" />
      <main className="mx-auto max-w-lg space-y-4 px-4 pt-6">
        <div className="rounded-3xl bg-gradient-brand-soft p-6 text-center shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand text-brand-foreground shadow-glow">
            <FileText className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold">Report an incident</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The full multi-step report flow — category, location, evidence media, anonymous & emergency toggles, draft & submit — arrives in the next update. Your reports stay private to you.
          </p>
        </div>
      </main>
    </div>
  );
}
