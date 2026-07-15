import { createFileRoute } from "@tanstack/react-router";
import { Shield, PhoneCall, Lock, MessageSquareWarning, CreditCard, Camera, UserX, Bug } from "lucide-react";
import { InfoPage } from "@/components/app/InfoPage";

export const Route = createFileRoute("/_authenticated/cyber-safety")({
  head: () => ({ meta: [{ title: "Cyber Safety — Abhaya" }] }),
  component: () => (
    <InfoPage
      title="Cyber Safety"
      hero={{
        icon: Shield,
        title: "Report cyber crime in minutes",
        subtitle: "1930 is India's dedicated cyber crime helpline. Every hour counts.",
      }}
      actions={[
        { label: "Call 1930 — Cyber Crime", href: "tel:1930", tone: "emergency", icon: PhoneCall },
        { label: "Report at cybercrime.gov.in", href: "https://cybercrime.gov.in/", tone: "brand" },
      ]}
      sections={[
        {
          icon: MessageSquareWarning,
          title: "Cyber bullying & harassment",
          body: [
            "Take screenshots with the URL, username and date-time visible — don't delete anything.",
            "Block and report the account on the platform first, then file at cybercrime.gov.in.",
            "For rape/gang-rape/child sexual abuse imagery, use the anonymous 'Report Women & Child Related Crime' option.",
          ],
        },
        {
          icon: Camera,
          title: "Sextortion, morphed photos, deepfakes",
          body: [
            "Do not pay. Extortion escalates once you pay.",
            "Stop responding. Preserve all chats, screenshots and payment demands.",
            "Report to 1930 and to cybercrime.gov.in — request take-down under IT Act §66E, §67, §67A and BNS §77 (voyeurism).",
            "Ask the platform for emergency take-down citing 'non-consensual intimate imagery'.",
          ],
        },
        {
          icon: CreditCard,
          title: "OTP, UPI & bank scams",
          body: [
            "Never share OTP, CVV, UPI PIN, card PIN or 'card control' codes with anyone — no bank asks.",
            "For any lost amount, call 1930 within the 'Golden Hour' (first 60 min) to freeze the money trail.",
            "File on cybercrime.gov.in the same day — quote your Acknowledgement Number to your bank.",
          ],
        },
        {
          icon: UserX,
          title: "Fake profiles, stalking & doxxing",
          body: [
            "Report the fake profile on the platform (Instagram/Facebook/X have dedicated impersonation forms).",
            "File at cybercrime.gov.in — this is punishable under IT Act §66C, §66D and BNS §319 (impersonation).",
            "Enable two-factor authentication on all your accounts today.",
          ],
        },
        {
          icon: Lock,
          title: "Everyday safety habits",
          body: [
            "Use long passphrases and a password manager — reuse is the #1 breach cause.",
            "Turn on 2FA (prefer app-based, not SMS) on email, WhatsApp, Instagram, banking.",
            "Never install APKs from links; only use the official Play Store / App Store.",
            "Review app permissions monthly — revoke location, mic, contacts if not needed.",
          ],
        },
        {
          icon: Bug,
          title: "If your device is hacked",
          body: [
            "Disconnect from the internet, change your Google/Apple password from another device.",
            "Sign out of all sessions in Gmail, Instagram and WhatsApp.",
            "Reset the device to factory settings if you notice unknown apps or root access.",
          ],
        },
      ]}
    />
  ),
});
