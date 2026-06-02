"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function AdminAddBuyerClient() {
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
      unit_id: e.target.unit_id.value,
      total_amount: e.target.total_amount.value,
      amount_paid: e.target.amount_paid.value,
      construction_progress: parseInt(e.target.construction_progress.value) || 0,
      possession_date: e.target.possession_date.value,
      role: 'Buyer'
    };

    try {
      const res = await fetch('/api/buyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Buyer account created successfully!');
        setIsOpen(false);
        window.location.reload();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Network error. Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = isOpen && (
    <div className="modal-overlay" onClick={() => setIsOpen(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '600px'}}>
        <div className="modal-header">
          <div>
            <h2 className="serif">Register New Buyer</h2>
            <p className="text-muted" style={{fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Establish the Owner Portal credentials</p>
          </div>
          <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-section">
            <h4 style={{marginBottom: '1rem', color: '#c9a96e', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1.5px'}}>1. Secure Access</h4>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Owner Username (Login ID)</label>
                <input name="username" placeholder="e.g. arya_vanya_102" required />
              </div>
              <div className="form-group">
                <label>Registered Phone Number</label>
                <input name="phone" type="tel" placeholder="10-digit Phone" required minLength={10} maxLength={10} pattern="[0-9]{10}" onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} title="Please enter a valid 10-digit phone number" />
              </div>
            </div>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label>Access Password</label>
                <input name="password" type="password" placeholder="Create a secure password" required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input name="email" type="email" placeholder="e.g. buyer@gmail.com" required />
              </div>
            </div>
          </div>

          <div className="form-section mt-1" style={{background: '#fff'}}>
            <h4 style={{marginBottom: '1rem', color: '#c9a96e', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1.5px'}}>2. Unit Details</h4>
            <div className="form-row" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem'}}>
              <div className="form-group">
                <label>Unit / Flat Number</label>
                <input name="unit_id" placeholder="e.g. 102" required />
              </div>
              <div className="form-group">
                <label>Construction Progress (%)</label>
                <input name="construction_progress" type="number" min="0" max="100" defaultValue="15" />
              </div>
            </div>
            
            <div className="form-row" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginTop: '1rem'}}>
              <div className="form-group">
                <label>Total Value (INR)</label>
                <input name="total_amount" placeholder="e.g. ₹ 14.25 Cr" required />
              </div>
              <div className="form-group">
                <label>Current Amount Paid</label>
                <input name="amount_paid" placeholder="e.g. ₹ 2.50 Cr" required />
              </div>
            </div>

            <div className="form-group mt-1">
              <label>Estimated Possession Date</label>
              <input name="possession_date" type="date" required />
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
            {loading ? 'SYNCING DATABASE...' : 'ACTIVATE OWNER PORTAL'}
          </button>
          
          <p style={{textAlign: 'center', fontSize: '0.65rem', color: '#999', marginTop: '1.5rem'}}>
            Credentials will be activated instantly. Owner can log in via the "Buyer Access" portal.
          </p>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <button className="btn-dark" onClick={() => setIsOpen(true)}>ADD NEW BUYER</button>
      {mounted && isOpen && createPortal(modalContent, document.body)}
    </>
  );
}
