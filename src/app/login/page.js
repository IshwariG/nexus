"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import './login.css';

/* ─── Premium SVG Icons ─── */
const GoldLogoIcon = () => (
  <svg width="34" height="34" viewBox="0 0 34 34" fill="none" style={{ display: 'block' }}>
    {/* Golden real estate building steps */}
    <rect x="3" y="15" width="6" height="15" rx="1.5" fill="#c9a84c" />
    <rect x="13" y="5" width="8" height="25" rx="1.5" fill="#0d2a1d" />
    <rect x="25" y="10" width="6" height="20" rx="1.5" fill="#dfbf68" />
    {/* Decorative line underneath */}
    <path d="M2 32H32" stroke="#0d2a1d" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const AdminShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 8v8" />
    <path d="M9 11h6" />
  </svg>
);

const SalesPersonIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const PartnerHandshakeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const BuyerHomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const EyeOnIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const ShieldSecureIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const RightArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const TrendUpIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const ROLES = [
  { id: 'Admin', label: 'Admin', desc: 'Manage business operations and analytics', Icon: AdminShieldIcon },
  { id: 'Sales', label: 'Salesperson', desc: 'Handle leads and customer pipeline', Icon: SalesPersonIcon },
  { id: 'ChannelPartner', label: 'Channel Partner', desc: 'Submit and track leads & commissions', Icon: PartnerHandshakeIcon },
  { id: 'Buyer', label: 'Buyer / User', desc: 'Track booking, payments and construction updates', Icon: BuyerHomeIcon },
];

const PORTAL_META = {
  Admin: { title: 'Admin Portal', sub: 'Control your business operations', Icon: AdminShieldIcon, cls: 'admin' },
  Sales: { title: 'Sales Portal', sub: 'Manage leads and close deals faster', Icon: SalesPersonIcon, cls: 'sales' },
  ChannelPartner: { title: 'Channel Partner Portal', sub: 'Submit leads and track commissions', Icon: PartnerHandshakeIcon, cls: 'cp' },
  Buyer: { title: 'Buyer Portal', sub: 'Track your home journey and payments', Icon: BuyerHomeIcon, cls: 'buyer' },
};

/* ═══════════════════════════════════════════════════
   Forgot Password Modal (OTP Flow)
   ══════════════════════════════════════════════════ */
