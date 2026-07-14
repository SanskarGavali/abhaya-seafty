import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/ComingSoon";

export const Route = createFileRoute("/_authenticated/domestic-violence")({
  head: () => ({ meta: [{ title: "Domestic Violence Support — Abhaya" }] }),
  component: () => <ComingSoon title="Domestic Violence" blurb="Support hub with abuse-type explainers, legal rights, FIR guides, evidence guide, and nearby help arrives next." />,
});
