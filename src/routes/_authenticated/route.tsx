import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/app/BottomNav";
import { PWAInstallPrompt } from "@/components/app/PWAInstallPrompt";
import { PWAUpdateNotifier } from "@/components/app/PWAUpdateNotifier";
import guardianArt from "@/assets/abhaya-guardian-background.png.asset.json";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <div className="relative min-h-screen pb-24">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <img src={guardianArt.url} alt="" decoding="async" className="mx-auto h-full w-full max-w-lg object-cover object-top opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/75 to-background" />
      </div>
      <Outlet />
      <BottomNav />
      <PWAInstallPrompt />
      <PWAUpdateNotifier />
    </div>
  );
}
