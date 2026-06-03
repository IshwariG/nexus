"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function BuyerPaymentClient({ unitId, amountDue }) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Method Select, 2: Bank Details, 3: Success
  const [hasFile, setHasFile] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const modalContent = isOpen && (
    <div className="modal-overlay" onClick={() => setIsOpen(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '450px'}}>
        <div className="modal-header">
          <h2 className="serif">Secure Payment</h2>
          <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
        </div>

        {step === 1 && (
          <div className="animate-fade-in">
            <p className="text-muted mb-2">You are paying the next installment for Unit {unitId}.</p>
            <div style={{background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem'}}>
              <span style={{fontSize: '0.7rem', color: '#999', letterSpacing: '1px'}}>TOTAL AMOUNT DUE</span>
              <h2 className="num-mono" style={{margin: 0}}>{amountDue}</h2>
            </div>
            
            <h4 style={{fontSize: '0.8rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Select Payment Method</h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              <button className="btn-outline" style={{textAlign: 'left', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem'}} onClick={() => setStep(2)}>
                <span style={{fontSize: '1.5rem'}}>🏦</span>
                <div>
                  <strong style={{display: 'block'}}>Bank Transfer (NEFT/RTGS)</strong>
                  <span style={{fontSize: '0.7rem', opacity: 0.6}}>Direct transfer to project escrow account</span>
                </div>
              </button>
              <button className="btn-outline" style={{textAlign: 'left', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem'}} disabled>
                <span style={{fontSize: '1.5rem'}}>💳</span>
                <div>
                  <strong style={{display: 'block'}}>Credit/Debit Card</strong>
                  <span style={{fontSize: '0.7rem', color: '#c62828'}}>Service unavailable for large amounts</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h4 style={{fontSize: '0.8rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Bank Escrow Details</h4>
            <div style={{background: 'var(--vanya-green)', color: '#fff', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem'}}>
              <div className="mb-1">
                <span style={{fontSize: '0.6rem', opacity: 0.6}}>ACCOUNT NAME</span>
                <p style={{margin: 0, fontWeight: 600}}>VANYA RESIDENCES ESCROW A/C</p>
              </div>
              <div className="mb-1">
                <span style={{fontSize: '0.6rem', opacity: 0.6}}>ACCOUNT NUMBER</span>
                <p style={{margin: 0, fontWeight: 600}}>99220011883344</p>
              </div>
              <div className="mb-1">
                <span style={{fontSize: '0.6rem', opacity: 0.6}}>IFSC CODE</span>
                <p style={{margin: 0, fontWeight: 600}}>HDFC0001234</p>
              </div>
              <div>
                <span style={{fontSize: '0.6rem', opacity: 0.6}}>BANK & BRANCH</span>
                <p style={{margin: 0, fontWeight: 600}}>HDFC BANK, NEW DELHI CENTRAL</p>
              </div>
            </div>
            
            <div className="form-group">
              <label>Upload Payment Receipt (Screenshot/PDF) <span style={{color: '#dc2626'}}>*</span></label>
              <input 
                type="file" 
                required 
                style={{padding: '0.5rem'}} 
                onChange={(e) => {
                  if (e.target.files.length > 0) {
                    setHasFile(true);
                  } else {
                    setHasFile(false);
                  }
                }}
              />
            </div>
            
            <button 
              className="btn-dark" 
              style={{
                width: '100%', 
                background: hasFile ? '#c9a96e' : '#ccc', 
                padding: '1rem',
                cursor: hasFile ? 'pointer' : 'not-allowed'
              }} 
              onClick={() => hasFile && setStep(3)}
              disabled={!hasFile}
            >
              SUBMIT FOR VERIFICATION
            </button>
            <button className="btn-outline mt-1" style={{border: 'none'}} onClick={() => setStep(1)}>← BACK</button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in" style={{textAlign: 'center', padding: '2rem 0'}}>
            <div style={{width: '60px', height: '60px', background: '#e8f5e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto'}}>
              <span style={{color: '#2e7d32', fontSize: '2rem'}}>✓</span>
            </div>
            <h2 className="serif">Receipt Submitted</h2>
            <p className="text-muted mt-1">Our finance team will verify the transfer within 24-48 hours and update your equity balance.</p>
            <button className="btn-dark mt-2" style={{width: '100%'}} onClick={() => setIsOpen(false)}>CLOSE</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button className="btn-dark mt-2" style={{width: '100%', padding: '1rem', background: '#c9a96e', border: 'none'}} onClick={() => setIsOpen(true)}>
        SECURE PAYMENT PORTAL
      </button>
      {mounted && isOpen && createPortal(modalContent, document.body)}
    </>
  );
}
