"use client";

import React, { useState } from 'react';

export default function AdminAlertsCard({ inquiries = [], units = [], project = 'vanya-residences' }) {
  const [isDismissed, setIsDismissed] = useState(false);
  // Aggregate counts
  const pendingVisitsCount = inquiries.filter(inq => 
    inq.status && inq.status.startsWith('SCHEDULED|')
  ).length;

  const unassignedLeadsCount = inquiries.filter(inq => {
    // Exclude internal actions
    const isInternalAction = 
      (inq.source || '').startsWith('UNIT_ASSIGNMENT_') || 
      (inq.status || '').startsWith('SCHEDULED|') ||
      (inq.status || '').startsWith('DONE|');

    if (isInternalAction) return false;
    
    // Unassigned means no salesman ID (no | character or status is empty/NEW)
    if (!inq.status) return true;
    const parts = inq.status.split('|');
    return parts.length === 1 || parts[1] === 'unassigned';
  }).length;

  const availableUnitsCount = units.filter(u => u.status === 'AVAILABLE').length;
  const totalUnitsCount = units.length || 1;
  const availablePercentage = Math.round((availableUnitsCount / totalUnitsCount) * 100);
  const isLowInventory = availablePercentage < 40 && project === 'vanya-residences';

  const hasAlerts = pendingVisitsCount > 0 || unassignedLeadsCount > 0 || isLowInventory;

  if (!hasAlerts || isDismissed) return null;

  return (
    <div className="widget-card" style={{ 
      position: 'fixed', 
      bottom: '24px', 
      right: '24px', 
      zIndex: 9999, 
      width: '380px',
      borderLeft: '4px solid #c2a661', 
      background: '#fffdf9', 
      padding: '1.25rem', 
      boxShadow: '0 12px 24px rgba(0,0,0,0.15)' 
    }}>
      <div className="flex-between mb-1" style={{ marginBottom: '1rem', alignItems: 'flex-start' }}>
        <div>
          <h3 className="serif" style={{ margin: 0, color: '#113629', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
            <span>⚠️</span> Critical Operational Warnings
          </h3>
          <p className="text-muted" style={{ margin: '0.2rem 0 0 0', fontSize: '0.65rem', letterSpacing: '0.5px' }}>Exceptions requiring administrative actions & assignments</p>
        </div>
        <button 
          onClick={() => setIsDismissed(true)} 
          style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#999', cursor: 'pointer', padding: 0, lineHeight: 1 }}
        >
          &times;
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {pendingVisitsCount > 0 && (
          <div style={{
            background: 'white',
            border: '1px solid #f0edf4',
            borderRadius: '8px',
            padding: '0.6rem 0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
          }}>
            <span style={{ fontSize: '1.1rem' }}>📅</span>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#113629' }}>Site Visits Pending</div>
              <div style={{ fontSize: '0.68rem', color: '#555' }}>{pendingVisitsCount} upcoming client visits need briefings.</div>
            </div>
          </div>
        )}

        {unassignedLeadsCount > 0 && (
          <div style={{
            background: 'white',
            border: '1px solid #f0edf4',
            borderRadius: '8px',
            padding: '0.6rem 0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
          }}>
            <span style={{ fontSize: '1.1rem' }}>👤</span>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#113629' }}>Unassigned Pipeline Leads</div>
              <div style={{ fontSize: '0.68rem', color: '#555' }}>{unassignedLeadsCount} prospects waiting for representative allocation.</div>
            </div>
          </div>
        )}

        {isLowInventory && (
          <div style={{
            background: '#fff5f5',
            border: '1px solid #feb2b2',
            borderRadius: '8px',
            padding: '0.6rem 0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
          }}>
            <span style={{ fontSize: '1.1rem', color: '#c53030' }}>🚨</span>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#c53030' }}>Low Available Inventory</div>
              <div style={{ fontSize: '0.68rem', color: '#742a2a' }}>Vanya Residences is {availablePercentage}% available ({availableUnitsCount} units left).</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
