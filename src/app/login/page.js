"use client";

import { useState } from 'react';
import './login.css';

export default function LoginPage() {
  const [view, setView] = useState('selection'); // 'selection' | 'form'
  const [role, setRole] = useState(null);

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
    setView('form');
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
      alert('Network or Server Error. Make sure you restarted the Next.js server! Error: ' + error.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-blur"></div>
      
      <header className="login-header">
        
        
      </header>

      <main className="login-main">
        {view === 'selection' ? (
          <div className="selection-view animate-fade-in">
            <div className="selection-title-box">
              <h2>HERITAGE ESTATE MANAGEMENT</h2>
           
            </div>
            
            <div className="cards-container">
              {/* Admin Card */}
              <div className="access-card">
                <div className="icon-wrapper">
                  <span className="icon">🛡️</span>
                </div>
                <h3>Admin Access</h3>
                <p>Strategic oversight, governance protocols, and global inventory management for the Heritage Portfolio.</p>
                <button className="btn btn-primary access-btn" onClick={() => handleSelectRole('Admin')}>
                  Proceed to Login →
                </button>
              </div>

              {/* Sales Card */}
              <div className="access-card">
                <div className="icon-wrapper">
                  <span className="icon">🤝</span>
                </div>
                <h3>Sales Access</h3>
                <p>Concierge lead management, high-net-worth client relations, and revenue analytics for the Vanya Residences.</p>
                <button className="btn btn-outline bg-white text-dark access-btn" onClick={() => handleSelectRole('Sales')}>
                  Proceed to Login →
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="form-view animate-fade-in">
            <div className="login-modal">
              <div className="modal-header">
                <h3>{role} Executive Login</h3>
                <p>Enter your credentials to access the portfolio dashboard.</p>
              </div>
              
              <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>{role === 'Sales' ? 'Sales Representative ID' : 'Admin ID'}</label>
                  <div className="input-with-icon">
                    <span className="input-icon">👤</span>
                    <input type="text" name="username" placeholder={role === 'Sales' ? 'SR-XXXXX' : 'ADM-XXXX'} required />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Secure Password</label>
                  <div className="input-with-icon">
                    <span className="input-icon">🔒</span>
                    <input type="password" name="password" placeholder="••••••••" required />
                  </div>
                </div>
                
                <div className="form-actions-row">
                  <label className="checkbox-label">
                    <input type="checkbox" /> Remember device
                  </label>
                  <a href="#" className="forgot-link">Forgot {role === 'Sales' ? 'Sales ID' : 'Admin ID'}?</a>
                </div>
                
                <button type="submit" className="btn btn-primary auth-btn">
                  AUTHENTICATE ACCOUNT
                </button>
                
                <div className="restricted-badge">
                  <span>Restricted Access</span>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="login-footer">
        <div className="security-notice">
          <span className="icon">🛡️</span>
          <span>Security Notice: This system is for authorized {role ? role.toLowerCase() : 'estate'} personnel only. All access is logged and monitored.</span>
        </div>
        <div className="copyright">
          © 2024 Heritage Estate Management • Vanya Residences Portal
        </div>
      </footer>
    </div>
  );
}
