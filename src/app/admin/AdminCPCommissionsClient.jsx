"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminCPCommissionsClient({ initialCommissions, cpPartners }) {
  const router = useRouter();
  const [commissions, setCommissions] = useState(initialCommissions || []);
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getPartnerName = (cpId) => {
    const cp = cpPartners.find(p => p.id === cpId);
    return cp ? `${cp.firm_name} (${cp.username})` : 'Unknown Partner';
  };

  // Parse formatted amount string e.g. "₹ 28.50 L" -> number in rupees
  const parseAmount = (amtStr) => {
    if (!amtStr) return 0;
    const cleaned = amtStr.replace(/[^\d.]/g, '');
    let num = parseFloat(cleaned) || 0;
    if (amtStr.includes('Cr')) num = num * 10000000;
    else if (amtStr.includes('L')) num = num * 100000;
    return num;
  };

  const formatINR = (val) => {
    if (val >= 10000000) return '₹ ' + (val / 10000000).toFixed(2) + ' Cr';
    if (val >= 100000) return '₹ ' + (val / 100000).toFixed(2) + ' L';
    return '₹ ' + val.toLocaleString('en-IN');
  };

  // KPI totals
  const totalPaid = commissions.filter(c => c.status === 'PAID').reduce((s, c) => s + parseAmount(c.amount), 0);
  const totalPending = commissions.filter(c => c.status === 'APPROVED' || c.status === 'PENDING').reduce((s, c) => s + parseAmount(c.amount), 0);
  const totalAll = totalPaid + totalPending;

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
        setCommissions(prev =>
          prev.map(c => c.id === commissionId ? { ...c, status: newStatus } : c)
        );
        if (newStatus === 'PAID') {
          showToast('✅ Commission disbursed! Payout record created. CP dashboard updated.', 'success');
        } else if (newStatus === 'APPROVED') {
          showToast('Commission approved and queued for disbursement.', 'success');
        }
        router.refresh();
      } else {
        showToast(data.error || 'Failed to update commission status.', 'error');
      }
    } catch (err) {
      showToast('Network error updating commission.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="widget-card mt-2" style={{ position: 'relative' }}>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'success' ? '#113629' : '#c53030',
          color: 'white', padding: '0.85rem 1.5rem', borderRadius: '8px',
          fontSize: '0.82rem', fontWeight: '600', zIndex: 99999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
          animation: 'fadeInUp 0.3s ease'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', position: 'relative' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h3 className="serif" style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: '#113629' }}>Channel Partner Commissions & Payouts</h3>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Review, approve, and disburse referred sales commissions to brokers</p>
        </div>
      </div>

      {/* KPI Summary Row */}
      {commissions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#f8f9fb', border: '1px solid #e8eaed', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#6b7280', letterSpacing: '1px', marginBottom: '0.4rem' }}>TOTAL COMMISSION POOL</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#113629', fontFamily: 'Playfair Display, serif' }}>{formatINR(totalAll)}</div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#166534', letterSpacing: '1px', marginBottom: '0.4rem' }}>TOTAL DISBURSED</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#137333', fontFamily: 'Playfair Display, serif' }}>{formatINR(totalPaid)}</div>
          </div>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#92400e', letterSpacing: '1px', marginBottom: '0.4rem' }}>PENDING DISBURSEMENT</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#d97706', fontFamily: 'Playfair Display, serif' }}>{formatINR(totalPending)}</div>
          </div>
        </div>
      )}

      {/* Commissions Table */}
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
            <tr key={c.id || i} style={{ background: c.status === 'PAID' ? '#f0fdf4' : 'white' }}>
              <td>
                <strong>{getPartnerName(c.cp_id)}</strong>
              </td>
              <td>{c.client_name}</td>
              <td>
                <span style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  V-{c.unit_id}
                </span>
              </td>
              <td><strong style={{ color: '#113629', fontSize: '1rem' }}>{c.amount}</strong></td>
              <td>
                <span className={`badge ${c.status === 'PAID' ? 'available' : c.status === 'APPROVED' ? 'negotiation' : 'reserved'}`}>
                  {c.status === 'PAID' ? '✅ PAID' : c.status === 'APPROVED' ? '⏳ APPROVED' : '🔵 PENDING'}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {c.status === 'PENDING' && (
                    <button
                      className="btn-dark"
                      style={{ padding: '4px 12px', fontSize: '0.65rem', background: '#c2a661', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                      disabled={updatingId === c.id}
                      onClick={() => handleUpdateStatus(c.id, 'APPROVED')}
                    >
                      {updatingId === c.id ? '...' : 'APPROVE'}
                    </button>
                  )}
                  {c.status === 'APPROVED' && (
                    <button
                      className="btn-dark"
                      style={{ padding: '4px 12px', fontSize: '0.65rem', background: '#2e7d32', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white', fontWeight: '700' }}
                      disabled={updatingId === c.id}
                      onClick={() => handleUpdateStatus(c.id, 'PAID')}
                    >
                      {updatingId === c.id ? 'PROCESSING...' : '💸 DISBURSE PAYMENT'}
                    </button>
                  )}
                  {c.status === 'PAID' && (
                    <span style={{ fontSize: '0.75rem', color: '#137333', fontWeight: '600' }}>
                      ✅ Paid & Cleared
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {commissions.length === 0 && (
            <tr>
              <td colSpan="6" className="text-muted" style={{ textAlign: 'center', padding: '2.5rem' }}>
                No broker commissions active. Commissions are generated automatically when a referred lead books a unit.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <style dangerouslySetInnerHTML={{__html: `@keyframes fadeInUp { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}} />
    </div>
  );
}
