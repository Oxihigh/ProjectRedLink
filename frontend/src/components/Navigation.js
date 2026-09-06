"use client";
import { supabase } from "../utils/supabase";

import { isNativeApp } from "../utils/notifications";

export default function Navigation({ session, userProfile, onShowPublicRequest }) {
  const handleLogin = async () => {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <nav className="premium-nav">
      <div className="nav-container">
        <div className="logo" onClick={() => window.location.reload()} style={{ cursor: "pointer", letterSpacing: '-1px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round" className="text-red">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span className="text-red" style={{ fontWeight: 900 }}>RED</span><span className="text-dark">LINK</span>
        </div>
        <div className="flex-align gap-2">
          <button 
            type="button"
            onClick={onShowPublicRequest} 
            className="btn btn-red text-sm flex-align gap-1"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', boxShadow: '2px 2px 0px var(--border)' }}
            title="Broadcast an emergency blood request"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M2 12h20" />
            </svg>
            <span>Request Blood</span>
          </button>
          {session ? (
            <div className="flex-align">
              <div className="avatar-circle">{session.user.email?.charAt(0).toUpperCase()}</div>
              <span className="text-sm text-gray mr-4 nav-email">{session.user.email}</span>
              <button onClick={handleLogout} className="btn btn-ghost text-sm nav-logout">Log Out</button>
            </div>
          ) : (
            <button onClick={handleLogin} className="btn btn-outline text-sm" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', boxShadow: '2px 2px 0px var(--border)' }}>
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
