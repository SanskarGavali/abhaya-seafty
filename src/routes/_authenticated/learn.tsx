import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app/AppHeader";
import { BookOpen, Scale, Shield, HeartHandshake } from "lucide-react";

const sections = [
  { icon: BookOpen, title: "Safety Articles", desc: "Practical guides for daily safety." },
  { icon: Scale, title: "Women's Rights", desc: "Plain-language explainers for Indian laws." },
  { icon: Shield, title: "Cyber Safety", desc: "Protect your digital identity and privacy." },
  { icon: HeartHandshake, title: "Support & Recovery", desc: "Resources for healing and next steps." },
];

export const Route = createFileRoute("/_authenticated/learn")({
  head: () => ({ meta: [{ title: "Learning Centre — Abhaya" }] }),
  component: LearnPage,
});

function LearnPage() {
  return (
    <div>
      <AppHeader title="Learning Centre" />
      <main className="mx-auto max-w-lg space-y-3 px-4 pt-6">
        {sections.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-4 rounded-3xl bg-surface p-4 shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand text-brand-foreground shadow-soft">
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">{title}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          </div>
        ))}
        <p className="pt-4 text-center text-xs text-muted-foreground">
          Full articles, videos, and legal explainers arrive in the next update.
        </p>
      </main>
    </div>
  );
}
