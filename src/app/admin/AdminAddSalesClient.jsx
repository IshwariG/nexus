"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function AdminAddSalesClient() {
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
      full_name: e.target.full_name.value,
      employee_id: e.target.employee_id.value
    };

    try {
      const res = await fetch('/api/sales/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        alert('Salesperson registered successfully!');
        setIsOpen(false);
        window.location.reload();
      } else {
        setError(data.error || 'Failed to register salesperson.');
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
            <h2 className="serif">Register Salesperson</h2>
            <p className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Establish new Sales Portal credentials</p>
          </div>
          <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-section">
            <h4 style={{ marginBottom: '1rem', color: '#c9a96e', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>1. Portal Access credentials</h4>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Sales Username (Login ID)</label>
                <input name="username" placeholder="e.g. SR-1001" required />
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
                <input name="email" type="email" placeholder="e.g. agent@company.com" required />
              </div>
            </div>
          </div>

          <div className="form-section mt-1" style={{ background: '#fff' }}>
            <h4 style={{ marginBottom: '1rem', color: '#c9a96e', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>2. Employee profile</h4>
            <div className="form-group">
              <label>Full Name</label>
              <input name="full_name" placeholder="e.g. John Doe" required pattern="[A-Za-z\s]+" title="Please enter letters only" />
            </div>
            <div className="form-group">
              <label>Employee ID</label>
              <input name="employee_id" placeholder="e.g. EMP-2023-44" required />
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
            color: '#fff',
            fontSize: '0.8rem',
            letterSpacing: '2px',
            boxShadow: '0 10px 20px rgba(17, 54, 41, 0.2)'
          }} disabled={loading}>
            {loading ? 'REGISTERING PORTAL...' : 'ACTIVATE SALES PORTAL'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <button className="btn-dark" style={{ background: 'var(--vanya-gold)', color: 'white', border: 'none', padding: '0.55rem 1.1rem', fontSize: '0.67rem', cursor: 'pointer', borderRadius: '7px', fontWeight: '500' }} onClick={() => setIsOpen(true)}>ADD SALESPERSON</button>
      {mounted && isOpen && createPortal(modalContent, document.body)}
    </>
  );
}
