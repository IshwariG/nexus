"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VisitManagerClient({ inquiryId, currentStatus, salesmanId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const markAsDone = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inquiries?id=${inquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: `DONE|${salesmanId}` })
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      alert('Error updating status');
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus.startsWith('DONE')) {
    return <span className="badge available" style={{fontSize: '0.6rem'}}>VISIT COMPLETED</span>;
  }

  return (
    <button 
      onClick={markAsDone} 
      disabled={loading}
      className="btn-dark"
      style={{
        padding: '4px 10px', 
        fontSize: '0.65rem', 
        background: 'var(--vanya-green)',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        cursor: 'pointer'
      }}
    >
      {loading ? '...' : 'MARK AS DONE'}
    </button>
  );
}
