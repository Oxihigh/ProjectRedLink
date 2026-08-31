"use client";
import { useState, useEffect, useRef } from "react";
import { apiCall } from "../utils/api";

export default function WizardRegistration({ onComplete }) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [disqualifiedReason, setDisqualifiedReason] = useState(null);
  
  const [wizData, setWizData] = useState({
    name: '', role: '', blood_group: 'A+', weight: '', 
    last_donation_date: '', pincode: '', phone_number: ''
  });

  const STEPS_DONOR = ['step-role', 'step-name', 'step-bg', 'step-weight', 'step-medication', 'step-last-donation', 'step-pincode', 'step-phone'];
  const STEPS_REQUESTER = ['step-role', 'step-name', 'step-pincode', 'step-phone'];
  const activeSteps = wizData.role === 'requester' ? STEPS_REQUESTER : STEPS_DONOR;

  const [alertMsg, setAlertMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentStepIdx]);

  const disqualify = (reason) => {
    setDisqualifiedReason(reason);
  };

  const handleNext = () => {
    setAlertMsg("");
    const step = activeSteps[currentStepIdx];
    
    if (step === 'step-role' && !wizData.role) {
      setAlertMsg("Please select an option.");
      return;
    }
    if (step === 'step-name') {
      const nameVal = wizData.name.trim();
      if (!nameVal) {
        setAlertMsg("Please enter your name.");
        return;
      } else if (nameVal.length < 2) {
        setAlertMsg("Name should have at least 2 characters.");
        return;
      }
    }
    if (step === 'step-weight') {
      const w = parseInt(wizData.weight);
      if (!w || w <= 45) {
        return disqualify("You must weigh more than 45kg to safely donate whole blood.");
      }
    }
    if (step === 'step-pincode') {
      const p = parseInt(wizData.pincode);
      if (!p || p < 100000 || p > 999999) {
        setAlertMsg("Enter a valid 6-digit pincode.");
        return;
      }
    }

    if (currentStepIdx < activeSteps.length - 1) {
      setCurrentStepIdx(c => c + 1);
    }
  };

  const handlePrev = () => {
    setAlertMsg("");
    if (currentStepIdx > 0) {
      setCurrentStepIdx(c => c - 1);
    }
  };

  const handleSubmit = async () => {
    setAlertMsg("");
    const cleanedPhone = wizData.phone_number.replace(/\D/g, '');
    if (cleanedPhone.length !== 10) {
      setAlertMsg("Please enter a valid 10-digit phone number.");
      return;
    }
    const formattedPhone = `+91${cleanedPhone}`;
    try {
      await apiCall('/register', 'POST', {
        name: wizData.name,
        role: wizData.role,
        blood_group: wizData.blood_group,
        pincode: parseInt(wizData.pincode),
        phone_number: formattedPhone,
        last_donation_date: wizData.last_donation_date || null
      });
      setIsSuccess(true);
    } catch (err) {
      setAlertMsg(err.message || "Registration failed. Please try again.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const step = activeSteps[currentStepIdx];
      if (!['step-medication', 'step-role'].includes(step)) {
        e.preventDefault();
        if (step === 'step-phone') handleSubmit();
        else handleNext();
      }
    }
  };

  if (disqualifiedReason) {
    return (
      <div className="wizard-container">
        <div className="glass-panel text-center p-6">
          <h2 className="wizard-question text-red">Eligibility Notice</h2>
          <p className="text-gray mb-6">{disqualifiedReason}</p>
          <p className="text-white font-bold mb-6">Thank you for your honesty and willingness to help save lives.</p>
          <div className="wizard-buttons" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn btn-outline" onClick={() => window.location.reload()}>Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="wizard-container">
        <div className="glass-panel text-center p-6">
          <div style={{
            width: '64px',
            height: '64px',
            background: 'rgba(34, 197, 94, 0.15)',
            color: '#22c55e',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 className="wizard-question" style={{ color: '#ffffff' }}>Profile Created!</h2>
          <p className="text-gray mb-6">You are now registered on Project Red-Link.</p>
          
          <div className="wizard-buttons" style={{ justifyContent: 'center' }}>
            <button className="btn btn-red" onClick={onComplete}>Enter Command Center</button>
          </div>
        </div>
      </div>
    );
  }

  const step = activeSteps[currentStepIdx];
  const progressPercent = Math.round(((currentStepIdx + 1) / activeSteps.length) * 100);

  return (
    <div className="wizard-container" onKeyDown={handleKeyDown}>
      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '4px',
        background: 'var(--surface-elevated)',
        borderRadius: '4px',
        marginBottom: '2rem',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progressPercent}%`,
          height: '100%',
          background: 'var(--red)',
          transition: 'width 0.3s ease'
        }}></div>
      </div>

      {step === 'step-role' && (
        <div className="wizard-step active">
          <h2 className="wizard-question">Welcome to RedLink! What would you like to do?</h2>
          <div className="wizard-buttons" style={{ flexDirection: 'column' }}>
            <button className="btn btn-red" 
              style={{ padding: '1.25rem', fontSize: '1.05rem', justifyContent: 'flex-start' }} 
              onClick={() => { 
                setWizData(prev => ({...prev, role: 'donor'})); 
                setCurrentStepIdx(1); 
              }}>
              ❤️ I want to Donate Blood (Hero)
            </button>
            <button className="btn btn-outline" 
              style={{ padding: '1.25rem', fontSize: '1.05rem', justifyContent: 'flex-start' }} 
              onClick={() => { 
                setWizData(prev => ({...prev, role: 'requester'})); 
                setCurrentStepIdx(1); 
              }}>
              🏥 I need to Request Blood
            </button>
          </div>
          {alertMsg && <p className="wizard-alert">{alertMsg}</p>}
        </div>
      )}

      {step === 'step-name' && (
        <div className="wizard-step active">
          <h2 className="wizard-question">What's your full name?</h2>
          <input ref={inputRef} type="text" className="wizard-input" placeholder="e.g. Rahul Sharma" 
            value={wizData.name} onChange={e => setWizData({...wizData, name: e.target.value})} />
          <div className="wizard-buttons">
            <button className="btn btn-outline" onClick={handlePrev}>Back</button>
            <button className="btn btn-red" onClick={handleNext}>Next</button>
          </div>
          {alertMsg && <p className="wizard-alert">{alertMsg}</p>}
        </div>
      )}

      {step === 'step-bg' && (
        <div className="wizard-step active">
          <h2 className="wizard-question">What's your blood group?</h2>
          <select className="wizard-select" value={wizData.blood_group} onChange={e => setWizData({...wizData, blood_group: e.target.value})}>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </select>
          <div className="wizard-buttons">
            <button className="btn btn-outline" onClick={handlePrev}>Back</button>
            <button className="btn btn-red" onClick={handleNext}>Next</button>
          </div>
        </div>
      )}

      {step === 'step-weight' && (
        <div className="wizard-step active">
          <h2 className="wizard-question">What is your weight (in kg)?</h2>
          <input ref={inputRef} type="number" className="wizard-input" placeholder="e.g. 65" min="20" max="300"
            value={wizData.weight} onChange={e => setWizData({...wizData, weight: e.target.value})} />
          <div className="wizard-buttons">
            <button className="btn btn-outline" onClick={handlePrev}>Back</button>
            <button className="btn btn-red" onClick={handleNext}>Next</button>
          </div>
          {alertMsg && <p className="wizard-alert">{alertMsg}</p>}
        </div>
      )}

      {step === 'step-medication' && (
        <div className="wizard-step active">
          <h2 className="wizard-question">Are you taking any disqualifying medication, like an asthma inhaler?</h2>
          <div className="wizard-buttons" style={{ flexDirection: 'column' }}>
            <button className="btn btn-outline" style={{ padding: '1rem', fontSize: '1rem' }} onClick={handleNext}>No, I am not</button>
            <button className="btn btn-red" style={{ padding: '1rem', fontSize: '1rem' }} 
              onClick={() => disqualify("You cannot donate blood if you are using certain medications like an asthma inhaler.")}>Yes, I am</button>
          </div>
        </div>
      )}

      {step === 'step-last-donation' && (
        <div className="wizard-step active">
          <h2 className="wizard-question">When was your last donation? (Optional)</h2>
          <input ref={inputRef} type="date" className="wizard-input" 
            value={wizData.last_donation_date} onChange={e => setWizData({...wizData, last_donation_date: e.target.value})} />
          <div className="wizard-buttons">
            <button className="btn btn-outline" onClick={handlePrev}>Back</button>
            <button className="btn btn-red" onClick={handleNext}>Next</button>
          </div>
        </div>
      )}

      {step === 'step-pincode' && (
        <div className="wizard-step active">
          <h2 className="wizard-question">What is your 6-digit residential pincode?</h2>
          <input ref={inputRef} type="number" className="wizard-input" placeholder="e.g. 110001" min="100000" max="999999"
            value={wizData.pincode} onChange={e => setWizData({...wizData, pincode: e.target.value})} />
          <div className="wizard-buttons">
            <button className="btn btn-outline" onClick={handlePrev}>Back</button>
            <button className="btn btn-red" onClick={handleNext}>Next</button>
          </div>
          {alertMsg && <p className="wizard-alert">{alertMsg}</p>}
        </div>
      )}

      {step === 'step-phone' && (
        <div className="wizard-step active">
          <h2 className="wizard-question">What's your 10-digit mobile number?</h2>
          <input ref={inputRef} type="tel" className="wizard-input" placeholder="e.g. 9876543210"
            value={wizData.phone_number} onChange={e => setWizData({...wizData, phone_number: e.target.value})} />
          <div className="wizard-buttons">
            <button className="btn btn-outline" onClick={handlePrev}>Back</button>
            <button className="btn btn-red" onClick={handleSubmit}>Complete Registration</button>
          </div>
          {alertMsg && <p className="wizard-alert">{alertMsg}</p>}
        </div>
      )}
    </div>
  );
}
