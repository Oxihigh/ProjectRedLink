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
    </section>
  );
}
