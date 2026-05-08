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
  const [documentFile, setDocumentFile] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

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
      alert('Geolocation not supported by browser.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!documentFile) return alert('Please upload a supporting medical document.');
    
    setIsVerifying(true);
    try {
      const payload = new FormData();
      payload.append('blood_group', formData.blood_group);
      payload.append('pincode', parseInt(formData.pincode));
      payload.append('hospital_name', formData.hospital_name);
      payload.append('phone_number', formData.phone_number);
      if (formData.location_details) payload.append('location_details', formData.location_details);
      payload.append('supporting_document', documentFile);

      const res = await apiCall('/blood-requests', 'POST', payload);
      setSuccessToken(res.success_token);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  if (successToken) {
    return (
      <section className="glass-panel p-8 border-red mt-10" style={{ textAlign: 'center' }}>
        {volunteerDetails ? (
          <div className="bg-red p-6 rounded mb-8 pulse-animation" style={{ color: 'var(--dark)' }}>
            <h2 className="font-outfit text-3xl font-bold mb-2">A Hero Has Volunteered!</h2>
            <p className="text-xl mb-4"><strong>{volunteerDetails.name}</strong> is willing to help!</p>
            <div className="p-4 rounded" style={{ backgroundColor: 'var(--bg)', color: 'var(--red)', fontSize: '2rem', fontWeight: 'bold', border: '2px solid var(--red)' }}>
              📞 {volunteerDetails.phone}
            </div>
            <p className="mt-4 font-bold text-sm">Please call them immediately to coordinate.</p>
          </div>
        ) : (
          <>
            <h2 className="section-title text-red" style={{ fontSize: '2.5rem' }}>Emergency Broadcasted!</h2>
            <p className="text-gray text-lg mb-6">Your emergency has been pushed to the Live Feed of local donors. Stay on this screen—we will alert you instantly when someone volunteers.</p>
          </>
        )}

        <div className="bg-dark p-6 rounded" style={{ border: '2px solid var(--red)', margin: '2rem 0' }}>
          <p className="text-gray mb-2 font-bold text-lg">Your Success Token</p>
          <h1 className="text-white" style={{ fontSize: '3.5rem', letterSpacing: '4px', margin: 0 }}>{successToken}</h1>
          <p className="text-red mt-4 text-sm font-bold">WARNING: Save this token! You will need it to close the request once you receive blood.</p>
        </div>

        <button type="button" className="btn btn-outline" onClick={onClose} style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
          I have saved my token. Return Home.
        </button>
      </section>
    );
  }

  return (
    <section className="glass-panel p-8 border-red mt-10">
      <h2 className="section-title text-dark">Broadcast Emergency Request</h2>
      <p className="text-gray mb-6">Requesting blood is open to the public and does not require an account. This will instantly alert local donors.</p>
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="input-group">
          <label>Required Blood Group</label>
          <select value={formData.blood_group} onChange={e => setFormData({ ...formData, blood_group: e.target.value })} required>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label>Pincode</label>
          <div className="flex-align gap-2">
            <input type="number" min="100000" max="999999" placeholder="e.g. 100000" required style={{ flexGrow: 1 }}
              value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} />
            <button type="button" className="btn btn-outline" onClick={handleDetectLoc} style={{ padding: '0.8rem', borderColor: 'var(--text)', color: 'var(--text)' }} title="Detect Pincode">📍</button>
          </div>
        </div>
        <div className="input-group full-width">
          <label>Hospital Name</label>
          <input type="text" placeholder="e.g. City General Hospital" required value={formData.hospital_name} onChange={e => setFormData({ ...formData, hospital_name: e.target.value })} />
        </div>
        <div className="input-group full-width">
          <label>Requester Phone Number</label>
          <input type="text" placeholder="e.g. +1 234 567 8900" required value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} />
        </div>
        <div className="input-group full-width">
          <label>Location Details (Optional)</label>
          <input type="text" placeholder="e.g. Ward 4, Room 102" value={formData.location_details} onChange={e => setFormData({ ...formData, location_details: e.target.value })} />
        </div>
        <div className="input-group full-width">
          <label>Supporting Document (Prescription / Admission Slip)</label>
          <input type="file" accept="image/*" required onChange={e => setDocumentFile(e.target.files[0])} />
          <small className="text-gray mt-1">Our AI instantly verifies documents to prevent spam.</small>
        </div>
        <div className="flex-align" style={{ gap: '1rem', marginTop: '1.5rem' }}>
          <button type="submit" className="btn btn-red full-width" disabled={isVerifying}>
            {isVerifying ? 'Verifying...' : 'Broadcast Now'}
          </button>
          <button type="button" className="btn btn-outline full-width" onClick={onClose} disabled={isVerifying}>
            Cancel
          </button>
        </div>
      </form>
    </section>
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
    <section className="glass-panel p-8 border-red mt-10">
      <h2 className="section-title text-dark">Close Emergency Request</h2>
      <p className="text-gray mb-6">Enter the Success Token you received when broadcasting your emergency to close the loop and award points to your donor hero.</p>
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="input-group full-width">
          <label>Success Token</label>
          <input type="text" placeholder="e.g. A4B9F2" required value={token} onChange={e => setToken(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-red full-width mt-4">Confirm Handshake & Close Request</button>
        <button type="button" className="btn btn-outline full-width mt-2" onClick={onClose}>Cancel</button>
      </form>
    </section>
  );
}
