"use client";
import { useEffect, useState } from "react";
import Navigation from "../components/Navigation";
import Hero from "../components/Hero";
import WizardRegistration from "../components/WizardRegistration";
import CommandCenter from "../components/CommandCenter";
import { PublicRequestForm, CloseRequestForm } from "../components/Modals";
import { supabase } from "../utils/supabase";

export default function Home() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [viewState, setViewState] = useState('hero'); // hero, public-req, close-req, register, dashboard

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSession = async (session) => {
    setSession(session);
    if (session) {
      const { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      if (error || !data) {
        setViewState('register');
      } else {
        setUserProfile(data);
        setViewState('dashboard');
      }
    } else {
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
      </main>
    </>
  );
}
