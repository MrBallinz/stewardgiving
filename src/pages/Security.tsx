import { LegalLayout } from "@/components/LegalLayout";
import { Card } from "@/components/ui/card";
import {
  Lock,
  ShieldCheck,
  KeyRound,
  Server,
  Bug,
  Eye,
  AlertTriangle,
  Database,
  Users,
} from "lucide-react";

const PILLARS = [
  {
    icon: Lock,
    title: "Encryption",
    body: "TLS 1.3 in transit. AES-256 at rest. Per-tenant key isolation for sensitive fields. FIPS 140-2 validated KMS.",
  },
  {
    icon: KeyRound,
    title: "Access control",
    body: "Least-privilege RBAC, SSO + MFA required for staff, hardware security keys for production.",
  },
  {
    icon: Server,
    title: "Infrastructure",
    body: "SOC 2 Type II and ISO 27001 cloud providers, isolated environments, automated patching.",
  },
  {
    icon: Eye,
    title: "Monitoring",
    body: "24/7 logging, anomaly detection, SIEM, immutable audit trails for sensitive actions.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance",
    body: "Controls modeled on SOC 2 (Sec/Avail/Conf), ISO 27001, GDPR, CCPA/CPRA, and the GLBA Safeguards Rule.",
  },
  {
    icon: Bug,
    title: "Disclosure",
    body: "Coordinated vulnerability disclosure with safe harbor for good-faith research.",
  },
];

