import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app/AppHeader";
import { BellOff } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Abhaya" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <div>
      <AppHeader title="Notifications" back="/profile" showBell={false} />
      <main className="mx-auto max-w-lg px-4 pt-16">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-soft text-brand">
            <BellOff className="h-9 w-9" />
          </div>
          <h2 className="mt-5 font-display text-xl font-semibold">You're all caught up</h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Alerts about your emergency chain, live-location sessions, and safety updates will appear here.
          </p>
        </div>
      </main>
    </div>
  );
}
