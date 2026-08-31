"use client";
import Link from "next/link";

export default function PrivacyPolicy() {
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
          PRIVACY <span className="text-red">POLICY</span>
        </h1>
        <p className="text-gray text-sm font-bold">Effective Date: September 1, 2026 | Last Updated: September 1, 2026</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', lineHeight: '1.7' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>1. Overview & Commitment</h2>
        <p className="text-gray mb-6">
          <strong>Project Red-Link</strong> (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates a hyper-local emergency blood donation coordination platform. We are committed to safeguarding your privacy and ensuring the security of your personal and health-related information in accordance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>, the <strong>Information Technology Act, 2000 (SPDI Rules)</strong>, and global privacy standards.
        </p>

        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>2. Information We Collect</h2>
        <p className="text-gray mb-3">To operate our emergency coordination service, we collect the following categories of data:</p>
        <ul className="text-gray mb-6" style={{ paddingLeft: '1.5rem' }}>
          <li className="mb-2"><strong>Identity & Contact Data:</strong> Full name, phone number, and Google OAuth authenticated email address.</li>
          <li className="mb-2"><strong>Medical & Eligibility Data:</strong> Blood group (e.g., A+, O-), weight eligibility threshold, self-reported medication disqualification status, and date of last donation.</li>
          <li className="mb-2"><strong>Location Data:</strong> 6-digit postal code (pincode) and approximate device GPS coordinates used strictly for 10km proximity donor matching.</li>
          <li className="mb-2"><strong>Device & Push Notification Data:</strong> Firebase Cloud Messaging (FCM) / Apple Push Notification service (APNs) device tokens to deliver real-time emergency broadcast alerts.</li>
        </ul>

        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>3. How We Use Your Data</h2>
        <p className="text-gray mb-3">Your information is used <strong>strictly</strong> for the following purposes:</p>
        <ul className="text-gray mb-6" style={{ paddingLeft: '1.5rem' }}>
          <li className="mb-2">Matching patients in critical need with nearby compatible blood donors based on blood group and pincode.</li>
          <li className="mb-2">Sending immediate push notifications to eligible donors when an emergency is broadcasted in their area.</li>
          <li className="mb-2">Tracking donor lifesaver points and enforcing medical cooldown periods (e.g., 90 days between whole blood donations) to protect donor health.</li>
        </ul>

        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>4. Absolute Privacy & Non-Commercialization</h2>
        <ul className="text-gray mb-6" style={{ paddingLeft: '1.5rem' }}>
          <li className="mb-2"><strong>No Selling of Data:</strong> We do not sell, rent, monetize, or share your personal or health data with third-party advertisers, pharmaceutical companies, or data brokers.</li>
          <li className="mb-2"><strong>Phone Number Masking:</strong> Donor phone numbers are kept private and are only revealed when a donor explicitly volunteers to assist with a specific emergency request.</li>
        </ul>

        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>5. Data Storage & Security</h2>
        <p className="text-gray mb-6">
          All data is securely encrypted in transit (TLS 1.3/HTTPS) and at rest utilizing secure, enterprise-grade database infrastructure (Supabase / PostgreSQL with Row Level Security and Firebase Auth).
        </p>

        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>6. Your Rights & Account Deletion</h2>
        <p className="text-gray mb-3">Under data protection laws and mobile app store requirements, you have full control over your data:</p>
        <ul className="text-gray mb-6" style={{ paddingLeft: '1.5rem' }}>
          <li className="mb-2"><strong>Right to Access & Rectify:</strong> You can edit your profile details, blood group, and location anytime from the &quot;Profile&quot; tab.</li>
          <li className="mb-2"><strong>Right to Erasure (Delete Account):</strong> You can permanently delete your profile, phone number, and all associated donation records instantly via the in-app &quot;Delete My Account&quot; feature in your Profile settings.</li>
        </ul>

        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>7. Contact & Grievance Officer</h2>
        <p className="text-gray mb-2">For any privacy questions, data requests, or grievances, please contact our Data Protection Officer:</p>
        <div style={{ background: 'var(--bg)', border: '2px solid var(--border)', padding: '1rem', marginTop: '0.5rem' }}>
          <p className="font-bold">Project Red-Link Data Protection Team</p>
          <p className="text-gray text-sm">Email: <a href="mailto:support@projectredlink.app" className="text-red" style={{ fontWeight: 700 }}>support@projectredlink.app</a></p>
        </div>
      </div>
    </div>
  );
}
