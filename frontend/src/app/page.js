"use client";
import { useEffect, useState, useRef } from "react";
import Navigation from "../components/Navigation";
import Hero from "../components/Hero";
import WizardRegistration from "../components/WizardRegistration";
import CommandCenter from "../components/CommandCenter";
import { PublicRequestForm, CloseRequestForm } from "../components/Modals";
import { supabase } from "../utils/supabase";

import { App } from "@capacitor/app";
import { isNativeApp } from "../utils/notifications";

export default function Home() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [viewState, setViewState] = useState('hero'); // hero, public-req, close-req, register, dashboard
  const handledUserRef = useRef(null);

  useEffect(() => {
    // 1. Non-blocking background warmup ping for Python backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://project-red-link-back.vercel.app';
    fetch(apiUrl, { method: 'GET' }).catch(() => {});

    // 2. Fetch session once
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    let appUrlListener;
    if (isNativeApp()) {
      appUrlListener = App.addListener('appUrlOpen', async ({ url }) => {
        console.log('App opened with deep link URL:', url);
        if (url && (url.includes('access_token=') || url.includes('code='))) {
          if (url.includes('#')) {
            const hash = url.split('#')[1];
            const params = new URLSearchParams(hash);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            if (access_token && refresh_token) {
              const { data: { session } } = await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
              if (session) handleSession(session, true);
            }
          } else if (url.includes('code=')) {
            const fakeUrl = url.replace('com.projectredlink.app://', 'https://localhost/');
            const parsedUrl = new URL(fakeUrl);
            const code = parsedUrl.searchParams.get('code');
            if (code) {
              const { data: { session } } = await supabase.auth.exchangeCodeForSession(code);
              if (session) handleSession(session, true);
            }
          }
        }
      });
    }

    return () => {
      subscription.unsubscribe();
      if (appUrlListener) {
        appUrlListener.then(l => l.remove()).catch(() => {});
      }
    };
  }, []);

  const handleSession = async (session, force = false) => {
    setSession(session);
    if (session) {
      // Prevent duplicate fetches for the same user unless forced
      if (!force && handledUserRef.current === session.user.id && userProfile) {
        return;
      }
      handledUserRef.current = session.user.id;

      const { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle();
      if (error || !data) {
        setViewState('register');
      } else {
        setUserProfile(data);
        setViewState('dashboard');
      }
    } else {
      handledUserRef.current = null;
      setUserProfile(null);
      setViewState('hero');
    }
  };

  const resetView = () => {
    if (session) {
      if (userProfile) setViewState('dashboard');
      else setViewState('register');
    } else {
      setViewState('hero');
    }
  };

  return (
    <>
      <Navigation 
        session={session} 
        userProfile={userProfile} 
        onShowPublicRequest={() => setViewState('public-req')} 
      />
      <main className="main-layout">
        {viewState === 'hero' && (
          <Hero 
            onShowPublicRequest={() => setViewState('public-req')} 
            onShowCloseRequest={() => setViewState('close-req')} 
          />
        )}
        
        {viewState === 'public-req' && (
          <PublicRequestForm onClose={resetView} />
        )}

        {viewState === 'close-req' && (
          <CloseRequestForm onClose={resetView} />
        )}

        {viewState === 'register' && (
          <WizardRegistration onComplete={() => handleSession(session)} />
        )}

        {viewState === 'dashboard' && userProfile && (
          <CommandCenter userProfile={userProfile} />
        )}

        {/* Legal & Compliance Footer */}
        <footer style={{ marginTop: '5rem', paddingTop: '2rem', borderTop: '2px solid var(--border)', textAlign: 'center' }}>
          <div className="flex-align gap-4" style={{ justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <a href="/privacy" className="text-sm font-bold text-dark" style={{ textDecoration: 'none' }}>
              Privacy Policy
            </a>
            <span className="text-gray">&bull;</span>
            <a href="/terms" className="text-sm font-bold text-dark" style={{ textDecoration: 'none' }}>
              Terms of Service
            </a>
          </div>
          <p className="text-gray text-xs" style={{ maxWidth: '600px', margin: '0 auto', lineHeight: '1.5' }}>
            Project Red-Link is a non-commercial voluntary blood donation coordination platform. Commercial buying or selling of blood is strictly prohibited by law.
          </p>
        </footer>
      </main>
    </>
  );
}