const Security = () => {
  return (
    <LegalLayout
      title="Security"
      updated="April 29, 2026"
      current="/security"
    >
      <p className="lead">
        Steward protects financial information that customers entrust to us
        with the same diligence we ask them to bring to their own
        stewardship. Security is not a layer we add at the end — it is
        engineered into the product, the company, and our partner choices
        from the start. This page summarizes the administrative, technical,
        and physical controls we operate and how to report a security
        concern.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 not-prose mt-8">
        {PILLARS.map((p) => (
          <Card key={p.title} className="p-5 border-border/60">
            <p.icon className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-base font-semibold mt-3">
              {p.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {p.body}
            </p>
          </Card>
        ))}
      </div>

      <h2>Governance and program</h2>
      <ul>
        <li>
          A written Information Security Program owned by our Head of
          Security and reviewed annually by leadership.
        </li>
        <li>
          Policies covering acceptable use, access control, asset
          management, change management, vendor risk, business continuity,
          incident response, secure SDLC, and data classification.
        </li>
        <li>
          Risk assessments performed annually and on material change, with
          a tracked remediation register.
        </li>
        <li>
          A designated Privacy Officer and Security Officer; security and
          privacy training required at hire and annually thereafter, with
          targeted training for engineers handling sensitive data.
        </li>
        <li>
          Background checks for all staff with access to production systems,
          consistent with applicable law.
        </li>
      </ul>

      <h2>Data protection</h2>
      <ul>
        <li>
          <strong>Encryption in transit</strong> — TLS 1.2+ (1.3 preferred)
          with modern cipher suites; HSTS enforced on all customer-facing
          domains; certificates managed via automated rotation.
        </li>
        <li>
          <strong>Encryption at rest</strong> — AES-256 for databases,
          object storage, and backups. Encryption keys are managed by a
          FIPS 140-2 validated KMS with annual rotation. Field-level
          encryption for highly sensitive data (e.g., bank account
          identifiers).
        </li>
        <li>
          <strong>Secrets management</strong> — application secrets stored
          in a managed vault, never in source code, accessed via
          short-lived credentials with full audit trail.
        </li>
        <li>
          <strong>Data minimization</strong> — we collect only what we need
          and discard what we do not. We do not collect online-banking
          credentials, full card numbers, or sensitive personal data
          outside what is required by KYC partners.
        </li>
      </ul>

      <h2>Identity and access management</h2>
      <ul>
        <li>
          <strong>Customer accounts</strong> — passwords hashed with a
          modern password-hashing function (Argon2id or bcrypt at industry
          cost factors), salted per user. Multi-factor authentication
          supported and strongly recommended; passkeys on roadmap. Leaked
          password protection (HIBP) enabled at signup and password change.
        </li>
        <li>
          <strong>Staff access</strong> — role-based, least-privilege
          access reviewed quarterly. SSO with MFA enforced. Production
          access requires hardware security keys (FIDO2), is just-in-time
          where possible, and is logged for audit.
        </li>
        <li>
          <strong>Tenant isolation</strong> — every customer record is
          isolated at the database layer with row-level security policies
          that ensure one tenant's data is never returned to another. RLS
          policies are unit-tested and reviewed in code review.
        </li>
        <li>
          <strong>Session management</strong> — short-lived access tokens
          with rotating refresh tokens; idle and absolute session timeouts;
          revocation on password change.
        </li>
      </ul>

      <h2>Infrastructure and operations</h2>
      <ul>
        <li>
          Hosted on SOC 2 Type II and ISO 27001 certified cloud providers
          in U.S. data centers with 24/7 physical security, redundant
          power, and environmental controls.
        </li>
        <li>
          Production, staging, and development environments are network-
          and credential-isolated; production data is never copied into
          lower environments.
        </li>
        <li>
          Automated patching of operating systems and dependencies.
          Critical vulnerabilities are remediated on an expedited
          timeline (target: 7 days for critical, 30 days for high).
        </li>
        <li>
          Continuous database backups with point-in-time recovery (35-day
          window) and tested restoration procedures (quarterly).
        </li>
        <li>
          Documented business continuity and disaster recovery plan with
          RTO of 4 hours and RPO of 15 minutes for the customer-facing
          application.
        </li>
        <li>
          DDoS protection, WAF, bot management, and rate limiting at the
          edge.
        </li>
      </ul>

      <h2>Software development lifecycle</h2>
      <ul>
        <li>
          All code changes are peer-reviewed and pass automated tests,
          static analysis (SAST), software composition analysis (SCA), and
          secret scanning before deployment.
        </li>
        <li>
          Annual third-party penetration tests of the application and
          infrastructure. Summary letters available under NDA.
        </li>
        <li>
          Dependency vulnerability scanning runs continuously; critical
          findings page on-call.
        </li>
        <li>
          Threat modeling for new features that handle sensitive data or
          money movement.
        </li>
      </ul>

      <h2>Payments and bank data</h2>
      <ul>
        <li>
          <strong>Card data</strong> is processed exclusively by our
          PCI-DSS Level 1 payment processor and never touches Steward's
          servers. Steward stores only last4, brand, and billing address
          for receipts.
        </li>
        <li>
          <strong>Bank connections</strong> use a regulated financial data
          aggregator. Steward receives read-only transaction data. We
          never see your online-banking credentials. We never move money
          without your explicit per-transaction approval.
        </li>
        <li>
          <strong>ACH/wire transfers</strong>, where supported, are
          executed by our licensed payments partner under their banking
          and money-transmission licenses. Steward is not a money
          transmitter.
        </li>
      </ul>

      <h2>AI safety</h2>
      <ul>
        <li>
          AI requests are routed through our gateway with input/output
          filtering, rate limiting, and abuse detection.
        </li>
        <li>
          Customer Data is never used to train external AI models. Our
          providers are contractually prohibited from training on our
          traffic.
        </li>
        <li>
          The Steward Companion is read-only — it cannot move money,
          change account settings, or take actions on your behalf.
        </li>
      </ul>

      <h2>Vendor and subprocessor management</h2>
      <p>
        We assess subprocessors before engagement and at least annually
        thereafter for security posture, compliance certifications, data
        handling practices, and breach history. All subprocessors are bound
        by written contracts including confidentiality, security, and where
        required, Standard Contractual Clauses. A current subprocessor list
        is available at{" "}
        <a href="mailto:trust@steward.app">trust@steward.app</a>.
      </p>

      <h2>Logging, monitoring, and audit</h2>
      <ul>
        <li>
          Centralized logging across application, infrastructure, and
          identity systems with 13-month retention.
        </li>
        <li>
          Immutable audit trails for sensitive actions (auth, role changes,
          money movement, data export, admin access).
        </li>
        <li>
          24/7 alerting with on-call rotation; SLAs for triage and
          response by severity.
        </li>
      </ul>

      <h2>Incident response and breach notification</h2>
      <div className="not-prose grid sm:grid-cols-3 gap-4 my-6">
        <Card className="p-5 border-border/60">
          <AlertTriangle className="h-5 w-5 text-primary" />
          <h3 className="font-serif text-base font-semibold mt-3">Detect</h3>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            24/7 monitoring, on-call rotation, customer reports, and
            researcher disclosures.
          </p>
        </Card>
        <Card className="p-5 border-border/60">
          <Database className="h-5 w-5 text-primary" />
          <h3 className="font-serif text-base font-semibold mt-3">Contain</h3>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Severity classification, isolation, evidence preservation, and
            forensic analysis.
          </p>
        </Card>
        <Card className="p-5 border-border/60">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-serif text-base font-semibold mt-3">Notify</h3>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Affected customers and regulators within statutory timelines
            (GDPR 72h; US state laws as applicable).
          </p>
        </Card>
      </div>
      <p>
        Steward maintains a documented incident response plan with defined
        roles, severity levels, communication procedures, and post-incident
        review. In the event of a confirmed security incident affecting your
        data, we will notify you without undue delay and in accordance with
        applicable law, including GDPR Article 33/34, the GLBA Safeguards
        Rule notification requirements, and US state breach notification
        statutes.
      </p>

      <h2>Customer security responsibilities</h2>
      <p>Security is shared. To do your part:</p>
      <ul>
        <li>Use a strong, unique password and enable multi-factor authentication.</li>
        <li>Keep your devices and browsers patched.</li>
        <li>Review the connected accounts and active sessions in <strong>Settings → Security</strong>.</li>
        <li>Notify us immediately at <a href="mailto:security@steward.app">security@steward.app</a> if you suspect unauthorized access.</li>
        <li>Be skeptical of phishing — Steward will never ask for your password or MFA code.</li>
      </ul>

      <h2>Responsible disclosure</h2>
      <p>
        We welcome reports from security researchers acting in good faith.
        To report a vulnerability, email{" "}
        <a href="mailto:security@steward.app">security@steward.app</a> with
        steps to reproduce. PGP key available on request. Please do not
        publicly disclose the issue until we have had a reasonable
        opportunity to investigate and remediate (typically 90 days).
      </p>
      <p>
        <strong>Safe harbor.</strong> We will not pursue legal action against
        researchers who:
      </p>
      <ul>
        <li>Make a good-faith effort to avoid privacy violations and disruption to others;</li>
        <li>Only access the minimum data necessary to demonstrate the issue;</li>
        <li>Do not exploit, modify, exfiltrate, or destroy customer data;</li>
        <li>Do not perform social engineering, physical, or denial-of-service attacks;</li>
        <li>Give us a reasonable time to remediate before any public disclosure.</li>
      </ul>

      <h2>Trust and audit artifacts</h2>
      <p>
        Enterprise customers may request our latest SOC 2 Type II report,
        penetration test summary, business continuity plan summary, and
        completed security questionnaires (CAIQ, SIG Lite, HECVAT) under
        NDA at <a href="mailto:trust@steward.app">trust@steward.app</a>.
      </p>
    </LegalLayout>
  );
};

export default Security;
