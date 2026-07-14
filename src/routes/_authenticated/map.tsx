import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app/AppHeader";
import { MapPin, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({ meta: [{ title: "Safe Places Nearby — Abhaya" }] }),
  component: MapPage,
});

function MapPage() {
  return (
    <div>
      <AppHeader title="Safe Places Nearby" />
      <main className="mx-auto max-w-lg space-y-4 px-4 pt-6">
        <div className="rounded-3xl bg-gradient-brand-soft p-6 text-center shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand text-brand-foreground shadow-glow">
            <MapPin className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold">Find help around you</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Nearby police stations, hospitals, shelters and NGOs will appear here with one-tap directions.
          </p>
        </div>
        <div className="rounded-3xl bg-surface p-6 shadow-card">
          <div className="flex items-center gap-2 text-brand">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Coming next</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Live map with your location, filtered categories (Police, Hospital, NGO, Shelter) and Google Maps directions arrive in the next update.
          </p>
        </div>
      </main>
    </div>
  );
}
