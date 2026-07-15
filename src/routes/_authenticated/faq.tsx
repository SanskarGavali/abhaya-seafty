import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";
import { InfoPage } from "@/components/app/InfoPage";

export const Route = createFileRoute("/_authenticated/faq")({
  head: () => ({ meta: [{ title: "FAQs — Abhaya" }] }),
  component: () => (
    <InfoPage
      title="FAQs"
      back="/learn"
      hero={{ icon: HelpCircle, title: "Common questions, straight answers" }}
      sections={[
        { title: "Can I file an FIR outside my city?", body: "Yes. Under BNSS §173 you can file a Zero FIR at ANY police station in India. They must accept it and forward it to the correct jurisdiction." },
        { title: "Is 112 free even without balance?", body: "Yes. 112 is India's single emergency number and works from any phone, on any network, even without SIM balance." },
        { title: "Do I need a lawyer to file a DV complaint?", body: "No. You can approach the Protection Officer or the Magistrate directly under the Protection of Women from Domestic Violence Act, 2005. Free legal aid is available via DLSA (15100)." },
        { title: "What if the police refuse my complaint?", body: "You can (1) send a written complaint to the SP, (2) apply to the Magistrate under BNSS §175(3), or (3) file a complaint with the State Human Rights Commission. Refusing to register a cognizable offence is itself punishable under BNS §198." },
        { title: "Someone is blackmailing me with photos. What do I do?", body: "Do not pay. Preserve every message and screenshot. Call 1930 immediately and file at cybercrime.gov.in. Ask the platform for emergency take-down as 'non-consensual intimate imagery'. Applicable law: IT Act §66E, §67, §67A and BNS §77 (voyeurism)." },
        { title: "Can my in-laws throw me out of the house?", body: "No. Under the DV Act you have the right to reside in the shared household. Seek a Residence Order from the Magistrate." },
        { title: "Does POSH cover interns and consultants?", body: "Yes. 'Aggrieved woman' under POSH includes employees, interns, trainees, apprentices, contract staff, and visitors — regardless of pay or duration." },
        { title: "Is Abhaya's data private?", body: "Yes. Your data is encrypted and scoped to your account only. Nobody else can see your contacts, incidents, or settings." },
      ]}
    />
  ),
});
