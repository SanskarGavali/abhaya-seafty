import { Link } from "@tanstack/react-router";
import { Bell, ChevronLeft } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { cn } from "@/lib/utils";

export function AppHeader({
  title,
  back,
  showLogo = false,
  showBell = true,
  right,
  className,
}: {
  title?: string;
  back?: string;
  showLogo?: boolean;
  showBell?: boolean;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("sticky top-0 z-30 border-b border-border/60 bg-background/55 backdrop-blur-2xl", className)}>
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {back && (
            <Link to={back} className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-brand-soft" aria-label="Back">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          )}
          {showLogo ? <BrandLogo size="sm" /> : title ? <h1 className="text-base font-semibold">{title}</h1> : null}
        </div>
        <div className="flex items-center gap-1">
          {right}
          {showBell && (
            <Link to="/notifications" className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-brand-soft" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
