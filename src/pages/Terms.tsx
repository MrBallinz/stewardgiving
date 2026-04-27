import { LegalLayout } from "@/components/LegalLayout";

const Terms = () => {
  return (
    <LegalLayout
      title="Terms of Service"
      updated="January 1, 2026"
      current="/terms"
    >
      <p>
        These Terms of Service ("Terms") form a binding agreement between you
        and <strong>Steward, Inc.</strong> ("Steward," "we," "us") governing
        your access to and use of our website, applications, and related
        services (collectively, the "Services"). Please read them carefully. By
        creating an account or using the Services, you agree to these Terms.
      </p>

      <h2>1. Eligibility and accounts</h2>
      <p>
        You must be at least 18 years old and able to enter into a binding
        contract. You are responsible for the accuracy of the information you
        provide, the security of your credentials, and all activity under your
        account. Notify us immediately of any unauthorized access at{" "}
        <a href="mailto:security@steward.app">security@steward.app</a>.
      </p>

      <h2>2. The Services</h2>
      <p>
        Steward helps business owners track profit, set a giving covenant,
        manage recipients, and produce year-end giving reports. Steward is a
        software tool. <strong>We are not a bank, broker, investment adviser,
        tax adviser, attorney, or licensed financial planner.</strong> Nothing
        in the Services constitutes financial, tax, legal, or investment
        advice.
      </p>

      <h2>3. Bank connections and money movement</h2>
      <p>
        Bank account linking is provided through a regulated third-party data
        aggregator. Steward receives read-only access to transactions to
        compute profit. Where you authorize a transfer to a recipient, money
        movement is performed by our licensed payments partner under their
        terms. Steward does not hold customer funds.
      </p>

      <h2>4. Subscriptions and billing</h2>
      <ul>
        <li>
          Paid plans are billed in advance on a monthly or annual basis and
          renew automatically until cancelled.
        </li>
        <li>
          You may cancel at any time from <strong>Settings → Billing</strong>.
          Cancellation takes effect at the end of the current billing period.
        </li>
        <li>
          Fees are non-refundable except where required by law or expressly
          stated.
        </li>
        <li>
          We may change pricing with at least thirty (30) days' notice prior to
          the change taking effect for your account.
        </li>
      </ul>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Services to violate any law or third-party right.</li>
        <li>
          Provide false, misleading, or fraudulent information, including
          recipient identities or EINs.
        </li>
        <li>
          Use the Services to launder funds, evade taxes, or finance unlawful
          activity.
        </li>
        <li>
          Reverse-engineer, scrape, or interfere with the Services or attempt
          to access them by means we have not authorized.
        </li>
        <li>
          Upload malicious code or attempt to disrupt other users' access.
        </li>
      </ul>

      <h2>6. AI features</h2>
      <p>
        The Steward Companion chat uses third-party AI models. AI output may be
        incomplete or inaccurate and should not be relied on as professional
        advice. Do not submit information you do not wish to be transmitted to
        our AI providers solely for the purpose of generating a response.
      </p>

      <h2>7. Your content</h2>
      <p>
        You retain ownership of the data you submit ("Customer Data"). You
        grant Steward a worldwide, non-exclusive, royalty-free license to host,
        process, and display Customer Data solely to operate and improve the
        Services for you. We will not use Customer Data to train external AI
        models.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        The Services, including all software, designs, text, graphics, and
        trademarks, are owned by Steward or its licensors and protected by
        intellectual property laws. We grant you a limited, non-transferable,
        revocable license to use the Services in accordance with these Terms.
      </p>

      <h2>9. Termination</h2>
      <p>
        You may terminate your account at any time. We may suspend or terminate
        your access if you breach these Terms, if required by law, or if your
        use poses a risk to Steward or other users. Upon termination, your
        right to use the Services ends and we will delete or anonymize your
        data subject to legal retention obligations.
      </p>

      <h2>10. Disclaimers</h2>
      <p>
        THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES
        OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF
        MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        STEWARD DOES NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED,
        ERROR-FREE, OR THAT TRANSACTION DATA WILL BE COMPLETE OR ACCURATE.
      </p>

      <h2>11. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, STEWARD SHALL NOT BE LIABLE FOR
        ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
        OR LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL. STEWARD'S AGGREGATE
        LIABILITY FOR ANY CLAIM ARISING OUT OF THE SERVICES SHALL NOT EXCEED
        THE GREATER OF (A) THE FEES YOU PAID TO STEWARD IN THE TWELVE (12)
        MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM OR (B) ONE HUNDRED
        U.S. DOLLARS.
      </p>

      <h2>12. Indemnification</h2>
      <p>
        You agree to indemnify and hold Steward harmless from any claim arising
        out of your breach of these Terms, your Customer Data, or your
        violation of any law or third-party right.
      </p>

      <h2>13. Governing law and disputes</h2>
      <p>
        These Terms are governed by the laws of the State of Delaware, without
        regard to its conflict-of-laws principles. Any dispute shall be
        resolved by binding arbitration administered by the American
        Arbitration Association under its Commercial Arbitration Rules, on an
        individual basis. <strong>You and Steward waive the right to a jury
        trial and to participate in a class action.</strong> You may opt out of
        arbitration within 30 days of accepting these Terms by emailing{" "}
        <a href="mailto:legal@steward.app">legal@steward.app</a>.
      </p>

      <h2>14. Changes to the Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be
        notified by email or in-product notice at least thirty (30) days
        before they take effect. Continued use of the Services after the
        effective date constitutes acceptance.
      </p>

      <h2>15. Contact</h2>
      <p>
        Steward, Inc. — Legal Department<br />
        Email: <a href="mailto:legal@steward.app">legal@steward.app</a>
      </p>
    </LegalLayout>
  );
};

export default Terms;
