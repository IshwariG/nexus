"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function AdminAddCPClient() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = {
      username: e.target.username.value,
      phone: e.target.phone.value,
      email: e.target.email.value,
      password: e.target.password.value,
      firm_name: e.target.firm_name.value,
      rera_number: e.target.rera_number.value,
      commission_rate: parseFloat(e.target.commission_rate.value) || 2.0
    };

    try {
      const res = await fetch('/api/cp/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        alert('Channel Partner registered successfully!');
        setIsOpen(false);
        window.location.reload();
      } else {
        setError(data.error || 'Failed to register broker.');
      }
    } catch (err) {
      setError('Network error. Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = isOpen && (
    <div className="modal-overlay" onClick={() => setIsOpen(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div>
            <h2 className="serif">Register Channel Partner</h2>
            <p className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Establish new Broker Portal credentials</p>
          </div>
          <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-section">
            <h4 style={{ marginBottom: '1rem', color: '#c9a96e', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>1. Portal Access credentials</h4>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Broker Username (Login ID)</label>
                <input name="username" placeholder="e.g. apex_brokers" required />
              </div>
              <div className="form-group">
                <label>Registered Phone Number</label>
                <input name="phone" type="tel" placeholder="10-digit Phone" required minLength={10} maxLength={10} pattern="[0-9]{10}" onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} title="Please enter a valid 10-digit phone number" />
              </div>
            </div>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label>Portal Password</label>
                <input name="password" type="password" placeholder="Create portal password" required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input name="email" type="email" placeholder="e.g. partner@firm.com" required />
              </div>
            </div>
          </div>

          <div className="form-section mt-1" style={{ background: '#fff' }}>
            <h4 style={{ marginBottom: '1rem', color: '#c9a96e', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>2. Business profile</h4>
            <div className="form-group">
              <label>Broker / Firm Name</label>
              <input name="firm_name" placeholder="e.g. Apex Luxury Realty" required />
            </div>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label>RERA Registration Number</label>
                <input name="rera_number" placeholder="e.g. RERA-DEL-98765-CP" required />
              </div>
              <div className="form-group">
                <label>Commission Rate (%)</label>
                <input name="commission_rate" type="number" step="0.05" min="0" max="10" defaultValue="2.50" required />
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fff5f5',
              border: '1px solid #feb2b2',
              color: '#c53030',
              padding: '1rem',
              borderRadius: '10px',
              fontSize: '0.8rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="btn-dark mt-2" style={{
            width: '100%',
            padding: '1.25rem',
            background: 'linear-gradient(135deg, var(--vanya-green) 0%, #2d2d2d 100%)',
            fontSize: '0.8rem',
            letterSpacing: '2px',
            boxShadow: '0 10px 20px rgba(17, 54, 41, 0.2)'
          }} disabled={loading}>
            {loading ? 'REGISTERING PORTAL...' : 'ACTIVATE BROKER PORTAL'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <button className="btn-dark" style={{ background: 'var(--vanya-gold)', color: 'white', border: 'none', padding: '0.55rem 1.1rem', fontSize: '0.67rem', cursor: 'pointer', borderRadius: '7px', fontWeight: '500' }} onClick={() => setIsOpen(true)}>ADD NEW CP PARTNER</button>
      {mounted && isOpen && createPortal(modalContent, document.body)}
    </>
  );
}
