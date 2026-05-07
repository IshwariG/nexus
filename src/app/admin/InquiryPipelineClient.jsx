"use client";
import React, { useState } from 'react';

export default function InquiryPipelineClient({ inquiries }) {
  const [viewAll, setViewAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const salesmenMap = {
    'SR-9999': { name: 'Vikram Sethi', initials: 'VS', color: 'bg-blue' },
    'SR-1111': { name: 'Ananya Rao', initials: 'AR', color: 'bg-green' },
    'SR-2222': { name: 'Karan Malhotra', initials: 'KM', color: 'bg-red' },
    'SR-3333': { name: 'Priya Sharma', initials: 'PS', color: 'bg-yellow' },
    'SR-4444': { name: 'Rohan Verma', initials: 'RV', color: 'bg-purple' }
  };

  const getSalesmanInfo = (status) => {
    if (!status) return salesmenMap['SR-9999'];
    const parts = status.split('|');
    if (parts.length > 1 && salesmenMap[parts[1]]) {
      return salesmenMap[parts[1]];
    }
    return salesmenMap['SR-9999'];
  };

  const getStatusText = (status) => {
    if (!status) return 'NEW';
    return status.split('|')[0];
  };

  const filteredInquiries = inquiries.filter(inq => 
    (inq.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (inq.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inq.phone || '').includes(searchQuery)
  );

  const displayedInquiries = viewAll ? filteredInquiries : filteredInquiries.slice(0, 4);

  const exportCSV = () => {
    const headers = ['Client Name', 'Email', 'Phone', 'Assigned To', 'Source', 'Status', 'Date'];
    const rows = filteredInquiries.map(inq => {
      const sm = getSalesmanInfo(inq.status);
      const statusText = getStatusText(inq.status);
      return [
        `"${inq.name || 'UNKNOWN'}"`,
        `"${inq.email || ''}"`,
        `"${inq.phone || ''}"`,
        `"${sm.name}"`,
        `"${inq.source || 'WEBSITE PORTAL'}"`,
        `"${statusText}"`,
        `"${new Date(inq.created_at).toLocaleString()}"`
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "inquiry_pipeline_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="widget-card">
      <div className="flex-between mb-2">
        <div>
          <h3 className="serif" style={{margin:'0 0 0.25rem 0'}}>Master Inquiry Pipeline</h3>
          <p className="text-muted" style={{margin:0}}>Unified tracking of cross-channel lead acquisition</p>
        </div>
        <div style={{display:'flex', gap:'1rem'}}>
          <div className="search-box">
             <span className="search-icon">🔍</span>
             <input 
                type="text" 
                placeholder="FILTER BY CLIENT..." 
                className="input-search" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
          <button className="btn-dark" onClick={exportCSV}>EXPORT LOG</button>
        </div>
      </div>
      
      <table className="table-standard">
        <thead>
          <tr>
            <th>CLIENT & CONTACT</th>
            <th>ASSIGNED SALESMAN</th>
            <th>SOURCE</th>
            <th>STATUS</th>
            <th>TIMESTAMP</th>
          </tr>
        </thead>
        <tbody>
          {displayedInquiries.length > 0 ? displayedInquiries.map((inq, i) => {
            const sm = getSalesmanInfo(inq.status);
            const statusText = getStatusText(inq.status);
            return (
              <tr key={inq.id || i}>
                <td><strong>{inq.name?.toUpperCase() || 'UNKNOWN'}</strong><br/><span className="text-muted">{inq.email} <br/> {inq.phone}</span></td>
                <td>
                  <div className="salesman-info">
                     <div className={`sm-avatar ${sm.color}` || 'bg-blue'}>{sm.initials}</div>
                     <div><strong>{sm.name}</strong></div>
                  </div>
                </td>
                <td><span className="source-pill">🌐 {inq.source?.toUpperCase() || 'WEBSITE PORTAL'}</span></td>
                <td><span className={`badge ${statusText.toLowerCase().replace(' ', '-')}`}>{statusText}</span></td>
                <td className="text-muted" style={{fontSize:'0.75rem'}}>{new Date(inq.created_at).toLocaleString('en-US', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</td>
              </tr>
            );
          }) : <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem'}}>No inquiries found matching "{searchQuery}".</td></tr>}
        </tbody>
      </table>
      
      {filteredInquiries.length > 4 && (
        <div className="text-center mt-1 pt-1 border-t">
           <button 
             onClick={() => setViewAll(!viewAll)} 
             style={{background: 'none', border: 'none', cursor: 'pointer'}}
             className="text-muted" 
           >
             <span style={{fontSize:'0.65rem', fontWeight:600, letterSpacing:'1px', textDecoration:'none'}}>
               {viewAll ? 'COLLAPSE PIPELINE ⌃' : `VIEW ALL ${filteredInquiries.length} INQUIRIES ⌄`}
             </span>
           </button>
        </div>
      )}
    </div>
  );
}
