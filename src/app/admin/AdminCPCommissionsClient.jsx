"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminCPCommissionsClient({ initialCommissions, cpPartners }) {
  const router = useRouter();
  const [commissions, setCommissions] = useState(initialCommissions || []);
  const [updatingId, setUpdatingId] = useState(null);

  const getPartnerName = (cpId) => {
    const cp = cpPartners.find(p => p.id === cpId);
    return cp ? `${cp.firm_name} (${cp.username})` : 'Unknown Partner';
  };

  const handleUpdateStatus = async (commissionId, newStatus) => {
    setUpdatingId(commissionId);
    try {
      const res = await fetch('/api/cp/commission', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commission_id: commissionId, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        // Update local state
        setCommissions(prev => 
          prev.map(c => c.id === commissionId ? { ...c, status: newStatus } : c)
        );
        router.refresh();
      } else {
        alert(data.error || 'Failed to update commission status.');
      }
    } catch (err) {
      alert('Network error updating commission.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="widget-card mt-2">
      <div className="flex-between mb-2">
        <div>
          <h3 className="serif" style={{ margin: 0 }}>Channel Partner Commissions & Payouts</h3>
          <p className="text-muted" style={{ margin: 0 }}>Review, approve, and disburse referred sales commissions to brokers</p>
        </div>
      </div>
      <table className="table-standard">
        <thead>
          <tr>
            <th>BROKER PARTNER</th>
            <th>REFERRED BUYER</th>
            <th>UNIT ID</th>
            <th>COMMISSION AMOUNT</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {commissions.map((c, i) => (
            <tr key={c.id || i}>
              <td><strong>{getPartnerName(c.cp_id)}</strong></td>
              <td>{c.client_name}</td>
              <td>Flat {c.unit_id}</td>
              <td><strong style={{ color: '#113629' }}>{c.amount}</strong></td>
              <td>
                <span className={`badge ${c.status === 'PAID' ? 'available' : c.status === 'APPROVED' ? 'negotiation' : 'reserved'}`}>
                  {c.status}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {c.status === 'PENDING' && (
                    <button 
                      className="btn-dark" 
                      style={{ padding: '4px 10px', fontSize: '0.65rem', background: '#c2a661' }}
                      disabled={updatingId === c.id}
                      onClick={() => handleUpdateStatus(c.id, 'APPROVED')}
                    >
                      {updatingId === c.id ? '...' : 'APPROVE'}
                    </button>
                  )}
                  {c.status === 'APPROVED' && (
                    <button 
                      className="btn-dark" 
                      style={{ padding: '4px 10px', fontSize: '0.65rem', background: '#2e7d32' }}
                      disabled={updatingId === c.id}
                      onClick={() => handleUpdateStatus(c.id, 'PAID')}
                    >
                      {updatingId === c.id ? '...' : 'DISBURSE PAYMENT'}
                    </button>
                  )}
                  {c.status === 'PAID' && (
                    <span className="text-muted" style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>Paid & Cleared</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {commissions.length === 0 && (
            <tr>
              <td colSpan="6" className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>
                No broker commissions active. Commissions are generated automatically when a referred lead buys a unit.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
