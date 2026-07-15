import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app/AppHeader";
import { BookOpen, Scale, Shield, HandHeart, FileText, HelpCircle, Landmark, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const items: { to: string; icon: LucideIcon; title: string; desc: string }[] = [
  { to: "/rights", icon: Scale, title: "Women's Rights", desc: "DV Act, POSH, BNS/BNSS/BSA, POCSO, IT Act." },
  { to: "/zero-fir", icon: FileText, title: "Zero FIR — How to file", desc: "Step-by-step guide to filing anywhere." },
  { to: "/schemes", icon: Landmark, title: "Government Schemes", desc: "Sakhi, Ujjawala, Nirbhaya Fund, One Stop Centres." },
  { to: "/cyber-safety", icon: Shield, title: "Cyber Safety", desc: "OTP scams, deepfakes, stalking, 1930 helpline." },
  { to: "/domestic-violence", icon: HandHeart, title: "Domestic Violence", desc: "Recognise abuse, legal rights, shelters." },
  { to: "/harassment", icon: HandHeart, title: "Harassment", desc: "Street, workplace (POSH), online." },
  { to: "/faq", icon: HelpCircle, title: "FAQs", desc: "Common questions answered simply." },
  { to: "/map", icon: MapPin, title: "Safe Places Nearby", desc: "Police, hospitals, NGOs, shelters." },
];

export const Route = createFileRoute("/_authenticated/learn")({
  head: () => ({ meta: [{ title: "Learning Centre — Abhaya" }] }),
  component: LearnPage,
});

function LearnPage() {
  return (
    <div>
      <AppHeader title="Learning Centre" />
      <main className="mx-auto max-w-lg space-y-3 px-4 pt-4 pb-8">
        <div className="rounded-3xl bg-gradient-brand-soft p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground shadow-glow">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Know your rights, know your options</h2>
              <p className="text-xs text-muted-foreground">Practical, India-specific guides you can act on today.</p>
            </div>
          </div>
        </div>

        {items.map(({ to, icon: Icon, title, desc }) => (
          <Link key={to} to={to as never} className="flex items-center gap-4 rounded-3xl bg-surface p-4 shadow-card ring-1 ring-border/60 hover:bg-brand-soft/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand text-brand-foreground shadow-soft">
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">{title}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          </Link>
        ))}
      </main>
    </div>
  );
}
