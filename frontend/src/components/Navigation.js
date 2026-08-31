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
        <div className="logo" onClick={() => window.location.reload()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" className="text-red">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <div>
            <span className="logo-red">RED</span><span className="logo-white">LINK</span>
          </div>
        </div>
        <div className="flex-align gap-2">
          <button onClick={onShowPublicRequest} className="btn btn-outline">
            Request Blood
          </button>
          {!session ? (
            <button onClick={handleLogin} className="btn btn-red">Join Network</button>
          ) : (
            <div className="flex-align">
              <div className="avatar-circle">{session.user.email?.charAt(0).toUpperCase()}</div>
              <span className="text-sm text-gray mr-2 nav-email">{session.user.email}</span>
              <button onClick={handleLogout} className="btn btn-ghost text-sm nav-logout">Log Out</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