function ForgotModal({ onClose }) {
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: New Password
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoOtp, setDemoOtp] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setDemoOtp(data.demo_otp); // For testing
        setStep(2);
      } else {
        setError(data.error);
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), otp: otp.trim(), newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setStep(4); // Success step
      } else {
        setError(data.error);
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(13,42,29,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(5px)' }}>
      <div style={{ background:'#fff', borderRadius:'16px', padding:'2.25rem', width:'100%', maxWidth:'420px', boxShadow:'0 20px 50px rgba(13,42,29,0.15)', animation:'fadeIn 0.25s ease' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
          <div>
            <h2 style={{ fontFamily:'var(--font-serif), Georgia, serif', fontSize:'1.35rem', color:'#0d2a1d', margin:'0 0 0.25rem', fontWeight:'700' }}>Reset Password</h2>
            <p style={{ fontSize:'0.78rem', color:'#8e8b82', margin:0 }}>
              {step === 1 ? 'Enter your registered phone number' : step === 2 ? 'We sent a code to your phone' : step === 3 ? 'Create a new password' : ''}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'1.6rem', cursor:'pointer', color:'#8e8b82', lineHeight:1, padding:'0 0.2rem' }}>×</button>
        </div>

        {error && <div style={{ background:'#fee2e2', color:'#dc2626', padding:'0.75rem', borderRadius:'8px', fontSize:'0.8rem', marginBottom:'1rem', border:'1px solid #fca5a5' }}>{error}</div>}

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:'600', color:'#5a5750', marginBottom:'0.35rem' }}>Phone Number</label>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 9876543210" required
              className="input-field-custom"
              style={{ paddingLeft: '1rem', marginBottom:'1.25rem' }}
            />
            <button type="submit" disabled={loading} className="btn-gold-pill">
              {loading ? 'Sending OTP…' : 'Send OTP'}
              <span className="btn-arrow-circle"><RightArrowIcon /></span>
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); setError(''); setStep(3); }}>
            {demoOtp && <div style={{ fontSize:'0.75rem', color:'#10b981', marginBottom:'1rem', fontWeight:'600' }}>Test Mode OTP: {demoOtp}</div>}
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:'600', color:'#5a5750', marginBottom:'0.35rem' }}>Enter 6-digit OTP</label>
            <input
              type="text" maxLength="6" value={otp} onChange={e => setOtp(e.target.value)}
              placeholder="000000" required
              className="input-field-custom"
              style={{ paddingLeft: '1rem', fontSize:'1.3rem', letterSpacing:'6px', textAlign:'center', fontFamily:'monospace', marginBottom:'1.25rem' }}
            />
            <button type="submit" className="btn-gold-pill">
              Verify OTP
              <span className="btn-arrow-circle"><RightArrowIcon /></span>
            </button>
            <div style={{ textAlign:'center', marginTop:'1.1rem' }}>
              <button type="button" onClick={() => setStep(1)} style={{ background:'none', border:'none', color:'#8e8b82', fontSize:'0.75rem', cursor:'pointer', textDecoration:'underline', fontFamily:'inherit' }}>Change Phone Number</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:'600', color:'#5a5750', marginBottom:'0.35rem' }}>New Password</label>
              <input
                type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password" required
                className="input-field-custom"
                style={{ paddingLeft: '1rem' }}
              />
            </div>
            <div style={{ marginBottom:'1.25rem' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:'600', color:'#5a5750', marginBottom:'0.35rem' }}>Confirm Password</label>
              <input
                type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password" required
                className="input-field-custom"
                style={{ paddingLeft: '1rem' }}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-gold-pill">
              {loading ? 'Updating…' : 'Reset Password'}
              <span className="btn-arrow-circle"><RightArrowIcon /></span>
            </button>
          </form>
        )}

        {step === 4 && (
          <div style={{ textAlign:'center', padding:'1rem 0' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'#e6f4ea', color:'#137333', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem', fontSize:'1.6rem' }}>✓</div>
            <p style={{ fontSize:'1.05rem', color:'#0d2a1d', fontWeight:'700', marginBottom:'0.5rem' }}>Password Reset Successful</p>
            <p style={{ fontSize:'0.82rem', color:'#8e8b82', marginBottom:'1.5rem' }}>You can now log in with your new password.</p>
            <button onClick={onClose} className="btn-gold-pill">Back to Login</button>
          </div>
        )}

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Contact Support Modal
   ══════════════════════════════════════════════════ */
function SupportModal({ onClose }) {
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState('');
  const [name, setName] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!msg.trim() || !name.trim()) return;
    setSent(true);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(13,42,29,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(5px)' }}>
      <div style={{ background:'#fff', borderRadius:'16px', padding:'2.25rem', width:'100%', maxWidth:'460px', boxShadow:'0 20px 50px rgba(13,42,29,0.15)', animation:'fadeIn 0.25s ease' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
          <div>
            <h2 style={{ fontFamily:'var(--font-serif), Georgia, serif', fontSize:'1.35rem', color:'#0d2a1d', margin:'0 0 0.25rem', fontWeight:'700' }}>Contact Support</h2>
            <p style={{ fontSize:'0.78rem', color:'#8e8b82', margin:0 }}>We typically respond within 2–4 hours</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'1.6rem', cursor:'pointer', color:'#8e8b82', lineHeight:1, padding:'0 0.2rem' }}>×</button>
        </div>

        {/* Contact Info */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1.5rem' }}>
          {[
            { icon:'📧', label:'Email', val:'support@homeland.com' },
            { icon:'📞', label:'Phone', val:'+91 98765 43210' },
            { icon:'🕐', label:'Hours', val:'Mon–Sat, 9am–7pm IST' },
            { icon:'📍', label:'Office', val:'Mumbai, Maharashtra' },
          ].map(c => (
            <div key={c.label} style={{ background:'#faf9f6', borderRadius:'8px', padding:'0.7rem 0.9rem', border:'1px solid #eae8e1' }}>
              <div style={{ fontSize:'0.82rem', marginBottom:'2px' }}>{c.icon}</div>
              <div style={{ fontSize:'0.58rem', color:'#8e8b82', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.5px' }}>{c.label}</div>
              <div style={{ fontSize:'0.74rem', color:'#0d2a1d', fontWeight:'600', marginTop:'2px' }}>{c.val}</div>
            </div>
          ))}
        </div>

        {!sent ? (
          <form onSubmit={handleSend}>
            <div style={{ marginBottom:'0.85rem' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:'600', color:'#5a5750', marginBottom:'0.3rem' }}>Your Name</label>
              <input value={name} onChange={e => setName(e.target.value)} type="text" required placeholder="Enter your name"
                className="input-field-custom" style={{ paddingLeft: '1rem' }}
              />
            </div>
            <div style={{ marginBottom:'1.25rem' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:'600', color:'#5a5750', marginBottom:'0.3rem' }}>Message</label>
              <textarea value={msg} onChange={e => setMsg(e.target.value)} required rows={3} placeholder="Describe your issue or question…"
                style={{ width:'100%', padding:'0.7rem 0.85rem', border:'1px solid var(--border)', borderRadius:'8px', fontSize:'0.88rem', outline:'none', fontFamily:'inherit', boxSizing:'border-box', resize:'vertical', color: 'var(--text-dark)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--brand-gold)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
              />
            </div>
            <button type="submit" className="btn-gold-pill">
              Send Message
              <span className="btn-arrow-circle"><RightArrowIcon /></span>
            </button>
          </form>
        ) : (
          <div style={{ textAlign:'center', padding:'1rem 0' }}>
            <div style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>✓</div>
            <p style={{ fontSize:'0.95rem', fontWeight:'700', color:'#0d2a1d', marginBottom:'0.4rem' }}>Message Sent!</p>
            <p style={{ fontSize:'0.8rem', color:'#8e8b82', marginBottom:'1.5rem' }}>Our team will get back to you at the earliest.</p>
            <button onClick={onClose} className="btn-gold-pill">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ══════════════════════════════════════════════════════ */
export default function LoginPage() {
  const [view, setView] = useState('selection');
  const [selectedRole, setSelectedRole] = useState('Admin');
  const [role, setRole] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [savedUsername, setSavedUsername] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load remembered username on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('homeland_remembered_user');
      if (saved) { 
        setSavedUsername(saved); 
        setRememberMe(true); 
      }
    }
  }, []);

  // Handle URL errors (e.g. from callback)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err) {
        setErrorMsg(err);
      }
    }
  }, []);

  const goForm = (r) => { 
    setRole(r || selectedRole); 
    setView('form'); 
    setErrorMsg(''); 
  };
  
  const goBack = () => { 
    setView('selection'); 
    setRole(null); 
    setShowPw(false); 
    setErrorMsg(''); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const username = e.target.username.value;
    const password = e.target.password.value;

    // Handle Remember Me
    if (typeof window !== 'undefined') {
      if (rememberMe) localStorage.setItem('homeland_remembered_user', username);
      else localStorage.removeItem('homeland_remembered_user');
    }

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
        setErrorMsg(data.error || 'Invalid credentials.');
      }
    } catch (err) { 
      setErrorMsg('Connection error: ' + err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const meta = role ? PORTAL_META[role] : null;

  return (
    <div className="login-page-container">

      {/* ══ LEFT PANE: DYNAMIC ILLUSTRATIONS ══ */}
      <div className="login-left-panel" style={{ padding: '3rem 4rem', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {/* Absolute Background Layer */}
        {view === 'selection' && (
          <>
            <img src="/images/selection_portal_bg.png" alt="Welcome Bg" className="admin-bg-image" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
            <div className="admin-bg-tint" style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
          </>
        )}
        {view === 'form' && role === 'Admin' && (
          <>
            <img src="/images/admin_portal_bg.png" alt="Admin Bg" className="admin-bg-image" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
            <div className="admin-bg-tint" style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
          </>
        )}
        {view === 'form' && role === 'Sales' && (
          <>
            <div className="sales-left-workspace" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, border: 'none', borderRadius: 0, boxShadow: 'none' }} />
            <div className="sales-workspace-tint" style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
          </>
        )}
        {view === 'form' && role === 'ChannelPartner' && (
          <>
            <div className="cp-left-topography" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, border: 'none', borderRadius: 0, boxShadow: 'none' }} />
            <div className="cp-topography-tint" style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
          </>
        )}
        {view === 'form' && role === 'Buyer' && (
          <>
            <div className="buyer-left-couch" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, border: 'none', borderRadius: 0, boxShadow: 'none' }} />
            <div className="buyer-couch-tint" style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
          </>
        )}

        {/* Foreground Content Layer */}
        <div className="left-content-wrapper" style={{ zIndex: 2, position: 'relative', display: 'flex', flexDirection: 'column', flex: 1 }}>
          
          {/* Logo */}
          <div className="custom-logo">
            <GoldLogoIcon />
            <div className="custom-logo-text">
              <span className="custom-logo-title" style={{ color: '#ffffff' }}>Real Estate</span>
              <span className="custom-logo-subtitle" style={{ color: '#ffffff' }}>─ CRM + ERP ─</span>
            </div>
          </div>

          <div>
            <div className="welcome-badge" style={{ background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>Welcome to</div>
            <h1 className="left-title" style={{ color: '#ffffff' }}>
              Real Estate<br />
              <span style={{ color: '#ffffff' }}>CRM + ERP</span> Platform
            </h1>
            <p className="left-subtitle" style={{ color: '#ffffff' }}>
              Manage Sales, Inventory, Leads,<br />
              Buyers &amp; Operations – All in One Place
            </p>
          </div>

          {/* Visual Widgets Area */}
          {view === 'selection' && (
            <div style={{ flex: 1 }} />
          )}

          {view === 'form' && role === 'Admin' && (
            <div style={{ flex: 1, position: 'relative', marginTop: '1rem' }}>
              <div className="floating-widgets-container" style={{ position: 'relative', padding: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Card 1: Total Revenue */}
                <div className="floating-kpi-card">
                  <div className="kpi-header">
                    <span>Total Revenue</span>
                    <span className="kpi-header-arrow">→</span>
                  </div>
                  <div className="kpi-value-mono">₹ 24.68 Cr</div>
                  <div className="kpi-trend-pill">
                    <TrendUpIcon />
                    <span>24.5% <span style={{color: 'var(--text-muted)', fontWeight: 500}}>vs last month</span></span>
                  </div>
                </div>
                {/* Card 2: Bookings */}
                <div className="floating-kpi-card">
                  <div className="kpi-header">
                    <span>Bookings</span>
                    <div className="donut-circle-chart">
                      <svg width="24" height="24" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e0e7ff" strokeWidth="4" />
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--brand-gold)" strokeWidth="4" strokeDasharray="72 28" strokeDashoffset="25" />
                      </svg>
                    </div>
                  </div>
                  <div className="kpi-value-mono">128</div>
                  <div className="kpi-trend-pill">
                    <TrendUpIcon />
                    <span>18%</span>
                  </div>
                </div>
                {/* Card 3: Active Leads */}
                <div className="floating-kpi-card">
                  <div className="kpi-header">
                    <span>Active Leads</span>
                    <span style={{ color: '#10b981' }}><ShieldSecureIcon /></span>
                  </div>
                  <div className="kpi-value-mono">356</div>
                  <div className="kpi-trend-pill">
                    <TrendUpIcon />
                    <span>12%</span>
                  </div>
                </div>
                {/* Card 4: Collections */}
                <div className="floating-kpi-card">
                  <div className="kpi-header">
                    <span>Collections</span>
                    <span className="kpi-header-arrow">→</span>
                  </div>
                  <div className="kpi-value-mono">₹ 18.34 Cr</div>
                  <div className="kpi-trend-pill">
                    <TrendUpIcon />
                    <span>20.3%</span>
                  </div>
                  <svg className="sparkline-svg" viewBox="0 0 100 30" aria-hidden>
                    <path d="M0,25 Q15,5 30,20 T60,10 T80,28 T100,8" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {view === 'form' && role === 'Sales' && (
            <div style={{ flex: 1, position: 'relative', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Simulated Desk Mockup Layout */}
              <div className="sales-desk-mock" style={{ width: '100%', height: '100%', padding: 0 }}>
                {/* Laptop Mockup */}
                <div className="laptop-mock-outer" style={{ width: '75%' }}>
                  <div className="laptop-screen">
                    <div className="laptop-pipeline-title">Lead Pipeline</div>
                    <div className="pipeline-mini-chart">
                      {[
                        { label: 'New Lead', pct: 82, val: 38 },
                        { label: 'Site Visit', pct: 60, val: 18 },
                        { label: 'Negotiate', pct: 45, val: 15 },
                        { label: 'Booking', pct: 28, val: 12 }
                      ].map(p => (
                        <div key={p.label} className="pipeline-mini-row">
                          <span className="pipeline-mini-label">{p.label}</span>
                          <div className="pipeline-mini-bar-wrap">
                            <div className="pipeline-mini-bar" style={{ width: `${p.pct}%` }} />
                          </div>
                          <span className="pipeline-mini-value">{p.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="laptop-base" style={{ width: '83%' }} />

                {/* Mobile Phone Mockup */}
                <div className="phone-mock-floating" style={{ right: '0rem', top: '0rem', width: '105px' }}>
                  <div className="phone-screen">
                    <div className="phone-header">Hot Leads</div>
                    {[
                      { name: 'Rahul Sharma', init: 'RS' },
                      { name: 'Nidhi Verma', init: 'NV' },
                      { name: 'Amit Patel', init: 'AP' }
                    ].map(c => (
                      <div key={c.name} className="phone-contact-row">
                        <div className="phone-avatar">{c.init}</div>
                        <span className="phone-name">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Today's Followups Card Overlay */}
                <div className="followups-floating-card" style={{ bottom: '0rem', left: '0rem', width: '185px' }}>
                  <div className="followups-title">Today's Followups</div>
                  <div className="followup-metrics-grid">
                    <div className="followup-metric-item">
                      <div className="followup-metric-num">07</div>
                      <div className="followup-metric-label">Calls</div>
                    </div>
                    <div className="followup-metric-item" style={{ borderLeft: '1px solid #ebdcb9', borderRight: '1px solid #ebdcb9' }}>
                      <div className="followup-metric-num">03</div>
                      <div className="followup-metric-label">Meetings</div>
                    </div>
                    <div className="followup-metric-item">
                      <div className="followup-metric-num">04</div>
                      <div className="followup-metric-label">Site Visit</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {view === 'form' && role === 'ChannelPartner' && (
            <div style={{ flex: 1, position: 'relative', marginTop: '1rem' }}>
              {/* Floating Widget: Leads Submitted */}
              <div className="cp-floating-leads" style={{ top: '0rem', left: '0rem' }}>
                <div className="kpi-header" style={{ marginBottom: '3px' }}>Leads Submitted</div>
                <div className="kpi-value-mono" style={{ fontSize: '1.2rem', margin: 0 }}>124</div>
                <div className="kpi-trend-pill" style={{ marginTop: '2px' }}>
                  <TrendUpIcon />
                  <span>21%</span>
                </div>
              </div>

              {/* Handshake Graphic Badge */}
              <div className="cp-handshake-badge" style={{ top: '0rem', right: '0rem' }}>🤝</div>

              {/* Floating Widget: Commission Earned */}
              <div className="cp-floating-commission" style={{ top: '5rem', right: '0rem' }}>
                <div className="kpi-header" style={{ marginBottom: '3px' }}>Commission Earned</div>
                <div className="kpi-value-mono" style={{ fontSize: '1.2rem', margin: 0 }}>₹ 3.62 L</div>
                <div className="kpi-trend-pill" style={{ marginTop: '2px' }}>
                  <TrendUpIcon />
                  <span>18%</span>
                </div>
              </div>

              {/* Floating Widget: Recent Leads */}
              <div className="cp-recent-leads-card" style={{ bottom: '0rem', right: '0rem' }}>
                <div className="followups-title" style={{ borderBottom: '1px solid #f0eee8', paddingBottom: '3px', marginBottom: '4px' }}>Recent Leads</div>
                {[
                  { name: 'Rohan Mehta', role: 'Site Visit', init: 'RM' },
                  { name: 'Sneha Desai', role: 'Follow Up', init: 'SD' },
                  { name: 'Vikram Singh', role: 'Interested', init: 'VS' }
                ].map(l => (
                  <div key={l.name} className="cp-recent-lead-row">
                    <div className="phone-avatar" style={{ background: '#ecfdf5', color: '#10b981', width: '13px', height: '13px' }}>{l.init}</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{l.name}</span>
                      <span style={{ fontSize: '0.48rem', color: 'var(--text-muted)' }}>{l.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'form' && role === 'Buyer' && (
            <div style={{ flex: 1, position: 'relative', marginTop: '1rem' }}>
              {/* Floating Widget: Booking Status */}
              <div className="buyer-floating-status" style={{ top: '0rem', left: '0rem' }}>
                <div className="kpi-header">Booking Status</div>
                <div className="buyer-status-pill">
                  <span style={{ fontSize: '0.62rem' }}>✓</span> Confirmed
                </div>
              </div>

              {/* Floating Widget: Next Payment */}
              <div className="buyer-floating-payment" style={{ top: '0rem', right: '0rem' }}>
                <div className="kpi-header">Next Payment</div>
                <div className="kpi-value-mono" style={{ fontSize: '1.2rem', margin: '4px 0 2px' }}>₹ 2,45,000</div>
                <div className="kpi-sub-text">Due on 15-May-2025</div>
              </div>

              {/* Floating Widget: Construction Progress */}
              <div className="buyer-floating-progress" style={{ bottom: '0rem', left: '0rem' }}>
                <div className="kpi-header">Construction</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
                  <span className="kpi-value-mono" style={{ fontSize: '1.25rem', margin: 0 }}>65%</span>
                  <span style={{ fontSize: '0.55rem', color: 'var(--brand-gold)', fontWeight: 700 }}>Completed</span>
                </div>
                <div className="buyer-progress-bar-wrap">
                  <div className="buyer-progress-bar" style={{ width: '65%' }} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ══ RIGHT PANE: LOGIN FORMS AND INTERACTIVE CHOICES ══ */}
      <div className="login-right-panel">

        {/* ── VIEW 1: ROLE SELECTION GRID ── */}
        {view === 'selection' && (
          <div className="animate-fade-in">
            <h2 className="selection-title">Select your role to continue</h2>
            <div className="divider-ornament">
              <div className="divider-line" />
              <div className="divider-diamond" />
              <div className="divider-line" />
            </div>

            <div className="roles-grid">
              {ROLES.map(r => {
                const CardIcon = r.Icon;
                return (
                  <div
                    key={r.id}
                    className={`role-grid-card ${selectedRole === r.id ? 'active' : ''}`}
                    onMouseEnter={() => setSelectedRole(r.id)}
                    onClick={() => goForm(r.id)}
                  >
                    <div className="role-card-icon-wrap">
                      <CardIcon />
                    </div>
                    <h3 className="role-card-label">{r.label}</h3>
                    <p className="role-card-desc">{r.desc}</p>
                    <div className="role-card-arrow">
                      <RightArrowIcon />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="selection-footer-support">
              Need help? <button onClick={() => setShowSupport(true)}>Contact Support</button>
            </div>
          </div>
        )}

        {/* ── VIEW 2: CREDENTIALS FORMS ── */}
        {view === 'form' && meta && (
          <div className="animate-fade-in">
            {/* Back Button */}
            <button onClick={goBack} className="back-navigation-btn">
              <span>←</span> Back to role selection
            </button>

            {/* Portal header */}
            <div className="portal-form-header">
              <div className={`portal-badge-circle ${meta.cls}`}>
                <meta.Icon />
              </div>
              <h1 className="portal-form-title">{meta.title}</h1>
              <p className="portal-form-subtitle">{meta.sub}</p>
            </div>

            {/* Status Feedback Warnings */}
            {errorMsg && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1.5rem', border: '1px solid #fca5a5', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>⚠️</span> {errorMsg}
              </div>
            )}

            {/* Main Form submit triggers Supabase endpoint via local authentication */}
            <form onSubmit={handleSubmit}>
              
              {/* Username Input with User icon */}
              <div className="login-input-group">
                <div className="input-container-with-icon">
                  <span className="input-icon-left">
                    <UserIcon />
                  </span>
                  <input
                    name="username"
                    type="text"
                    placeholder="Username"
                    defaultValue={savedUsername}
                    required
                    className="input-field-custom"
                  />
                </div>
              </div>

              {/* Password Input with Lock icon and Eye Toggle visibility */}
              <div className="login-input-group">
                <div className="input-container-with-icon">
                  <span className="input-icon-left">
                    <LockIcon />
                  </span>
                  <input
                    name="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Password"
                    required
                    className="input-field-custom has-right-toggle"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="input-toggle-right">
                    {showPw ? <EyeOnIcon /> : <EyeOffIcon />}
                  </button>
                </div>
              </div>

              {/* Remember Me and Forgot Password linkages */}
              <div className="options-row-custom">
                <label className="custom-checkbox-container">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
                <button type="button" onClick={() => setShowForgot(true)} className="forgot-password-link">
                  Forgot password?
                </button>
              </div>

              {/* Login Button with Circular Arrow Icon */}
              <button
                type="submit"
                disabled={loading}
                className="btn-gold-pill"
              >
                {loading ? 'Logging in…' : `Login as ${meta.title.split(' ')[0]}`}
                <span className="btn-arrow-circle">
                  <RightArrowIcon />
                </span>
              </button>

            </form>

            {/* Secure Login Badge Footnote */}
            <div className="secure-login-footer">
              <span><ShieldSecureIcon /></span>
              <span>Secure login</span>
            </div>
          </div>
        )}

      </div>

      {/* Modals for password recovery OTP & Contact Support */}
      {showForgot && <ForgotModal onClose={() => setShowForgot(false)} />}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}

    </div>
  );
}
