import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandLogo({ size = "md", showWord = true }: { size?: "sm" | "md" | "lg" | "xl"; showWord?: boolean }) {
  const shieldSize = { sm: "h-7 w-7", md: "h-9 w-9", lg: "h-14 w-14", xl: "h-24 w-24" }[size];
  const iconSize = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7", xl: "h-12 w-12" }[size];
  const wordSize = { sm: "text-lg", md: "text-2xl", lg: "text-4xl", xl: "text-6xl" }[size];
  return (
    <div className="inline-flex items-center gap-2.5">
      <div className={cn("relative flex items-center justify-center rounded-2xl bg-gradient-brand shadow-glow", shieldSize)}>
        <Shield className={cn("text-brand-foreground", iconSize)} strokeWidth={2.5} fill="currentColor" fillOpacity={0.15} />
      </div>
      {showWord && (
        <span
          className={cn("font-display font-semibold tracking-tight", wordSize)}
          style={{ backgroundImage: "var(--gradient-brand)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
        >
          Abhaya
        </span>
      )}
    </div>
  );
}
