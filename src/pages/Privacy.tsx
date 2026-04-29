import { LegalLayout } from "@/components/LegalLayout";

const Privacy = () => {
  return (
    <LegalLayout
      title="Privacy Policy"
      updated="April 29, 2026"
      current="/privacy"
    >
      <p className="lead">
        This Privacy Policy explains how <strong>Steward, Inc.</strong>{" "}
        ("Steward," "we," "us," "our") collects, uses, discloses, retains, and
        protects personal information when you use our website, mobile and
        desktop applications, AI Companion, and related services
        (collectively, the "Services"). It applies to customers, prospects,
        recipients of giving (where their information is provided to us), and
        visitors to our marketing sites. By using the Services, you confirm
        that you have read this Policy.
      </p>

      <p>
        Steward is a financial stewardship tool for Christian business
        owners. We process personal and financial information so you can
        track profit, set a giving covenant, and route generosity to the
        churches, missions, and nonprofits you choose. We treat that
        information as a sacred trust and as regulated financial data under
        the laws below.
      </p>

      <h2>1. Information we collect</h2>

      <h3>1.1 Information you provide</h3>
      <ul>
        <li>
          <strong>Account information</strong> — name, email address, hashed
          password, phone number (optional), business name, business type,
          and country/state of operation.
        </li>
        <li>
          <strong>Giving covenant settings</strong> — the percentage of
          profit you commit to give, recipients you choose (church, missions,
          nonprofits), allocation percentages, recipient names, EINs or
          equivalent registration numbers, and contact details you enter.
        </li>
        <li>
          <strong>Payment information</strong> — billing address and the last
          four digits and brand of your card. <strong>Full card numbers are
          collected directly by our PCI-DSS Level 1 payment processor and
          never touch Steward's servers.</strong>
        </li>
        <li>
          <strong>Communications</strong> — messages you send to support, the
          Steward Companion AI chat, in-product feedback, surveys, and call
          recordings (with your consent and notice where required).
        </li>
        <li>
          <strong>Identity verification</strong> — where required to comply
          with Know-Your-Customer (KYC) or Anti-Money-Laundering (AML)
          obligations of our payment partners, limited identity information
          (e.g., date of birth, last four of SSN/EIN, government ID image)
          collected directly by the partner.
        </li>
      </ul>

      <h3>1.2 Information from connected accounts</h3>
      <ul>
        <li>
          <strong>Bank and financial data</strong> — when you link a business
          bank account through our regulated financial data provider (e.g.,
          Plaid), we receive read-only transaction history, balances, and
          account metadata required to compute monthly profit.{" "}
          <strong>We never receive your online-banking credentials.</strong>
        </li>
        <li>
          <strong>Accounting data</strong> — if you connect QuickBooks, Xero,
          or Wave, we receive read-only chart-of-accounts and transaction
          data scoped to the permissions you grant and revocable at any
          time.
        </li>
        <li>
          <strong>Giving platform data</strong> — if you connect Tithe.ly,
          Pushpay, Planning Center, Subsplash, Overflow, DonorBox, Givelify,
          EasyTithe, Generis, Pure Charity, Every.org, or similar, we
          receive recipient and confirmation data needed to record gifts.
        </li>
        <li>
          <strong>Single sign-on</strong> — if you sign in with Google or
          Apple, we receive your name, email, and avatar.
        </li>
      </ul>

      <h3>1.3 Information collected automatically</h3>
      <ul>
        <li>
          <strong>Device and usage data</strong> — IP address, approximate
          location derived from IP, browser type, operating system, device
          identifiers, referring URLs, pages and features used, timestamps,
          and crash logs.
        </li>
        <li>
          <strong>Cookies and similar technologies</strong> — strictly
          necessary cookies for authentication and session management;
          functional cookies for preferences; and (with consent where
          required) analytics cookies. You can manage non-essential cookies
          from the cookie banner or in <strong>Settings → Privacy</strong>.
        </li>
      </ul>

      <h3>1.4 Sensitive information we deliberately do not collect</h3>
      <p>
        We do not request and do not want: religious affiliation tied to
        identity, racial or ethnic origin, political opinions, union
        membership, genetic or biometric data, health data, sexual
        orientation, or precise geolocation. Our use of faith-oriented
        language (covenant, firstfruits, stewardship) describes our product
        ethos and does not represent collection of religious data about you.
      </p>

      <h2>2. How we use information</h2>
      <p>We use personal information to:</p>
      <ul>
        <li>Provide, operate, secure, and improve the Services.</li>
        <li>
          Compute monthly profit, giving amounts, and generate the year-end
          giving report you can share with your tax advisor.
        </li>
        <li>
          Process payments, prevent fraud, satisfy KYC/AML and financial
          recordkeeping obligations of our payment partners.
        </li>
        <li>
          Authenticate you, detect and prevent unauthorized access, and
          maintain audit trails of sensitive actions.
        </li>
        <li>
          Communicate with you about your account, security alerts, product
          updates, and (with consent where required) marketing.
        </li>
        <li>
          Provide AI-assisted answers via the Steward Companion using the
          minimum context required to respond.
        </li>
        <li>
          Comply with legal obligations and enforce our Terms of Service.
        </li>
      </ul>

      <p>
        <strong>We do not engage in solely automated decision-making that
        produces legal or similarly significant effects on you.</strong> The
        Companion AI provides suggestions; it does not move money or make
        binding decisions about your account.
      </p>

      <h2>3. Legal bases for processing (EEA / UK / Switzerland)</h2>
      <p>Where the GDPR or UK GDPR applies, we rely on:</p>
      <ul>
        <li>
          <strong>Performance of a contract</strong> — to deliver the
          Services you have asked us to provide.
        </li>
        <li>
          <strong>Legitimate interests</strong> — to secure and improve the
          Services, prevent fraud, and operate our business, balanced
          against your rights.
        </li>
        <li>
          <strong>Legal obligation</strong> — for tax, accounting, AML, and
          recordkeeping requirements.
        </li>
        <li>
          <strong>Consent</strong> — for non-essential cookies, marketing
          email/SMS, and any optional data you choose to provide.
        </li>
      </ul>

      <h2>4. How we share information</h2>
      <p>
        <strong>We do not sell, rent, or "share" personal information for
        cross-context behavioral advertising</strong> as those terms are
        defined under CCPA/CPRA. We disclose information only to:
      </p>
      <ul>
        <li>
          <strong>Service providers (subprocessors)</strong> bound by written
          contracts including Standard Contractual Clauses where required —
          cloud infrastructure, financial data aggregation, payment
          processing, email and SMS delivery, error monitoring, customer
          support tools, and authentication.
        </li>
        <li>
          <strong>AI providers</strong> — when you use the Steward Companion,
          your messages and the minimum required context are sent through
          our AI gateway to upstream model providers (e.g., Google,
          OpenAI) solely to generate a response. <strong>Inputs and outputs
          are not used by us or our providers to train external models</strong>{" "}
          and are not retained beyond the providers' transient operational
          windows.
        </li>
        <li>
          <strong>Connected platforms you authorize</strong> — banks,
          accounting tools, and giving platforms, only as you direct.
        </li>
        <li>
          <strong>Professional advisers</strong> — auditors, lawyers, and
          insurers under duties of confidentiality.
        </li>
        <li>
          <strong>Legal and safety</strong> — when required by law,
          subpoena, court order, or to protect rights, property, or safety.
          We will challenge overbroad requests where appropriate and notify
          you unless legally prohibited.
        </li>
        <li>
          <strong>Business transfers</strong> — in a merger, acquisition,
          financing, or asset sale, with notice to affected users and
          continued application of this Policy or an equally protective one.
        </li>
      </ul>
      <p>
        A current list of subprocessors is maintained at{" "}
        <a href="mailto:trust@steward.app">trust@steward.app</a> and may be
        provided on request.
      </p>

      <h2>5. International data transfers</h2>
      <p>
        Steward is operated from the United States. Where we transfer
        personal data from the EEA, UK, Switzerland, or other jurisdictions
        with cross-border restrictions, we rely on Standard Contractual
        Clauses, the UK International Data Transfer Addendum, the Swiss
        FDPIC-approved SCCs, or other lawful transfer mechanisms, together
        with supplementary technical and organizational measures.
      </p>

      <h2>6. Data retention schedule</h2>
      <p>
        We keep personal information only as long as needed for the purposes
        for which it was collected, to satisfy legal obligations, and to
        resolve disputes. Specific schedules:
      </p>
      <ul>
        <li>
          <strong>Account profile</strong> — for the life of your account,
          then deleted or anonymized within <strong>90 days</strong> of
          account closure unless a legal hold applies.
        </li>
        <li>
          <strong>Financial transaction records and giving history</strong> —
          retained for <strong>seven (7) years</strong> after the relevant
          tax year, consistent with IRS recordkeeping guidance and GLBA
          obligations.
        </li>
        <li>
          <strong>Payment records (last4, billing address)</strong> —{" "}
          <strong>seven (7) years</strong> for tax and dispute resolution.
        </li>
        <li>
          <strong>Bank connection metadata</strong> — deleted within{" "}
          <strong>30 days</strong> of disconnection; underlying transaction
          records used in giving calculations follow the 7-year schedule.
        </li>
        <li>
          <strong>Support communications</strong> — <strong>3 years</strong>{" "}
          from last interaction.
        </li>
        <li>
          <strong>Steward Companion AI chats</strong> — <strong>30 days</strong>{" "}
          for quality and abuse review, then deleted; you can clear a chat
          at any time.
        </li>
        <li>
          <strong>Security and audit logs</strong> — <strong>13 months</strong>{" "}
          for SOC 2 and incident investigation purposes.
        </li>
        <li>
          <strong>Marketing data</strong> — until you unsubscribe, plus a
          suppression list retained indefinitely so we honor your choice.
        </li>
        <li>
          <strong>Backups</strong> — overwritten on a rolling{" "}
          <strong>35-day</strong> cycle; deletion requests are honored in
          live systems immediately and propagate to backups within that
          window.
        </li>
      </ul>
      <p>
        Where retention is governed by stricter law in your jurisdiction,
        the stricter rule applies.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Subject to your jurisdiction, you may have the right to:
      </p>
      <ul>
        <li>Access, correct, or delete personal information.</li>
        <li>Receive a portable copy of your data in a common, machine-readable format.</li>
        <li>Restrict or object to certain processing, including profiling.</li>
        <li>
          Opt out of "sale," "sharing," or targeted advertising. Steward
          does not engage in any of these.
        </li>
        <li>
          Withdraw consent for marketing or non-essential cookies at any
          time, without affecting prior lawful processing.
        </li>
        <li>Designate an authorized agent (CCPA/CPRA) or appeal a denial (US state laws).</li>
        <li>Lodge a complaint with your local data protection authority.</li>
      </ul>
      <p>
        To exercise these rights, email{" "}
        <a href="mailto:privacy@steward.app">privacy@steward.app</a> or use
        the in-product control at <strong>Settings → Privacy → Data
        rights</strong>. We will verify your identity (typically via the
        email on file) before fulfilling the request and respond within{" "}
        <strong>45 days</strong> (CCPA/CPRA) or <strong>30 days</strong>{" "}
        (GDPR), with one extension where permitted. We do not discriminate
        against you for exercising your rights.
      </p>

      <h2>8. Children's privacy</h2>
      <p>
        The Services are not directed to children under 16 and we do not
        knowingly collect personal information from them. If you believe a
        child has provided us information, contact{" "}
        <a href="mailto:privacy@steward.app">privacy@steward.app</a> and we
        will delete it.
      </p>

      <h2>9. Security</h2>
      <p>
        We implement administrative, technical, and physical safeguards
        appropriate to the sensitivity of the data, described in our{" "}
        <a href="/security">Security page</a>. No system is perfectly
        secure; we encourage strong, unique passwords and multi-factor
        authentication.
      </p>

      <h2>10. Cookies and tracking</h2>
      <p>
        We use a tiered cookie consent banner where required by law. Strictly
        necessary cookies cannot be disabled because the Services will not
        function without them. We honor the <strong>Global Privacy Control
        (GPC)</strong> signal as a valid opt-out of sale/sharing and of
        targeted advertising for residents of jurisdictions that recognize
        it.
      </p>

      <h2>11. Notice to specific jurisdictions</h2>
      <p>
        <strong>California (CCPA/CPRA).</strong> In the past 12 months we
        have collected the categories of information described in Section 1
        for the business purposes described in Section 2 and disclosed them
        to the recipients in Section 4. We have not sold or shared personal
        information and do not knowingly collect or sell information of
        consumers under 16.
      </p>
      <p>
        <strong>EEA / UK / Switzerland.</strong> The data controller is
        Steward, Inc. We do not require an EU Article 27 representative for
        SaaS B2B activity below relevant thresholds; an EU/UK representative
        will be appointed and disclosed here if and when required.
      </p>
      <p>
        <strong>Canada (PIPEDA / Quebec Law 25).</strong> Our Privacy
        Officer can be reached at{" "}
        <a href="mailto:privacy@steward.app">privacy@steward.app</a>.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        We will notify you of material changes by email and by posting an
        updated effective date at the top of this page at least{" "}
        <strong>30 days</strong> before they take effect, unless a shorter
        period is required by law.
      </p>

      <h2>13. Contact us</h2>
      <p>
        Steward, Inc. — Privacy Office<br />
        1209 N Orange St, Wilmington, DE 19801, USA<br />
        Email: <a href="mailto:privacy@steward.app">privacy@steward.app</a>
      </p>
    </LegalLayout>
  );
};

export default Privacy;
