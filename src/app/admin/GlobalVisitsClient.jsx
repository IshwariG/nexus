"use client";

import { useState } from 'react';

export default function GlobalVisitsClient({ inquiries }) {
  const [searchQuery, setSearchQuery] = useState('');

  const salesmanNames = {
    'SR-9999': 'Vikram Sethi',
    'SR-1111': 'Ananya Rao',
    'SR-2222': 'Karan Malhotra',
    'SR-3333': 'Priya Sharma',
    'SR-4444': 'Rohan Verma'
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
      <div className="flex-between mb-2">
        <div>
          <h3 className="section-title serif" style={{margin:0}}>Project-wide Scheduled Visits</h3>
          <p className="text-muted" style={{margin:0}}>Global tracking of site walkthroughs and meeting statuses</p>
        </div>
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input 
            className="input-search" 
            placeholder="Search by client or salesman..." 
            style={{width: '240px'}}
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
                <td className="text-muted" style={{fontSize: '0.75rem'}}>{inq.message}</td>
                <td>
                  <span className={`badge ${inq.status.startsWith('SCHEDULED') ? 'negotiation' : 'available'}`}>
                    {inq.status.startsWith('SCHEDULED') ? 'PENDING VISIT' : 'VISIT DONE'}
                  </span>
                </td>
              </tr>
            );
          })}
          {filteredVisits.length === 0 && (
            <tr><td colSpan="4" className="text-muted" style={{textAlign:'center', padding:'2rem'}}>No visits found matching your search.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
