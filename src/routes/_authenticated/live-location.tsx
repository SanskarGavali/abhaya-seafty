import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/ComingSoon";

export const Route = createFileRoute("/_authenticated/live-location")({
  head: () => ({ meta: [{ title: "Live Location — Abhaya" }] }),
  component: () => <ComingSoon title="Live Location" blurb="Continuous GPS sharing to trusted contacts with map view and stop-sharing control arrives next." />,
});
