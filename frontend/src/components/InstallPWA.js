"use client";
import { useEffect, useState } from "react";
import { registerServiceWorker } from "../utils/firebase";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [appUrl, setAppUrl] = useState("https://theredlinkproject.vercel.app");

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentOrigin = window.location.origin || "https://theredlinkproject.vercel.app";
    setAppUrl(currentOrigin);

    // Register Service Worker automatically on load
    registerServiceWorker();

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isMobileDevice = /mobi|android|iphone|ipad|ipod/.test(userAgent);

    if (isIosDevice) {
      setIsIos(true);
    }
    
    if (!isMobileDevice) {
      setIsDesktop(true);
    }

    // Auto-open install prompt if user arrived via scanned install QR code
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('install') === 'true' && isMobileDevice) {
      setIsOpen(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Auto trigger prompt if arrived via QR code scan
      if (searchParams.get('install') === 'true' && isMobileDevice) {
        setIsOpen(true);
        setTimeout(() => {
          e.prompt();
        }, 500);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsOpen(false);
    });

    const triggerInstall = () => setIsOpen(true);
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
      setIsOpen(false);
    }
  };

  if (isInstalled || !isOpen) return null;

  const installUrl = `${appUrl}?install=true`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(installUrl)}&color=000000&bgcolor=ffffff`;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 99999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: 'white', padding: '1.5rem', textAlign: 'center', backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        backgroundColor: '#111827',
        border: '3px solid var(--red, #dc2626)',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        position: 'relative'
      }}>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            position: 'absolute', top: '12px', right: '16px',
            background: 'transparent', border: 'none', color: '#9ca3af',
            fontSize: '1.5rem', cursor: 'pointer', fontWeight: 'bold'
          }}
          aria-label="Close"
        >
          ✕
        </button>

        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', color: 'var(--red, #dc2626)', fontWeight: 900, textTransform: 'uppercase' }}>
          Project RedLink
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
          Emergency Blood Network App
        </p>

        {isDesktop ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              backgroundColor: 'white',
              padding: '12px',
              borderRadius: '12px',
              marginBottom: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <img 
                src={qrImageUrl} 
                alt="Scan QR Code to Download App" 
                style={{ width: '200px', height: '200px', display: 'block' }}
              />
            </div>
            
            <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f3f4f6', marginBottom: '0.25rem' }}>
              📱 Scan with Phone Camera
            </p>
            <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1.5rem', maxWidth: '340px' }}>
              Scanning this QR code immediately triggers the 1-tap app installation prompt on your mobile phone.
            </p>

            {deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                style={{ 
                  width: '100%', padding: '0.8rem', fontSize: '1rem',
                  backgroundColor: 'var(--red, #dc2626)', color: 'white', border: 'none',
                  borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' 
                }}
              >
                Or Install Desktop App on Laptop
              </button>
            )}
          </div>
        ) : isIos ? (
          <div style={{ backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '12px', border: '1px solid #374151' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 'bold' }}>
              To install app & receive alerts on iOS:
            </p>
            <ol style={{ textAlign: 'left', fontSize: '1rem', lineHeight: '1.8', margin: '0 auto', display: 'inline-block' }}>
              <li>Tap the <strong>Share</strong> button in Safari.</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
              <li>Tap <strong>"Add"</strong> in the top right corner.</li>
            </ol>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#e5e7eb' }}>
              Install Project Red-Link on your phone to receive instant emergency push notifications.
            </p>
            {deferredPrompt ? (
              <button 
                onClick={handleInstallClick}
                style={{ 
                  padding: '1rem 2rem', fontSize: '1.2rem', 
                  backgroundColor: 'var(--red, #dc2626)', color: 'white', 
                  border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' 
                }}
              >
                Install Application Now
              </button>
            ) : (
              <p style={{ fontSize: '0.95rem', color: '#9ca3af' }}>
                Open your mobile browser menu (⋮) and tap <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>.
              </p>
            )}
          </div>
        )}

        <button 
          onClick={() => setIsOpen(false)}
          style={{ marginTop: '1.5rem', background: 'transparent', border: 'none', color: '#9ca3af', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          Close & Continue in Browser
        </button>
      </div>
    </div>
  );
}
