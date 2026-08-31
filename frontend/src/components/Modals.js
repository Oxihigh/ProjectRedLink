"use client";
import { useState, useEffect } from "react";
import { apiCall } from "../utils/api";

export function PublicRequestForm({ onClose }) {
  const [formData, setFormData] = useState({
    blood_group: 'A+',
    pincode: '',
    hospital_name: '',
    phone_number: '',
    location_details: ''
  });

  const [successToken, setSuccessToken] = useState(null);
  const [volunteerDetails, setVolunteerDetails] = useState(null);

  useEffect(() => {
    if (!successToken || volunteerDetails) return;

    const interval = setInterval(async () => {
      try {
        const res = await apiCall(`/blood-requests/${successToken}/status`, 'GET');
        if (res.status === 'volunteered') {
          setVolunteerDetails({ name: res.donor_name, phone: res.donor_phone });
          clearInterval(interval);
        }
      } catch (e) {
        console.error("Status polling error", e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [successToken, volunteerDetails]);

  const handleDetectLoc = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          if (data && data.address && data.address.postcode) {
            setFormData({ ...formData, pincode: data.address.postcode.replace(/\D/g, '') });
            alert('Pincode detected successfully!');
          } else {
            alert('Could not detect pincode accurately. Please enter manually.');
          }
        } catch (e) {
          alert('Failed to connect to location service.');
        }
      }, () => {
        alert('Location permission denied.');
      });
    } else {
      alert('Geolocation not supported by device.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append('blood_group', formData.blood_group);
      payload.append('pincode', parseInt(formData.pincode));
      payload.append('hospital_name', formData.hospital_name);
      payload.append('phone_number', formData.phone_number);
      if (formData.location_details) payload.append('location_details', formData.location_details);

      const res = await apiCall('/blood-requests', 'POST', payload);
      setSuccessToken(res.success_token);
    } catch (err) {
      alert(err.message);
    }
  };

  if (successToken) {
    return (
      <div className="modal-overlay">
        <div className="modal-content text-center">
          {volunteerDetails ? (
            <div style={{
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h2 className="text-xl font-bold mb-1" style={{ color: '#22c55e' }}>A Hero Has Volunteered!</h2>
              <p className="text-white mb-3"><strong>{volunteerDetails.name}</strong> is willing to help!</p>
              <div className="phone-box mb-2">
                📞 {volunteerDetails.phone}
              </div>
              <p className="text-xs text-gray">Please call them immediately to coordinate arrival.</p>
            </div>
          ) : (
            <div className="mb-6">
              <div style={{
                width: '56px',
                height: '56px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--red)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-red mb-2">Emergency Broadcasted!</h2>
              <p className="text-gray text-sm">Your request has been dispatched to nearby donors. Stay on this screen—we will alert you the second someone volunteers.</p>
            </div>
          )}

          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <p className="text-gray text-xs font-bold uppercase mb-1">Your Blood Donor Token</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <h1 className="text-white" style={{ fontSize: '2.5rem', letterSpacing: '3px', margin: 0 }}>{successToken}</h1>
              <button type="button" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => navigator.clipboard.writeText(successToken)}>
                Copy
              </button>
            </div>
            <p className="text-red text-xs mt-2 font-bold">Save this token to close your request once you receive blood.</p>
          </div>

          <button type="button" className="btn btn-outline w-full" onClick={onClose}>
            Done / Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h2 className="text-xl font-bold text-white">Broadcast Emergency</h2>
            <p className="text-gray text-xs">Instantly dispatches alerts to local donors.</p>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="input-group">
            <label>Required Blood Group</label>
            <select value={formData.blood_group} onChange={e => setFormData({ ...formData, blood_group: e.target.value })} required>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>
          
          <div className="input-group">
            <label>Hospital Pincode</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="number" min="100000" max="999999" placeholder="e.g. 110001" required style={{ flex: 1 }}
                value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} />
              <button type="button" className="btn btn-outline" onClick={handleDetectLoc} style={{ padding: '0 0.85rem' }} title="Detect Pincode">
                📍
              </button>
            </div>
          </div>

          <div className="input-group full-width">
            <label>Hospital Name</label>
            <input type="text" placeholder="e.g. AIIMS Delhi / City General" required value={formData.hospital_name} onChange={e => setFormData({ ...formData, hospital_name: e.target.value })} />
          </div>

          <div className="input-group full-width">
            <label>Contact Phone Number</label>
            <input type="tel" placeholder="e.g. 9876543210" required value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} />
          </div>

          <div className="input-group full-width">
            <label>Location / Ward Details (Optional)</label>
            <input type="text" placeholder="e.g. ICU Ward 3, Bed 12" value={formData.location_details} onChange={e => setFormData({ ...formData, location_details: e.target.value })} />
          </div>

          <div className="input-group full-width mt-2" style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-red" style={{ flex: 2 }}>
              🚨 Broadcast Alert
            </button>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CloseRequestForm({ onClose }) {
  const [token, setToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) return;
    try {
      const res = await apiCall(`/blood-requests/success/${token}`, 'POST');
      alert(res.message);
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h2 className="text-xl font-bold text-white">Close Emergency Request</h2>
            <p className="text-gray text-xs">Confirm donor receipt and award lifesaver points.</p>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="input-group full-width">
            <label>Blood Donor Token</label>
            <input type="text" placeholder="e.g. A4B9F2" required value={token} onChange={e => setToken(e.target.value)} />
          </div>
          <div className="input-group full-width mt-2" style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-red" style={{ flex: 2 }}>
              Confirm Handshake
            </button>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
