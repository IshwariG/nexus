"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminGlobalSearchClient({ inquiries, units }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ inquiries: [], units: [] });
  const [selectedLead, setSelectedLead] = useState(null);

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (val.trim().length === 0) {
      setResults({ inquiries: [], units: [] });
      return;
    }

    const lower = val.toLowerCase();

    // Filter Inquiries by name, phone, or email
    const filteredInquiries = inquiries.filter(inq => 
      (inq.name || '').toLowerCase().includes(lower) ||
      (inq.phone || '').toLowerCase().includes(lower) ||
      (inq.email || '').toLowerCase().includes(lower)
    ).slice(0, 5);

    // Filter Property Units by unit_id or type
    const filteredUnits = units.filter(u => 
      (u.unit_id || '').toLowerCase().includes(lower) ||
      (u.type || '').toLowerCase().includes(lower)
    ).slice(0, 5);

    setResults({ inquiries: filteredInquiries, units: filteredUnits });
  };

  const handleSelectUnit = (unitId) => {
    setQuery('');
    setResults({ inquiries: [], units: [] });
    router.push(`/admin/unit/${unitId}`);
  };

  return (
    <div style={{ position: 'relative', width: '280px' }}>
      <div className="search-box" style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.9rem', opacity: 0.5 }}>🔍</span>
        <input 
          type="text" 
          value={query}
          onChange={handleSearch}
          placeholder="Search Leads, Buyers, Flats..." 
          style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', fontFamily: 'inherit' }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults({ inquiries: [], units: [] }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#999', padding: 0 }}>&times;</button>
        )}
      </div>

      {/* Results Dropdown */}
      {(results.inquiries.length > 0 || results.units.length > 0) && (
        <div style={{
          position: 'absolute',
          top: '100%', left: 0, right: 0,
          background: 'white',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          marginTop: '0.5rem',
          zIndex: 100,
          maxHeight: '350px',
          overflowY: 'auto',
          padding: '0.5rem'
        }}>
          {results.inquiries.length > 0 && (
            <div>
              <div style={{ fontSize: '0.6rem', color: '#c2a661', fontWeight: 'bold', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>LEADS & CLIENTS</div>
              {results.inquiries.map(inq => (
                <div 
                  key={inq.id} 
                  onClick={() => { setSelectedLead(inq); setQuery(''); setResults({ inquiries: [], units: [] }); }}
                  style={{ padding: '6px 8px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <strong style={{ color: '#113629' }}>{inq.name}</strong>
                  <span style={{ fontSize: '0.65rem', color: '#666' }}>📞 {inq.phone}</span>
                </div>
              ))}
            </div>
          )}

          {results.units.length > 0 && (
            <div style={{ marginTop: '0.5rem', borderTop: results.inquiries.length > 0 ? '1px solid #f0f0f0' : 'none', paddingTop: results.inquiries.length > 0 ? '0.5rem' : 0 }}>
              <div style={{ fontSize: '0.6rem', color: '#c2a661', fontWeight: 'bold', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>INVENTORY FLATS</div>
              {results.units.map(u => (
                <div 
                  key={u.id} 
                  onClick={() => handleSelectUnit(u.unit_id)}
                  style={{ padding: '6px 8px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div>
                    <strong>Flat {u.unit_id}</strong>
                    <span style={{ fontSize: '0.65rem', color: '#666', marginLeft: '0.5rem' }}>{u.type}</span>
                  </div>
                  <span className={`badge ${u.status === 'AVAILABLE' ? 'available' : u.status === 'SOLD OUT' ? 'sold' : 'reserved'}`} style={{ fontSize: '0.55rem', padding: '2px 6px' }}>{u.status.replace(' OUT', '')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detailed Lead Modal Pop-up */}
      {selectedLead && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11,21,18,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '2.5rem', width: '100%', maxWidth: '450px', borderRadius: '14px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', position: 'relative' }}>
            <button onClick={() => setSelectedLead(null)} style={{ position: 'absolute', top: '1rem', right: '1.5rem', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }}>&times;</button>
            <h2 className="serif" style={{ color: '#113629', marginBottom: '0.2rem', fontSize: '1.6rem' }}>Client Record</h2>
            <p className="text-muted" style={{ fontSize: '0.65rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2rem' }}>Live CRM lead lookup</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', fontSize: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.65rem', color: '#999', display: 'block', fontWeight: 'bold' }}>FULL NAME</label>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#113629', marginTop: '0.2rem' }}>{selectedLead.name}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', color: '#999', display: 'block', fontWeight: 'bold' }}>PHONE</label>
                  <div style={{ marginTop: '0.2rem' }}>{selectedLead.phone}</div>
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', color: '#999', display: 'block', fontWeight: 'bold' }}>EMAIL</label>
                  <div style={{ marginTop: '0.2rem', wordBreak: 'break-all' }}>{selectedLead.email || 'None'}</div>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', color: '#999', display: 'block', fontWeight: 'bold' }}>PIPELINE STATUS</label>
                <div style={{ marginTop: '0.3rem' }}>
                  <span className={`badge ${selectedLead.status.startsWith('NEW') ? 'sold' : 'available'}`} style={{ fontSize: '0.6rem' }}>
                    {selectedLead.status.split('|')[0]}
                  </span>
                </div>
              </div>
              <div style={{ background: '#faf9f6', padding: '1rem', borderRadius: '8px', border: '1px solid #f0edf4' }}>
                <label style={{ fontSize: '0.65rem', color: '#999', display: 'block', fontWeight: 'bold', marginBottom: '0.4rem' }}>LEAD CORRESPONDENCE</label>
                <div style={{ fontSize: '0.82rem', color: '#444', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{selectedLead.message || 'No messages.'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
