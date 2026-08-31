"use client";
import { useState, useEffect } from "react";
import { apiCall } from "../utils/api";
import { supabase } from "../utils/supabase";
import PushNotificationPrompt from "./PushNotificationPrompt";

export default function CommandCenter({ userProfile }) {
  const [activeTab, setActiveTab] = useState('tab-home');
  const [eligibility, setEligibility] = useState({ eligible: false, message: 'Checking...' });
  const [liveFeed, setLiveFeed] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  
  const [editProfile, setEditProfile] = useState({
    name: userProfile.name,
    role: userProfile.role,
    blood_group: userProfile.blood_group || 'A+',
    pincode: userProfile.pincode,
    phone_number: userProfile.phone_number
  });

  useEffect(() => {
    if (userProfile.role === 'donor') {
      let channel;
      
      apiCall('/check-eligibility').then(res => {
        setEligibility(res);
        
        if (res.eligible) {
          supabase.from('blood_requests')
            .select('*')
            .order('created_at', { ascending: false })
            .then(({ data }) => {
              if (data) setLiveFeed(data);
            });

          channel = supabase.channel(`public:blood_requests:${Date.now()}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'blood_requests' }, payload => {
              setLiveFeed(prev => [payload.new, ...prev]);
            })
            .subscribe();
        }
      }).catch(console.error);

      return () => {
        if (channel) supabase.removeChannel(channel);
      };
    }
  }, [userProfile]);

  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/profile', 'PATCH', editProfile);
      alert('Profile updated successfully!');
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const bg = encodeURIComponent(e.target['search-bg'].value);
    const pc = e.target['search-pincode'].value;
    try {
      const donors = await apiCall(`/search?pincode=${pc}&blood_group=${bg}`);
      setSearchResults(donors);
    } catch (err) {
      alert(err.message);
    }
  };

  const requestContact = async (donorId) => {
    try {
      const res = await apiCall(`/request-contact/${donorId}`, 'POST');
      setSearchResults(prev => prev.map(d => d.id === donorId ? { ...d, revealedPhone: res.phone_number } : d));
    } catch (err) {
      alert(err.message);
    }
  };

  const confirmDonation = async (donorId) => {
    try {
      const res = await apiCall('/donation/requester-confirm', 'POST', { other_user_id: donorId });
      alert(res.message);
    } catch (err) {
      alert(err.message);
    }
  };

  const reportUser = async (donorId) => {
    const reason = prompt("Reason for reporting (Fake, Asking for money, etc.):");
    if (!reason) return;
    try {
      await apiCall(`/report/${donorId}`, 'POST', { reason });
      alert('User reported.');
    } catch (err) {
      alert(err.message);
    }
  };

  const volunteerForRequest = async (requestId) => {
    try {
      const res = await apiCall(`/blood-requests/${requestId}/volunteer`, 'POST');
      setLiveFeed(prev => prev.map(req => req.id === requestId ? { ...req, volunteeredPhone: res.phone_number } : req));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="w-full">
      <PushNotificationPrompt />
      
      <div className="app-tabs">
        <button className={`tab-btn ${activeTab === 'tab-home' ? 'active' : ''}`} onClick={() => setActiveTab('tab-home')}>
          Overview
        </button>
        <button className={`tab-btn ${activeTab === 'tab-network' ? 'active' : ''}`} onClick={() => setActiveTab('tab-network')}>
          {userProfile.role === 'donor' ? 'Emergency Feed' : 'Find Donors'}
        </button>
        <button className={`tab-btn ${activeTab === 'tab-edit-profile' ? 'active' : ''}`} onClick={() => setActiveTab('tab-edit-profile')}>
          My Profile
        </button>
      </div>

      {activeTab === 'tab-home' && (
        <section className="tab-content">
          <div className="overview-header">
            <h2>Welcome, <span className="text-red">{userProfile.name}</span></h2>
            <p className="text-gray text-sm">
              {userProfile.role === 'donor' ? '🩸 Emergency Donor Command Center' : '🏥 Medical Requester Command Center'}
            </p>
          </div>
          
          <div className="stats-grid">
            {userProfile.role === 'donor' && (
              <div className="stat-card">
                <span className="stat-label">Lifesaver Points</span>
                <span className="stat-value">{userProfile.lifesaver_points || 0}</span>
              </div>
            )}
            <div className="stat-card">
              <span className="stat-label">Donor Availability</span>
              <span className={`stat-value text-xl mt-2 ${userProfile.role === 'requester' ? '' : (eligibility.eligible ? 'text-red font-bold' : 'text-gray')}`}>
                {userProfile.role === 'donor' ? eligibility.message : 'Active Network Member'}
              </span>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'tab-network' && (
        <section className="tab-content">
          {userProfile.role === 'donor' ? (
            <div className="glass-panel border-red relative">
              <h3 className="text-xl font-bold mb-4 flex-align gap-2">
                <span className="live-indicator"></span> Live Emergency Feed
              </h3>
              
              {!eligibility.eligible && eligibility.message !== 'Checking...' ? (
                <div style={{
                  background: 'var(--surface-card)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  textAlign: 'center'
                }}>
                  <p className="font-bold text-lg text-white">Medical Cooldown Period</p>
                  <p className="text-gray text-sm mt-1">{eligibility.message}</p>
                  <p className="text-red text-xs font-bold mt-3">Emergency broadcasts are hidden to protect your health until you can safely donate again.</p>
                </div>
              ) : (
                <div className="feed-container">
                  {liveFeed.length === 0 ? (
                    <p className="text-gray text-sm italic" style={{ padding: '1rem' }}>Listening for local emergency requests in your area...</p>
                  ) : (
                    liveFeed.map(req => (
                      <div key={req.id} className="feed-item">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ 
                            background: 'var(--red)', 
                            color: 'white', 
                            fontWeight: 800, 
                            padding: '0.2rem 0.6rem', 
                            fontSize: '0.75rem',
                            borderRadius: '4px'
                          }}>
                            {req.blood_group} NEEDED
                          </span>
                          <span className="text-gray text-xs">{new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm font-bold text-white mb-1">🏥 {req.hospital_name}</p>
                        <p className="text-xs text-gray mb-3">📍 {req.location_details || `Pincode: ${req.pincode}`}</p>
                        {!req.volunteeredPhone ? (
                          <button className="btn btn-red w-full" onClick={() => volunteerForRequest(req.id)}>
                            I Am Willing to Help
                          </button>
                        ) : (
                          <div style={{
                            background: 'var(--surface-elevated)',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--surface-border)'
                          }}>
                            <p className="text-xs text-gray mb-1">Requester Contact:</p>
                            <p className="font-bold text-red">📞 {req.volunteeredPhone}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="glass-panel border-red">
                <h3 className="text-xl mb-4">Search Local Donors</h3>
                <form onSubmit={handleSearch} className="form-grid">
                  <div className="input-group">
                    <label>Blood Group</label>
                    <select name="search-bg" required>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Pincode</label>
                    <input type="number" name="search-pincode" placeholder="e.g. 110001" required />
                  </div>
                  <div className="input-group full-width">
                    <button type="submit" className="btn btn-red w-full">Search Nearby Donors</button>
                  </div>
                </form>
              </div>

              {searchResults && (
                <div className="mb-8">
                  <h3 className="text-xl mb-4">Available Donors Nearby</h3>
                  <div className="results-grid">
                    {searchResults.length === 0 ? (
                      <p className="text-gray text-sm">No registered donors found in this pincode currently.</p>
                    ) : (
                      searchResults.map(d => (
                        <div key={d.id} className="donor-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h4 className="font-bold text-white">{d.name}</h4>
                            <span style={{ 
                              background: 'rgba(239, 68, 68, 0.15)', 
                              color: 'var(--red)', 
                              fontWeight: 800, 
                              padding: '0.2rem 0.5rem', 
                              fontSize: '0.75rem',
                              borderRadius: '4px',
                              border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}>
                              {d.blood_group}
                            </span>
                          </div>
                          <p className="text-xs text-gray mb-3">Lifesaver Points: <strong>{d.lifesaver_points || 0}</strong></p>
                          {!d.revealedPhone ? (
                            <button className="btn btn-outline w-full" onClick={() => requestContact(d.id)}>
                              Request Contact
                            </button>
                          ) : (
                            <div>
                              <div className="phone-box mb-2">📞 {d.revealedPhone}</div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-red text-sm" style={{ flex: 1 }} onClick={() => confirmDonation(d.id)}>
                                  Confirm Handshake
                                </button>
                                <button className="btn btn-ghost text-sm" onClick={() => reportUser(d.id)}>
                                  Report
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {activeTab === 'tab-edit-profile' && (
        <section className="tab-content glass-panel border-red">
          <h2 className="text-xl font-bold mb-1">Edit Profile</h2>
          <p className="text-gray text-sm mb-6">Update your location or contact preferences.</p>
          
          <form onSubmit={handleEditProfileSubmit} className="form-grid">
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" value={editProfile.name} onChange={e => setEditProfile({...editProfile, name: e.target.value})} required />
            </div>
            <div className="input-group">
              <label>Account Role</label>
              <select value={editProfile.role} onChange={e => setEditProfile({...editProfile, role: e.target.value})} required>
                <option value="donor">Donate Blood (Hero)</option>
                <option value="requester">Request Blood</option>
              </select>
            </div>
            {editProfile.role === 'donor' && (
              <div className="input-group">
                <label>Blood Group</label>
                <select value={editProfile.blood_group} onChange={e => setEditProfile({...editProfile, blood_group: e.target.value})}>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
            )}
            <div className="input-group">
              <label>Location Pincode</label>
              <input type="number" min="100000" max="999999" value={editProfile.pincode} onChange={e => setEditProfile({...editProfile, pincode: e.target.value})} required />
            </div>
            <div className="input-group full-width">
              <label>Phone Number (Private)</label>
              <input type="text" value={editProfile.phone_number} onChange={e => setEditProfile({...editProfile, phone_number: e.target.value})} required />
            </div>
            <div className="input-group full-width mt-2">
              <button type="submit" className="btn btn-red w-full">Save Changes</button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
