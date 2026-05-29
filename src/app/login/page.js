"use client";
import { useState } from 'react';

/* ─── Brand Colors ─── */
const G = '#113629';
const GOLD = '#C9A84C';
const GOLD2 = '#b8962e';

/* ─── SVG Icons ─── */
const Logo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect x="2"  y="13" width="5" height="13" rx="1.2" fill={GOLD}/>
    <rect x="11" y="4"  width="6" height="22" rx="1.2" fill={G}/>
    <rect x="21" y="8"  width="5" height="18" rx="1.2" fill={GOLD}/>
  </svg>
);

const AdminIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.5 7h7.5l-6 4.5 2.5 7L12 17l-6.5 3.5 2.5-7L2 9h7.5z"/>
  </svg>
);

const SalesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);

const CPIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const EyeOn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ─── Reusable Input ─── */
const Input = ({ label, name, type = 'text', placeholder, children }) => (
  <div style={{ marginBottom: '1rem' }}>
    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>{label}</label>
    <div style={{ position: 'relative' }}>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required
        style={{
          width: '100%', height: '42px', padding: '0 2.5rem 0 0.85rem',
          border: '1px solid #e5e7eb', borderRadius: '7px',
          fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit',
          boxSizing: 'border-box', background: '#fff', color: '#1f2937'
        }}
        onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 3px rgba(201,168,76,0.12)`; }}
        onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
      />
      {children}
    </div>
  </div>
);

/* ─── KPI Card ─── */
const KpiCard = ({ label, value, sub, subColor = '#10b981', extra }) => (
  <div style={{ background: '#fff', borderRadius: '10px', padding: '1rem 1.1rem', border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
    <div style={{ fontSize: '0.58rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</div>
    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: G, margin: '4px 0 2px', fontFamily: 'Georgia,serif' }}>{value}</div>
    <div style={{ fontSize: '0.62rem', fontWeight: '600', color: subColor }}>{sub}</div>
    {extra}
  </div>
);

/* ─── Role Card ─── */
const RoleCard = ({ id, label, desc, Icon, active, onClick, onDoubleClick }) => (
  <div
    onClick={onClick}
    onDoubleClick={onDoubleClick}
    style={{
      background: '#fff',
      border: `1.5px solid ${active ? GOLD : '#e5e7eb'}`,
      borderRadius: '12px',
      padding: '1.1rem',
      cursor: 'pointer',
      transition: 'all 0.18s',
      boxShadow: active ? `0 4px 18px rgba(201,168,76,0.13)` : '0 1px 4px rgba(0,0,0,0.03)',
      background: active ? 'rgba(201,168,76,0.04)' : '#fff',
    }}
  >
    <div style={{
      width: '40px', height: '40px', borderRadius: '9px',
      background: active ? '#fdf3d0' : '#fdf8ee',
      border: `1px solid ${active ? GOLD : '#f0e8cc'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: '0.65rem'
    }}>
      <Icon />
    </div>
    <div style={{ fontSize: '0.88rem', fontWeight: '700', color: G, marginBottom: '0.25rem', fontFamily: 'Georgia,serif' }}>{label}</div>
    <div style={{ fontSize: '0.7rem', color: '#6b7280', lineHeight: '1.4' }}>{desc}</div>
  </div>
);

/* ─── Portal Icon Ring ─── */
const PortalRing = ({ Icon }) => (
  <div style={{
    width: '58px', height: '58px', borderRadius: '50%',
    background: '#fdf8ee', border: `1.5px solid #f0e8cc`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 0.85rem'
  }}>
    <Icon />
  </div>
);

const ROLES = [
  { id: 'Admin', label: 'Admin', desc: 'Manage business operations and analytics', Icon: AdminIcon },
  { id: 'Sales', label: 'Salesperson', desc: 'Handle leads and customer pipeline', Icon: SalesIcon },
  { id: 'ChannelPartner', label: 'CP (Channel Partner)', desc: 'Submit and track leads & commissions', Icon: CPIcon },
  { id: 'Buyer', label: 'Buyer / User', desc: 'Track booking, payments and construction updates', Icon: HomeIcon },
];

