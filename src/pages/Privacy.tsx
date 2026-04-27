import { LegalLayout } from "@/components/LegalLayout";

const Privacy = () => {
  return (
    <LegalLayout
      title="Privacy Policy"
      updated="January 1, 2026"
      current="/privacy"
    >
      <p>
        This Privacy Policy explains how <strong>Steward, Inc.</strong> ("Steward,"
        "we," "us") collects, uses, discloses, and protects personal information
        when you use our website, mobile applications, and related services
        (collectively, the "Services"). By using the Services, you agree to the
        practices described here.
      </p>

      <h2>1. Information we collect</h2>

      <h3>1.1 Information you provide</h3>
      <ul>
        <li>
          <strong>Account information</strong> — name, email address, password,
          business name, and business type.
        </li>
        <li>
          <strong>Giving covenant settings</strong> — recipients you choose
          (church, missions, nonprofits), allocation percentages, and
          recipient EIN/contact details you enter.
        </li>
        <li>
          <strong>Payment information</strong> — billing address and the last
          four digits of your card. Full card numbers are collected directly by
          our PCI-DSS Level 1 payment processor and are never stored on
          Steward's servers.
        </li>
        <li>
          <strong>Communications</strong> — messages you send to support, the
          AI Companion chat, or in response to surveys.
        </li>
      </ul>

      <h3>1.2 Information from connected accounts</h3>
      <ul>
        <li>
          <strong>Bank and financial data</strong> — when you link a business
          bank account through our financial data provider (e.g., Plaid), we
          receive read-only transaction history, balances, and account metadata
          required to compute monthly profit. We do not receive online-banking
          credentials.
        </li>
      </ul>

      <h3>1.3 Information collected automatically</h3>
      <ul>
        <li>
          <strong>Device and usage data</strong> — IP address, browser type,
          operating system, referring URLs, pages viewed, and timestamps.
        </li>
        <li>
          <strong>Cookies and similar technologies</strong> — strictly necessary
          cookies for authentication and session management, and (with consent)
          analytics cookies. See our cookie controls in your account settings.
        </li>
      </ul>

      <h2>2. How we use information</h2>
      <p>We use personal information to:</p>
      <ul>
        <li>Provide, maintain, and improve the Services.</li>
        <li>
          Compute monthly profit and giving amounts based on your covenant.
        </li>
        <li>
          Process payments, prevent fraud, and meet financial recordkeeping
          obligations.
        </li>
        <li>
          Generate year-end giving reports for your tax records.
        </li>
        <li>
          Communicate with you about your account, security alerts, product
          updates, and (with consent) marketing.
        </li>
        <li>Comply with legal obligations and enforce our Terms of Service.</li>
      </ul>

      <h2>3. Legal bases (EEA/UK users)</h2>
      <p>
        Where the GDPR applies, we rely on the following lawful bases:{" "}
        <strong>contract</strong> (to deliver the Services you request),{" "}
        <strong>legitimate interests</strong> (to secure and improve the
        Services), <strong>legal obligation</strong> (e.g., tax and AML
        recordkeeping), and <strong>consent</strong> (for non-essential
        cookies and marketing).
      </p>

      <h2>4. How we share information</h2>
      <p>
        We do not sell or rent personal information. We share it only with:
      </p>
      <ul>
        <li>
          <strong>Service providers</strong> bound by written contracts —
          cloud infrastructure, financial data aggregation, payment processing,
          email delivery, error monitoring, and customer support.
        </li>
        <li>
          <strong>AI providers</strong> — when you use the Steward Companion
          chat, your messages are sent through our AI gateway to upstream
          model providers solely to generate a response. Inputs are not used
          to train external models.
        </li>
        <li>
          <strong>Legal and safety</strong> — when required by law, subpoena,
          or to protect rights, property, or safety.
        </li>
        <li>
          <strong>Business transfers</strong> — in a merger, acquisition, or
          asset sale, with notice to affected users.
        </li>
      </ul>

      <h2>5. International data transfers</h2>
      <p>
        Steward is operated from the United States. Where we transfer personal
        data from the EEA, UK, or Switzerland, we use Standard Contractual
        Clauses or other lawful mechanisms.
      </p>

      <h2>6. Data retention</h2>
      <p>
        We retain account and giving records for the life of your account and
        up to seven (7) years thereafter to satisfy financial recordkeeping
        obligations. You can request earlier deletion subject to applicable
        legal holds.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Depending on where you live, you may have the right to:
      </p>
      <ul>
        <li>Access, correct, or delete personal information.</li>
        <li>Receive a portable copy of your data.</li>
        <li>
          Restrict or object to certain processing, including automated
          decision-making.
        </li>
        <li>
          Opt out of "sale" or "sharing" of personal information (CCPA/CPRA).
          Steward does not sell or share personal information as those terms
          are defined.
        </li>
        <li>Withdraw consent for marketing or non-essential cookies.</li>
        <li>
          Lodge a complaint with your local data protection authority.
        </li>
      </ul>
      <p>
        To exercise these rights, email{" "}
        <a href="mailto:privacy@steward.app">privacy@steward.app</a>. We will
        verify your identity before fulfilling the request and respond within
        the timeframes required by law.
      </p>

      <h2>8. Children's privacy</h2>
      <p>
        The Services are not directed to children under 16. We do not knowingly
        collect personal information from children. If you believe a child has
        provided us information, contact us and we will delete it.
      </p>

      <h2>9. Security</h2>
      <p>
        We implement administrative, technical, and physical safeguards
        described in our <a href="/security">Security page</a>. No system is
        perfectly secure; we encourage strong, unique passwords and
        multi-factor authentication.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We will notify you of material changes by email and by posting an
        updated effective date at the top of this page.
      </p>

      <h2>11. Contact us</h2>
      <p>
        Steward, Inc. — Privacy Office<br />
        Email: <a href="mailto:privacy@steward.app">privacy@steward.app</a>
        <br />
        EU/UK Representative: available on request.
      </p>
    </LegalLayout>
  );
};

export default Privacy;
