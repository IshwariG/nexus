"use client";
import React, { useState } from 'react';

export default function GridClient({ units, inquiries }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const gridLevels = [5, 4, 3, 2, 1];

  const handleCellClick = (unitId) => {
    // Look for client details in the Inquiries side-channel
    const inquiry = inquiries.find(inq => inq.source === `UNIT_ASSIGNMENT_${unitId}`);
    if (inquiry) {
      setSelectedClient({ unitId, inquiry });
    } else {
      // If no details exist, maybe just show a basic message or do nothing
      const uData = units.find(u => parseInt(u.unit_id) === unitId);
      if (uData && uData.tag_color && !['green', 'red', 'blue'].includes(uData.tag_color)) {
        // Fallback for names assigned before this feature
        setSelectedClient({ unitId, inquiry: { name: uData.tag_color, message: 'Details missing.' } });
      }
    }
  };

  return (
    <>
      <div className="grid-occupancy-structured mt-2">
        {gridLevels.map(lvl => (
          <div className="grid-row" key={lvl}>
            <div className="row-label">LVL {lvl.toString().padStart(2, '0')}</div>
            <div className="row-cells">
              {Array.from({length: 10}).map((_, i) => {
                const unitId = lvl * 100 + i + 1;
                const uData = units.find(u => parseInt(u.unit_id) === unitId);
                const statusClass = uData ? (uData.status === 'AVAILABLE' ? 'available' : (uData.status === 'RESERVED' || uData.status === 'IN NEGOTIATION' ? 'reserved' : 'sold')) : 'available';
                return (
                  <div key={unitId} className={`occ-cell ${statusClass}`} style={{position: 'relative', cursor: (statusClass !== 'available') ? 'pointer' : 'default'}} onClick={() => handleCellClick(unitId)}>
                    <strong>{unitId}</strong>
                    <span>{uData ? uData.status.replace(' OUT', '') : 'AVAILABLE'}</span>
                    {uData && uData.tag_color && !['green', 'red', 'blue'].includes(uData.tag_color) && (
                      <span style={{fontSize: '0.45rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px'}}>{uData.tag_color}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedClient && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div style={{background: 'white', padding: '3rem', width: '100%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.05)', border: '1px solid #eee', position: 'relative'}}>
            <button onClick={() => setSelectedClient(null)} style={{position: 'absolute', top: '1rem', right: '1.5rem', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888'}}>&times;</button>
            <h2 className="serif" style={{color: '#113629', marginBottom: '0.5rem', fontSize: '1.8rem'}}>Unit {selectedClient.unitId} Assignment</h2>
            <p style={{color: '#888', fontSize: '0.8rem', marginBottom: '2rem', letterSpacing: '0.5px'}}>Confidential Client Record</p>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '1.2rem', fontSize: '0.9rem', color: '#555'}}>
              <div>
                <strong style={{fontSize: '0.65rem', letterSpacing: '1px', color: '#888', display: 'block', marginBottom: '0.2rem'}}>FULL NAME</strong>
                <div style={{color: '#113629', fontWeight: 600, fontSize: '1.1rem'}}>{selectedClient.inquiry.name}</div>
              </div>
              {selectedClient.inquiry.phone && (
                <div>
                  <strong style={{fontSize: '0.65rem', letterSpacing: '1px', color: '#888', display: 'block', marginBottom: '0.2rem'}}>PHONE NUMBER</strong>
                  <div>{selectedClient.inquiry.phone}</div>
                </div>
              )}
              {selectedClient.inquiry.email && (
                <div>
                  <strong style={{fontSize: '0.65rem', letterSpacing: '1px', color: '#888', display: 'block', marginBottom: '0.2rem'}}>EMAIL (IF PROVIDED)</strong>
                  <div>{selectedClient.inquiry.email}</div>
                </div>
              )}
              <div style={{background: '#faf9f6', padding: '1rem', border: '1px solid #eee', marginTop: '0.5rem'}}>
                <strong style={{fontSize: '0.65rem', letterSpacing: '1px', color: '#888', display: 'block', marginBottom: '0.5rem'}}>ADDITIONAL DETAILS</strong>
                <div style={{whiteSpace: 'pre-wrap', lineHeight: 1.6}}>{selectedClient.inquiry.message}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
