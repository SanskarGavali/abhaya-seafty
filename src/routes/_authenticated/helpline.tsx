import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app/AppHeader";
import { Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const helplines = [
  { key: "112", label: "Emergency", number: "112", desc: "All-India Emergency" },
  { key: "1091", label: "Women Helpline", number: "1091", desc: "National Women Helpline" },
  { key: "181", label: "Women in Distress", number: "181", desc: "Women in distress" },
  { key: "100", label: "Police", number: "100", desc: "Police helpline" },
  { key: "108", label: "Ambulance", number: "108", desc: "Medical emergency" },
  { key: "1098", label: "Child Helpline", number: "1098", desc: "Children in need" },
  { key: "1930", label: "Cyber Crime", number: "1930", desc: "Report cyber crime" },
];

export const Route = createFileRoute("/_authenticated/helpline")({
  head: () => ({ meta: [{ title: "Helpline Numbers — Abhaya" }] }),
  component: HelplinePage,
});

function HelplinePage() {
  return (
    <div>
      <AppHeader title="Helpline Numbers" back="/home" />
      <main className="mx-auto max-w-lg space-y-3 px-4 pt-6">
        {helplines.map((h) => (
          <div key={h.key} className="flex items-center gap-3 rounded-3xl bg-surface p-4 shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand text-brand-foreground shadow-soft">
              <Phone className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">{h.label}</div>
              <div className="text-xs text-muted-foreground">{h.desc}</div>
            </div>
            <Button variant="ghost" size="icon" aria-label={`Pin ${h.label}`}>
              <Star className="h-4 w-4" />
            </Button>
            <Button asChild variant="brand" size="sm">
              <a href={`tel:${h.number}`}>{h.number}</a>
            </Button>
          </div>
        ))}
      </main>
    </div>
  );
}
