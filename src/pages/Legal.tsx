import { Link } from "react-router-dom";
import { LegalLayout } from "@/components/LegalLayout";
import { Card } from "@/components/ui/card";
import {
  ShieldCheck,
  FileText,
  Lock,
  ArrowRight,
  Scale,
  Cookie,
  FileSignature,
  HeartHandshake,
} from "lucide-react";

const PAGES = [
  {
    to: "/privacy",
    icon: Lock,
    title: "Privacy Policy",
    body: "How we collect, use, retain, and protect personal and financial information. Aligned with GDPR, UK GDPR, CCPA/CPRA, GLBA, and PIPEDA.",
  },
  {
    to: "/terms",
    icon: FileText,
    title: "Terms of Service",
    body: "The agreement that governs your use of Steward — accounts, billing, acceptable use, AI features, disclaimers, and dispute resolution.",
  },
  {
    to: "/security",
    icon: ShieldCheck,
    title: "Security",
    body: "Administrative, technical, and physical controls: encryption, access management, vendor diligence, incident response, and disclosure.",
  },
];

const FRAMEWORKS = [
  {
    icon: Scale,
    title: "Privacy & data protection",
    items: [
      "EU GDPR (Reg. 2016/679) & UK GDPR",
      "California CCPA / CPRA",
      "Virginia VCDPA, Colorado CPA, Connecticut CTDPA, Utah UCPA, Texas TDPSA, Oregon OCPA, Montana MCDPA",
      "Canada PIPEDA & Quebec Law 25",
      "Brazil LGPD",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Security & financial",
    items: [
      "SOC 2 Type II (Security, Availability, Confidentiality)",
      "ISO/IEC 27001 aligned controls",
      "PCI DSS (processed by certified payment partner)",
      "Gramm-Leach-Bliley Act (GLBA) Safeguards Rule",
      "FTC Act Section 5 (unfair & deceptive practices)",
    ],
  },
  {
    icon: FileSignature,
    title: "Accessibility & marketing",
    items: [
      "WCAG 2.2 AA accessibility",
      "ADA Title III digital accessibility",
      "CAN-SPAM Act (US) & CASL (Canada)",
      "TCPA for SMS notifications",
      "ePrivacy Directive (EU cookie consent)",
    ],
  },
];

const Legal = () => {
  return (
    <LegalLayout title="Legal" updated="April 29, 2026" current="/legal">
      <p className="lead">
        Steward serves Christian business owners who want to turn profit into
        generosity. We hold your information — and our obligations to you — with
        the same diligence we ask you to bring to your stewardship. The
        documents below explain what you can expect from us, what we ask of
        you, and how we comply with the laws that govern modern financial
        software.
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

      <h2>Our compliance posture</h2>
      <p>
        Steward is designed to align with the frameworks below. Where we are
        not yet formally certified, we adopt the underlying controls and
        publish our progress in good faith. Audit reports and questionnaires
        (CAIQ, SIG Lite, HECVAT) are available to enterprise customers under
        NDA at <a href="mailto:trust@steward.app">trust@steward.app</a>.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 not-prose mt-6">
        {FRAMEWORKS.map((f) => (
          <Card key={f.title} className="p-5 border-border/60">
            <f.icon className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-base font-semibold mt-3">
              {f.title}
            </h3>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {f.items.map((i) => (
                <li key={i} className="leading-snug">• {i}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <h2>Our covenant with you</h2>
      <div className="not-prose grid sm:grid-cols-2 gap-4 my-6">
        <Card className="p-5 border-border/60">
          <HeartHandshake className="h-5 w-5 text-primary" />
          <h3 className="font-serif text-base font-semibold mt-3">
            What we promise
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            <li>• We will never sell or rent your personal information.</li>
            <li>• We will never use your financial data to train external AI.</li>
            <li>• We will never move money without your explicit approval.</li>
            <li>• We will tell you promptly if your data is ever at risk.</li>
            <li>• We will honor your right to leave and take your data with you.</li>
          </ul>
        </Card>
        <Card className="p-5 border-border/60">
          <Cookie className="h-5 w-5 text-primary" />
          <h3 className="font-serif text-base font-semibold mt-3">
            How we ask you to partner with us
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            <li>• Use a strong, unique password and enable MFA.</li>
            <li>• Keep your recipient information accurate and current.</li>
            <li>• Use Steward only for your own lawful business activity.</li>
            <li>• Tell us right away if you suspect an unauthorized login.</li>
            <li>• Confirm tax-deductibility of recipients with a qualified advisor.</li>
          </ul>
        </Card>
      </div>

      <h2>A note on faith and law</h2>
      <p>
        Steward is built on the conviction that handling money is a spiritual
        practice. We use language drawn from the Christian tradition —
        <em>covenant</em>, <em>steward</em>, <em>firstfruits</em> — because
        that is the audience we serve. None of that language changes your
        legal rights or our legal obligations. Where Scripture and statute
        speak to the same question, we hold ourselves to whichever is
        stricter.
      </p>

      <h2>Contact</h2>
      <p>
        For privacy requests, security disclosures, or legal notices:
      </p>
      <ul>
        <li>Privacy & data subject requests — <a href="mailto:privacy@steward.app">privacy@steward.app</a></li>
        <li>Security & vulnerability reports — <a href="mailto:security@steward.app">security@steward.app</a></li>
        <li>Legal notices & subpoenas — <a href="mailto:legal@steward.app">legal@steward.app</a></li>
        <li>Trust, compliance & vendor reviews — <a href="mailto:trust@steward.app">trust@steward.app</a></li>
      </ul>
      <p className="text-sm text-muted-foreground">
        Steward, Inc. · 1209 N Orange St, Wilmington, DE 19801, USA
      </p>
    </LegalLayout>
  );
};

export default Legal;
