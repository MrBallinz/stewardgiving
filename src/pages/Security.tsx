import { LegalLayout } from "@/components/LegalLayout";
import { Card } from "@/components/ui/card";
import { Lock, ShieldCheck, KeyRound, Server, Bug, Eye } from "lucide-react";

const PILLARS = [
  {
    icon: Lock,
    title: "Encryption",
    body: "TLS 1.2+ in transit. AES-256 at rest. Per-tenant key isolation for sensitive fields.",
  },
  {
    icon: KeyRound,
    title: "Access control",
    body: "Least-privilege RBAC, MFA-required for staff, hardware keys for production access.",
  },
  {
    icon: Server,
    title: "Infrastructure",
    body: "SOC 2-certified cloud providers, isolated environments, automated patching.",
  },
  {
    icon: Eye,
    title: "Monitoring",
    body: "24/7 logging, anomaly detection, audit trails for sensitive actions.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance",
    body: "Controls modeled on SOC 2, GDPR, CCPA/CPRA, and the GLBA Safeguards Rule.",
  },
  {
    icon: Bug,
    title: "Disclosure",
    body: "Coordinated vulnerability disclosure. Safe harbor for good-faith research.",
  },
];

const Security = () => {
  return (
    <LegalLayout
      title="Security"
      updated="January 1, 2026"
      current="/security"
    >
      <p>
        Steward protects financial information that customers entrust to us
        with the same diligence we ask them to bring to their own
        stewardship. This page summarizes the administrative, technical, and
        physical controls we operate, and how to report a security concern.
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

      <h2>Data protection</h2>
      <ul>
        <li>
          <strong>Encryption in transit</strong> — all network traffic uses TLS
          1.2 or higher with modern cipher suites; HSTS enforced on all
          customer-facing domains.
        </li>
        <li>
          <strong>Encryption at rest</strong> — AES-256 for databases, object
          storage, and backups. Encryption keys are managed by a FIPS 140-2
          validated key management service with rotation.
        </li>
        <li>
          <strong>Secrets management</strong> — application secrets are stored
          in a managed secrets vault, never in source code, and accessed via
          short-lived credentials.
        </li>
      </ul>

      <h2>Identity and access management</h2>
      <ul>
        <li>
          <strong>Customer accounts</strong> — passwords are hashed with a
          modern password-hashing function and salted per user. Multi-factor
          authentication is supported and recommended.
        </li>
        <li>
          <strong>Staff access</strong> — role-based, least-privilege access.
          MFA enforced. Production access requires hardware security keys and
          is logged for audit.
        </li>
        <li>
          <strong>Row-level security</strong> — every customer record is
          isolated at the database layer with row-level security policies that
          ensure one tenant's data is never returned to another.
        </li>
      </ul>

      <h2>Infrastructure and operations</h2>
      <ul>
        <li>
          Hosted on SOC 2 Type II and ISO 27001 certified cloud providers in
          U.S. data centers with 24/7 physical security, redundant power, and
          environmental controls.
        </li>
        <li>
          Production, staging, and development environments are network- and
          credential-isolated.
        </li>
        <li>
          Automated patching of operating systems and dependencies. Critical
          vulnerabilities are remediated on an expedited timeline.
        </li>
        <li>
          Continuous backups with point-in-time recovery and tested
          restoration procedures.
        </li>
      </ul>

      <h2>Software development lifecycle</h2>
      <ul>
        <li>
          All code changes are peer-reviewed and pass automated tests, static
          analysis, and dependency vulnerability scanning before deployment.
        </li>
        <li>
          Annual third-party penetration tests of the application and
          infrastructure. Summary letters available under NDA.
        </li>
        <li>
          Security training for all engineering staff at hire and annually
          thereafter.
        </li>
      </ul>

      <h2>Payments and bank data</h2>
      <ul>
        <li>
          Card numbers are processed exclusively by our PCI-DSS Level 1
          payment processor and never touch Steward's servers.
        </li>
        <li>
          Bank connections use a regulated financial data aggregator. Steward
          receives read-only transaction data. We never see your online
          banking credentials and we never move money without your explicit
          per-transaction approval.
        </li>
      </ul>

      <h2>Vendor management</h2>
      <p>
        We assess subprocessors before engagement and at least annually
        thereafter for security posture, compliance certifications, and data
        handling practices. A current list of subprocessors is available on
        request.
      </p>

      <h2>Incident response</h2>
      <p>
        Steward maintains a documented incident response plan with defined
        roles, severity levels, and communication procedures. In the event of
        a confirmed security incident affecting your data, we will notify
        you without undue delay and in accordance with applicable law.
      </p>

      <h2>Responsible disclosure</h2>
      <p>
        We welcome reports from security researchers acting in good faith. To
        report a vulnerability, email{" "}
        <a href="mailto:security@steward.app">security@steward.app</a> with
        steps to reproduce. Please do not publicly disclose the issue until we
        have had a reasonable opportunity to investigate and remediate.
      </p>
      <p>
        <strong>Safe harbor.</strong> We will not pursue legal action against
        researchers who:
      </p>
      <ul>
        <li>Make a good-faith effort to avoid privacy violations and disruption to others;</li>
        <li>Only access the minimum data necessary to demonstrate the issue;</li>
        <li>Do not exploit, modify, or destroy customer data;</li>
        <li>Give us a reasonable time to remediate before any public disclosure.</li>
      </ul>

      <h2>Security questionnaires and audits</h2>
      <p>
        Enterprise customers may request our latest SOC 2 report, penetration
        test summary, and completed security questionnaires (CAIQ, SIG) under
        NDA at <a href="mailto:security@steward.app">security@steward.app</a>.
      </p>
    </LegalLayout>
  );
};

export default Security;
