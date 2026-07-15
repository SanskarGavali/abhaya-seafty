import { createFileRoute } from "@tanstack/react-router";
import { FileText, ShieldAlert, ClipboardCheck, AlertTriangle } from "lucide-react";
import { InfoPage } from "@/components/app/InfoPage";

export const Route = createFileRoute("/_authenticated/zero-fir")({
  head: () => ({ meta: [{ title: "Zero FIR — Abhaya" }] }),
  component: () => (
    <InfoPage
      title="Zero FIR"
      back="/learn"
      hero={{
        icon: FileText,
        title: "File an FIR at ANY police station",
        subtitle: "Under BNSS §173 (formerly CrPC §154), no station can refuse you on jurisdiction.",
      }}
      sections={[
        {
          icon: ShieldAlert,
          title: "What is a Zero FIR?",
          body: [
            "A First Information Report filed at any police station regardless of where the crime happened.",
            "The station registers it with 'Zero' as the FIR number and then transfers it to the station with jurisdiction.",
            "It exists precisely so victims never lose time being sent from station to station.",
          ],
        },
        {
          icon: ClipboardCheck,
          title: "How to file — step by step",
          body: [
            "Go to the nearest police station. Ask for the Duty Officer.",
            "State clearly: 'I want to file a Zero FIR.'",
            "Give a written or oral complaint — describe what happened, when, where, and who was involved.",
            "The officer must read it back to you. Sign only after you're satisfied.",
            "Collect a FREE copy of the FIR — this is your legal right.",
            "For cognizable offences (rape, DV, assault, stalking, kidnapping), registration is mandatory.",
          ],
        },
        {
          icon: AlertTriangle,
          title: "If the police refuse",
          body: [
            "Send your written complaint by post to the Superintendent of Police (SP).",
            "Approach the Magistrate under BNSS §175(3) — the court can direct the police to register the FIR.",
            "File a complaint online at your State Police portal or the State Human Rights Commission.",
            "Refusal to register an FIR for a cognizable offence is itself punishable (BNS §198).",
          ],
        },
      ]}
    />
  ),
});
