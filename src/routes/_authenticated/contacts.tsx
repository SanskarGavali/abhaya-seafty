import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/ComingSoon";

export const Route = createFileRoute("/_authenticated/contacts")({
  head: () => ({ meta: [{ title: "Emergency Contacts — Abhaya" }] }),
  component: () => <ComingSoon title="Emergency Contacts" back="/profile" blurb="Add, edit, and drag-reorder your priority contact chain for the SOS system in the next update." />,
});
