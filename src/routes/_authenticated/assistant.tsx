import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/ComingSoon";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "AI Safety Assistant — Abhaya" }] }),
  component: () => <ComingSoon title="AI Safety Assistant" blurb="Your calm, always-on safety companion — powered by Lovable AI — arrives in the next update with voice, memory, and multilingual support." />,
});
