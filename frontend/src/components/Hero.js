"use client";
import { supabase } from "../utils/supabase";

export default function Hero({ onShowPublicRequest, onShowCloseRequest }) {
  const handleDonorClick = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err) {
      alert(`Login failed: ${err.message}`);
    }
  };

  return (
    <section className="hero-container">
      <h1 className="hero-title">
        The <br /><span className="text-red">Red Link</span><br /> Project
      </h1>
      <div className="badge mb-6 mt-6">detect &bull; direct &bull; protect</div>

      <div className="hero-desc">
        <p className="mb-4">
          Our vision is to create a secure, hyper-local directory that bridges the gap between those in critical medical
          need and the everyday heroes willing to help.
        </p>
        <p>
          By leveraging strict privacy protocols and direct pincode routing, we neutralize middlemen and drastically
          reduce vein-to-vein time.
        </p>
      </div>
      
      <div className="mt-8 flex-align" style={{ gap: '1rem', justifyContent: 'flex-start', marginTop: '2rem', flexWrap: 'wrap' }}>
        <button onClick={handleDonorClick} className="btn btn-red">Login / Join Network</button>
        <button onClick={() => window.dispatchEvent(new Event('trigger-install-pwa'))} className="btn btn-outline">
          Download App
        </button>
        <button onClick={onShowPublicRequest} className="btn btn-outline">
          Broadcast Emergency (No Login)
        </button>
        <button onClick={onShowCloseRequest} className="btn btn-ghost" style={{ color: 'var(--gray)' }}>
          Have a Blood Donor Token?
        </button>
      </div>

      {/* How to Use Section */}
      <div style={{ width: '100%', marginTop: '4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <span style={{ 
            background: 'var(--red)', 
            color: 'white', 
            fontWeight: 900, 
            padding: '0.3rem 0.8rem', 
            fontSize: '0.85rem',
            letterSpacing: '1.5px',
            textTransform: 'uppercase'
          }}>
            QUICK GUIDE
          </span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>
            How To Use Project Red-Link
          </h2>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 900, 
              color: 'var(--red)', 
              marginBottom: '0.5rem' 
            }}>
              01
            </div>
            <h3>1. Join or Request</h3>
            <p>
              Log in with Google to register as a donor with your pincode and blood group, or broadcast an urgent blood emergency instantly without logging in.
            </p>
          </div>

          <div className="feature-card">
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 900, 
              color: 'var(--red)', 
              marginBottom: '0.5rem' 
            }}>
              02
            </div>
            <h3>2. Hyper-Local Matching</h3>
            <p>
              Our PostGIS proximity algorithm pinpoints nearby eligible donors based on pincode and blood group compatibility within a 10km radius.
            </p>
          </div>

          <div className="feature-card">
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 900, 
              color: 'var(--red)', 
              marginBottom: '0.5rem' 
            }}>
              03
            </div>
            <h3>3. Alerts & Verification</h3>
            <p>
              Donors receive instant push notifications. Once donated, upload the hospital receipt for AI verification to receive an official Lifesaver Certificate.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
