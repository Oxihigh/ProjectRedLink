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
      setAlertMsg("Please enter a valid 10-digit Indian phone number (no country code).");
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
      alert(err.message);
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
        <div className="wizard-step active">
          <h2 className="wizard-question text-red">Eligibility Notice</h2>
          <p className="text-gray text-xl mb-6" style={{ fontWeight: 600 }}>{disqualifiedReason}</p>
          <p className="text-dark font-bold text-2xl mb-8">Thank you for your honesty and willingness to help!</p>
          <div className="wizard-buttons">
            <button type="button" className="btn btn-outline" onClick={() => window.location.reload()}>Cancel / Logout</button>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="wizard-container">
        <div className="wizard-step active" style={{ textAlign: 'center' }}>
          <h2 className="wizard-question text-red" style={{ fontSize: '2rem' }}>Profile Created!</h2>
          <p className="text-gray text-xl mb-4">You're officially registered on RedLink.</p>
          
          <div className="bg-dark p-6 rounded" style={{ border: '2px solid var(--red)', margin: '1rem 0' }}>
            <h3 className="text-white mb-4" style={{ fontSize: '1.2rem' }}>📱 Download Our App</h3>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://theredlinkproject.vercel.app/download" alt="Download App QR Code" style={{ margin: '0 auto', borderRadius: '8px', border: '4px solid white' }} />
            <p className="mt-4 text-gray text-sm" style={{ lineHeight: '1.5' }}>
              <strong className="text-red">IMPORTANT:</strong> You will <strong className="text-red">ONLY</strong> receive emergency blood requests if you have downloaded our mobile app and enabled push notifications.
            </p>
          </div>
          
          <div className="wizard-buttons flex-align" style={{ justifyContent: 'center', marginTop: '2rem' }}>
            <button className="btn btn-red" onClick={onComplete}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  const step = activeSteps[currentStepIdx];

  return (
    <div className="wizard-container" onKeyDown={handleKeyDown}>
      {step === 'step-role' && (
        <div className="wizard-step active">
          <h2 className="wizard-question">Welcome to RedLink! Are you here to Donate Blood or Request Blood?</h2>
          <div className="wizard-buttons" style={{ flexDirection: 'column' }}>
            <button className={`btn ${wizData.role === 'donor' ? 'btn-red' : 'btn-outline'}`} 
              style={{ fontSize: '1.5rem' }} 
              onClick={() => { 
                setWizData(prev => ({...prev, role: 'donor'})); 
                setCurrentStepIdx(1); 
              }}>
              I am here to Donate Blood (Hero)
            </button>
            <button className={`btn ${wizData.role === 'requester' ? 'btn-red' : 'btn-outline'}`} 
              style={{ fontSize: '1.5rem' }} 
              onClick={() => { 
                setWizData(prev => ({...prev, role: 'requester'})); 
                setCurrentStepIdx(1); 
              }}>
              I need to Request Blood
            </button>
          </div>
          {alertMsg && <p className="wizard-alert">{alertMsg}</p>}
        </div>
      )}

      {step === 'step-name' && (
        <div className="wizard-step active">
          <h2 className="wizard-question">Hi there! To get started, what's your full name?</h2>
          <input ref={inputRef} type="text" className="wizard-input" placeholder="Enter your full name" 
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
          <h2 className="wizard-question">Nice to meet you, <span className="text-red">{wizData.name}</span>! Heroes save lives. What's your blood group?</h2>
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
          <h2 className="wizard-question">What is your weight in kg?</h2>
          <input ref={inputRef} type="number" className="wizard-input" placeholder="e.g. 60" min="20" max="300"
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
          <h2 className="wizard-question">Are you currently taking any disqualifying medication, such as an asthma inhaler?</h2>
          <div className="wizard-buttons" style={{ flexDirection: 'column' }}>
            <button className="btn btn-outline" style={{ fontSize: '1.5rem' }} onClick={handleNext}>No, I am not</button>
            <button className="btn btn-red" style={{ fontSize: '1.5rem' }} 
              onClick={() => disqualify("You cannot donate blood if you are using certain medications like an asthma inhaler.")}>Yes, I am</button>
          </div>
        </div>
      )}

      {step === 'step-last-donation' && (
        <div className="wizard-step active">
          <h2 className="wizard-question">When was your last donation? (Leave blank if never)</h2>
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
          <h2 className="wizard-question">Got it. To connect you locally, what's your 6-digit pincode?</h2>
          <input ref={inputRef} type="number" className="wizard-input" placeholder="e.g. 100000" min="100000" max="999999"
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
          <h2 className="wizard-question">Almost done! What's your 10-digit phone number? We keep this private.</h2>
          <input ref={inputRef} type="text" className="wizard-input" placeholder="e.g. 9876543210"
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
