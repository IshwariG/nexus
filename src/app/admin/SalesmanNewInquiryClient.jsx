"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function SalesmanNewInquiryClient({ userId, buttonClass = "btn-sales-new", label = "+ NEW INQUIRY" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', source: 'Salesman Generated', pincode: '' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, message: `Pincode: ${formData.pincode}`, salesman_id: userId })
    });
    setIsOpen(false);
    window.location.reload();
  };

  const modalContent = isOpen && mounted ? (
    <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999}}>
      <div style={{background: 'white', padding: '2.5rem', width: '100%', maxWidth: '400px', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', color: '#333'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem'}}>
          <h3 className="serif" style={{margin: 0, color: '#111', fontSize: '1.4rem'}}>Add Direct Lead</h3>
          <button onClick={() => setIsOpen(false)} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666', marginTop: '-0.5rem'}}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1.2rem'}}>
          <div>
            <label style={{display:'block', fontSize:'0.75rem', fontWeight:'bold', color:'#666', marginBottom:'0.3rem'}}>CLIENT NAME *</label>
            <input type="text" placeholder="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{width:'100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius:'4px', background:'#f9f9f9', color:'#333'}} />
          </div>
          <div>
            <label style={{display:'block', fontSize:'0.75rem', fontWeight:'bold', color:'#666', marginBottom:'0.3rem'}}>EMAIL ADDRESS *</label>
            <input type="email" placeholder="Email Address" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{width:'100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius:'4px', background:'#f9f9f9', color:'#333'}} />
          </div>
          <div>
            <label style={{display:'block', fontSize:'0.75rem', fontWeight:'bold', color:'#666', marginBottom:'0.3rem'}}>PHONE NUMBER *</label>
            <input type="tel" placeholder="Phone Number" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{width:'100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius:'4px', background:'#f9f9f9', color:'#333'}} />
          </div>
          <div>
            <label style={{display:'block', fontSize:'0.75rem', fontWeight:'bold', color:'#666', marginBottom:'0.3rem'}}>PINCODE *</label>
            <input type="text" placeholder="Pincode / Zip Code" required value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} style={{width:'100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius:'4px', background:'#f9f9f9', color:'#333'}} />
          </div>
          <div>
            <label style={{display:'block', fontSize:'0.75rem', fontWeight:'bold', color:'#666', marginBottom:'0.3rem'}}>SOURCE</label>
            <input type="text" placeholder="Source (e.g. Call, Referral)" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} style={{width:'100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius:'4px', background:'#f9f9f9', color:'#333'}} />
          </div>
          <button type="submit" style={{background:'#113629', color:'white', border:'none', padding: '1rem', borderRadius:'4px', cursor:'pointer', fontWeight:'bold', letterSpacing:'1px', marginTop:'0.5rem'}}>SUBMIT LEAD</button>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button className={buttonClass} onClick={() => setIsOpen(true)} style={buttonClass === 'btn-dark' ? {width: '100%'} : {}}>{label}</button>
      {mounted && createPortal(modalContent, document.body)}
    </>
  );
}
