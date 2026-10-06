import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import {
  Phone,
  FileText,
  ShieldAlert,
  Stethoscope,
  Scale,
  Camera,
  ExternalLink,
  ChevronDown,
  AlertTriangle,
  Globe,
  Info,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import guardianArt from "@/assets/abhaya-guardian-background.png.asset.json";

export const Route = createFileRoute("/_authenticated/report")({
  head: () => ({ meta: [
    { title: "Report & Guidance — Abhaya" },
    { name: "description", content: "Emergency helplines, police complaint guidance, legal rights, and evidence preservation resources from Abhaya." },
    { property: "og:title", content: "Report & Guidance — Abhaya" },
    { property: "og:description", content: "Emergency help and official guidance for police complaints, medical care, legal rights, and preserving evidence." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ReportPage,
});

type OfficialLink = { label: string; url: string };

function Section({
  icon: Icon,
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="guidance-section overflow-hidden rounded-3xl bg-surface shadow-card ring-1 ring-border/60">
      <Button variant="ghost"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="guidance-toggle flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-brand-soft/40"
      >
        <div className="safety-icon flex h-10 w-10 shrink-0 items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-base font-semibold">{title}</div>
          {subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>}
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </Button>
      {open && <div className="guidance-content border-t border-border/60 px-4 pb-5 pt-4 text-sm text-foreground/85">{children}</div>}
    </section>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((s, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
            {i + 1}
          </span>
          <span className="leading-relaxed">{s}</span>
        </li>
      ))}
    </ol>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((s, i) => (
        <li key={i} className="flex gap-2 leading-relaxed">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
          <span>{s}</span>
        </li>
      ))}
    </ul>
  );
}

function Callout({ tone = "info", children }: { tone?: "info" | "warn"; children: ReactNode }) {
  const cls =
    tone === "warn"
      ? "bg-emergency/10 text-emergency"
      : "bg-brand-soft text-foreground/80";
  const Icon = tone === "warn" ? AlertTriangle : Info;
  return (
    <div className={`mt-3 flex gap-2 rounded-2xl p-3 text-xs ${cls}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function Links({ items }: { items: OfficialLink[] }) {
  return (
    <div className="mt-3 space-y-2">
      {items.map((l) => (
        <a
          key={l.url}
          href={l.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-3 py-2.5 text-xs font-medium text-brand hover:bg-brand-soft"
        >
          <span className="flex items-center gap-2 truncate">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{l.label}</span>
          </span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </a>
      ))}
    </div>
  );
}

const EMERGENCY_NUMBERS = [
  { label: "All-India Emergency", number: "112", desc: "Free from any phone, works without balance" },
  { label: "Women Helpline", number: "1091", desc: "National Women Helpline" },
  { label: "Police", number: "100", desc: "Police helpline" },
  { label: "Ambulance", number: "108", desc: "Medical emergency" },
  { label: "Cyber Crime", number: "1930", desc: "Financial fraud & cyber crime" },
  { label: "Child Helpline", number: "1098", desc: "Children in need" },
];

function ReportPage() {
  return (
    <div className="safety-screen pb-24">
      <div className="safety-art" aria-hidden="true"><img src={guardianArt.url} alt="" decoding="async" /></div>
      <AppHeader title="Report & Guidance" />
      <main className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        <div className="guidance-intro">
          <h2 className="font-display text-lg font-semibold">You have options. Here's how to use them.</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verified guidance from official Government of India sources. Tap any section to expand.
          </p>
        </div>

        {/* Emergency Help — always visible */}
        <section className="emergency-help">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emergency/10 text-emergency">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-base font-semibold">Emergency Help</div>
              <div className="text-xs text-muted-foreground">Tap any number to call directly.</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {EMERGENCY_NUMBERS.map((h) => (
              <a
                key={h.number}
                href={`tel:${h.number}`}
                className="emergency-number flex flex-col gap-0.5 border border-border p-3 transition-colors"
              >
                <span className="text-xl font-bold text-brand">{h.number}</span>
                <span className="text-xs font-medium">{h.label}</span>
                <span className="text-[11px] text-muted-foreground">{h.desc}</span>
              </a>
            ))}
          </div>
          <Button asChild variant="emergency" size="lg" className="mt-3 w-full">
            <a href="tel:112">
              <Phone className="h-5 w-5" /> Call 112 now
            </a>
          </Button>
        </section>

        <Section
          icon={FileText}
          title="Police Complaint Guide"
          subtitle="FIR, Zero FIR, and what to do if police refuse"
          defaultOpen
        >
          <div className="space-y-4">
            <div>
              <div className="mb-1 font-semibold">What is an FIR?</div>
              <p>
                A First Information Report is the written document police prepare when they receive information about
                a cognizable offence (rape, assault, DV, stalking, kidnapping, etc.). Registering an FIR is your legal
                right — police cannot refuse it for a cognizable offence.
              </p>
            </div>
            <div>
              <div className="mb-1 font-semibold">How to file an FIR</div>
              <Steps
                items={[
                  "Go to the nearest police station and ask for the Duty Officer.",
                  "State clearly what happened, when, where, and who was involved. You may write it yourself or dictate it.",
                  "The officer must read it back to you before you sign — correct any mistakes.",
                  "Collect a FREE copy of the FIR. This is your legal right (BNSS §173).",
                  "Note the FIR number, date, and the officer's name and rank.",
                ]}
              />
            </div>
            <div>
              <div className="mb-1 font-semibold">What is a Zero FIR?</div>
              <p>
                A Zero FIR can be filed at ANY police station, regardless of where the offence happened. The station
                registers it with "0" as the number and forwards it to the correct jurisdiction. Use this when you're
                travelling or unsure of jurisdiction.
              </p>
            </div>
            <div>
              <div className="mb-1 font-semibold">If police refuse to register your complaint</div>
              <Steps
                items={[
                  "Ask the officer for the refusal in writing (they rarely give this).",
                  "Send your complaint by post or email to the Superintendent of Police (SP) of the district.",
                  "File an application under BNSS §175(3) before the Magistrate — the court can order police to register the FIR.",
                  "File an online complaint on your State Police portal or with the State/National Human Rights Commission.",
                ]}
              />
              <Callout tone="warn">
                Refusing to register a cognizable-offence FIR is itself punishable under BNS §198. You have the right
                to escalate.
              </Callout>
            </div>
            <Links
              items={[
                { label: "National Legal Services Authority (NALSA)", url: "https://nalsa.gov.in" },
                { label: "State-wise Police / Online FIR portals", url: "https://digitalpolice.gov.in" },
                { label: "National Human Rights Commission", url: "https://nhrc.nic.in" },
              ]}
            />
          </div>
        </Section>

        <Section icon={ShieldAlert} title="Cyber Crime" subtitle="Fraud, harassment, non-consensual images, stalking">
          <div className="space-y-4">
            <div>
              <div className="mb-1 font-semibold">Report online</div>
              <Steps
                items={[
                  "For financial fraud, call 1930 immediately (the sooner, the better — banks can freeze funds).",
                  "File a complaint at cybercrime.gov.in — you can report anonymously for many offences.",
                  "For non-consensual intimate images, use the platform's emergency take-down and NCMEC/StopNCII where applicable.",
                  "Keep the case number safe — you will need it for follow-ups.",
                ]}
              />
            </div>
            <div>
              <div className="mb-1 font-semibold">Protect digital evidence</div>
              <Bullets
                items={[
                  "Take screenshots showing the sender's ID, timestamp, and full message.",
                  "Save the original URLs, not just screenshots. Record profile links.",
                  "Do not delete chats, emails, or transaction SMS — even the abusive ones.",
                  "Back up to a second device or cloud folder you control.",
                ]}
              />
            </div>
            <Callout>
              Do not pay blackmailers. Paying rarely stops the abuse and destroys leverage during investigation.
            </Callout>
            <Links
              items={[
                { label: "National Cyber Crime Reporting Portal", url: "https://cybercrime.gov.in" },
                { label: "Cyber Crime Helpline — 1930", url: "tel:1930" },
                { label: "CERT-In — India's cyber incident response", url: "https://www.cert-in.org.in" },
              ]}
            />
          </div>
        </Section>

        <Section icon={Stethoscope} title="Medical Guidance" subtitle="Rights, examination, MLC and emergency care">
          <div className="space-y-4">
            <div>
              <div className="mb-1 font-semibold">Your medical examination rights</div>
              <Bullets
                items={[
                  "Every public hospital MUST provide free first-aid and medical treatment to survivors of assault. Refusing care is punishable (BNS §200).",
                  "For sexual assault survivors, examination follows the MoHFW protocol — you may request a female doctor.",
                  "You have the right to have a person of your choice present during examination.",
                  "The two-finger test is banned by the Supreme Court and MoHFW — it must not be performed.",
                ]}
              />
            </div>
            <div>
              <div className="mb-1 font-semibold">Hospital procedure</div>
              <Steps
                items={[
                  "Go to the nearest government hospital or Sakhi One-Stop Centre.",
                  "Ask for an MLC (Medico-Legal Case) — hospitals are required to inform police, but treatment cannot be delayed for police to arrive.",
                  "Do NOT bathe, change clothes or discard clothing before the exam — evidence is preserved on the body and fabric.",
                  "Keep copies of every prescription, report, and discharge summary.",
                ]}
              />
            </div>
            <Callout tone="warn">
              Emergency care cannot be denied for lack of ID, money, or FIR. If a hospital refuses, call 102 / 108 and
              also 112.
            </Callout>
            <Links
              items={[
                { label: "Ministry of Health & Family Welfare (MoHFW)", url: "https://mohfw.gov.in" },
                { label: "One Stop Centre Scheme (Sakhi)", url: "https://wcd.nic.in/schemes/one-stop-centre-scheme-1" },
              ]}
            />
          </div>
        </Section>

        <Section icon={Scale} title="Legal Rights" subtitle="Plain-language explainer of protections available to you">
          <div className="space-y-4">
            <div>
              <div className="mb-1 font-semibold">Core rights in an emergency or investigation</div>
              <Bullets
                items={[
                  "Right to register an FIR at any police station (Zero FIR — BNSS §173).",
                  "Right to a free copy of the FIR.",
                  "Right to free legal aid via District Legal Services Authority (call 15100).",
                  "Right to have a woman officer record a statement in offences against women (BNSS §176).",
                  "Right to record your statement at a place of your choice (like your home) for many offences.",
                  "Right to in-camera trial and identity protection in sexual offences.",
                  "Right to compensation under the Victim Compensation Scheme.",
                ]}
              />
            </div>
            <div>
              <div className="mb-1 font-semibold">Where to get free legal help</div>
              <Bullets
                items={[
                  "DLSA / SLSA — free legal aid, lawyers, and mediation. Helpline: 15100.",
                  "State Commission for Women in your state.",
                  "National Commission for Women — complaints & counselling.",
                ]}
              />
            </div>
            <Callout>
              This is general information, not legal advice. For your specific case, contact DLSA (15100) or a lawyer.
            </Callout>
            <Links
              items={[
                { label: "NALSA — Free Legal Services (call 15100)", url: "https://nalsa.gov.in" },
                { label: "National Commission for Women", url: "https://ncw.gov.in" },
                { label: "Ministry of Women & Child Development", url: "https://wcd.nic.in" },
              ]}
            />
          </div>
        </Section>

        <Section icon={Camera} title="Evidence Preservation" subtitle="What to save, what NOT to delete">
          <div className="space-y-4">
            <div>
              <div className="mb-1 font-semibold">Save safely</div>
              <Bullets
                items={[
                  "Photos and videos of injuries, damage, and the location — with timestamps.",
                  "Audio recordings (where legal in your state) of threats or abuse.",
                  "Chats, DMs, and emails — save the entire thread, not clipped screenshots.",
                  "Screenshots of profiles, usernames, and URLs.",
                  "Call logs and SMS — export or screenshot from your phone.",
                  "Documents: medical reports, receipts, transaction records, property papers.",
                ]}
              />
            </div>
            <div>
              <div className="mb-1 font-semibold">Do NOT delete</div>
              <Bullets
                items={[
                  "Abusive messages, threats, or blackmail material — even if painful to see.",
                  "Bank SMS and UPI transaction messages during fraud investigations.",
                  "Call logs showing missed or harassing calls.",
                  "Anything the accused sent you — including deleted messages you may have backed up.",
                ]}
              />
            </div>
            <div>
              <div className="mb-1 font-semibold">Back up in more than one place</div>
              <Bullets
                items={[
                  "Copy to a second phone, laptop, or a trusted family member's device.",
                  "Upload to a private cloud folder (Google Drive, iCloud) — turn on 2-step verification.",
                  "Keep original files (with EXIF metadata) — courts can verify authenticity from originals.",
                ]}
              />
            </div>
            <Callout tone="warn">
              Never edit, crop, or filter evidence before sharing with police — it can be challenged in court.
            </Callout>
          </div>
        </Section>

        <Section icon={Globe} title="Official Links" subtitle="Government of India verified resources">
          <Links
            items={[
              { label: "cybercrime.gov.in — Cyber Crime Portal", url: "https://cybercrime.gov.in" },
              { label: "digitalpolice.gov.in — Online FIR & State Police", url: "https://digitalpolice.gov.in" },
              { label: "wcd.nic.in — Ministry of Women & Child Development", url: "https://wcd.nic.in" },
              { label: "ncw.gov.in — National Commission for Women", url: "https://ncw.gov.in" },
              { label: "nalsa.gov.in — Free Legal Services", url: "https://nalsa.gov.in" },
              { label: "nhrc.nic.in — National Human Rights Commission", url: "https://nhrc.nic.in" },
              { label: "mohfw.gov.in — Ministry of Health & Family Welfare", url: "https://mohfw.gov.in" },
              { label: "One Stop Centre (Sakhi) scheme", url: "https://wcd.nic.in/schemes/one-stop-centre-scheme-1" },
            ]}
          />
          <Callout>
            Only use official government sources. Beware of look-alike websites asking for payment or OTP — no
            government helpline ever asks for an OTP.
          </Callout>
        </Section>
      </main>
    </div>
  );
}
