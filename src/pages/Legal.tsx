import { Link } from "react-router-dom";
import { LegalLayout } from "@/components/LegalLayout";
import { Card } from "@/components/ui/card";
import { ShieldCheck, FileText, Lock, ArrowRight } from "lucide-react";

const PAGES = [
  {
    to: "/privacy",
    icon: Lock,
    title: "Privacy Policy",
    body: "How we collect, use, and protect personal information. Aligned with GDPR, CCPA/CPRA, and consumer privacy best practices.",
  },
  {
    to: "/terms",
    icon: FileText,
    title: "Terms of Service",
    body: "The agreement that governs your use of Steward — accounts, billing, acceptable use, disclaimers, and dispute resolution.",
  },
  {
    to: "/security",
    icon: ShieldCheck,
    title: "Security",
    body: "Our controls for protecting customer data: encryption, access management, vendor diligence, and incident response.",
  },
];

const Legal = () => {
  return (
    <LegalLayout title="Legal" updated="January 1, 2026" current="/legal">
      <p className="lead">
        Steward is committed to handling your information with the same
        diligence we ask you to bring to your finances. The documents below
        explain what you can expect from us and what we ask of you.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mt-8 not-prose">
        {PAGES.map((p) => (
          <Link key={p.to} to={p.to} className="block">
            <Card className="p-5 h-full hover:shadow-elegant transition-shadow border-border/60">
              <p.icon className="h-6 w-6 text-primary" />
              <h3 className="font-serif text-lg font-semibold mt-3">
                {p.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {p.body}
              </p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                Read <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </span>
            </Card>
          </Link>
        ))}
      </div>

      <h2>Compliance posture</h2>
      <p>
        Steward is designed to align with the following frameworks and laws.
        Where we are not yet formally certified, we adopt the controls and
        publish our progress in good faith.
      </p>
      <ul>
        <li>
          <strong>GDPR</strong> (EU 2016/679) and <strong>UK GDPR</strong> —
          lawful basis disclosure, data subject rights, DPA available on
          request.
        </li>
        <li>
          <strong>CCPA / CPRA</strong> (California) — right to know, delete,
          correct, and opt out of sale/sharing (Steward does not sell or share
          personal information).
        </li>
        <li>
          <strong>SOC 2 Type II</strong> — controls modeled on the Trust
          Services Criteria for Security, Availability, and Confidentiality.
        </li>
        <li>
          <strong>PCI DSS</strong> — payment card data is processed exclusively
          by our PCI-certified payment processor; Steward does not store card
          numbers.
        </li>
        <li>
          <strong>GLBA Safeguards Rule</strong> — financial information is
          handled with administrative, technical, and physical safeguards.
        </li>
      </ul>

      <h2>Contact</h2>
      <p>
        For privacy requests, security disclosures, or legal notices, contact{" "}
        <a href="mailto:legal@steward.app">legal@steward.app</a>. Security
        researchers may report vulnerabilities to{" "}
        <a href="mailto:security@steward.app">security@steward.app</a>.
      </p>
    </LegalLayout>
  );
};

export default Legal;
