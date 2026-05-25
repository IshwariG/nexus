"use client";

import { useState } from 'react';
import './login.css';

export default function LoginPage() {
  const [view, setView] = useState('selection'); // 'selection' | 'form'
  const [role, setRole] = useState(null); // 'Admin' | 'Sales' | 'ChannelPartner' | 'Buyer'
  const [selectedRole, setSelectedRole] = useState('Admin');
  const [showPassword, setShowPassword] = useState(false);

  const handleSelectCard = (roleId) => {
    setSelectedRole(roleId);
  };

  const handleContinue = () => {
    if (selectedRole) {
      setRole(selectedRole);
      setView('form');
    }
  };

  const handleBack = () => {
    setView('selection');
    setRole(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = '/admin';
      } else {
        alert(data.error || 'Authentication rejected by server.');
      }
    } catch (error) {
      alert('Authentication error. Please check your credentials. Details: ' + error.message);
    }
  };

  const showDemoCredentials = () => {
    let creds = '';
    if (role === 'Admin') creds = 'Username: ADM-1234\nPassword: password123';
    else if (role === 'Sales') creds = 'Username: SR-9999\nPassword: Vikram@123';
    else if (role === 'Buyer') creds = 'Username: sham / aryan\nPassword: sham / aryan';
    else if (role === 'ChannelPartner') creds = 'Username: cp101\nPassword: password123';
    
    alert(`Demo Credentials:\n\n${creds}`);
  };

  return (
    <div className="login-page">
      <div className="login-split-container">
        
        {/* ========================================== */}
        {/* LEFT COLUMN (VISUAL & BRAND PANE) */}
        {/* ========================================== */}
        <div className="login-left-pane">
          <div className="logo-container">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c2a661" strokeWidth="2.5">
              <rect x="3" y="10" width="4" height="11" rx="1" fill="#c2a661" />
              <rect x="10" y="4" width="4" height="17" rx="1" fill="#113629" stroke="#113629" />
              <rect x="17" y="7" width="4" height="14" rx="1" fill="#c2a661" />
            </svg>
            <div>
              <span className="logo-main-text">HOMELAND.</span>
              <span className="logo-sub-text" style={{ marginLeft: '4px' }}>Real Estate</span>
            </div>
          </div>

          {/* Render Selection Left Pane */}
          {view === 'selection' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="left-pane-header">
                <span style={{ fontSize: '0.72rem', color: '#c2a661', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Welcome to</span>
                <h1>Real Estate<br/>CRM + ERP Platform</h1>
                <p>Manage Sales, Inventory, Leads, Buyers & Operations in one single unified workspace.</p>
              </div>

              {/* Existing Project Image Mock */}
              <div style={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 20px 45px rgba(0,0,0,0.06)',
                border: '1px solid #e5e7eb',
                background: '#fff',
                padding: '8px',
                marginTop: '1.5rem',
                maxHeight: '340px'
              }}>
                <img 
                  src="/images/hero_building_1777640070355.png" 
                  alt="Vanya Residences Building" 
                  style={{ width: '100%', height: '320px', objectFit: 'cover', borderRadius: '10px' }}
                />
              </div>
            </div>
          )}

          {/* Render Admin Form Left Pane */}
          {view === 'form' && role === 'Admin' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="left-pane-header">
                <span style={{ fontSize: '0.72rem', color: '#c2a661', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Grow Your Business</span>
                <h1>Grow Your Business<br/>with Intelligence</h1>
                <p>Real-time insights, performance analytics, inventory tracking & much more.</p>
              </div>

              {/* Dynamic KPI Cards Grid */}
              <div className="admin-kpis-grid">
                <div className="admin-kpi-card">
                  <span className="admin-kpi-label">TOTAL REVENUE</span>
                  <span className="admin-kpi-value">₹ 12.45 Cr</span>
                  <span className="admin-kpi-sub">↑ +16.6% vs last month</span>
                </div>
                <div className="admin-kpi-card">
                  <span className="admin-kpi-label">SALES OVERVIEW</span>
                  <span className="admin-kpi-value">₹ 8.74 Cr</span>
                  <span className="admin-kpi-sub">↑ +22.4% vs last month</span>
                </div>
                <div className="admin-kpi-card">
                  <span className="admin-kpi-label">ACTIVE PROJECTS</span>
                  <span className="admin-kpi-value">24</span>
                  <span className="admin-kpi-sub" style={{ color: '#6b7280' }}>Across Heritage Suites</span>
                </div>
                <div className="admin-kpi-card" style={{ position: 'relative' }}>
                  <div>
                    <span className="admin-kpi-label">TOTAL LEADS</span>
                    <span className="admin-kpi-value">1,248</span>
                    <span className="admin-kpi-sub">↑ +15.3% increase</span>
                  </div>
                  <div style={{ position: 'absolute', right: '1.25rem', bottom: '1.25rem' }}>
                    <svg width="34" height="34" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f3f5" strokeWidth="4" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#c2a661" strokeWidth="4.2" 
                        strokeDasharray="75 25" strokeDashoffset="25" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Render Salesperson Form Left Pane */}
          {view === 'form' && role === 'Sales' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="left-pane-header">
                <span style={{ fontSize: '0.72rem', color: '#c2a661', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Lead Converter</span>
                <h1>Manage Leads.<br/>Close Deals. Grow Faster.</h1>
                <p>All your leads, follow-ups, meetings and deals in one place.</p>
              </div>

              {/* Pipeline Mock Laptop Graphic */}
              <div className="sales-laptop-mock">
                <div style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#113629', borderBottom: '1px solid #f1f3f5', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>LEAD PIPELINE STATUS</div>
                <div className="sales-pipeline-row">
                  <span style={{ color: '#4b5563', fontWeight: '500' }}>New Lead</span>
                  <div style={{ flex: 1, background: '#f3f4f6', height: '8px', borderRadius: '4px', margin: '0 1rem', overflow: 'hidden' }}>
                    <div style={{ background: '#c2a661', width: '80%', height: '100%' }}></div>
                  </div>
                  <strong style={{ color: '#113629' }}>120</strong>
                </div>
                <div className="sales-pipeline-row">
                  <span style={{ color: '#4b5563', fontWeight: '500' }}>Contacted</span>
                  <div style={{ flex: 1, background: '#f3f4f6', height: '8px', borderRadius: '4px', margin: '0 1rem', overflow: 'hidden' }}>
                    <div style={{ background: '#c2a661', width: '60%', height: '100%' }}></div>
                  </div>
                  <strong style={{ color: '#113629' }}>85</strong>
                </div>
                <div className="sales-pipeline-row">
                  <span style={{ color: '#4b5563', fontWeight: '500' }}>Follow Up</span>
                  <div style={{ flex: 1, background: '#f3f4f6', height: '8px', borderRadius: '4px', margin: '0 1rem', overflow: 'hidden' }}>
                    <div style={{ background: '#c2a661', width: '45%', height: '100%' }}></div>
                  </div>
                  <strong style={{ color: '#113629' }}>64</strong>
                </div>
                <div className="sales-pipeline-row">
                  <span style={{ color: '#4b5563', fontWeight: '500' }}>Proposal</span>
                  <div style={{ flex: 1, background: '#f3f4f6', height: '8px', borderRadius: '4px', margin: '0 1rem', overflow: 'hidden' }}>
                    <div style={{ background: '#c2a661', width: '25%', height: '100%' }}></div>
                  </div>
                  <strong style={{ color: '#113629' }}>32</strong>
                </div>
              </div>

              {/* Side Stats Row */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                <div style={{ flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', boxShadow: '0 4px 10px rgba(0,0,0,0.01)' }}>
                  <div style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 'bold' }}>MEETINGS TODAY</div>
                  <h3 style={{ fontSize: '1.35rem', margin: '2px 0 0 0', color: '#113629' }}>08 <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: '500' }}>Scheduled</span></h3>
                </div>
                <div style={{ flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', boxShadow: '0 4px 10px rgba(0,0,0,0.01)' }}>
                  <div style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 'bold' }}>DEALS THIS MONTH</div>
                  <h3 style={{ fontSize: '1.35rem', margin: '2px 0 0 0', color: '#113629' }}>₹ 5.62 Cr <span style={{ fontSize: '0.62rem', color: '#10b981', fontWeight: 'bold' }}>↗ +10.5%</span></h3>
                </div>
              </div>
            </div>
          )}

          {/* Render Channel Partner Form Left Pane */}
          {view === 'form' && role === 'ChannelPartner' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="left-pane-header">
                <span style={{ fontSize: '0.72rem', color: '#c2a661', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Earn Commissions</span>
                <h1>Partner. Promote.<br/>Earn Together.</h1>
                <p>Submit quality leads and earn exciting commissions on verified closures.</p>
              </div>

              {/* Connections Node Graphics Visual */}
              <div className="cp-nodes-graphic">
                <div className="cp-node-center">You</div>
                {/* Branches */}
                <div className="cp-node-branch" style={{ top: '20px', left: '60px' }}>👤</div>
                <div className="cp-node-branch" style={{ top: '35px', right: '60px' }}>👤</div>
                <div className="cp-node-branch" style={{ bottom: '20px', left: '70px' }}>👤</div>
                <div className="cp-node-branch" style={{ bottom: '30px', right: '70px' }}>👤</div>
                {/* SVG connection lines */}
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                  <line x1="50%" y1="50%" x2="70px" y2="40px" stroke="#e5e7eb" strokeWidth="2" />
                  <line x1="50%" y1="50%" x2="80%" y2="55px" stroke="#e5e7eb" strokeWidth="2" />
                  <line x1="50%" y1="50%" x2="85px" y2="80%" stroke="#e5e7eb" strokeWidth="2" />
                  <line x1="50%" y1="50%" x2="78%" y2="80%" stroke="#e5e7eb" strokeWidth="2" />
                </svg>
                <div style={{ position: 'absolute', bottom: '10px', left: '15px', background: '#e6f4ea', color: '#137333', fontSize: '0.62rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>156 Leads Submitted</div>
              </div>

              {/* Side Stats Row */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                <div style={{ flex: 1.2, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', boxShadow: '0 4px 10px rgba(0,0,0,0.01)' }}>
                  <div style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 'bold' }}>COMMISSIONS EARNED</div>
                  <h3 style={{ fontSize: '1.35rem', margin: '2px 0 0 0', color: '#113629' }}>₹ 2.45 Cr <span style={{ fontSize: '0.62rem', color: '#10b981', fontWeight: 'bold' }}>↑ +22.6%</span></h3>
                </div>
                <div style={{ flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', boxShadow: '0 4px 10px rgba(0,0,0,0.01)' }}>
                  <div style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 'bold' }}>LATEST PAYOUT</div>
                  <h3 style={{ fontSize: '1.35rem', margin: '2px 0 0 0', color: '#113629' }}>₹ 75,000 <span style={{ fontSize: '0.58rem', background: '#e6f4ea', color: '#137333', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold', marginLeft: '3px' }}>Paid</span></h3>
                </div>
              </div>
            </div>
          )}

          {/* Render Buyer Form Left Pane */}
          {view === 'form' && role === 'Buyer' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="left-pane-header">
                <span style={{ fontSize: '0.72rem', color: '#c2a661', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Your Dream Home</span>
                <h1>Your Dream Home.<br/>Our Commitment.</h1>
                <p>Track your booking, payments and construction updates in real-time.</p>
              </div>

              {/* Overlaid Image Visual */}
              <div className="buyer-hero-container" style={{ backgroundImage: `url('/images/hero_building_1777640070355.png')` }}>
                {/* Construction Card Overlay */}
                <div className="buyer-overlay-card" style={{ top: '20px', left: '20px', width: '220px' }}>
                  <span style={{ fontSize: '0.58rem', color: '#9ca3af', fontWeight: 'bold', display: 'block' }}>CONSTRUCTION PROGRESS</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#113629' }}>72%</span>
                    <span style={{ fontSize: '0.58rem', color: '#10b981', fontWeight: 'bold' }}>On Time</span>
                  </div>
                  <div style={{ background: '#e5e7eb', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ background: '#c2a661', width: '72%', height: '100%' }}></div>
                  </div>
                </div>

                {/* Payment Overview Overlay */}
                <div className="buyer-overlay-card" style={{ bottom: '20px', right: '20px', width: '200px' }}>
                  <span style={{ fontSize: '0.58rem', color: '#9ca3af', fontWeight: 'bold', display: 'block' }}>PAYMENT OVERVIEW</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#113629', display: 'block', margin: '2px 0' }}>₹ 18.75 L</span>
                  <span style={{ fontSize: '0.58rem', color: '#6b7280', fontWeight: 'bold' }}>Paid So Far</span>
                </div>
              </div>
            </div>
          )}

          {/* Badges footer row in Left Pane */}
          <div className="bottom-badges-row">
            <div className="badge-item">
              <span>🛡️</span> Secure
            </div>
            <div className="badge-item">
              <span>🤝</span> Reliable
            </div>
            <div className="badge-item">
              <span>⏰</span> Real-time
            </div>
            <div className="badge-item">
              <span>📈</span> Scalable
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN (SELECTION & FORMS PANE) */}
        {/* ========================================== */}
        <div className="login-right-pane">
          
          {/* Header Back Arrow inside forms */}
          {view === 'form' && (
            <button 
              onClick={handleBack} 
              style={{
                position: 'absolute',
                top: '2.5rem',
                left: '5rem',
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: '600'
              }}
            >
              ← Back to Role Selection
            </button>
          )}

          {/* Render Screen 1: Role Selection */}
          {view === 'selection' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ margin: 'auto 0' }}>
                <div style={{ marginBottom: '2rem' }}>
                  <h2 className="serif" style={{ fontSize: '2rem', color: '#113629', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Select Your Role</h2>
                  <p className="text-muted" style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Choose the portal that best matches your role to continue</p>
                </div>

                {/* 4 Cards Grid */}
                <div className="roles-grid">
                  {[
                    { id: 'Admin', label: 'Admin', desc: 'Manage business operations and analytics', icon: '👑' },
                    { id: 'Sales', label: 'Salesperson', desc: 'Handle leads and customer pipeline', icon: '🧑‍💼' },
                    { id: 'ChannelPartner', label: 'CP (Channel Partner)', desc: 'Submit and track leads & commissions', icon: '🤝' },
                    { id: 'Buyer', label: 'Buyer / User', desc: 'Track booking, payments and construction updates', icon: '👤' }
                  ].map(r => (
                    <div 
                      key={r.id} 
                      onClick={() => handleSelectCard(r.id)}
                      onDoubleClick={() => {
                        setSelectedRole(r.id);
                        setRole(r.id);
                        setView('form');
                      }}
                      className={`role-card ${selectedRole === r.id ? 'active' : ''}`}
                    >
                      <div className="role-card-icon">
                        {r.icon}
                      </div>
                      <h3>{r.label}</h3>
                      <p>{r.desc}</p>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleContinue}
                  className="continue-btn"
                  disabled={!selectedRole}
                >
                  Continue →
                </button>
              </div>

              {/* Screen 1 Footer */}
              <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af' }}>
                © 2025 Homeland Real Estate. All rights reserved.
              </div>
            </div>
          )}

          {/* Render Screens 2-5: Form Access views */}
          {view === 'form' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
              
              <div className="form-header-box">
                <div style={{ 
                  width: '54px', 
                  height: '54px', 
                  background: 'rgba(194,166,97,0.1)', 
                  color: '#b08e40', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  marginBottom: '1rem' 
                }}>
                  {role === 'Admin' ? '👑' : role === 'Sales' ? '🧑‍💼' : role === 'ChannelPartner' ? '🤝' : '👤'}
                </div>
                <h1>{
                  role === 'Admin' ? 'Admin Portal' : 
                  role === 'Sales' ? 'Sales Portal' : 
                  role === 'ChannelPartner' ? 'Channel Partner Portal' : 
                  'Buyer Portal'
                }</h1>
                <p>
                  {role === 'Admin' ? 'Control your business operations' :
                   role === 'Sales' ? 'Manage leads and close deals faster' :
                   role === 'ChannelPartner' ? 'Submit leads and track commissions' :
                   'Track your home journey and payments'}
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
                
                {/* Username Input Field */}
                <div className="login-form-group">
                  <label>
                    {role === 'Admin' ? 'Admin ID / Email Address' :
                     role === 'Sales' ? 'Sales Representative ID / Email' :
                     role === 'ChannelPartner' ? 'Broker ID / Email' :
                     'Email Address / Username'}
                  </label>
                  <div className="login-input-wrapper">
                    <span className="login-input-icon">👤</span>
                    <input 
                      type="text" 
                      name="username" 
                      placeholder={
                        role === 'Admin' ? 'ADM-XXXX' :
                        role === 'Sales' ? 'SR-XXXXX' :
                        role === 'ChannelPartner' ? 'cpXXX' :
                        'Enter your username'
                      }
                      className="login-input-field"
                      required
                    />
                  </div>
                </div>

                {/* Password Input Field */}
                <div className="login-form-group">
                  <label>Password</label>
                  <div className="login-input-wrapper">
                    <span className="login-input-icon">🔒</span>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password" 
                      placeholder="Enter password" 
                      className="login-input-field"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        opacity: 0.6
                      }}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                {/* Options Row */}
                <div className="login-form-options">
                  <label className="login-checkbox-label">
                    <input type="checkbox" style={{ accentColor: '#c2a661' }} />
                    Remember Me
                  </label>
                  <a 
                    href="#forgot" 
                    onClick={(e) => { e.preventDefault(); showDemoCredentials(); }}
                    className="login-forgot-link"
                  >
                    Forgot Password?
                  </a>
                </div>

                {/* Main Submit Button */}
                <button type="submit" className="continue-btn" style={{ height: '46px', marginTop: '0.5rem' }}>
                  Login
                </button>

                {/* Divider & Secondary continuation options */}
                <div className="or-divider">
                  <span>or continue with</span>
                </div>

                <div className="social-auth-grid">
                  <button type="button" onClick={() => alert('Google authentication simulated')} className="social-auth-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.6 4.5 1.7l2.4-2.4C17.3 1.5 14.9.8 12.24.8c-5.96 0-10.8 4.84-10.8 10.8s4.84 10.8 10.8 10.8c6.2 0 11.2-4.4 11.2-10.8 0-.7-.1-1.3-.2-1.8H12.24z"/></svg>
                    Google
                  </button>
                  {role === 'Admin' || role === 'Sales' ? (
                    <button type="button" onClick={() => alert('Microsoft authentication simulated')} className="social-auth-btn">
                      <svg width="14" height="14" viewBox="0 0 23 23"><path d="M0 0h11v11H0z" fill="#f25022"/><path d="M12 0h11v11H12z" fill="#7fba00"/><path d="M0 12h11v11H0z" fill="#00a4ef"/><path d="M12 12h11v11H12z" fill="#ffb900"/></svg>
                      Microsoft
                    </button>
                  ) : (
                    <button type="button" onClick={() => alert('Apple authentication simulated')} className="social-auth-btn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.84-.98 2.94.1.08.2.12.3.12.87 0 1.95-.57 2.51-1.45z"/></svg>
                      Apple
                    </button>
                  )}
                </div>

                <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#6b7280', marginTop: '1rem' }}>
                  Need help? <a href="#support" onClick={(e) => { e.preventDefault(); alert('Please contact administrator at support@homeland.com'); }} style={{ color: '#c2a661', textDecoration: 'none', fontWeight: 600 }}>Contact Support</a>
                </div>
              </form>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
