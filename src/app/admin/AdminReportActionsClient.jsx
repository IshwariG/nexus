"use client";

import React from 'react';

export default function AdminReportActionsClient({ inquiries, units, buyers }) {
  
  const exportAllData = () => {
    // Combine essential data into one CSV
    const headers = ['Type', 'Name/UnitID', 'Contact/Floor', 'Status/Price', 'Date/Progress'];
    
    const inquiryRows = inquiries.map(inq => [
      'INQUIRY',
      `"${inq.name}"`,
      `"${inq.phone}"`,
      `"${inq.status}"`,
      `"${new Date(inq.created_at).toLocaleDateString()}"`
    ]);

    const unitRows = units.map(u => [
      'UNIT',
      `"${u.unit_id}"`,
      `"${u.floor}"`,
      `"${u.status}"`,
      `"${u.price}"`
    ]);

    const buyerRows = (buyers || []).map(b => [
      'BUYER',
      `"${b.username}"`,
      `"${b.unit_id}"`,
      `"${b.amount_paid} / ${b.total_amount}"`,
      `"${b.construction_progress}%"`
    ]);

    const csvContent = [
      headers.join(','),
      ...inquiryRows.map(r => r.join(',')),
      ...unitRows.map(r => r.join(',')),
      ...buyerRows.map(r => r.join(','))
    ].join('\n');

    downloadCSV(csvContent, 'Vanya_Master_Export.csv');
  };

  const generateQuarterlyReport = () => {
    // Specific business metrics for the report
    const soldCount = units.filter(u => u.status === 'SOLD OUT').length;
    const totalRev = 180.5; // Mock from GridClient for consistency
    const headers = ['VANYA RESIDENCES - Q2 2026 PERFORMANCE REPORT'];
    const body = [
      '',
      `TOTAL UNITS SOLD: ${soldCount}`,
      `REVENUE CONFIRMED: ₹ ${totalRev} Cr`,
      `TOTAL INQUIRIES: ${inquiries.length}`,
      `AVERAGE CONVERSION: ${((soldCount/inquiries.length)*100).toFixed(1)}%`,
      '',
      '--- UNIT DISTRIBUTION ---',
      ...units.map(u => `${u.unit_id}: ${u.status}`),
      '',
      'GENERATED ON: ' + new Date().toLocaleString()
    ];

    const content = [headers, ...body].join('\n');
    downloadFile(content, 'Quarterly_Report_Q2_2026.txt');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{display:'flex', gap:'1rem', alignItems: 'center'}}>
       <button 
         onClick={generateQuarterlyReport}
         className="text-muted-btn" 
         style={{fontSize: '0.7rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0}}
       >
         QUARTERLY REPORT
       </button>
       <button 
         onClick={exportAllData}
         className="text-muted-btn" 
         style={{fontSize: '0.7rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0}}
       >
         EXPORT DATA
       </button>
    </div>
  );
}
