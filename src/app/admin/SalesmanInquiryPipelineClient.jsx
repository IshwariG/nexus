"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SalesmanInquiryPipelineClient({ initialInquiries, salesmanId }) {
  const router = useRouter();
  
  // Sort helper: NEW (unattended) goes to top, CONTACTED/others go to bottom
  const sortLeads = (list) => {
    return [...list].sort((a, b) => {
      const aIsNew = (a.status || '').startsWith('NEW|');
      const bIsNew = (b.status || '').startsWith('NEW|');
      
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;
      
      // Secondary sort by date
      return new Date(b.created_at) - new Date(a.created_at);
    });
  };

  const [leads, setLeads] = useState(sortLeads(initialInquiries));
  const [updatingId, setUpdatingId] = useState(null);

  const handleToggleContact = async (inquiryId, currentStatus) => {
    setUpdatingId(inquiryId);
    
    // Toggle status: NEW|SR-XXXX <-> CONTACTED|SR-XXXX
    let newStatus = `CONTACTED|${salesmanId}`;
    if (currentStatus.startsWith('CONTACTED|')) {
      newStatus = `NEW|${salesmanId}`;
    }

    try {
      const res = await fetch(`/api/inquiries?id=${inquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        // Update local list
        const updatedList = leads.map(l => 
          l.id === inquiryId ? { ...l, status: newStatus } : l
        );
        setLeads(sortLeads(updatedList));
        router.refresh();
      } else {
        alert(data.error || 'Failed to update lead status.');
      }
    } catch (err) {
      alert('Network error updating lead status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getCityFromPincode = (message) => {
    let city = "UNKNOWN LOCATION";
    if (message) {
      const match = message.match(/Pincode:\s*(\d{6})/i);
      if (match) {
        const pin = match[1];
        if (pin.startsWith('11')) city = 'NEW DELHI';
        else if (pin.startsWith('40')) city = 'MUMBAI';
        else if (pin.startsWith('56')) city = 'BANGALORE';
        else if (pin.startsWith('50')) city = 'HYDERABAD';
        else if (pin.startsWith('60')) city = 'CHENNAI';
        else if (pin.startsWith('70')) city = 'KOLKATA';
        else if (pin.startsWith('41')) city = 'PUNE';
        else if (pin.startsWith('38')) city = 'AHMEDABAD';
        else city = `PIN: ${pin}`;
      }
    }
    return city;
  };

  return (
    <div className="widget-card">
      <div className="flex-between">
        <h3 className="section-title serif" style={{ margin: 0 }}>
          Active Inquiry Pipeline <span className="badge sold">URGENT</span>
        </h3>
        <button className="btn-dark" style={{ background: '#0b1512' }}>EXPORT CSV</button>
      </div>
      <table className="table-standard">
        <thead>
          <tr>
            <th>CLIENT NAME</th>
            <th>CONTACT INFORMATION</th>
            <th>SOURCE</th>
            <th>RECEIVED</th>
            <th>CONTACT STATUS</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {leads.length > 0 ? (
            leads.map((inq, i) => {
              const isUncontacted = (inq.status || '').startsWith('NEW|');
              const city = getCityFromPincode(inq.message);
              const cleanSource = inq.source ? inq.source.split('|')[0].replace(/_/g, ' ') : 'Website';

              return (
                <tr key={inq.id || i} style={{ opacity: isUncontacted ? 1 : 0.7, background: isUncontacted ? 'rgba(194, 166, 97, 0.03)' : 'transparent' }}>
                  <td>
                    <strong>{inq.name}</strong>
                    <br />
                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>{city}</span>
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                    📞 {inq.phone}
                    <br />
                    ✉️ {inq.email}
                  </td>
                  <td>
                    <span className="source-pill" style={{ textTransform: 'uppercase', fontSize: '0.6rem' }}>
                      {cleanSource}
                    </span>
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {new Date(inq.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`badge ${isUncontacted ? 'sold' : 'available'}`} style={{ fontSize: '0.58rem' }}>
                      {isUncontacted ? 'NOT ATTENDED' : 'CONTACTED'}
                    </span>
                  </td>
                  <td>
                    {isUncontacted ? (
                      <button 
                        className="btn-dark" 
                        style={{ padding: '6px 12px', fontSize: '0.65rem', background: '#c2a661', color: '#fff', border: 'none', cursor: 'pointer' }}
                        disabled={updatingId === inq.id}
                        onClick={() => handleToggleContact(inq.id, inq.status)}
                      >
                        {updatingId === inq.id ? '...' : 'MARK CONTACTED'}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '0.85rem' }}>✓ Attended</span>
                        <button 
                          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.7rem', textDecoration: 'underline', padding: 0 }}
                          disabled={updatingId === inq.id}
                          onClick={() => handleToggleContact(inq.id, inq.status)}
                        >
                          Undo
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="6" className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>
                No active leads assigned to you.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
