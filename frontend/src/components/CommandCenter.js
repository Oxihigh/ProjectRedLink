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
          // Fetch initial active requests for their pincode and blood group
          supabase.from('blood_requests')
            .select('*')
            .order('created_at', { ascending: false })
            .then(({ data }) => {
              if (data) setLiveFeed(data);
            });

          // Donor realtime feed
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

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete your account and all associated personal data? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      await supabase.from('users').delete().eq('id', userProfile.id);
      await supabase.auth.signOut();
      alert("Your account and all personal data have been permanently deleted.");
      window.location.reload();
    } catch (err) {
      alert(`Failed to delete account: ${err.message}`);
    }
  };

  return (
    <div className="app-container mt-6">
      <PushNotificationPrompt />
      
      {/* Modern Segmented Tab Bar */}
      <div className="segmented-tabs">
        <button 
          className={`segment-btn ${activeTab === 'tab-home' ? 'active' : ''}`} 
          onClick={() => setActiveTab('tab-home')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span className="segment-label">Home</span>
        </button>
        
        <button 
          className={`segment-btn ${activeTab === 'tab-network' ? 'active' : ''}`} 
          onClick={() => setActiveTab('tab-network')}
        >
          {userProfile.role === 'donor' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          )}
          <span className="segment-label">{userProfile.role === 'donor' ? 'Live Feed' : 'Find Donors'}</span>
        </button>
        
        <button 
          className={`segment-btn ${activeTab === 'tab-edit-profile' ? 'active' : ''}`} 
          onClick={() => setActiveTab('tab-edit-profile')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span className="segment-label">Profile</span>
        </button>
      </div>

      {activeTab === 'tab-home' && (
        <section className="tab-content">
          <div className="overview-header">
            <h2 className="text-dark">Welcome back, <span className="text-red">{userProfile.name}</span></h2>
            <p className="text-gray text-sm font-bold">{userProfile.role === 'donor' ? 'Donor Command Center' : 'Requester Command Center'}</p>
          </div>
          <div className="stats-grid">
            {userProfile.role === 'donor' && (
              <div className="stat-card">
                <span className="stat-label">Lifesaver Points</span>
                <span className="stat-value">{userProfile.lifesaver_points || 0}</span>
              </div>
            )}
            <div className="stat-card">
              <span className="stat-label">Medical Status</span>
              <div className={`stat-status-text ${userProfile.role === 'requester' ? '' : (eligibility.eligible ? 'text-red font-bold' : 'text-gray')}`}>
                {userProfile.role === 'donor' ? eligibility.message : 'Active'}
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'tab-network' && (
        <section className="tab-content">
          {userProfile.role === 'donor' ? (
            <div className="glass-panel border-top-red relative overflow-hidden">
              <h3 className="font-outfit text-xl font-bold mb-4 flex-align gap-2 text-dark">
                <span className="live-indicator"></span> Live Feed
              </h3>
              
              {!eligibility.eligible && eligibility.message !== 'Checking...' ? (
                <div className="bg-dark p-6 rounded text-center my-4" style={{ border: '1px solid var(--red)' }}>
                  <p className="text-white text-lg font-bold">You are in a medical cooldown period.</p>
                  <p className="text-gray mt-2">{eligibility.message}</p>
                  <p className="text-red mt-4 text-sm font-bold">Emergency broadcasts are hidden to protect your health until you are eligible to safely donate again.</p>
                </div>
              ) : (
                <div className="feed-container">
                  {liveFeed.length === 0 ? (
                    <p className="text-gray text-sm italic">Listening for local emergencies...</p>
                  ) : (
                    liveFeed.map(req => (
                      <div key={req.id} className="feed-item glass-panel border-red mb-4 p-4">
                        <h4 className="text-red font-bold text-lg mb-1 flex-align gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                          {req.blood_group} Blood Needed
                        </h4>
                        <p className="text-sm text-gray mb-1"><strong>Hospital:</strong> {req.hospital_name}</p>
                        <p className="text-sm text-gray mb-4"><strong>Location:</strong> {req.location_details || 'N/A'}</p>
                        {!req.volunteeredPhone ? (
                          <button className="btn btn-red w-full" onClick={() => volunteerForRequest(req.id)}>I am Willing</button>
                        ) : (
                          <div className="mt-4 p-3 bg-dark text-white rounded">
                            <p className="mb-1 text-sm text-gray">Thank you, Hero!</p>
                            <p className="font-bold flex-align gap-2">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                              </svg>
                              {req.volunteeredPhone}
                            </p>
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
                <h3 className="font-outfit text-xl mb-4 text-dark">Search Local Donors</h3>
                <form onSubmit={handleSearch} className="flex-align gap-2">
                  <select name="search-bg" required>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                  <input type="number" name="search-pincode" placeholder="Pincode" required />
                  <button type="submit" className="btn btn-red">Search</button>
                </form>
              </div>

              {searchResults && (
                <div className="mb-8">
                  <h3 className="font-outfit text-xl mb-4 text-dark">Network Results</h3>
                  <div className="results-grid">
                    {searchResults.length === 0 ? (
                      <p className="text-gray">No eligible donors found.</p>
                    ) : (
                      searchResults.map(d => (
                        <div key={d.id} className="donor-card">
                          <h4 className="text-red">{d.name}</h4>
                          <p className="text-sm text-gray mb-4">Blood Group: <strong>{d.blood_group}</strong> | Points: <strong>{d.lifesaver_points || 0}</strong></p>
                          {!d.revealedPhone ? (
                            <button className="btn btn-outline w-full mb-2" onClick={() => requestContact(d.id)}>Request Contact</button>
                          ) : (
                            <>
                              <div className="phone-box mb-4 flex-align gap-2" style={{ justifyContent: 'center' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                </svg>
                                {d.revealedPhone}
                              </div>
                              <div className="action-grid">
                                <button className="btn btn-red text-sm" onClick={() => confirmDonation(d.id)}>Confirm Handshake</button>
                                <button className="btn btn-ghost text-sm" onClick={() => reportUser(d.id)}>Report</button>
                              </div>
                            </>
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
          <h2 className="section-title text-dark">Edit Profile</h2>
          <p className="text-gray mb-6">Update your details below.</p>
          <form onSubmit={handleEditProfileSubmit} className="form-grid">
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" value={editProfile.name} onChange={e => setEditProfile({...editProfile, name: e.target.value})} required />
            </div>
            <div className="input-group">
              <label>Role</label>
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
              <label>Phone Number (Kept Private)</label>
              <input type="text" value={editProfile.phone_number} onChange={e => setEditProfile({...editProfile, phone_number: e.target.value})} required />
            </div>
            <button type="submit" className="btn btn-red full-width mt-4">Save Changes</button>
          </form>

          {/* Legal & Account Deletion (App Store Compliance) */}
          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '2px solid var(--border)' }}>
            <h3 className="font-outfit text-lg font-bold mb-2 text-dark">Data Privacy & Account Controls</h3>
            <p className="text-gray text-xs mb-4">
              In compliance with the DPDP Act and App Store guidelines, you can review our policies or permanently delete your account.
            </p>
            <div className="flex-align gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
              <a href="/privacy" className="btn btn-outline text-sm" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                Privacy Policy
              </a>
              <a href="/terms" className="btn btn-outline text-sm" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                Terms of Service
              </a>
            </div>
            
            <div style={{ marginTop: '1.25rem', background: '#fff5f5', border: '2px solid var(--red)', padding: '1rem' }}>
              <p className="font-bold text-red text-sm mb-1">Delete Account</p>
              <p className="text-gray text-xs mb-3">Permanently remove your donor profile, phone number, and all associated data.</p>
              <button 
                type="button" 
                onClick={handleDeleteAccount} 
                className="btn btn-outline text-sm" 
                style={{ borderColor: 'var(--red)', color: 'var(--red)', padding: '0.5rem 1rem' }}
              >
                Delete My Account & Personal Data
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
