"use client";
import { supabase } from "../utils/supabase";

export default function Navigation({ session, userProfile, onShowPublicRequest }) {
  const handleLogin = async () => {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <nav className="premium-nav">
      <div className="nav-container">
        <div className="logo" onClick={() => window.location.reload()} style={{ cursor: "pointer" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round" className="text-red">
            <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7 6.36 7 6.36s-2.29 2.7-3.43 3.63S2 11.09 2 12.25c0 2.22 1.8 4.05 4 4.05z"></path>
            <path d="M16 21c3.31 0 6-2.69 6-6 0-1.73-.86-3.39-2.57-4.79C17.72 8.81 16 7 16 7s-1.72 1.81-3.43 3.21C10.86 11.61 10 13.27 10 15c0 3.31 2.69 6 6 6z"></path>
          </svg>
          Red<span className="text-dark">Link</span>
        </div>
        <div className="flex-align">
          <button onClick={onShowPublicRequest} className="btn btn-outline mr-4">
            Request Blood
          </button>
          {!session ? (
            <button onClick={handleLogin} className="btn btn-red">Join the Network</button>
          ) : (
            <div className="flex-align">
              <div className="avatar-circle">{session.user.email?.charAt(0).toUpperCase()}</div>
              <span className="text-sm text-gray mr-4">{session.user.email}</span>
              <button onClick={handleLogout} className="btn btn-ghost text-sm">Log Out</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
