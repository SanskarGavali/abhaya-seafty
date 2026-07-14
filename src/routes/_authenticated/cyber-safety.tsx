import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/ComingSoon";

export const Route = createFileRoute("/_authenticated/cyber-safety")({
  head: () => ({ meta: [{ title: "Cyber Safety — Abhaya" }] }),
  component: () => <ComingSoon title="Cyber Safety" blurb="Cyber bullying, blackmail, OTP scams, deepfakes and the 1930 helpline arrive next." />,
});
