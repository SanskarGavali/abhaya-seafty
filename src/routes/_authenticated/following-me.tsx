import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, PhoneCall, MapPin, Users, Eye, Footprints, Building2 } from "lucide-react";
import { InfoPage } from "@/components/app/InfoPage";

export const Route = createFileRoute("/_authenticated/following-me")({
  head: () => ({ meta: [{ title: "Someone is Following Me — Abhaya" }] }),
  component: () => (
    <InfoPage
      title="Someone is Following Me"
      hero={{
        icon: Footprints,
        title: "Stay calm — you've got this",
        subtitle: "Follow these steps to reach safety fast.",
        tone: "brand",
      }}
      actions={[
        { label: "Activate SOS now", to: "/sos", tone: "emergency", icon: AlertTriangle },
        { label: "Call 112", href: "tel:112", tone: "brand", icon: PhoneCall },
        { label: "Share live location", to: "/live-location", tone: "brand", icon: MapPin },
        { label: "Alert my contacts", to: "/contacts", tone: "brand", icon: Users },
      ]}
      sections={[
        {
          icon: Eye,
          title: "Confirm you're being followed",
          body: [
            "Change direction or cross the street — a follower will usually mirror you.",
            "Stop to look at a shop window and check reflections for anyone stopping too.",
            "If they keep pace, treat it as real and act.",
          ],
        },
        {
          icon: Building2,
          title: "Move toward people and light",
          body: [
            "Walk into any open shop, restaurant, bank, hotel lobby, or petrol pump.",
            "Ask staff to let you sit inside while you call for help.",
            "Head to the nearest police station or hospital — both are safe havens.",
          ],
        },
        {
          icon: PhoneCall,
          title: "Make it obvious you're calling for help",
          body: [
            "Speak loudly on the phone — say your location and 'someone is following me'.",
            "If you can't talk, tap SOS in Abhaya — it plays a loud siren and shares your live location.",
            "Dial 112 (India's single emergency number) — it works even without balance.",
          ],
        },
        {
          icon: AlertTriangle,
          title: "If they get close",
          body: [
            "Shout 'FIRE!' or 'HELP!' — short, sharp, and loud.",
            "Aim for eyes, nose, throat, and knees if you're grabbed.",
            "Drop your bag, keep moving — belongings can be replaced.",
          ],
        },
      ]}
    />
  ),
});
