import { LegalLayout } from "@/components/LegalLayout";

const Terms = () => {
  return (
    <LegalLayout
      title="Terms of Service"
      updated="April 29, 2026"
      current="/terms"
    >
      <p className="lead">
        These Terms of Service ("Terms") form a binding agreement between you
        and <strong>Steward, Inc.</strong> ("Steward," "we," "us," "our")
        governing your access to and use of our website, applications, AI
        Companion, and related services (collectively, the "Services"). These
        Terms include an arbitration agreement and class-action waiver in
        Section 14 that affects how disputes are resolved. Please read them
        carefully. By creating an account or using the Services, you agree
        to these Terms.
      </p>

      <h2>1. Eligibility and accounts</h2>
      <p>
        You must be at least 18 years old, legally able to enter into a
        binding contract, and not barred from using the Services under
        applicable law or sanctions. If you use the Services on behalf of an
        organization, you represent that you have authority to bind that
        organization, and "you" refers to both you and the organization.
      </p>
      <p>
        You are responsible for the accuracy of the information you provide,
        the security of your credentials, and all activity under your
        account. Notify us immediately at{" "}
        <a href="mailto:security@steward.app">security@steward.app</a> of any
        unauthorized access. We strongly recommend enabling multi-factor
        authentication.
      </p>

      <h2>2. The Services</h2>
      <p>
        Steward helps business owners track profit, set a giving covenant,
        manage recipients, route generosity through connected platforms,
        and produce year-end giving reports. Steward is a software tool.{" "}
        <strong>We are not a bank, money transmitter, broker, investment
        adviser, tax adviser, attorney, certified public accountant, or
        licensed financial planner.</strong> Nothing in the Services
        constitutes financial, tax, legal, accounting, or investment advice,
        and the faith-oriented content (devotionals, scripture references,
        Companion AI responses) is not pastoral counseling or theological
        instruction. Consult qualified professionals for advice specific to
        your situation.
      </p>

      <h2>3. Bank connections, payments, and money movement</h2>
      <p>
        Bank account linking is provided through a regulated third-party
        data aggregator. Steward receives read-only access to transactions
        to compute profit and never receives your online-banking
        credentials. Where you authorize a transfer to a recipient, money
        movement is performed by our licensed payments partner under their
        terms and applicable banking law. Steward does not hold customer
        funds, is not a money transmitter, and does not guarantee delivery
        timing of any transfer.
      </p>
      <p>
        You are solely responsible for verifying recipient information
        (including EINs, account numbers, and tax-deductibility status).
        Once a transfer is authorized and submitted, it may be irreversible.
      </p>

      <h2>4. Subscriptions, billing, and trials</h2>
      <ul>
        <li>
          Paid plans are billed in advance on a monthly or annual basis and
          renew automatically at the then-current price until cancelled.
        </li>
        <li>
          Free trials, if offered, convert to paid subscriptions at the end
          of the trial unless cancelled before the trial ends.
        </li>
        <li>
          You may cancel at any time from <strong>Settings → Billing</strong>.
          Cancellation takes effect at the end of the current billing period;
          you retain access until then.
        </li>
        <li>
          Fees are non-refundable except where required by law or expressly
          stated. Annual plans are not pro-rated on cancellation.
        </li>
        <li>
          We may change pricing with at least <strong>thirty (30) days'</strong>{" "}
          notice prior to the change taking effect for your account. If you
          do not agree, you may cancel before the change takes effect.
        </li>
        <li>
          You are responsible for any taxes, duties, or withholdings
          (excluding taxes on Steward's net income).
        </li>
        <li>
          Past-due balances accrue interest at the lesser of 1.5% per month
          or the maximum allowed by law and may result in suspension.
        </li>
      </ul>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Services to violate any law, regulation, or third-party right.</li>
        <li>
          Provide false, misleading, or fraudulent information, including
          recipient identities, EINs, or business records.
        </li>
        <li>
          Use the Services to launder funds, evade taxes, sanctions-evade,
          or finance unlawful or terrorist activity.
        </li>
        <li>
          Use the Services in violation of US OFAC sanctions or while
          located in a comprehensively sanctioned jurisdiction.
        </li>
        <li>
          Reverse-engineer, decompile, scrape, benchmark for a competing
          product, or interfere with the Services or attempt to access them
          by means we have not authorized.
        </li>
        <li>
          Upload malicious code, conduct unauthorized security testing, or
          attempt to disrupt other users' access.
        </li>
        <li>
          Use the Services to harass, defame, or infringe the rights of
          others, including any recipient organization.
        </li>
        <li>
          Resell, sublicense, or provide the Services as a service bureau
          without our written consent.
        </li>
      </ul>
      <p>
        We may suspend access immediately to address security, legal, or
        integrity risks, with notice as soon as reasonably practicable.
      </p>

      <h2>6. AI features and Steward Companion</h2>
      <p>
        The Steward Companion uses third-party AI models accessed through
        our AI gateway. Outputs ("AI Output") are generated probabilistically
        and may be incomplete, inaccurate, or out of date. <strong>You must
        not rely on AI Output as professional financial, tax, legal, or
        pastoral advice.</strong> Verify any material information before
        acting on it.
      </p>
      <ul>
        <li>
          We do not use your inputs or outputs to train external models, and
          our providers are contractually prohibited from doing so.
        </li>
        <li>
          You retain ownership of inputs you submit. As between you and
          Steward, you own AI Output to the extent permitted by law; AI
          Output may not be eligible for copyright protection.
        </li>
        <li>
          Do not submit information you do not wish transmitted to our AI
          providers solely for the purpose of generating a response. Do not
          submit health, biometric, or other sensitive personal data.
        </li>
        <li>
          AI use is rate-limited and subject to fair-use thresholds posted
          in your plan.
        </li>
      </ul>

      <h2>7. Your content and our license</h2>
      <p>
        You retain ownership of the data you submit ("Customer Data"). You
        grant Steward a worldwide, non-exclusive, royalty-free license to
        host, process, transmit, display, and create derivative works of
        Customer Data solely to operate, secure, and improve the Services
        for you and to comply with law. This license ends when Customer
        Data is deleted from our active systems, except for backups and
        legal-hold copies as described in our{" "}
        <a href="/privacy">Privacy Policy</a>.{" "}
        <strong>We will not use Customer Data to train external AI models.</strong>
      </p>

      <h2>8. Feedback</h2>
      <p>
        If you provide feedback or suggestions, you grant us a perpetual,
        irrevocable, royalty-free license to use them without restriction or
        compensation.
      </p>

      <h2>9. Intellectual property</h2>
      <p>
        The Services, including all software, designs, text, graphics,
        Scripture selections curated by us, devotionals, and trademarks
        ("Steward IP"), are owned by Steward or its licensors and protected
        by intellectual property laws. We grant you a limited,
        non-transferable, non-sublicensable, revocable license to use the
        Services in accordance with these Terms. All rights not expressly
        granted are reserved.
      </p>

      <h2>10. Third-party services and connectors</h2>
      <p>
        The Services integrate with third parties such as Plaid, Stripe,
        Wise, QuickBooks, Xero, Wave, Tithe.ly, Pushpay, Planning Center,
        Subsplash, Overflow, DonorBox, Givelify, EasyTithe, Generis, Pure
        Charity, Every.org, GiveDirectly, and Compassion. Your use of those
        services is governed by their terms and privacy policies. Steward
        is not responsible for third-party services and disclaims liability
        for their acts and omissions.
      </p>

      <h2>11. Termination</h2>
      <p>
        You may terminate your account at any time from{" "}
        <strong>Settings → Account</strong>. We may suspend or terminate your
        access if you breach these Terms, if required by law, if your use
        poses a risk to Steward or other users, or if your account is
        inactive for more than <strong>24 months</strong> after notice. Upon
        termination, your right to use the Services ends, and we will delete
        or anonymize your data subject to the retention schedule in our
        Privacy Policy and any legal-hold obligations. You may export your
        data for <strong>30 days</strong> after termination.
      </p>

      <h2>12. Disclaimers</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICES ARE PROVIDED
        "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS
        OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS
        FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ANY WARRANTIES
        ARISING FROM COURSE OF DEALING OR USAGE OF TRADE. STEWARD DOES NOT
        WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR
        SECURE; THAT DEFECTS WILL BE CORRECTED; OR THAT TRANSACTION OR
        BANK-FEED DATA WILL BE COMPLETE, ACCURATE, OR TIMELY. SOME
        JURISDICTIONS DO NOT ALLOW EXCLUSION OF IMPLIED WARRANTIES, IN WHICH
        CASE THE FOREGOING MAY NOT APPLY TO YOU.
      </p>

      <h2>13. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, STEWARD AND ITS AFFILIATES,
        OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT,
        INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES,
        OR ANY LOSS OF PROFITS, REVENUE, GOODWILL, DATA, OR OPPORTUNITY,
        ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR THE SERVICES,
        EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
      </p>
      <p>
        STEWARD'S AGGREGATE LIABILITY FOR ANY CLAIM ARISING OUT OF OR
        RELATING TO THESE TERMS OR THE SERVICES SHALL NOT EXCEED THE GREATER
        OF (A) THE FEES YOU PAID TO STEWARD IN THE TWELVE (12) MONTHS BEFORE
        THE EVENT GIVING RISE TO THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS
        ($100). NOTHING IN THESE TERMS LIMITS LIABILITY THAT CANNOT BE
        LIMITED BY LAW (INCLUDING FRAUD OR WILLFUL MISCONDUCT).
      </p>

      <h2>14. Dispute resolution, arbitration, and class waiver</h2>
      <p>
        <strong>Informal resolution.</strong> Before filing a claim, you
        agree to try to resolve the dispute informally by emailing{" "}
        <a href="mailto:legal@steward.app">legal@steward.app</a>. If we
        cannot resolve it within 60 days, either party may proceed.
      </p>
      <p>
        <strong>Binding arbitration.</strong> Any dispute, claim, or
        controversy arising out of or relating to these Terms or the
        Services shall be resolved by binding individual arbitration
        administered by the American Arbitration Association ("AAA") under
        its Consumer or Commercial Arbitration Rules, as applicable, in
        Wilmington, Delaware (or by video at your election). Judgment on the
        award may be entered in any court of competent jurisdiction.
      </p>
      <p>
        <strong>Class-action waiver.</strong> YOU AND STEWARD AGREE THAT
        DISPUTES WILL BE BROUGHT ON AN INDIVIDUAL BASIS ONLY AND WAIVE THE
        RIGHT TO A JURY TRIAL AND TO PARTICIPATE IN A CLASS, COLLECTIVE, OR
        REPRESENTATIVE ACTION. If this waiver is found unenforceable, the
        unenforceable portion shall be severed and the remainder of this
        Section shall apply.
      </p>
      <p>
        <strong>Opt-out.</strong> You may opt out of arbitration within{" "}
        <strong>30 days</strong> of first accepting these Terms by emailing{" "}
        <a href="mailto:legal@steward.app">legal@steward.app</a> with the
        subject "Arbitration Opt-Out" and your account email.
      </p>
      <p>
        <strong>Exceptions.</strong> Either party may bring an individual
        action in small-claims court or seek injunctive relief in court for
        infringement of intellectual property rights.
      </p>

      <h2>15. Governing law</h2>
      <p>
        These Terms are governed by the laws of the State of Delaware,
        without regard to its conflict-of-laws principles, and, where
        arbitration does not apply, the state and federal courts located in
        New Castle County, Delaware shall have exclusive jurisdiction.
      </p>

      <h2>16. Export controls and sanctions</h2>
      <p>
        You represent that you are not located in, and will not use the
        Services from, any jurisdiction subject to comprehensive US trade
        sanctions, and that you are not on any US government restricted-party
        list. You will not export or re-export the Services in violation of
        US or other applicable export laws.
      </p>

      <h2>17. Changes to the Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will
        be notified by email or in-product notice at least{" "}
        <strong>thirty (30) days</strong> before they take effect. Your
        continued use of the Services after the effective date constitutes
        acceptance. If you do not agree, you must stop using the Services.
      </p>

      <h2>18. Notices and miscellaneous</h2>
      <p>
        We may give notices by email to the address on your account or by
        in-product message; you may give us notice at{" "}
        <a href="mailto:legal@steward.app">legal@steward.app</a>. These
        Terms are the entire agreement between us regarding the Services
        and supersede prior agreements. If any provision is found
        unenforceable, the remaining provisions remain in effect. Failure
        to enforce a provision is not a waiver. You may not assign these
        Terms without our consent; we may assign in connection with a
        merger, acquisition, or sale of assets. There are no third-party
        beneficiaries.
      </p>

      <h2>19. Contact</h2>
      <p>
        Steward, Inc. — Legal Department<br />
        1209 N Orange St, Wilmington, DE 19801, USA<br />
        Email: <a href="mailto:legal@steward.app">legal@steward.app</a>
      </p>
    </LegalLayout>
  );
};

export default Terms;
