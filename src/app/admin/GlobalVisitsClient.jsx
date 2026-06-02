"use client";

import { useState } from 'react';

export default function GlobalVisitsClient({ inquiries }) {
  const [searchQuery, setSearchQuery] = useState('');

  const salesmanNames = {
    'SR-9999': 'Vikram Sethi',
    'SR-1111': 'Ananya Rao',
    'SR-2222': 'Rahul Verma',
    'SR-3333': 'Sneha Patil',
    'SR-4444': 'Aditya Sharma'
  };

  const filteredVisits = inquiries.filter(inq => {
    const isVisit = inq.status.includes('SCHEDULED|') || inq.status.includes('DONE|');
    if (!isVisit) return false;

    const salesmanId = inq.status.split('|')[1];
    const sName = salesmanNames[salesmanId] || salesmanId;

    const matchesSearch = 
      inq.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      sName.toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchesSearch;
  });

  return (
    <div id="visits" className="widget-card mt-2">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', gap: '1rem', width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <h3 className="section-title serif" style={{margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: 'var(--vanya-green)'}}>Project-wide Scheduled Visits</h3>
          <p className="text-muted" style={{margin:0, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Global tracking of site walkthroughs and meeting statuses</p>
        </div>
        <div className="search-box">
          <span className="search-icon" style={{ fontSize: '0.8rem' }}>🔍</span>
          <input 
            className="input-search" 
            placeholder="Search by client or salesman..." 
            style={{width: '240px', fontSize: '0.8rem', padding: '0.5rem 0.5rem 0.5rem 2rem'}}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <table className="table-standard">
        <thead>
          <tr>
            <th>CLIENT</th>
            <th>ASSIGNED SALESMAN</th>
            <th>SCHEDULE DETAILS</th>
            <th>CURRENT STATUS</th>
          </tr>
        </thead>
        <tbody>
          {filteredVisits.map((inq, i) => {
            const statusParts = inq.status.split('|');
            const salesmanId = statusParts[1];
            const sName = salesmanNames[salesmanId] || salesmanId;
            return (
              <tr key={inq.id || i}>
                <td><strong>{inq.name}</strong><br/><span className="text-muted">{inq.phone}</span></td>
                <td>
                  <div className="salesman-info">
                    <span className="badge" style={{background: '#f0f0f0', color: '#333', textTransform: 'none'}}>{sName}</span>
                  </div>
                </td>
                <td style={{fontSize: '0.78rem', color: '#4b5563'}}>{inq.message}</td>
                <td>
                  {inq.status.startsWith('SCHEDULED') ? (
                    <span className="badge" style={{ background: '#fef7e0', color: '#b06000', padding: '6px 12px', borderRadius: '20px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', textTransform: 'none', fontSize: '0.68rem' }}>
                      PENDING VISIT
                    </span>
                  ) : (
                    <span className="badge" style={{ background: '#e6f4ea', color: '#137333', padding: '6px 12px', borderRadius: '20px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', textTransform: 'none', fontSize: '0.68rem' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" style={{ marginRight: '2px' }}><polyline points="20 6 9 17 4 12"/></svg>
                      VISIT DONE
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
          {filteredVisits.length === 0 && (
            <tr><td colSpan="4" className="text-muted" style={{textAlign:'center', padding:'2rem'}}>No visits found matching your search.</td></tr>
          )}
        </tbody>
      </table>

      {/* Pagination Footer matching Screen 1 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', padding: '0.75rem 0.5rem 0.25rem 0.5rem', borderTop: '1px solid #f1f3f5', fontSize: '0.75rem', color: '#6b7280' }}>
        <div>Showing {filteredVisits.length} of {filteredVisits.length} entries</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: 0.5, fontSize: '0.85rem' }}>‹</button>
          <button style={{ border: 'none', background: 'var(--vanya-green)', color: 'white', width: '26px', height: '26px', borderRadius: '50%', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</button>
          <button style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: 0.5, fontSize: '0.85rem' }}>›</button>
        </div>
        <div>
          <select style={{ padding: '4px 8px', fontSize: '0.72rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', color: '#4b5563' }}>
            <option>10 per page</option>
            <option>25 per page</option>
            <option>50 per page</option>
          </select>
        </div>
      </div>
    </div>
  );
}
