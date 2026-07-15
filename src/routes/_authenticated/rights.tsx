import { createFileRoute } from "@tanstack/react-router";
import { Scale, ShieldAlert, Briefcase, Baby, MonitorSmartphone, Home as HomeIcon, HandHeart, Users } from "lucide-react";
import { InfoPage } from "@/components/app/InfoPage";

export const Route = createFileRoute("/_authenticated/rights")({
  head: () => ({ meta: [{ title: "Women's Rights — Abhaya" }] }),
  component: () => (
    <InfoPage
      title="Women's Rights"
      back="/learn"
      hero={{ icon: Scale, title: "Your rights in plain language", subtitle: "Every woman in India is protected by these laws." }}
      sections={[
        {
          icon: ShieldAlert,
          title: "Protection of Women from Domestic Violence Act, 2005",
          body: [
            "Covers wives, live-in partners, mothers, sisters and daughters.",
            "Right to reside in the shared household — you cannot be evicted.",
            "Protection, Residence, Monetary Relief, Custody and Compensation orders.",
            "File before a Magistrate directly — a lawyer is not mandatory.",
          ],
        },
        {
          icon: Briefcase,
          title: "POSH Act, 2013 (Workplace)",
          body: [
            "Every workplace with 10+ employees must have an Internal Committee.",
            "File within 3 months of the last incident (extendable).",
            "Interim relief: transfer, up to 3 months' leave, restraint on the respondent.",
            "Retaliation for filing a POSH complaint is itself an offence.",
          ],
        },
        {
          icon: Users,
          title: "BNS / BNSS / BSA (New criminal laws, 2024)",
          body: [
            "BNS §63 — Rape (life imprisonment up to death for aggravated forms).",
            "BNS §75 — Sexual harassment; §76 — Assault to disrobe; §77 — Voyeurism; §78 — Stalking.",
            "BNS §85/§86 — Cruelty by husband or relatives (replaces IPC §498A).",
            "BNSS §173 — You can file an FIR at ANY police station (Zero FIR).",
            "BSA — New Evidence Act; electronic records fully admissible.",
          ],
        },
        {
          icon: Baby,
          title: "POCSO Act, 2012",
          body: [
            "Protects all persons under 18 from sexual offences.",
            "Mandatory reporting — failure to report is punishable.",
            "Child-friendly special courts; identity of the child is protected.",
            "Report to 1098 (Childline) or 112.",
          ],
        },
        {
          icon: MonitorSmartphone,
          title: "IT Act, 2000",
          body: [
            "§66E — Violation of privacy (capturing/publishing private images).",
            "§67, §67A — Publishing/transmitting obscene or sexually explicit content.",
            "§66C, §66D — Identity theft, cheating by impersonation.",
            "Report at 1930 or cybercrime.gov.in.",
          ],
        },
        {
          icon: HomeIcon,
          title: "Property & inheritance",
          body: [
            "Hindu Succession (Amendment) Act, 2005 — daughters are coparceners with equal rights to ancestral property.",
            "Right to your Streedhan (gifts, jewellery) — cannot be withheld by in-laws.",
            "Muslim, Christian and Parsi personal laws have their own succession rules; consult a lawyer.",
          ],
        },
        {
          icon: HandHeart,
          title: "Free legal aid",
          body: [
            "National Legal Services Authority (NALSA) — every woman is entitled to free legal aid, regardless of income.",
            "Call the DLSA helpline 15100 or visit the nearest District Legal Services Authority.",
          ],
        },
      ]}
    />
  ),
});
