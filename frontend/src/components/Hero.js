"use client";
import { supabase } from "../utils/supabase";
import { isNativeApp } from "../utils/notifications";

export default function Hero({ onShowPublicRequest, onShowCloseRequest }) {
  const handleDonorClick = async () => {
    try {
      const redirectUrl = isNativeApp()
        ? 'com.projectredlink.app://auth'
        : window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false
        }
      });
      if (error) throw error;
    } catch (err) {
      alert(`Login failed: ${err.message}`);
    }
  };

  return (
    <section className="hero-container">
      <div className="hero-badge">
        <span className="pulse-indicator"></span>
        <span>Hyper-Local Emergency Network</span>
      </div>

      <h1 className="hero-title">
        The <span className="text-red">Red Link</span> Project
      </h1>

      <p className="hero-desc">
        A direct, real-time emergency network connecting patients in critical medical need with nearby eligible blood donors. Powered by hyper-local routing to drastically reduce vein-to-vein response time.
      </p>
      
      <div className="hero-actions">
        <button onClick={handleDonorClick} className="btn btn-red">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          Join as Donor / Login
        </button>

        <button onClick={onShowPublicRequest} className="btn btn-outline">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Broadcast Emergency
        </button>

        <button onClick={onShowCloseRequest} className="btn btn-ghost">
          Have a Donor Token?
        </button>
      </div>

      {/* How to Use Section */}
      <div style={{ width: '100%', marginTop: '3.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <span style={{ 
            background: 'var(--red)', 
            color: 'white', 
            fontWeight: 800, 
            padding: '0.25rem 0.65rem', 
            fontSize: '0.75rem',
            letterSpacing: '1px',
            borderRadius: '6px',
            textTransform: 'uppercase'
          }}>
            GUIDE
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
            How Project Red-Link Works
          </h2>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-step-num">01</div>
            <h3>Join or Request</h3>
            <p>
              Log in with Google to register as an emergency donor, or broadcast an urgent blood requirement instantly without logging in.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-step-num">02</div>
            <h3>Hyper-Local Routing</h3>
            <p>
              Our proximity engine matches nearby eligible donors based on pincode and blood group compatibility within a 10km radius.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-step-num">03</div>
            <h3>Instant Push Alerts</h3>
            <p>
              Donors receive immediate heads-up alerts on Android & iOS devices to volunteer and reach the hospital quickly.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
