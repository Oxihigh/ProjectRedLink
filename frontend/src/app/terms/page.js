"use client";
import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="main-layout" style={{ maxWidth: '840px', margin: '0 auto', padding: 'calc(5rem + env(safe-area-inset-top)) 1.5rem 4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back to App
        </Link>
        <h1 className="hero-title" style={{ fontSize: 'clamp(2.2rem, 6vw, 3.5rem)', marginBottom: '0.5rem' }}>
          TERMS OF <span className="text-red">SERVICE</span>
        </h1>
        <p className="text-gray text-sm font-bold">Effective Date: September 1, 2026 | Last Updated: September 1, 2026</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', lineHeight: '1.7' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>1. Acceptance of Terms</h2>
        <p className="text-gray mb-6">
          By accessing or using <strong>Project Red-Link</strong> (the &quot;Platform&quot;, &quot;App&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.
        </p>

        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', color: 'var(--red)' }}>2. STRICT PROHIBITION ON COMMERCIALIZATION & SALE OF BLOOD</h2>
        <div style={{ background: 'var(--bg)', border: '2px solid var(--red)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <p className="font-bold mb-2 text-dark">
            Under the Drugs and Cosmetics Act, 1940 and the National Blood Policy of India, the sale and purchase of human blood is a severe, non-bailable criminal offense.
          </p>
          <ul className="text-gray" style={{ paddingLeft: '1.25rem' }}>
            <li className="mb-2">All blood donations facilitated through Project Red-Link must be <strong>100% voluntary, altruistic, and non-remunerated</strong>.</li>
            <li className="mb-2">Users are strictly prohibited from soliciting, demanding, offering, or accepting any monetary compensation, travel fees, or gifts in exchange for blood donations.</li>
            <li className="mb-2">Any user found attempting commercial blood transactions will be permanently banned and reported to relevant statutory law enforcement authorities.</li>
          </ul>
        </div>

        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>3. Medical Disclaimer & Platform Scope</h2>
        <p className="text-gray mb-3">
          <strong>Project Red-Link is a technology platform for volunteer coordination, not a medical healthcare provider, laboratory, or licensed blood bank.</strong>
        </p>
        <ul className="text-gray mb-6" style={{ paddingLeft: '1.5rem' }}>
          <li className="mb-2">The Platform does not conduct blood testing, disease screening, or medical cross-matching. All biological testing (e.g., HIV, Hepatitis B/C, Malaria, Syphilis, Hemoglobin) must be performed by the registered hospital or certified blood bank before any transfusion takes place.</li>
          <li className="mb-2">Project Red-Link makes no warranties regarding the immediate availability, physical arrival, or medical eligibility of voluntary donors. Requesters are strongly urged to continue pursuing standard hospital blood bank reserves concurrently.</li>
        </ul>

        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>4. Donor Health & Eligibility Protections</h2>
        <p className="text-gray mb-6">
          Donors must provide truthful and accurate information regarding their body weight, current medications, and past donation history. Donors must abide by mandatory medical cooldown periods (minimum 90 days for whole blood donations) to protect their physiological well-being.
        </p>

        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>5. User Conduct & Abuse Reporting</h2>
        <p className="text-gray mb-6">
          Users agree not to broadcast fraudulent emergency requests, post abusive content, or harass volunteers. Requesters and donors can utilize the in-app &quot;Report&quot; feature to report suspicious activity or misconduct.
        </p>

        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>6. Termination & Account Deletion</h2>
        <p className="text-gray mb-6">
          We reserve the right to suspend or terminate access for any user violating these terms. You may terminate your account at any time via the in-app &quot;Delete My Account&quot; function.
        </p>

        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>7. Governing Law & Jurisdiction</h2>
        <p className="text-gray">
          These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in India.
        </p>
      </div>
    </div>
  );
}
