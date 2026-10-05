import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Map, FileText, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/hooks/use-language";

const items = [
  { to: "/home", icon: Home, key: "home" as const },
  { to: "/map", icon: Map, key: "map" as const },
  { to: "/report", icon: FileText, key: "report" as const },
  { to: "/learn", icon: BookOpen, key: "learn" as const },
  { to: "/profile", icon: User, key: "profile" as const },
];

export function BottomNav() {
  const [lang] = useLanguage();
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/70 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {items.map(({ to, icon: Icon, key }) => {
          const active = path === to || path.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-brand-pink" : "text-muted-foreground",
              )}
            >
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-full transition-all", active && "bg-gradient-brand text-brand-foreground shadow-glow")}>
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              </div>
              <span>{t(key, lang)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
