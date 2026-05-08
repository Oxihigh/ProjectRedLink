"use client";
import { useState, useEffect } from "react";
import { apiCall } from "../utils/api";
import { supabase } from "../utils/supabase";

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
            .eq('pincode', userProfile.pincode)
            .eq('blood_group', userProfile.blood_group)
            .order('created_at', { ascending: false })
            .then(({ data }) => {
              if (data) setLiveFeed(data);
            });

          // Donor realtime feed
          channel = supabase.channel(`public:blood_requests:${Date.now()}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'blood_requests', filter: `pincode=eq.${userProfile.pincode}` }, payload => {
              if (payload.new.blood_group === userProfile.blood_group) {
                setLiveFeed(prev => [payload.new, ...prev]);
              }
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
    <div className="app-container mt-10">
      <div className="app-tabs">
        <button className={`tab-btn ${activeTab === 'tab-home' ? 'active' : ''}`} onClick={() => setActiveTab('tab-home')}>Home</button>
        <button className={`tab-btn ${activeTab === 'tab-network' ? 'active' : ''}`} onClick={() => setActiveTab('tab-network')}>Network Actions</button>
        <button className={`tab-btn ${activeTab === 'tab-edit-profile' ? 'active' : ''}`} onClick={() => setActiveTab('tab-edit-profile')}>Edit Profile</button>
      </div>

      {activeTab === 'tab-home' && (
        <section className="tab-content">
          <div className="overview-header">
            <h2 className="text-dark">Welcome back, <span className="text-red">{userProfile.name}</span></h2>
            <p className="text-gray text-lg font-bold">{userProfile.role === 'donor' ? 'Donor Command Center' : 'Requester Command Center'}</p>
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
              <span className={`stat-value text-xl mt-2 ${userProfile.role === 'requester' ? '' : (eligibility.eligible ? 'text-red font-bold' : 'text-gray')}`}>
                {userProfile.role === 'donor' ? eligibility.message : 'Active'}
              </span>
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
                        <h4 className="text-red font-bold text-lg mb-1">🚨 {req.blood_group} Blood Needed</h4>
                        <p className="text-sm text-gray mb-1"><strong>Hospital:</strong> {req.hospital_name}</p>
                        <p className="text-sm text-gray mb-4"><strong>Location:</strong> {req.location_details || 'N/A'}</p>
                        {!req.volunteeredPhone ? (
                          <button className="btn btn-red w-full" onClick={() => volunteerForRequest(req.id)}>I am Willing</button>
                        ) : (
                          <div className="mt-4 p-3 bg-dark text-white rounded">
                            <p className="mb-1 text-sm text-gray">Thank you, Hero!</p>
                            <p className="font-bold">📞 {req.volunteeredPhone}</p>
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
                              <div className="phone-box mb-4">📞 {d.revealedPhone}</div>
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
        </section>
      )}
    </div>
  );
}
