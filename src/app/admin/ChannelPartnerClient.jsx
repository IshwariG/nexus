"use client";

import React, { useState, useEffect } from 'react';
import './admin.css';

export default function ChannelPartnerClient({ username }) {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('tab') || 'dashboard';
    }
    return 'dashboard';
  });

  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formMsg, setFormMsg] = useState(null);

  // Earnings Velocity view type ('past' vs 'projection')
  const [velocityViewType, setVelocityViewType] = useState('past');

  // My Leads page states
  const [myLeadsSubTab, setMyLeadsSubTab] = useState('all');
  const [myLeadsSearchQuery, setMyLeadsSearchQuery] = useState('');

  // Form states for Submit Lead
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [prefLocation, setPrefLocation] = useState('Baner, Pune');
  const [prefType, setPrefType] = useState('3BHK Penthouse');
  const [budgetRange, setBudgetRange] = useState('1.0 - 1.5 Cr');
  const [leadSource, setLeadSource] = useState('Direct Referral');
  const [remarks, setRemarks] = useState('');

  // Profile Edit states
  const [profileName, setProfileName] = useState('Amit CP');
  const [profilePhone, setProfilePhone] = useState('+91 98765 43210');
  const [profileEmail, setProfileEmail] = useState('amit.cp@dreamspaces.com');
  const [profileMsg, setProfileMsg] = useState(null);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState(null);

  const handleChangePassword = async () => {
    setPasswordMsg(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg('All password fields are required.');
      setTimeout(() => setPasswordMsg(null), 3000);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('New password and confirm password do not match.');
      setTimeout(() => setPasswordMsg(null), 3000);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters.');
      setTimeout(() => setPasswordMsg(null), 3000);
      return;
    }

    try {
      const res = await fetch('/api/users/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          currentPassword,
          newPassword
        })
      });

      const json = await res.json();
      if (json.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordMsg('Password updated successfully.');
        setTimeout(() => setPasswordMsg(null), 3000);
      } else {
        setPasswordMsg(json.error || 'Failed to update password.');
        setTimeout(() => setPasswordMsg(null), 3000);
      }
    } catch (e) {
      setPasswordMsg('Network error updating password.');
      setTimeout(() => setPasswordMsg(null), 3000);
    }
  };

  // Chat threads states
  const [activeThread, setActiveThread] = useState('rahul');
  const [chatMessages, setChatMessages] = useState({
    rahul: [
      { sender: 'exec', text: "Namaste, Amit. I have shown Flat 101 to Devendra today. He seems very interested.", time: "10:30 AM" },
      { sender: 'cp', text: "Great! Please keep me updated on the progress.", time: "10:32 AM" }
    ],
    admin: [
      { sender: 'exec', text: "Your commission payout of ₹ 15,20000 has been processed successfully.", time: "Yesterday" }
    ],
    neha: [
      { sender: 'exec', text: "Hi Amit, are we scheduling the site visit for Rajesh Oberoi this Sunday?", time: "2 days ago" }
    ]
  });
  const [newMsg, setNewMsg] = useState('');

  const changeTab = (tabName, leadId = null) => {
    setActiveTab(tabName);
    if (leadId) setSelectedLeadId(leadId);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', tabName);
      window.history.pushState(null, '', `?${params.toString()}`);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cp?username=${username}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || 'Failed to fetch dashboard data.');
      }
    } catch (err) {
      setError('Network error loading dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [username]);

  const handleSubmitReferral = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg(null);

    try {
      const res = await fetch('/api/cp/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cp_username: username,
          client_name: clientName,
          email: clientEmail,
          phone: clientPhone,
          pref_type: prefType,
          message: `Preference: ${prefType}. Location: ${prefLocation}. Budget: ${budgetRange}. Source: ${leadSource}. Remarks: ${remarks}`
        })
      });
      const json = await res.json();
      if (json.success) {
        setFormMsg({ type: 'success', text: 'Client referred successfully! Assigned to our Sales Concierge.' });
        setClientName('');
        setClientEmail('');
        setClientPhone('');
        setRemarks('');
        fetchData();
        setTimeout(() => {
          changeTab('my-leads');
        }, 1500);
      } else {
        setFormMsg({ type: 'error', text: json.error || 'Failed to submit referral.' });
      }
    } catch (err) {
      setFormMsg({ type: 'error', text: 'Network error submitting referral.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    
    setChatMessages({
      ...chatMessages,
      [activeThread]: [
        ...chatMessages[activeThread],
        {
          sender: 'cp',
          text: newMsg,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    });
    setNewMsg('');
  };

  const parseAmount = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const cleaned = val.replace(/[^\d.]/g, '');
    let num = parseFloat(cleaned) || 0;
    if (val.includes('Cr')) {
      num = num * 10000000;
    } else if (val.includes('L')) {
      num = num * 100000;
    }
    return num;
  };

  const formatAmountINR = (val) => {
    if (val >= 10000000) {
      return '₹ ' + (val / 10000000).toFixed(2) + ' Cr';
    } else if (val >= 100000) {
      return '₹ ' + (val / 100000).toFixed(2) + ' L';
    }
    return '₹ ' + val.toLocaleString('en-IN');
  };

  const getStatusBadge = (statusStr) => {
    if (!statusStr) return <span className="badge available">NEW</span>;
    const rawStatus = statusStr.split('|')[0].toUpperCase();
    if (rawStatus === 'NEW') return <span className="badge available">NEW</span>;
    if (rawStatus === 'CONTACTED') return <span className="badge negotiation">UNDER REVIEW</span>;
    if (rawStatus === 'QUALIFIED') return <span className="badge reserved">APPROVED</span>;
    if (rawStatus === 'LOST') return <span className="badge sold">REJECTED</span>;
    return <span className="badge available">{rawStatus}</span>;
  };

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8f9fb', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', color: '#113629', fontWeight: 600 }}>Loading CP Partner Portal...</div>
        <div style={{ width: '40px', height: '40px', border: '3px solid #c2a661', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { to { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  const cpDetails = data?.cp || { firm_name: 'Apex Luxury Realty', rera_number: 'RERA-MUM-98765-CP', commission_rate: 2.50 };
  const leads = data?.leads || [];
  const commissions = data?.commissions || [];
  const payouts = data?.payouts || [];

  // Parse and calculate metrics from database
  // totalEarningsVal = what has actually been PAID OUT (from Payouts records)
  // pendingAmountVal = what is APPROVED but not yet disbursed (from Commissions)
  const paidAmountVal = payouts.reduce((acc, p) => acc + parseAmount(p.amount), 0);
  const pendingAmountVal = commissions
    .filter(c => c.status === 'APPROVED' || c.status === 'PENDING')
    .reduce((acc, c) => acc + parseAmount(c.amount), 0);
  const totalEarningsVal = paidAmountVal + pendingAmountVal;

  const getEarningsVelocityData = () => {
    const baseDate = new Date("2026-05-25");
    
    if (velocityViewType === 'past') {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() - i);
        months.push({
          label: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
          year: d.getFullYear(),
          monthIndex: d.getMonth(),
          value: 0
        });
      }
      
      commissions.forEach(c => {
        const amt = parseAmount(c.amount);
        const cDate = c.created_at ? new Date(c.created_at) : new Date("2026-05-01");
        const m = months.find(m => m.year === cDate.getFullYear() && m.monthIndex === cDate.getMonth());
        if (m) m.value += amt;
      });
      return months;
    } else {
      const months = [];
      for (let i = 1; i <= 6; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        months.push({
          label: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
          year: d.getFullYear(),
          monthIndex: d.getMonth(),
          value: 0
        });
      }
      const pendingAmt = pendingAmountVal;
      if (pendingAmt > 0) {
        months[0].value += pendingAmt * 0.5;
        months[1].value += pendingAmt * 0.3;
        months[2].value += pendingAmt * 0.2;
      }
      return months;
    }
  };

  // Selected Lead details
  const selectedLead = leads.find(l => l.id === selectedLeadId) || leads[0] || null;

  // Dynamic filter for My Leads
  const getSubFilteredLeads = () => {
    return leads.filter(l => {
      const matchSearch = (l.name || '').toLowerCase().includes(myLeadsSearchQuery.toLowerCase()) ||
                          (l.phone || '').includes(myLeadsSearchQuery);
      if (!matchSearch) return false;

      if (myLeadsSubTab === 'all') return true;
      const statusText = l.status ? l.status.split('|')[0].toUpperCase() : 'NEW';
      if (myLeadsSubTab === 'new' && statusText === 'NEW') return true;
      if (myLeadsSubTab === 'under-review' && (statusText === 'CONTACTED' || statusText === 'UNDER REVIEW')) return true;
      if (myLeadsSubTab === 'approved' && (statusText === 'QUALIFIED' || statusText === 'APPROVED')) return true;
      if (myLeadsSubTab === 'converted' && (statusText === 'CONVERTED' || statusText === 'SOLD OUT')) return true;
      if (myLeadsSubTab === 'rejected' && (statusText === 'LOST' || statusText === 'REJECTED')) return true;
      return false;
    });
  };

  const filteredLeads = getSubFilteredLeads();

  // Dynamic grouping of Commissions by Project
  const getProjectFromUnitId = (unitId) => {
    if (!unitId) return 'Vanya Residences';
    const id = parseInt(unitId);
    if (isNaN(id)) return 'Vanya Residences';
    if (id < 200) return 'Skyvue Tower A';
    if (id < 300) return 'Maple Heights';
    if (id < 400) return 'Golden Heights';
    return 'Maple Residences';
  };

  const projectStats = {};
  commissions.forEach(c => {
    const proj = getProjectFromUnitId(c.unit_id);
    if (!projectStats[proj]) {
      projectStats[proj] = { leads: 0, bookings: 0, earnings: 0 };
    }
    projectStats[proj].bookings++;
    projectStats[proj].earnings += parseAmount(c.amount);
  });

  const defaultProjects = ['Skyvue Tower A', 'Maple Heights', 'Golden Heights', 'Maple Residences'];
  defaultProjects.forEach(p => {
    if (!projectStats[p]) {
      projectStats[p] = { leads: 0, bookings: 0, earnings: 0 };
    }
    projectStats[p].leads = leads.filter(l => {
      const pref = l.message || '';
      return pref.toLowerCase().includes(p.toLowerCase().split(' ')[0]);
    }).length || 1;
  });

  const topProjectsSorted = Object.entries(projectStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.earnings - a.earnings);

  return (
    <div className="admin-layout" style={{ background: '#f8f9fb' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="admin-sidebar" style={{ background: '#ffffff', borderRight: '1px solid #f1f3f5', display: 'flex', flexDirection: 'column', width: '260px', overflowY: 'auto' }}>
        <div className="admin-sidebar-logo">
          <h2>DreamSpaces</h2>
          <p style={{ color: '#c2a661', fontSize: '0.6rem', letterSpacing: '1px' }}>CP PARTNER PORTAL</p>
        </div>
        
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f3f5' }}>
          <strong style={{ fontSize: '0.82rem', color: '#113629', display: 'block' }}>{cpDetails.firm_name}</strong>
          <span className="text-muted" style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }}>RERA: {cpDetails.rera_number}</span>
        </div>

        <nav className="admin-nav" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => changeTab('dashboard')}>
            <span className="nav-icon">📊</span> CP Dashboard
          </button>
          <button className={activeTab === 'submit-lead' ? 'active' : ''} onClick={() => changeTab('submit-lead')}>
            <span className="nav-icon">➕</span> Submit Lead
          </button>
          <button className={activeTab === 'my-leads' ? 'active' : ''} onClick={() => changeTab('my-leads')}>
            <span className="nav-icon">🤝</span> My Leads
          </button>
          <button className={activeTab === 'earnings' ? 'active' : ''} onClick={() => changeTab('earnings')}>
            <span className="nav-icon">💵</span> Earnings
          </button>
          <button className={activeTab === 'payouts' ? 'active' : ''} onClick={() => changeTab('payouts')}>
            <span className="nav-icon">💳</span> Payouts
          </button>
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => changeTab('profile')}>
            <span className="nav-icon">👤</span> Profile
          </button>
          <button className={activeTab === 'messages' ? 'active' : ''} onClick={() => changeTab('messages')}>
            <span className="nav-icon">✉️</span> Messages
          </button>
          <button className={activeTab === 'notifications' ? 'active' : ''} onClick={() => changeTab('notifications')}>
            <span className="nav-icon">🔔</span> Notifications
          </button>
        </nav>
        
        <div style={{ padding: '1.5rem', borderTop: '1px solid #f1f3f5' }}>
          <form action={async () => {
             document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
             document.cookie = "user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
             window.location.href = "/";
          }}>
            <button type="submit" className="btn-outline" style={{ width: '100%', cursor: 'pointer' }}>LOGOUT</button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="admin-main" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* HEADER BAR */}
        <header className="admin-header" style={{ background: 'white', padding: '1rem 2.5rem', borderBottom: '1px solid #f1f3f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="serif" style={{ fontSize: '1.35rem', margin: 0, color: '#113629' }}>Welcome back, Partner! 👋</h1>
            <p className="text-muted" style={{ margin: 0, fontSize: '0.68rem', letterSpacing: '0.5px' }}>PARTNER CODE: {username.toUpperCase()} • BASE COMM RATE: {cpDetails.commission_rate}%</p>
          </div>
          <button className="btn-dark" onClick={fetchData}>REFRESH TELEMETRY</button>
        </header>

        {error && (
          <div style={{ margin: '1.5rem 2.5rem', background: '#fff5f5', color: '#c53030', padding: '1rem', borderRadius: '8px', border: '1px solid #fed7d7', fontSize: '0.82rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CP VIEWS MAPPED ACCORDING TO USER REFERENCE SCREENSHOTS */}
        {/* ========================================================================= */}
        
        {/* ==================== 1. CP DASHBOARD ==================== */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            
            {/* Top KPI Cards (Row 1 of 4 Cards) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="kpi-card">
                <span>TOTAL LEADS</span>
                <h2>{leads.length}</h2>
                <div className="kpi-subtext"><span style={{ color: '#137333', fontWeight: 'bold' }}>+12</span> this month</div>
              </div>
              <div className="kpi-card">
                <span>APPROVED LEADS</span>
                <h2>{leads.filter(l => l.status?.startsWith('QUALIFIED') || l.status?.startsWith('CONTACTED')).length}</h2>
                <div className="kpi-subtext"><span style={{ color: '#137333', fontWeight: 'bold' }}>+6</span> this month</div>
              </div>
              <div className="kpi-card">
                <span>BOOKINGS</span>
                <h2>{commissions.length}</h2>
                <div className="kpi-subtext"><span style={{ color: '#137333', fontWeight: 'bold' }}>+2</span> this month</div>
              </div>
              <div className="kpi-card">
                <span>TOTAL EARNINGS</span>
                <h2>{formatAmountINR(totalEarningsVal)}</h2>
                <div className="kpi-subtext"><span style={{ color: '#137333', fontWeight: 'bold' }}>↗ Paid + Pending</span></div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              
              {/* Earnings Overview Line Chart */}
              <div className="widget-card">
                <h3 className="serif" style={{ margin: '0 0 1rem 0' }}>Earnings Overview</h3>
                <div style={{ position: 'relative', height: '160px', width: '100%' }}>
                  <svg viewBox="0 0 500 150" width="100%" height="100%" preserveAspectRatio="none">
                    <path d="M 0 130 L 100 110 L 200 70 L 300 85 L 400 45 L 500 20" fill="none" stroke="#c2a661" strokeWidth="3" />
                    <line x1="0" y1="130" x2="500" y2="130" stroke="#eee" />
                  </svg>
                </div>
              </div>

              {/* Lead Status Donut Chart */}
              <div className="widget-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 className="serif" style={{ margin: '0 0 1rem 0' }}>Lead Status</h3>
                <div className="donut-chart-mock" style={{ background: 'conic-gradient(#137333 0% 60%, #c2a661 60% 85%, #c62828 85% 100%)' }}>
                  <div className="donut-inner">
                    <h2 className="serif">{leads.length}</h2>
                    <span>TOTAL LEADS</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', fontSize: '0.7rem', marginTop: 'auto', justifyContent: 'center' }}>
                  <span><span className="dot" style={{ background: '#137333' }}></span> Converted (60%)</span>
                  <span><span className="dot" style={{ background: '#c2a661' }}></span> Under Review (25%)</span>
                  <span><span className="dot" style={{ background: '#c62828' }}></span> Rejected (15%)</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Recent Leads & Earnings Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
              <div className="widget-card">
                <div className="flex-between mb-2">
                  <h3 className="serif" style={{ margin: 0 }}>Recent Leads</h3>
                  <button onClick={() => changeTab('my-leads')} style={{ background: 'none', border: 'none', color: '#c2a661', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>View All Leads</button>
                </div>
                <table className="table-standard">
                  <thead>
                    <tr>
                      <th>CLIENT NAME</th>
                      <th>REQUIREMENT</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.slice(0, 4).map((l, i) => (
                      <tr key={l.id || i}>
                        <td><strong>{l.name}</strong></td>
                        <td>{l.message?.includes('Preference:') ? l.message.match(/Preference:\s*([^.]+)/)[1] : 'Any BHK'}</td>
                        <td>{getStatusBadge(l.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="widget-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="flex-between mb-2">
                  <h3 className="serif" style={{ margin: 0 }}>Earnings Summary</h3>
                  <button onClick={() => changeTab('earnings')} style={{ background: 'none', border: 'none', color: '#c2a661', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>View Payments</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8rem', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f3f5', paddingBottom: '0.5rem' }}>
                    <span>Total Commission Pool:</span>
                    <strong>{formatAmountINR(totalEarningsVal)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#137333', borderBottom: '1px solid #f1f3f5', paddingBottom: '0.5rem' }}>
                    <span>💸 Paid & Disbursed:</span>
                    <strong>{formatAmountINR(paidAmountVal)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c5221f' }}>
                    <span>⏳ Pending Disbursement:</span>
                    <strong>{formatAmountINR(pendingAmountVal)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. SUBMIT LEAD PAGE ==================== */}
        {activeTab === 'submit-lead' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            <div className="widget-card" style={{ maxWidth: '650px' }}>
              <h3 className="serif" style={{ margin: '0 0 1rem 0' }}>Submit New Lead</h3>
              <p className="text-muted" style={{ fontSize: '0.78rem', marginBottom: '1.5rem' }}>Submit a new lead and earn exciting rewards upon booking completion.</p>
              
              {formMsg && (
                <div style={{ background: formMsg.type === 'success' ? '#e6f4ea' : '#fce8e6', color: formMsg.type === 'success' ? '#137333' : '#c5221f', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.8rem' }}>
                  {formMsg.text}
                </div>
              )}

              <form onSubmit={handleSubmitReferral} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} required placeholder="e.g. Riya Sharma" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} required placeholder="+91 98765 43210" />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="riya@domain.com" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Preferred Location</label>
                    <select value={prefLocation} onChange={(e) => setPrefLocation(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}>
                      <option value="Baner, Pune">Baner, Pune</option>
                      <option value="Wakad, Pune">Wakad, Pune</option>
                      <option value="Hinjewadi, Pune">Hinjewadi, Pune</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Budget Range</label>
                    <select value={budgetRange} onChange={(e) => setBudgetRange(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}>
                      <option value="50 - 80 L">₹ 50 - 80 L</option>
                      <option value="1.0 - 1.5 Cr">₹ 1.0 - 1.5 Cr</option>
                      <option value="1.5 Cr+">₹ 1.5 Cr +</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Requirement</label>
                    <select value={prefType} onChange={(e) => setPrefType(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}>
                      <option value="2BHK Studio">2 BHK Studio</option>
                      <option value="3BHK Penthouse">3 BHK Penthouse</option>
                      <option value="4BHK Penthouse">4 BHK Penthouse</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Source of Lead</label>
                    <select value={leadSource} onChange={(e) => setLeadSource(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}>
                      <option value="Direct Referral">Direct Referral</option>
                      <option value="Website Inflow">Website Inflow</option>
                      <option value="Social Media Link">Social Media Link</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Additional Notes / Remarks</label>
                  <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Additional notes or preferences..." style={{ width: '96%', minHeight: '80px', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical' }} />
                </div>
                <button type="submit" disabled={submitting} className="btn-dark" style={{ padding: '0.75rem', fontSize: '0.8rem' }}>
                  {submitting ? 'PROCESSING...' : 'SUBMIT LEAD'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ==================== 3. MY LEADS PAGE ==================== */}
        {activeTab === 'my-leads' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            <div className="widget-card">
              <div className="flex-between mb-2" style={{ borderBottom: '1px solid #f1f3f5', paddingBottom: '1rem' }}>
                {/* Status Filter Tab Pills */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['all', 'new', 'under-review', 'approved', 'converted', 'rejected'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setMyLeadsSubTab(t)}
                      className={`btn-outline ${myLeadsSubTab === t ? 'active' : ''}`}
                      style={{ padding: '6px 12px', fontSize: '0.72rem', textTransform: 'uppercase', borderRadius: '4px' }}
                    >
                      {t.replace('-', ' ')}
                    </button>
                  ))}
                </div>
                
                {/* Search box */}
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input 
                    type="text" 
                    placeholder="Search leads..." 
                    className="input-search" 
                    value={myLeadsSearchQuery}
                    onChange={(e) => setMyLeadsSearchQuery(e.target.value)}
                    style={{ width: '180px' }}
                  />
                </div>
              </div>

              <table className="table-standard" style={{ marginTop: '1rem' }}>
                <thead>
                  <tr>
                    <th>LEAD DETAILS</th>
                    <th>REQUIREMENT</th>
                    <th>BUDGET</th>
                    <th>STATUS</th>
                    <th>SUBMITTED ON</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((l, i) => {
                    const req = l.message?.includes('Preference:') ? l.message.match(/Preference:\s*([^.]+)/)[1] : 'Any BHK';
                    const budget = l.message?.includes('Budget:') ? l.message.match(/Budget:\s*([^.]+)/)[1] : '₹ 50-80 L';
                    return (
                      <tr key={l.id || i}>
                        <td>
                          <strong>{l.name}</strong><br/>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>{l.phone}</span>
                        </td>
                        <td>{req}</td>
                        <td>{budget}</td>
                        <td>{getStatusBadge(l.status)}</td>
                        <td className="text-muted">{new Date(l.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td>
                          <button onClick={() => changeTab('lead-details', l.id)} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.7rem', margin: 0 }}>
                            👁 VIEW DETAILS
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLeads.length === 0 && (
                    <tr><td colSpan="6" className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>No leads matching search or filter criteria.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== 4. LEAD DETAILS PAGE ==================== */}
        {activeTab === 'lead-details' && selectedLead && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            <button onClick={() => changeTab('my-leads')} className="btn-outline" style={{ marginBottom: '1.25rem', padding: '6px 12px', width: 'fit-content' }}>← Back to Leads</button>
            
            <div className="flex-between mb-2">
              <h2 className="serif" style={{ margin: 0 }}>{selectedLead.name}</h2>
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>Lead ID: #FLD-{selectedLead.id.slice(0, 8).toUpperCase()}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
              <div className="widget-card">
                <h3 className="serif" style={{ margin: '0 0 1.25rem 0', borderBottom: '1px solid #f1f3f5', paddingBottom: '0.5rem' }}>Contact Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#999', display: 'block', fontWeight: 'bold' }}>MOBILE NUMBER</span>
                    <strong>{selectedLead.phone}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#999', display: 'block', fontWeight: 'bold' }}>EMAIL ADDRESS</span>
                    <strong>{selectedLead.email || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#999', display: 'block', fontWeight: 'bold' }}>PREFERRED LOCATION</span>
                    <div>{selectedLead.message?.includes('Location:') ? selectedLead.message.match(/Location:\s*([^.]+)/)[1] : 'Baner, Pune'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#999', display: 'block', fontWeight: 'bold' }}>BUDGET RANGE</span>
                    <div>{selectedLead.message?.includes('Budget:') ? selectedLead.message.match(/Budget:\s*([^.]+)/)[1] : '₹ 50-80 L'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#999', display: 'block', fontWeight: 'bold' }}>REQUIREMENT</span>
                    <div>{selectedLead.message?.includes('Preference:') ? selectedLead.message.match(/Preference:\s*([^.]+)/)[1] : '3 BHK'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#999', display: 'block', fontWeight: 'bold' }}>SOURCE OF LEAD</span>
                    <div>{selectedLead.message?.includes('Source:') ? selectedLead.message.match(/Source:\s*([^.]+)/)[1] : 'Direct Referral'}</div>
                  </div>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  <span style={{ fontSize: '0.65rem', color: '#999', display: 'block', fontWeight: 'bold' }}>ADDITIONAL NOTES</span>
                  <div style={{ background: '#faf9f6', padding: '0.75rem', borderRadius: '6px', border: '1px solid #f1eede', marginTop: '0.25rem', fontSize: '0.8rem' }}>
                    {selectedLead.message || 'No additional remarks.'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="widget-card">
                  <h3 className="serif" style={{ margin: '0 0 1.25rem 0' }}>Status Timeline</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#137333', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem' }}>✓</div>
                      <div>
                        <strong>Lead Submitted</strong>
                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>Successfully registered in CRM</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: selectedLead.status?.includes('|') ? '#137333' : '#c2a661', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem' }}>
                        {selectedLead.status?.includes('|') ? '✓' : '●'}
                      </div>
                      <div>
                        <strong>Under Review</strong>
                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>Representative assigned: {selectedLead.status?.includes('|') ? selectedLead.status.split('|')[1] : 'Pending'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', opacity: selectedLead.status?.startsWith('QUALIFIED') ? 1 : 0.4 }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: selectedLead.status?.startsWith('QUALIFIED') ? '#137333' : '#eee', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem' }}>
                        {selectedLead.status?.startsWith('QUALIFIED') ? '✓' : ''}
                      </div>
                      <div>
                        <strong>Approved & Qualified</strong>
                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>Milestone RERA status confirmed</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="widget-card">
                  <h3 className="serif" style={{ margin: '0 0 1rem 0' }}>Assigned To</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="sm-avatar bg-blue" style={{ width: '42px', height: '42px' }}>RM</div>
                    <div>
                      <strong>Rahul Mehta</strong>
                      <span className="text-muted" style={{ display: 'block', fontSize: '0.72rem' }}>Sales Executive</span>
                    </div>
                    <a href="tel:+918765432109" style={{ marginLeft: 'auto', background: '#e8f0fe', padding: '8px', borderRadius: '50%', textDecoration: 'none' }}>📞</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 5. EARNINGS PAGE ==================== */}
        {activeTab === 'earnings' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="kpi-card">
                <span>TOTAL EARNINGS</span>
                <h2>{formatAmountINR(totalEarningsVal)}</h2>
              </div>
              <div className="kpi-card">
                <span>PAID AMOUNT</span>
                <h2 style={{ color: '#137333' }}>{formatAmountINR(paidAmountVal)}</h2>
              </div>
              <div className="kpi-card">
                <span>PENDING AMOUNT</span>
                <h2 style={{ color: '#c62828' }}>{formatAmountINR(pendingAmountVal)}</h2>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {/* Earnings velocity bar chart */}
              <div className="widget-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 className="serif" style={{ margin: 0 }}>Earnings Velocity</h3>
                  <select 
                    value={velocityViewType}
                    onChange={(e) => setVelocityViewType(e.target.value)}
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', color: '#374151', fontWeight: '600', cursor: 'pointer' }}
                  >
                    <option value="past">Last 6 Months</option>
                    <option value="projection">Next 6 Months</option>
                  </select>
                </div>
                {(() => {
                  const data = getEarningsVelocityData();
                  const maxVal = Math.max(...data.map(d => d.value), 100000); // Min 1 Lakh to avoid giant bars for tiny amounts
                  return (
                    <div className="bar-chart-mock" style={{ height: '160px' }}>
                      {data.map((d, idx) => {
                        const heightPerc = Math.max((d.value / maxVal) * 100, 2);
                        return (
                          <div key={idx} className="bar-col">
                            <div className="bar" title={formatAmountINR(d.value)} style={{ height: `${heightPerc}%`, background: '#c2a661' }}></div>
                            <span>{d.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Top Performing Projects */}
              <div className="widget-card">
                <h3 className="serif" style={{ margin: '0 0 1rem 0' }}>Top Performing Projects</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {topProjectsSorted.slice(0, 5).map((p, idx) => (
                    <div key={idx} className="flex-between" style={{ borderBottom: '1px solid #f1f3f5', paddingBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{idx + 1}. {p.name}</span>
                      <strong style={{ color: '#c2a661' }}>{formatAmountINR(p.earnings)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Earnings breakdown table */}
            <div className="widget-card">
              <h3 className="serif" style={{ margin: '0 0 1rem 0' }}>Earnings Breakdown</h3>
              <table className="table-standard">
                <thead>
                  <tr>
                    <th>PROJECT</th>
                    <th>LEADS REFERRED</th>
                    <th>BOOKINGS CLOSED</th>
                    <th>EARNINGS</th>
                  </tr>
                </thead>
                <tbody>
                  {topProjectsSorted.map((p, idx) => (
                    <tr key={idx}>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.leads}</td>
                      <td>{p.bookings}</td>
                      <td style={{ color: '#137333', fontWeight: 'bold' }}>{formatAmountINR(p.earnings)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== 6. PAYOUTS PAGE ==================== */}
        {activeTab === 'payouts' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="kpi-card">
                <span>TOTAL PAYOUTS</span>
                <h2>{formatAmountINR(paidAmountVal)}</h2>
              </div>
              <div className="kpi-card">
                <span>APPROVED AMOUNT</span>
                <h2>{formatAmountINR(totalEarningsVal)}</h2>
              </div>
              <div className="kpi-card">
                <span>PENDING AMOUNT</span>
                <h2 style={{ color: '#c62828' }}>{formatAmountINR(pendingAmountVal)}</h2>
              </div>
              <div className="kpi-card">
                <span>NEXT PAYOUT DATE</span>
                <h2>25 May 2026</h2>
              </div>
            </div>

            <div className="widget-card">
              <h3 className="serif" style={{ margin: '0 0 1.25rem 0' }}>Payout History & Upcoming Payouts</h3>
              <table className="table-standard">
                <thead>
                  <tr>
                    <th>PAYOUT ID</th>
                    <th>DISBURSED DATE</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                    <th>REMARKS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p, idx) => (
                    <tr key={idx}>
                      <td><strong>PAY-{p.id.slice(0, 8).toUpperCase()}</strong></td>
                      <td>{new Date(p.paid_at || p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td style={{ color: '#137333', fontWeight: 'bold' }}>{p.amount}</td>
                      <td><span className="badge available">{p.status}</span></td>
                      <td>Commission Payout Clear</td>
                      <td>
                        <button className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.68rem', margin: 0 }}>
                          📥 RECEIPT
                        </button>
                      </td>
                    </tr>
                  ))}
                  {payouts.length === 0 && (
                    <tr><td colSpan="6" className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>No payouts processed to bank yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== 7. PROFILE PAGE ==================== */}
        {activeTab === 'profile' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
              
              {/* Profile Information card */}
              <div className="widget-card">
                <h3 className="serif" style={{ margin: '0 0 1.25rem 0', borderBottom: '1px solid #f1f3f5', paddingBottom: '0.5rem' }}>Profile Information</h3>
                
                {profileMsg && (
                  <div style={{ background: '#e6f4ea', color: '#137333', padding: '8px 12px', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.78rem' }}>
                    {profileMsg}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                  <div className="form-group">
                    <label>Firm Name</label>
                    <input type="text" readOnly value={cpDetails.firm_name} style={{ width: '96%', background: '#f5f5f5', border: '1px solid #ddd' }} />
                  </div>
                  <div className="form-group">
                    <label>RERA Registration Number</label>
                    <input type="text" readOnly value={cpDetails.rera_number} style={{ width: '96%', background: '#f5f5f5', border: '1px solid #ddd' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Full Name</label>
                      <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} style={{ width: '92%' }} />
                    </div>
                    <div className="form-group">
                      <label>Mobile Number</label>
                      <input type="text" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} style={{ width: '92%' }} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} style={{ width: '96%' }} />
                  </div>
                  <button onClick={() => { setProfileMsg('Profile details updated successfully!'); setTimeout(() => setProfileMsg(null), 3000); }} className="btn-dark" style={{ width: 'fit-content', padding: '8px 16px', fontSize: '0.78rem' }}>
                    UPDATE PROFILE
                  </button>
                </div>
              </div>

              {/* Security and Bank details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="widget-card">
                  <h3 className="serif" style={{ margin: '0 0 1.25rem 0' }}>Change Password</h3>
                  
                  {passwordMsg && (
                    <div style={{ background: '#fce8e6', color: '#c5221f', padding: '8px 12px', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.78rem' }}>
                      {passwordMsg}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label>Current Password</label>
                      <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ width: '92%', padding: '6px 10px' }} />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '92%', padding: '6px 10px' }} />
                    </div>
                    <div className="form-group">
                      <label>Confirm Password</label>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: '92%', padding: '6px 10px' }} />
                    </div>
                    <button onClick={handleChangePassword} className="btn-dark" style={{ width: '100%', padding: '8px', fontSize: '0.75rem' }}>
                      UPDATE PASSWORD
                    </button>
                  </div>
                </div>

                <div className="widget-card">
                  <h3 className="serif" style={{ margin: '0 0 1rem 0' }}>Registered Bank Account</h3>
                  <div style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                    <div><strong>Bank Name:</strong> HDFC Bank Ltd</div>
                    <div><strong>Account Number:</strong> XXXXXXXXXX9874</div>
                    <div><strong>IFSC Code:</strong> HDFC0001234</div>
                    <span className="badge available" style={{ marginTop: '0.5rem', fontSize: '0.55rem' }}>VERIFIED BY ERP</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== 8. MESSAGES PAGE ==================== */}
        {activeTab === 'messages' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', height: '450px' }}>
              
              {/* Left sidebar chats threads */}
              <div className="widget-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', overflowY: 'auto' }}>
                <h4 className="serif" style={{ margin: '0 0 0.75rem 0', color: '#113629' }}>Active Chats</h4>
                <button 
                  onClick={() => setActiveThread('rahul')}
                  className={`btn-outline ${activeThread === 'rahul' ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '10px', width: '100%', textAlign: 'left', border: 'none' }}
                >
                  <div className="sm-avatar bg-blue" style={{ width: '32px', height: '32px' }}>RM</div>
                  <div>
                    <strong style={{ fontSize: '0.8rem', display: 'block' }}>Rahul Mehta</strong>
                    <span style={{ fontSize: '0.62rem', color: '#888' }}>Sales Executive</span>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveThread('admin')}
                  className={`btn-outline ${activeThread === 'admin' ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '10px', width: '100%', textAlign: 'left', border: 'none' }}
                >
                  <div className="sm-avatar bg-green" style={{ width: '32px', height: '32px' }}>AS</div>
                  <div>
                    <strong style={{ fontSize: '0.8rem', display: 'block' }}>Admin Support</strong>
                    <span style={{ fontSize: '0.62rem', color: '#888' }}>System ERP Help</span>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveThread('neha')}
                  className={`btn-outline ${activeThread === 'neha' ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '10px', width: '100%', textAlign: 'left', border: 'none' }}
                >
                  <div className="sm-avatar bg-yellow" style={{ width: '32px', height: '32px' }}>NS</div>
                  <div>
                    <strong style={{ fontSize: '0.8rem', display: 'block' }}>Neha Sharma</strong>
                    <span style={{ fontSize: '0.62rem', color: '#888' }}>Broker Concierge</span>
                  </div>
                </button>
              </div>

              {/* Right side active chat window */}
              <div className="widget-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #f1f3f5', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <div className="sm-avatar bg-blue" style={{ width: '36px', height: '36px' }}>
                    {activeThread === 'rahul' ? 'RM' : activeThread === 'admin' ? 'AS' : 'NS'}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.85rem', display: 'block' }}>
                      {activeThread === 'rahul' ? 'Rahul Mehta' : activeThread === 'admin' ? 'Admin Support' : 'Neha Sharma'}
                    </strong>
                    <span style={{ fontSize: '0.65rem', color: '#137333', fontWeight: 'bold' }}>● ONLINE</span>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #f1f3f5', padding: '1rem', borderRadius: '8px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {chatMessages[activeThread]?.map((m, idx) => (
                    <div key={idx} style={{ alignSelf: m.sender === 'cp' ? 'flex-end' : 'flex-start', background: m.sender === 'cp' ? '#c2a661' : '#fff', color: m.sender === 'cp' ? 'white' : '#333', padding: '8px 12px', borderRadius: '8px', maxWidth: '70%', fontSize: '0.8rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                      <div>{m.text}</div>
                      <span style={{ fontSize: '0.58rem', opacity: 0.7, display: 'block', textAlign: 'right', marginTop: '4px' }}>{m.time}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <input type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Type your message..." style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.82rem' }} />
                  <button type="submit" className="btn-dark" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>SEND</button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* ==================== 9. NOTIFICATIONS PAGE ==================== */}
        {activeTab === 'notifications' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            <div className="widget-card">
              <div className="flex-between mb-2" style={{ borderBottom: '1px solid #f1f3f5', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <h3 className="serif" style={{ margin: 0 }}>Broker Notifications</h3>
                <button onClick={() => alert('All notifications marked as read.')} style={{ background: 'none', border: 'none', color: '#c2a661', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}>Mark all as read</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '1rem', background: '#faf6eb', borderLeft: '4px solid #c2a661', borderRadius: '6px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '8px', height: '8px', background: '#ef6c00', borderRadius: '50%' }}></div>
                  <div>
                    <strong>Your lead Vikas Singh has been approved!</strong>
                    <div className="text-muted" style={{ fontSize: '0.68rem', marginTop: '2px' }}>2 hours ago</div>
                  </div>
                </div>

                <div style={{ padding: '1rem', background: '#faf6eb', borderLeft: '4px solid #c2a661', borderRadius: '6px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '8px', height: '8px', background: '#ef6c00', borderRadius: '50%' }}></div>
                  <div>
                    <strong>You have earned ₹15,000 for a new booking.</strong>
                    <div className="text-muted" style={{ fontSize: '0.68rem', marginTop: '2px' }}>5 hours ago</div>
                  </div>
                </div>

                <div style={{ padding: '1rem', background: '#fff', borderLeft: '4px solid #eee', borderRadius: '6px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '8px', height: '8px', background: 'transparent', borderRadius: '50%' }}></div>
                  <div>
                    <strong>Commission payout of ₹ 15.20 L has been processed successfully.</strong>
                    <div className="text-muted" style={{ fontSize: '0.68rem', marginTop: '2px' }}>Yesterday</div>
                  </div>
                </div>

                <div style={{ padding: '1rem', background: '#fff', borderLeft: '4px solid #eee', borderRadius: '6px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '8px', height: '8px', background: 'transparent', borderRadius: '50%' }}></div>
                  <div>
                    <strong>New project update on Skyview Tower A was published.</strong>
                    <div className="text-muted" style={{ fontSize: '0.68rem', marginTop: '2px' }}>2 days ago</div>
                  </div>
                </div>

                <div style={{ padding: '1rem', background: '#fff', borderLeft: '4px solid #eee', borderRadius: '6px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '8px', height: '8px', background: 'transparent', borderRadius: '50%' }}></div>
                  <div>
                    <strong>Your referred lead Meena Joshi has been assigned to Rahul Mehta.</strong>
                    <div className="text-muted" style={{ fontSize: '0.68rem', marginTop: '2px' }}>3 days ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
