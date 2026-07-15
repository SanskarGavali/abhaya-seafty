import { createFileRoute } from "@tanstack/react-router";
import { Hand, PhoneCall, Briefcase, Users, Scale, FileText, AlertTriangle } from "lucide-react";
import { InfoPage } from "@/components/app/InfoPage";

export const Route = createFileRoute("/_authenticated/harassment")({
  head: () => ({ meta: [{ title: "Harassment — Abhaya" }] }),
  component: () => (
    <InfoPage
      title="Harassment"
      hero={{
        icon: Hand,
        title: "Harassment is a crime — full stop",
        subtitle: "You have strong legal protection at work, on the street, and online.",
      }}
      actions={[
        { label: "Call 1091 — Women Helpline", href: "tel:1091", tone: "emergency", icon: PhoneCall },
        { label: "SOS", to: "/sos", tone: "emergency", icon: AlertTriangle },
      ]}
      sections={[
        {
          icon: Users,
          title: "Street harassment ('eve teasing')",
          body: [
            "Punishable under BNS §75 (sexual harassment), §76 (assault or use of criminal force with intent to disrobe), §78 (stalking) and §79 (word/gesture insulting the modesty of a woman).",
            "You can file an FIR at ANY police station (Zero FIR) — location of the incident doesn't matter.",
            "Metro/train harassment — pull the alarm and call Railway Helpline 139 or 182.",
          ],
        },
        {
          icon: Briefcase,
          title: "Workplace harassment (POSH Act 2013)",
          body: [
            "Every workplace with 10+ employees must have an Internal Committee (IC). File a written complaint within 3 months (extendable).",
            "If there is no IC, or you're a domestic worker/informal-sector worker, complain to the Local Committee at the District Officer.",
            "The IC must complete inquiry in 90 days. Interim relief: transfer, leave up to 3 months, restrain from reporting.",
            "Retaliation for filing a POSH complaint is itself an offence.",
          ],
        },
        {
          icon: Scale,
          title: "Online harassment & stalking",
          body: [
            "Report at cybercrime.gov.in or call 1930.",
            "Applicable law: IT Act §66E, §67, §67A and BNS §78 (stalking), §351 (criminal intimidation).",
            "Preserve URLs, usernames, screenshots with timestamps before blocking.",
          ],
        },
        {
          icon: FileText,
          title: "How to file a complaint effectively",
          body: [
            "Write date, time, place, exact words/actions, witness names, and how it affected you.",
            "Ask for a copy of the FIR and the FIR number — it's your legal right.",
            "Free legal aid from the District Legal Services Authority (DLSA) — call 15100.",
          ],
        },
      ]}
    />
  ),
});
