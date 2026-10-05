import { cn } from "@/lib/utils";
import logo from "@/assets/abhaya-approved-logo.png.asset.json";

export function BrandLogo({
  size = "md",
  showWord = false,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  showWord?: boolean;
}) {
  const box = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-16 w-16", xl: "h-28 w-28" }[size];
  const wordSize = { sm: "text-lg", md: "text-2xl", lg: "text-4xl", xl: "text-5xl" }[size];
  return (
    <div className="inline-flex items-center gap-2.5">
      <img
        src={logo.url}
        alt="Abhaya"
        width={size === "xl" ? 224 : size === "lg" ? 128 : size === "md" ? 80 : 64}
        height={size === "xl" ? 224 : size === "lg" ? 128 : size === "md" ? 80 : 64}
        loading="eager"
        decoding="async"
        className={cn("shrink-0 rounded-2xl object-contain", box)}
        style={{ imageRendering: "auto" }}
      />
      {showWord && (
        <span
          className={cn("font-display font-semibold tracking-tight", wordSize)}
          style={{
            backgroundImage: "var(--gradient-brand)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Abhaya
        </span>
      )}
    </div>
  );
}
