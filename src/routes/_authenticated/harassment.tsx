import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/ComingSoon";

export const Route = createFileRoute("/_authenticated/harassment")({
  head: () => ({ meta: [{ title: "Harassment — Abhaya" }] }),
  component: () => <ComingSoon title="Harassment" blurb="Workplace, street, and online harassment resources, POSH Act explainer, and reporting steps arrive next." />,
});