const PORTAL_META = {
  Admin:         { title: 'Admin Portal',          sub: 'Control your business operations',     Icon: ShieldIcon },
  Sales:         { title: 'Sales Portal',           sub: 'Manage leads and close deals faster',  Icon: SalesIcon  },
  ChannelPartner:{ title: 'Channel Partner Portal', sub: 'Submit leads and track commissions',   Icon: CPIcon     },
  Buyer:         { title: 'Buyer Portal',           sub: 'Track your home journey and payments', Icon: HomeIcon   },
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
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#fff', borderRadius:'16px', padding:'2rem 2.25rem', width:'100%', maxWidth:'420px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)', animation:'fadeIn 0.25s ease' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
          <div>
            <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.25rem', color:G, margin:'0 0 0.2rem', fontWeight:'700' }}>Reset Password</h2>
            <p style={{ fontSize:'0.78rem', color:'#6b7280', margin:0 }}>
              {step === 1 ? 'Enter your registered phone number' : step === 2 ? 'We sent a code to your phone' : step === 3 ? 'Create a new password' : ''}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'1.4rem', cursor:'pointer', color:'#9ca3af', lineHeight:1, padding:'0 0.2rem' }}>×</button>
        </div>

        {error && <div style={{ background:'#fee2e2', color:'#dc2626', padding:'0.75rem', borderRadius:'8px', fontSize:'0.8rem', marginBottom:'1rem' }}>{error}</div>}

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:'600', color:'#374151', marginBottom:'0.35rem' }}>Phone Number</label>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 9876543210" required
              style={{ width:'100%', height:'42px', padding:'0 0.85rem', border:'1px solid #e5e7eb', borderRadius:'7px', fontSize:'0.85rem', outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:'1.25rem' }}
              onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 3px rgba(201,168,76,0.12)`; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
            <button type="submit" disabled={loading}
              style={{ width:'100%', height:'42px', background:GOLD, border:'none', borderRadius:'7px', color:'#fff', fontWeight:'700', fontSize:'0.88rem', cursor:'pointer' }}>
              {loading ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); setError(''); setStep(3); }}>
            {demoOtp && <div style={{ fontSize:'0.75rem', color:'#10b981', marginBottom:'1rem' }}>Test Mode OTP: {demoOtp}</div>}
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:'600', color:'#374151', marginBottom:'0.35rem' }}>Enter 6-digit OTP</label>
            <input
              type="text" maxLength="6" value={otp} onChange={e => setOtp(e.target.value)}
              placeholder="000000" required
              style={{ width:'100%', height:'42px', padding:'0 0.85rem', border:'1px solid #e5e7eb', borderRadius:'7px', fontSize:'1.2rem', letterSpacing:'4px', textAlign:'center', outline:'none', fontFamily:'monospace', boxSizing:'border-box', marginBottom:'1.25rem' }}
              onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 3px rgba(201,168,76,0.12)`; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
            <button type="submit"
              style={{ width:'100%', height:'42px', background:GOLD, border:'none', borderRadius:'7px', color:'#fff', fontWeight:'700', fontSize:'0.88rem', cursor:'pointer' }}>
              Verify OTP
            </button>
            <div style={{ textAlign:'center', marginTop:'1rem' }}>
              <button type="button" onClick={() => setStep(1)} style={{ background:'none', border:'none', color:'#6b7280', fontSize:'0.75rem', cursor:'pointer', textDecoration:'underline' }}>Change Phone Number</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:'600', color:'#374151', marginBottom:'0.35rem' }}>New Password</label>
            <input
              type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password" required
              style={{ width:'100%', height:'42px', padding:'0 0.85rem', border:'1px solid #e5e7eb', borderRadius:'7px', fontSize:'0.85rem', outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:'1rem' }}
              onFocus={e => { e.target.style.borderColor = GOLD; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
            />
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:'600', color:'#374151', marginBottom:'0.35rem' }}>Confirm Password</label>
            <input
              type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password" required
              style={{ width:'100%', height:'42px', padding:'0 0.85rem', border:'1px solid #e5e7eb', borderRadius:'7px', fontSize:'0.85rem', outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:'1.25rem' }}
              onFocus={e => { e.target.style.borderColor = GOLD; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
            />
            <button type="submit" disabled={loading}
              style={{ width:'100%', height:'42px', background:GOLD, border:'none', borderRadius:'7px', color:'#fff', fontWeight:'700', fontSize:'0.88rem', cursor:'pointer' }}>
              {loading ? 'Updating…' : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 4 && (
          <div style={{ textAlign:'center', padding:'1rem 0' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'#e6f4ea', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem', fontSize:'1.6rem' }}>✅</div>
            <p style={{ fontSize:'1rem', color:G, fontWeight:'700', marginBottom:'0.5rem' }}>Password Reset Successful</p>
            <p style={{ fontSize:'0.82rem', color:'#6b7280', marginBottom:'1.5rem' }}>You can now log in with your new password.</p>
            <button onClick={onClose} style={{ width:'100%', height:'42px', background:GOLD, border:'none', borderRadius:'7px', color:'#fff', fontWeight:'700', cursor:'pointer', fontSize:'0.88rem' }}>Back to Login</button>
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
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#fff', borderRadius:'16px', padding:'2rem 2.25rem', width:'100%', maxWidth:'460px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)', animation:'fadeIn 0.25s ease' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
          <div>
            <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.25rem', color:G, margin:'0 0 0.2rem', fontWeight:'700' }}>Contact Support</h2>
            <p style={{ fontSize:'0.78rem', color:'#6b7280', margin:0 }}>We typically respond within 2–4 hours</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'1.4rem', cursor:'pointer', color:'#9ca3af', lineHeight:1, padding:'0 0.2rem' }}>×</button>
        </div>

        {/* Contact Info */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1.5rem' }}>
          {[
            { icon:'📧', label:'Email', val:'support@homeland.com' },
            { icon:'📞', label:'Phone', val:'+91 98765 43210' },
            { icon:'🕐', label:'Hours', val:'Mon–Sat, 9am–7pm IST' },
            { icon:'📍', label:'Office', val:'Mumbai, Maharashtra' },
          ].map(c => (
            <div key={c.label} style={{ background:'#f8f9fb', borderRadius:'8px', padding:'0.7rem 0.9rem', border:'1px solid #f1f3f5' }}>
              <div style={{ fontSize:'0.82rem', marginBottom:'2px' }}>{c.icon}</div>
              <div style={{ fontSize:'0.6rem', color:'#9ca3af', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.5px' }}>{c.label}</div>
              <div style={{ fontSize:'0.75rem', color:G, fontWeight:'600', marginTop:'2px' }}>{c.val}</div>
            </div>
          ))}
        </div>

        {!sent ? (
          <form onSubmit={handleSend}>
            <div style={{ marginBottom:'0.85rem' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:'600', color:'#374151', marginBottom:'0.3rem' }}>Your Name</label>
              <input value={name} onChange={e => setName(e.target.value)} type="text" required placeholder="Enter your name"
                style={{ width:'100%', height:'40px', padding:'0 0.85rem', border:'1px solid #e5e7eb', borderRadius:'7px', fontSize:'0.85rem', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
                onFocus={e => { e.target.style.borderColor = GOLD; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
              />
            </div>
            <div style={{ marginBottom:'1.1rem' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:'600', color:'#374151', marginBottom:'0.3rem' }}>Message</label>
              <textarea value={msg} onChange={e => setMsg(e.target.value)} required rows={3} placeholder="Describe your issue or question…"
                style={{ width:'100%', padding:'0.7rem 0.85rem', border:'1px solid #e5e7eb', borderRadius:'7px', fontSize:'0.85rem', outline:'none', fontFamily:'inherit', boxSizing:'border-box', resize:'vertical' }}
                onFocus={e => { e.target.style.borderColor = GOLD; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
              />
            </div>
            <button type="submit" style={{ width:'100%', height:'42px', background:GOLD, border:'none', borderRadius:'7px', color:'#fff', fontWeight:'700', fontSize:'0.88rem', cursor:'pointer' }}>Send Message</button>
          </form>
        ) : (
          <div style={{ textAlign:'center', padding:'1rem 0' }}>
            <div style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>✅</div>
            <p style={{ fontSize:'0.9rem', fontWeight:'600', color:G, marginBottom:'0.4rem' }}>Message Sent!</p>
            <p style={{ fontSize:'0.8rem', color:'#6b7280', marginBottom:'1.25rem' }}>Our team will get back to you at the earliest.</p>
            <button onClick={onClose} style={{ width:'100%', height:'40px', background:G, border:'none', borderRadius:'7px', color:'#fff', fontWeight:'700', cursor:'pointer', fontSize:'0.85rem' }}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
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

  // Load remembered username on mount
  useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('homeland_remembered_user');
      if (saved) { setSavedUsername(saved); setRememberMe(true); }
    }
  });

  const goForm = (r) => { setRole(r || selectedRole); setView('form'); };
  const goBack = () => { setView('selection'); setRole(null); setShowPw(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
      if (data.success) window.location.href = '/admin';
      else alert(data.error || 'Invalid credentials.');
    } catch (err) { alert('Connection error: ' + err.message); }
    finally { setLoading(false); }
  };

  const meta = role ? PORTAL_META[role] : null;

  /* ── Shared layout shell ── */
  const s = {
    page: { minHeight:'100vh', background:'#f7f6f2', display:'flex', fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    left: { flex:'1.1', background:'#f7f6f2', borderRight:'1px solid #e5e7eb', padding:'2.5rem 3rem', display:'flex', flexDirection:'column', minHeight:'100vh' },
    right: { flex:'0.9', background:'#fff', padding:'2.5rem 3.5rem', display:'flex', flexDirection:'column', justifyContent:'center', minHeight:'100vh', boxShadow:'-8px 0 30px rgba(0,0,0,0.03)' },
    logo: { display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'2.2rem' },
    logoText: { fontFamily:"Georgia,serif", fontSize:'1.2rem', fontWeight:'800', color:G, letterSpacing:'0.3px' },
    logoSub: { fontSize:'0.5rem', color:GOLD, letterSpacing:'1.5px', textTransform:'uppercase', fontWeight:'700', display:'block', marginTop:'1px' },
    h1: { fontFamily:"Georgia,serif", fontSize:'1.85rem', color:G, lineHeight:'1.2', margin:'0 0 0.6rem', fontWeight:'700' },
    subp: { fontSize:'0.85rem', color:'#6b7280', lineHeight:'1.5', margin:'0 0 1.75rem' },
    goldBtn: { width:'100%', height:'46px', background:GOLD, border:'none', borderRadius:'8px', color:'#fff', fontWeight:'700', fontSize:'0.92rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem', transition:'background 0.18s', letterSpacing:'0.2px' },
    badge: { display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.7rem', fontWeight:'600', color:'#6b7280' },
  };

  return (
    <div style={s.page}>

      {/* ══ LEFT PANE ══ */}
      <div style={s.left}>
        {/* Logo */}
        <div style={s.logo}>
          <Logo />
          <div>
            <span style={s.logoText}>HOMELAND.</span>
            <span style={s.logoSub}>Real Estate</span>
          </div>
        </div>

        {/* ── SELECTION left ── */}
        {view === 'selection' && (
          <div style={{ display:'flex', flexDirection:'column', flex:1, animation:'fadeIn 0.3s ease' }}>
            <div>
              <div style={{ fontSize:'0.68rem', color:GOLD, fontWeight:'700', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'0.5rem' }}>Welcome to</div>
              <h1 style={s.h1}>Real Estate<br/>CRM + ERP Platform</h1>
              <p style={s.subp}>Manage Sales, Inventory, Leads,<br/>Buyers &amp; Operations in one place.</p>
            </div>
            <div style={{ flex:1, borderRadius:'14px', overflow:'hidden', maxHeight:'370px', border:'1px solid #e5e7eb', boxShadow:'0 12px 40px rgba(0,0,0,0.07)' }}>
              <img
                src="/images/hero_building_1777640070355.png"
                alt="Homeland Residences"
                style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
              />
            </div>
          </div>
        )}

        {/* ── ADMIN left ── */}
        {view === 'form' && role === 'Admin' && (
          <div style={{ display:'flex', flexDirection:'column', flex:1, animation:'fadeIn 0.3s ease' }}>
            <div>
              <h1 style={s.h1}>Grow Your Business<br/>with Intelligence</h1>
              <p style={s.subp}>Real-time insights, performance analytics,<br/>inventory tracking &amp; much more.</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.85rem' }}>
              <KpiCard label="Total Revenue"  value="₹ 12.45 Cr" sub="↑ +16.6% vs last month" />
              <KpiCard label="Sales Overview" value="₹ 8.74 Cr"  sub="↑ +22.4% vs last month" />
              <KpiCard label="Projects"       value="24"          sub="Active Projects" subColor="#6b7280" />
              <KpiCard label="Leads"          value="1,248"       sub="↑ +15.3% vs last month"
                extra={
                  <svg width="38" height="38" viewBox="0 0 38 38" style={{ position:'absolute', right:'0.75rem', bottom:'0.75rem' }}>
                    <circle cx="19" cy="19" r="15" fill="none" stroke="#f1f3f5" strokeWidth="4"/>
                    <circle cx="19" cy="19" r="15" fill="none" stroke={GOLD} strokeWidth="4" strokeDasharray="65 100" strokeDashoffset="25" strokeLinecap="round"/>
                  </svg>
                }
              />
            </div>
          </div>
        )}

        {/* ── SALES left ── */}
        {view === 'form' && role === 'Sales' && (
          <div style={{ display:'flex', flexDirection:'column', flex:1, animation:'fadeIn 0.3s ease' }}>
            <div>
              <h1 style={s.h1}>Manage Leads.<br/>Close Deals. <span style={{ color:GOLD }}>Grow Faster.</span></h1>
              <p style={s.subp}>All your leads, follow-ups, meetings and deals in one place.</p>
            </div>
            {/* Pipeline Card */}
            <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', padding:'1.25rem 1.5rem', boxShadow:'0 4px 16px rgba(0,0,0,0.04)', marginBottom:'1rem' }}>
              <div style={{ fontSize:'0.65rem', fontWeight:'700', color:G, textTransform:'uppercase', letterSpacing:'0.8px', borderBottom:'1px solid #f3f4f6', paddingBottom:'0.5rem', marginBottom:'0.75rem' }}>Lead Pipeline</div>
              {[
                  { l:'New Lead',  v:120, pct:80 },
                  { l:'Contacted', v:85,  pct:60 },
                  { l:'Follow Up', v:64,  pct:46 },
                  { l:'Proposal',  v:32,  pct:25 },
                  { l:'Closed',    v:13,  pct:12 },
                ].map(r => (
                <div key={r.l} style={{ display:'flex', alignItems:'center', paddingBottom:'0.45rem', borderBottom:'1px solid #f9fafb', marginBottom:'0.4rem' }}>
                  <span style={{ fontSize:'0.75rem', color:'#4b5563', fontWeight:'500', minWidth:'75px' }}>{r.l}</span>
                  <div style={{ flex:1, background:'#f3f4f6', height:'7px', borderRadius:'4px', margin:'0 0.75rem', overflow:'hidden' }}>
                    <div style={{ background:GOLD, width:`${r.pct}%`, height:'100%', borderRadius:'4px' }}/>
                  </div>
                  <strong style={{ fontSize:'0.75rem', color:G, minWidth:'28px', textAlign:'right' }}>{r.v}</strong>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:'0.75rem' }}>
              {[
                { l:'Meetings Today',    v:'08',         s:'Scheduled',  sc:'#6b7280' },
                { l:'Deals This Month',  v:'₹ 5.62 Cr',  s:'↗ +10.5%',  sc:'#10b981' }
              ].map(c => (
                <div key={c.l} style={{ flex:1, background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'0.9rem 1rem', boxShadow:'0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize:'0.58rem', color:'#9ca3af', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.6px' }}>{c.l}</div>
                  <div style={{ fontSize:'1.1rem', fontWeight:'700', color:G, marginTop:'3px' }}>{c.v} <span style={{ fontSize:'0.62rem', color:c.sc, fontWeight:'600' }}>{c.s}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CHANNEL PARTNER left ── */}
        {view === 'form' && role === 'ChannelPartner' && (
          <div style={{ display:'flex', flexDirection:'column', flex:1, animation:'fadeIn 0.3s ease' }}>
            <div>
              <h1 style={s.h1}>Partner. Promote.<br/><span style={{ color:GOLD }}>Earn Together.</span></h1>
              <p style={s.subp}>Submit quality leads and earn exciting commissions on verified closures.</p>
            </div>
            {/* Network Visual */}
            <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', height:'185px', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1rem', boxShadow:'0 4px 16px rgba(0,0,0,0.04)' }}>
              <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }} aria-hidden>
                {[['20%','20%'],['78%','22%'],['18%','78%'],['80%','76%']].map(([x,y],i)=>(
                  <line key={i} x1="50%" y1="50%" x2={x} y2={y} stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="4 3"/>
                ))}
              </svg>
              {/* Center node */}
              <div style={{ width:'52px', height:'52px', borderRadius:'50%', background:GOLD, color:'#fff', fontWeight:'700', fontSize:'0.82rem', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2, boxShadow:`0 4px 14px rgba(201,168,76,0.35)` }}>You</div>
              {/* Branch nodes */}
              {[{ top:'14%', left:'14%' }, { top:'12%', right:'14%' }, { bottom:'14%', left:'12%' }, { bottom:'12%', right:'12%' }].map((pos, i) => (
                <div key={i} style={{ position:'absolute', width:'36px', height:'36px', borderRadius:'50%', background:'#f9fafb', border:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2, ...pos }}>
                  <SalesIcon />
                </div>
              ))}
              <div style={{ position:'absolute', bottom:'10px', left:'14px', background:'#e6f4ea', color:'#137333', fontSize:'0.6rem', padding:'2px 9px', borderRadius:'20px', fontWeight:'700', zIndex:3 }}>156 Leads Submitted</div>
            </div>
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <div style={{ flex:1.2, background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'0.9rem 1rem', boxShadow:'0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize:'0.58rem', color:'#9ca3af', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.6px' }}>Commission Earned</div>
                <div style={{ fontSize:'1.1rem', fontWeight:'700', color:G, marginTop:'3px' }}>₹ 2.45 Cr <span style={{ fontSize:'0.6rem', color:'#10b981', fontWeight:'700' }}>↑ +22.6%</span></div>
              </div>
              <div style={{ flex:1, background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'0.9rem 1rem', boxShadow:'0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize:'0.58rem', color:'#9ca3af', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:'0.3rem' }}>Payout History</div>
                {[['₹ 45,000','Paid'],['₹ 75,000','Paid'],['₹ 68,000','Paid']].map(([a,st])=>(
                  <div key={a} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2px' }}>
                    <span style={{ fontSize:'0.68rem', fontWeight:'600', color:G }}>{a}</span>
                    <span style={{ fontSize:'0.58rem', background:'#e6f4ea', color:'#137333', padding:'1px 7px', borderRadius:'9px', fontWeight:'700' }}>{st}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── BUYER left ── */}
        {view === 'form' && role === 'Buyer' && (
          <div style={{ display:'flex', flexDirection:'column', flex:1, animation:'fadeIn 0.3s ease' }}>
            <div>
              <h1 style={s.h1}>Your Dream Home.<br/><span style={{ color:GOLD }}>Our Commitment.</span></h1>
              <p style={s.subp}>Track your booking, payments and construction updates in real-time.</p>
            </div>
            {/* Hero image with overlay cards */}
            <div style={{ position:'relative', borderRadius:'14px', overflow:'hidden', flex:1, maxHeight:'310px', boxShadow:'0 10px 35px rgba(0,0,0,0.08)' }}>
              <img
                src="/images/heritage_palace_1777642572460.png"
                alt="Dream Home"
                style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
              />
              {/* Construction Progress overlay */}
              <div style={{ position:'absolute', top:'14px', left:'14px', background:'rgba(255,255,255,0.92)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.5)', borderRadius:'10px', padding:'0.75rem 1rem', width:'200px', boxShadow:'0 6px 20px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize:'0.56rem', color:'#9ca3af', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.6px' }}>Construction Progress</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', margin:'4px 0' }}>
                  <span style={{ fontSize:'1.3rem', fontWeight:'700', color:G }}>72%</span>
                  <span style={{ fontSize:'0.58rem', color:'#10b981', fontWeight:'700' }}>On Time ✓</span>
                </div>
                <div style={{ background:'#e5e7eb', height:'5px', borderRadius:'3px', overflow:'hidden' }}>
                  <div style={{ background:GOLD, width:'72%', height:'100%', borderRadius:'3px' }}/>
                </div>
              </div>
              {/* Payment overlay */}
              <div style={{ position:'absolute', bottom:'14px', right:'14px', background:'rgba(255,255,255,0.92)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.5)', borderRadius:'10px', padding:'0.75rem 1rem', width:'170px', boxShadow:'0 6px 20px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize:'0.56rem', color:'#9ca3af', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.6px' }}>Payment Overview</div>
                <div style={{ fontSize:'1.25rem', fontWeight:'700', color:G, margin:'3px 0 1px' }}>₹ 18.75 L</div>
                <div style={{ fontSize:'0.62rem', color:'#6b7280', fontWeight:'600' }}>Paid So Far</div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom trust badges */}
        <div style={{ display:'flex', gap:'1.25rem', marginTop:'1.75rem', paddingTop:'1.25rem', borderTop:'1px solid #e5e7eb', flexWrap:'wrap' }}>
          {[['🛡️','Secure'],['🤝','Reliable'],['⏰','Real-time'],['📈','Scalable']].map(([ic, lb]) => (
            <div key={lb} style={s.badge}><span>{ic}</span>{lb}</div>
          ))}
        </div>
      </div>

      {/* ══ RIGHT PANE ══ */}
      <div style={s.right}>

        {/* ── ROLE SELECTION ── */}
        {view === 'selection' && (
          <div style={{ animation:'fadeIn 0.3s ease' }}>
            <div style={{ marginBottom:'1.75rem' }}>
              <h2 style={{ fontFamily:"Georgia,serif", fontSize:'1.7rem', color:G, fontWeight:'700', margin:'0 0 0.4rem' }}>Select Your Role</h2>
              <p style={{ fontSize:'0.82rem', color:'#6b7280', margin:0 }}>Choose the portal that best matches your role to continue</p>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'2rem' }}>
              {ROLES.map(r => (
                <RoleCard
                  key={r.id}
                  {...r}
                  active={selectedRole === r.id}
                  onClick={() => setSelectedRole(r.id)}
                  onDoubleClick={() => goForm(r.id)}
                />
              ))}
            </div>

            <button
              style={{ ...s.goldBtn }}
              onMouseEnter={e => e.currentTarget.style.background = GOLD2}
              onMouseLeave={e => e.currentTarget.style.background = GOLD}
              onClick={() => goForm()}
            >
              Continue &nbsp;→
            </button>

            <div style={{ marginTop:'2.5rem', textAlign:'center', fontSize:'0.7rem', color:'#c0c0c0' }}>
              © 2025 Homeland Real Estate. All rights reserved.
            </div>
          </div>
        )}

        {/* ── LOGIN FORM ── */}
        {view === 'form' && meta && (
          <div style={{ animation:'fadeIn 0.3s ease' }}>
            {/* Back */}
            <button
              onClick={goBack}
              style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600', display:'flex', alignItems:'center', gap:'0.35rem', marginBottom:'2rem', padding:0, fontFamily:'inherit' }}
              onMouseEnter={e => e.currentTarget.style.color = G}
              onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
            >
              ← Back to Role Selection
            </button>

            {/* Portal header */}
            <div style={{ textAlign:'center', marginBottom:'2rem' }}>
              <PortalRing Icon={meta.Icon} />
              <h1 style={{ fontFamily:"Georgia,serif", fontSize:'1.5rem', color:G, fontWeight:'700', margin:'0 0 0.3rem' }}>{meta.title}</h1>
              <p style={{ fontSize:'0.8rem', color:'#6b7280', margin:0 }}>{meta.sub}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Username with pre-filled remembered value */}
              <div style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', fontSize:'0.76rem', fontWeight:'600', color:'#374151', marginBottom:'0.35rem' }}>Email Address</label>
                <input
                  name="username"
                  type="text"
                  placeholder="Enter your email"
                  defaultValue={savedUsername}
                  required
                  style={{ width:'100%', height:'42px', padding:'0 0.85rem', border:'1px solid #e5e7eb', borderRadius:'7px', fontSize:'0.85rem', outline:'none', fontFamily:'inherit', boxSizing:'border-box', background:'#fff', color:'#1f2937' }}
                  onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 3px rgba(201,168,76,0.12)`; }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Password with toggle */}
              <div style={{ marginBottom:'0.85rem' }}>
                <label style={{ display:'block', fontSize:'0.76rem', fontWeight:'600', color:'#374151', marginBottom:'0.35rem' }}>Password</label>
                <div style={{ position:'relative' }}>
                  <input
                    name="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    required
                    style={{ width:'100%', height:'42px', padding:'0 2.5rem 0 0.85rem', border:'1px solid #e5e7eb', borderRadius:'7px', fontSize:'0.85rem', outline:'none', fontFamily:'inherit', boxSizing:'border-box', background:'#fff', color:'#1f2937' }}
                    onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 3px rgba(201,168,76,0.12)`; }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position:'absolute', right:'0.7rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', padding:0 }}>
                    {showPw ? <EyeOn/> : <EyeOff/>}
                  </button>
                </div>
              </div>

              {/* Options row */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
                <label style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.78rem', color:'#4b5563', cursor:'pointer', userSelect:'none' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{ accentColor: GOLD, width:'14px', height:'14px', cursor:'pointer' }}
                  />
                  Remember Me
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  style={{ fontSize:'0.78rem', color:GOLD, background:'none', border:'none', fontWeight:'600', cursor:'pointer', padding:0, fontFamily:'inherit' }}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login button */}
              <button
                type="submit"
                disabled={loading}
                style={{ ...s.goldBtn, opacity: loading ? 0.7 : 1 }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = GOLD2; }}
                onMouseLeave={e => e.currentTarget.style.background = GOLD}
              >
                {loading ? 'Logging in…' : 'Login'}
              </button>
            </form>

            {/* Support */}
            <div style={{ textAlign:'center', marginTop:'1.5rem', fontSize:'0.78rem', color:'#9ca3af' }}>
              Need help?{' '}
              <button
                onClick={() => setShowSupport(true)}
                style={{ color:GOLD, background:'none', border:'none', fontWeight:'600', cursor:'pointer', fontSize:'0.78rem', padding:0, fontFamily:'inherit' }}
              >
                Contact Support
              </button>
            </div>
          </div>
        )}

        {/* ── Modals ── */}
        {showForgot && <ForgotModal onClose={() => setShowForgot(false)} />}
        {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}

      </div>

      {/* Global fade animation */}
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        input::placeholder { color: #b0b8c4; }
      `}</style>
    </div>
  );
}
