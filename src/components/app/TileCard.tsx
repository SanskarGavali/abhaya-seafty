import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function TileCard({
  to,
  icon: Icon,
  label,
  tone = "brand",
  className,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  tone?: "brand" | "pink" | "emergency";
  className?: string;
}) {
  const toneClass = {
    brand: "bg-gradient-to-br from-[color-mix(in_oklch,var(--brand)_85%,white)] to-[color-mix(in_oklch,var(--brand-pink)_80%,white)] text-brand-foreground",
    pink: "bg-gradient-to-br from-[color-mix(in_oklch,var(--brand-pink)_85%,white)] to-[color-mix(in_oklch,var(--brand-pink)_70%,white)] text-brand-foreground",
    emergency: "bg-gradient-emergency text-emergency-foreground",
  }[tone];
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex flex-col items-center gap-2.5 rounded-3xl bg-surface p-4 text-center shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft",
        className,
      )}
    >
      <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl shadow-soft transition-transform group-hover:scale-105", toneClass)}>
        <Icon className="h-7 w-7" strokeWidth={2.2} />
      </div>
      <span className="text-[13px] font-medium leading-tight text-foreground">{label}</span>
    </Link>
  );
}
