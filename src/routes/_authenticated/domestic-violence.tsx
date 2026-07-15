import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert, PhoneCall, Scale, FileText, HandHeart, Home, AlertTriangle, Users } from "lucide-react";
import { InfoPage } from "@/components/app/InfoPage";

export const Route = createFileRoute("/_authenticated/domestic-violence")({
  head: () => ({ meta: [{ title: "Domestic Violence Support — Abhaya" }] }),
  component: () => (
    <InfoPage
      title="Domestic Violence"
      hero={{
        icon: HandHeart,
        title: "You are not alone",
        subtitle: "Abuse in any form is not your fault. Help is available today.",
      }}
      actions={[
        { label: "Call Women Helpline 1091", href: "tel:1091", tone: "emergency", icon: PhoneCall },
        { label: "Call 181 — Women in Distress", href: "tel:181", tone: "brand", icon: PhoneCall },
        { label: "SOS", to: "/sos", tone: "emergency", icon: AlertTriangle },
        { label: "File a report", to: "/report", tone: "brand", icon: FileText },
      ]}
      sections={[
        {
          icon: ShieldAlert,
          title: "Recognise the forms of abuse",
          body: [
            "Physical — hitting, slapping, choking, throwing objects.",
            "Emotional — insults, threats, isolation, controlling who you meet.",
            "Sexual — any non-consensual act, including within marriage.",
            "Economic — withholding money, blocking work, taking your salary.",
            "Verbal — shouting, humiliation, name-calling.",
          ],
        },
        {
          icon: Scale,
          title: "Your legal rights",
          body: [
            "Protection of Women from Domestic Violence Act, 2005 covers wives, live-in partners, mothers, sisters and daughters.",
            "You can seek a Protection Order, Residence Order, Monetary Relief, Custody Order and Compensation.",
            "You have the right to stay in the shared household — you cannot be thrown out.",
            "Section 498A IPC (now BNS §85/§86) makes cruelty by husband or his relatives a criminal offence.",
          ],
        },
        {
          icon: FileText,
          title: "How to file a complaint",
          body: [
            "Approach the nearest Protection Officer, Police Station, or Mahila Thana.",
            "You can file a Zero FIR at ANY police station — jurisdiction is not a barrier.",
            "Ask for a Domestic Incident Report (DIR) — the officer must record it.",
            "You can apply to a Magistrate directly under the DV Act — a lawyer is not mandatory.",
            "Free legal aid: District Legal Services Authority (DLSA) — call 15100.",
          ],
        },
        {
          icon: Home,
          title: "Preserve evidence safely",
          body: [
            "Photograph injuries, damaged items, threatening messages.",
            "Keep medical records and prescriptions from any hospital visit.",
            "Save screenshots of texts, WhatsApp, call logs and voicemails.",
            "Keep copies with a trusted friend or in cloud storage, not just on your phone.",
          ],
        },
        {
          icon: Users,
          title: "Shelter and support",
          body: [
            "One Stop Centres (Sakhi) — 181 — medical, legal, police and shelter under one roof.",
            "Swadhar Greh / Ujjawala shelters via the District Social Welfare Office.",
            "NGOs: Sneha (Mumbai), Shakti Shalini (Delhi), Vimochana (Bengaluru), Majlis (all-India legal).",
          ],
        },
      ]}
    />
  ),
});
