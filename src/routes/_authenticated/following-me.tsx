import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/ComingSoon";

export const Route = createFileRoute("/_authenticated/following-me")({
  head: () => ({ meta: [{ title: "Someone is Following Me — Abhaya" }] }),
  component: () => <ComingSoon title="Someone is Following Me" blurb="Panic flow with fake incoming call, siren, flashlight, and navigation to the nearest police station arrives next." />,
});
