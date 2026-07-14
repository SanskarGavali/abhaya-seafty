import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/ComingSoon";

export const Route = createFileRoute("/_authenticated/sos")({
  head: () => ({ meta: [{ title: "Emergency SOS — Abhaya" }] }),
  component: () => <ComingSoon title="Emergency SOS" blurb="Full-screen emergency mode with siren, flashlight, live GPS, and Smart Call Chain arrives in the next update." />,
});
