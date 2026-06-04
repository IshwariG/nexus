"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

export default function AdminUpdateBuyerClient({ buyer }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (buyer?.milestones) {
      setMilestones(buyer.milestones);
    } else {
      setMilestones([
        { step: "Foundation", status: "PENDING" },
        { step: "Structure", status: "PENDING" },
        { step: "Finishing", status: "PENDING" },
        { step: "Handover", status: "PENDING" }
      ]);
    }
  }, [buyer, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = {
      unit_id: e.target.unit_id.value,
      total_amount: e.target.total_amount.value,
      amount_paid: e.target.amount_paid.value,
      construction_progress: parseInt(e.target.construction_progress.value) || 0,
      possession_date: e.target.possession_date.value,
      milestones: milestones
    };

    try {
      const res = await fetch(`/api/buyers?username=${encodeURIComponent(buyer.username)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Buyer details updated!');
        setIsOpen(false);
        router.refresh();
        // Fallback for extreme caching
        setTimeout(() => window.location.reload(), 500);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = isOpen && (
    <div className="modal-overlay" onClick={() => setIsOpen(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '500px'}}>
        <div className="modal-header">
          <div>
            <h2 className="serif">Update Progress: {buyer.username}</h2>
            <p className="text-muted" style={{fontSize: '0.7rem'}}>Manage unit details and financial milestones</p>
          </div>
          <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-section">
            <div className="form-row" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
              <div className="form-group">
                <label>Unit ID (Read Only)</label>
                <input name="unit_id" defaultValue={buyer.unit_id} readOnly style={{background: '#f5f5f5'}} />
              </div>
              <div className="form-group">
                <label>Progress (%)</label>
                <input name="construction_progress" type="number" min="0" max="100" defaultValue={buyer.construction_progress} />
              </div>
            </div>
            
            <div className="form-row" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginTop: '1rem'}}>
              <div className="form-group">
                <label>Total Value</label>
                <input name="total_amount" defaultValue={buyer.total_amount} required />
              </div>
              <div className="form-group">
                <label>Total Paid</label>
                <input name="amount_paid" defaultValue={buyer.amount_paid} required />
              </div>
            </div>

            <div className="form-group mt-1">
              <label>Possession Date</label>
              <input name="possession_date" type="date" defaultValue={buyer.possession_date} required />
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.78rem', color: '#137333', display: 'block', marginBottom: '0.5rem' }}>CONSTRUCTION MILESTONES</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.62rem', background: '#fafafa', border: '1px solid #f1f3f5', padding: '0.88rem', borderRadius: '8px' }}>
                {milestones.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>{m.step}</span>
                    <select 
                      value={m.status} 
                      onChange={(e) => {
                        const newM = [...milestones];
                        newM[idx] = { ...newM[idx], status: e.target.value };
                        setMilestones(newM);
                      }}
                      style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.75rem', width: '130px', background: '#fff' }}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="IN PROGRESS">IN PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" className="btn-dark mt-2" style={{width: '100%', padding: '1rem'}} disabled={loading}>
            {loading ? 'SAVING CHANGES...' : 'UPDATE BUYER RECORD'}
          </button>

          <div style={{marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #fee2e2'}}>
             <p style={{fontSize: '0.65rem', color: '#ef4444', fontWeight: 600, marginBottom: '0.5rem'}}>DANGER ZONE</p>
             <button 
               type="button"
               className="btn-outline" 
               style={{width: '100%', borderColor: '#fecaca', color: '#dc2626', background: '#fff' }}
               disabled={loading}
               onClick={async () => {
                 if (confirm(`Are you sure you want to permanently delete buyer ${buyer.username} and their portal access? This cannot be undone.`)) {
                   setLoading(true);
                   try {
                     const res = await fetch(`/api/buyers?username=${encodeURIComponent(buyer.username)}`, { method: 'DELETE' });
                     const data = await res.json();
                     if (data.success) {
                       alert('Buyer deleted successfully.');
                       setIsOpen(false);
                       router.refresh();
                       // Fallback for extreme caching
                       setTimeout(() => window.location.reload(), 500);
                     } else {
                       alert('Error: ' + data.error);
                     }
                   } catch (err) {
                     alert('Network error.');
                   } finally {
                     setLoading(false);
                   }
                 }
               }}
             >
               DELETE BUYER ACCOUNT
             </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <button 
        className="text-blue" 
        style={{background:'none', border:'none', cursor:'pointer', fontSize:'0.7rem', fontWeight:600}}
        onClick={() => setIsOpen(true)}
      >
        UPDATE DATA
      </button>
      {mounted && isOpen && createPortal(modalContent, document.body)}
    </>
  );
}
