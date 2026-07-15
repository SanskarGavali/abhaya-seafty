import { createFileRoute } from "@tanstack/react-router";
import { Landmark, PhoneCall, HandHeart, ShieldCheck, GraduationCap, Wallet } from "lucide-react";
import { InfoPage } from "@/components/app/InfoPage";

export const Route = createFileRoute("/_authenticated/schemes")({
  head: () => ({ meta: [{ title: "Government Schemes — Abhaya" }] }),
  component: () => (
    <InfoPage
      title="Government Schemes"
      back="/learn"
      hero={{ icon: Landmark, title: "Support you're entitled to", subtitle: "Central Government schemes for women's safety and welfare." }}
      sections={[
        {
          icon: PhoneCall,
          title: "One Stop Centre (Sakhi) — 181",
          body: [
            "Integrated medical, legal, police, psycho-social and shelter support under one roof.",
            "Free of cost, 24×7, in every district. Dial 181 or walk in.",
          ],
        },
        {
          icon: HandHeart,
          title: "Ujjawala Scheme",
          body: [
            "For rescue and rehabilitation of women victims of trafficking for commercial sexual exploitation.",
            "Provides shelter, food, medical care, legal aid and vocational training.",
          ],
        },
        {
          icon: ShieldCheck,
          title: "Nirbhaya Fund",
          body: [
            "Central fund for projects that improve women's safety — CCTV, panic buttons, women-only helplines, forensic labs.",
            "Powers the 112 Emergency Response Support System (ERSS) across India.",
          ],
        },
        {
          icon: HandHeart,
          title: "Swadhar Greh",
          body: [
            "Shelter, food, clothing, medical treatment and legal aid for women in difficult circumstances.",
            "Reach via the District Social Welfare Office or 181.",
          ],
        },
        {
          icon: GraduationCap,
          title: "Beti Bachao Beti Padhao",
          body: [
            "Improves child sex ratio and promotes girls' education.",
            "Awareness, scholarships and safety initiatives in schools.",
          ],
        },
        {
          icon: Wallet,
          title: "Mahila Shakti Kendra & PMMVY",
          body: [
            "Mahila Shakti Kendra empowers rural women through skill development and community participation.",
            "Pradhan Mantri Matru Vandana Yojana provides cash assistance to pregnant and lactating mothers.",
          ],
        },
      ]}
    />
  ),
});
