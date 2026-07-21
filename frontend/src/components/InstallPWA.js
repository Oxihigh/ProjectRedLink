"use client";
import { useEffect, useState } from "react";
import { registerServiceWorker } from "../utils/firebase";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register Service Worker automatically on load for PWA installability & push readiness
    registerServiceWorker();

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIosDevice) {
      setIsIos(true);
      setIsInstallable(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    });
    const triggerInstall = () => setIsDismissed(false);
    window.addEventListener('trigger-install-pwa', triggerInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('trigger-install-pwa', triggerInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  if (!isInstallable || isInstalled || isDismissed) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 99999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: 'white', padding: '2rem', textAlign: 'center', backdropFilter: 'blur(5px)'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--red)', fontWeight: 900 }}>Project RedLink</h1>
      
      {isIos ? (
        <div style={{ backgroundColor: '#1f2937', padding: '2rem', borderRadius: '12px', border: '1px solid #374151', maxWidth: '400px' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>To receive live emergency alerts, please install the app:</p>
          <ol style={{ textAlign: 'left', fontSize: '1.1rem', lineHeight: '1.8', margin: '0 auto', display: 'inline-block' }}>
            <li>Tap the <strong>Share</strong> button at the bottom of Safari.</li>
            <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
            <li>Tap <strong>"Add"</strong> in the top right.</li>
          </ol>
        </div>
      ) : (
        <>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', maxWidth: '400px' }}>For the best experience and to receive life-saving push notifications, please install the app.</p>
          <button 
            onClick={handleInstallClick}
            style={{ padding: '1rem 2rem', fontSize: '1.5rem', backgroundColor: 'var(--red)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)' }}
          >
            Install Application
          </button>
        </>
      )}

      <button 
        onClick={() => setIsDismissed(true)}
        style={{ marginTop: '2rem', background: 'transparent', border: 'none', color: '#9ca3af', textDecoration: 'underline', cursor: 'pointer' }}
      >
        Continue in browser for now
      </button>
    </div>
  );
}
