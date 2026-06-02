"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function InquiryPipelineClient({ 
  inquiries = [], 
  allCallLogs = [], 
  opportunities = [], 
  allUsers = [], 
  buyers = [],
  onAddCallLog,
  exotelSid,
  exotelApiKey,
  exotelToken,
  exotelVirtualNumber
}) {
  // Masking helpers for CP Protection
  // Admin pipeline also hides phone/email for CP leads until CLOSED
  const shouldMaskPhone = (inq) => {
    if (!inq || !inq.source || !inq.source.startsWith('CP_Referral|')) return false;
    const stage = (inq.status || '').split('|')[0].toUpperCase();
    return !['DONE', 'BOOKED', 'CONVERTED'].includes(stage);
  };
  
  const getDisplayPhone = (inq) => {
    if (!inq || !inq.phone) return '';
    if (shouldMaskPhone(inq)) {
      const raw = String(inq.phone).trim();
      if (raw.length <= 4) return '••••••';
      return raw.slice(0, 2) + '••••' + raw.slice(-2);
    }
    return inq.phone;
  };

  const getDisplayEmail = (inq) => {
    if (!inq || !inq.email) return '';
    if (shouldMaskPhone(inq)) {
      const parts = inq.email.split('@');
      if (parts.length < 2) return '•••@•••';
      return parts[0].charAt(0) + '•••@' + parts[1];
    }
    return inq.email;
  };


  const [viewAll, setViewAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Timeline states
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [localCallLogs, setLocalCallLogs] = useState([]);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  
  // Log follow-up form states
  const [newLogNotes, setNewLogNotes] = useState('');
  const [newLogDuration, setNewLogDuration] = useState('60');
  const [newLogSalesman, setNewLogSalesman] = useState('');
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // Outbound Dialing States
  const [isDialing, setIsDialing] = useState(false);
  const [dialingMessage, setDialingMessage] = useState('');

  const handleTriggerCall = async (inq) => {
    const repId = inq.status && inq.status.includes('|') ? inq.status.split('|')[1] : '';
    const repUser = allUsers.find(u => u.username === repId || u.employee_id === repId);
    const repPhone = repUser?.phone || '9999999999';
    const clientPhone = inq.phone || '8888888888';

    setIsDialing(true);
    setDialingMessage(`Triggering call for ${inq.name}. Connecting representative (${repPhone}) and prospect (${clientPhone})...`);

    try {
      const res = await fetch('/api/calls/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiry_id: inq.id,
          salesman_id: repId || 'SR-9999',
          salesman_phone: repPhone,
          client_phone: clientPhone,
          exotel_sid: exotelSid,
          exotel_api_key: exotelApiKey,
          exotel_token: exotelToken,
          exotel_virtual_number: exotelVirtualNumber
        })
      });
      const json = await res.json();
      if (json.success) {
        setDialingMessage(json.message);
        // Dismiss overlay quickly so it doesn't block the page
        setTimeout(() => {
          setIsDialing(false);
          setDialingMessage('');
        }, 1800);
        // Refresh call logs in background regardless of overlay state
        if (json.sandbox) {
          fetch(`/api/calls?inquiry_id=${inq.id}`)
            .then(res => res.json())
            .then(j => {
              if (j.success && j.data) {
                setLocalCallLogs(j.data);
                if (onAddCallLog) {
                  j.data.forEach(log => {
                    if (!allCallLogs.some(existing => existing.id === log.id)) {
                      onAddCallLog(log);
                    }
                  });
                }
              }
            })
            .catch(err => console.error('Failed to reload call logs:', err));
        }
      } else {
        alert(json.error || 'Failed to trigger call.');
        setIsDialing(false);
      }
    } catch (err) {
      alert('Network error: ' + err.message);
      setIsDialing(false);
    }
  };

  const salesmenMap = {
    'SR-9999': { name: 'Vikram Sethi', initials: 'VS', color: 'bg-blue' },
    'SR-1111': { name: 'Ananya Rao', initials: 'AR', color: 'bg-green' },
    'SR-2222': { name: 'Rahul Verma', initials: 'RV', color: 'bg-red' },
    'SR-3333': { name: 'Sneha Patil', initials: 'SP', color: 'bg-yellow' },
    'SR-4444': { name: 'Aditya Sharma', initials: 'AS', color: 'bg-purple' }
  };

  const getSalesmanInfo = (status) => {
    if (!status) return salesmenMap['SR-9999'];
    const parts = status.split('|');
    const repId = parts.length > 1 ? parts[1] : parts[0];
    
    // Check dynamic user profile first
    const user = (allUsers || []).find(u => u.role === 'Sales' && (u.employee_id === repId || u.username === repId));
    if (user) {
      const name = user.full_name || user.username;
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      return { name, initials, color: 'bg-green' };
    }
    
    if (parts.length > 1 && salesmenMap[parts[1]]) {
      return salesmenMap[parts[1]];
    }
    return salesmenMap['SR-9999'];
  };

  const getStatusText = (status) => {
    if (!status) return 'NEW';
    return status.split('|')[0];
  };

  const filteredInquiries = inquiries.filter(inq => {
    // Exclude internal admin actions (Assignments/Scheduled Visits) from the Lead Pipeline
    const isInternalAction = 
      (inq.source || '').startsWith('UNIT_ASSIGNMENT_') || 
      (inq.status || '').startsWith('SCHEDULED|') ||
      (inq.status || '').startsWith('DONE|');

    if (isInternalAction) return false;

    return (
      (inq.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (inq.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inq.phone || '').includes(searchQuery)
    );
  });

  const displayedInquiries = viewAll ? filteredInquiries : filteredInquiries.slice(0, 4);

  const handleOpenTimeline = (inq) => {
    setSelectedInquiry(inq);
    
    // Gather matching call logs
    const matchingLogs = allCallLogs.filter(log => String(log.inquiry_id) === String(inq.id));
    setLocalCallLogs(matchingLogs);
    
    // Pre-select assigned representative or default
    const repId = inq.status && inq.status.includes('|') ? inq.status.split('|')[1] : '';
    
    // Determine the list of valid sales representatives dynamically (active only)
    const salesReps = allUsers.filter(u => u.role === 'Sales' && u.is_active !== false);
    const dropdownList = salesReps.length > 0 
      ? salesReps.map(r => ({ id: r.employee_id || r.username, name: r.full_name || r.username }))
      : Object.keys(salesmenMap).map(k => ({ id: k, name: salesmenMap[k].name }));
      
    const isValidRep = repId && repId !== 'unassigned' && dropdownList.some(r => r.id === repId);
    setNewLogSalesman(isValidRep ? repId : (dropdownList[0]?.id || 'SR-9999'));
    
    setNewLogNotes('');
    setNewLogDuration('60');
    setShowTimelineModal(true);
  };

  // Compile sorted chronological timeline events
  const getTimelineEvents = (inq) => {
    if (!inq) return [];
    
    const events = [];
    
    // 1. Lead creation
    events.push({
      type: 'creation',
      title: 'Lead Registered',
      description: `Lead created in database via source: ${inq.source?.toUpperCase() || 'WEBSITE PORTAL'}`,
      timestamp: inq.created_at,
      icon: '➕'
    });
    
    // 2. Rep assignment
    const repId = inq.status && inq.status.includes('|') ? inq.status.split('|')[1] : null;
    if (repId) {
      const user = (allUsers || []).find(u => u.role === 'Sales' && (u.employee_id === repId || u.username === repId));
      const repName = user ? (user.full_name || user.username) : (salesmenMap[repId]?.name || repId);
      events.push({
        type: 'assignment',
        title: 'Sales Representative Allocated',
        description: `Client assigned to representative ${repName} (${repId})`,
        timestamp: inq.created_at, // Use created_at as anchor
        icon: '👤'
      });
    }
    
    // 3. Telephony logs
    localCallLogs.forEach(log => {
      const user = (allUsers || []).find(u => u.role === 'Sales' && (u.employee_id === log.salesman_id || u.username === log.salesman_id));
      const repName = user ? (user.full_name || user.username) : (salesmenMap[log.salesman_id]?.name || log.salesman_id || 'Representative');
      const durationMinSec = `${Math.floor(log.duration / 60)}m ${log.duration % 60}s`;
      events.push({
        type: 'call',
        title: `Outbound Call - ${repName}`,
        description: `Duration: ${durationMinSec}. Notes: ${log.notes || 'No conversation log notes added.'}`,
        timestamp: log.created_at,
        icon: '📞',
        extra: log
      });
    });
    
    // 4. Converted walk-in opportunity
    const opp = opportunities.find(o => String(o.inquiry_id) === String(inq.id));
    if (opp) {
      events.push({
        type: 'opportunity',
        title: 'Elevated to Qualified Opportunity',
        description: `Site visit walk-in verification completed. CP protection tag lock status: ${opp.status}`,
        timestamp: opp.walk_in_date || opp.created_at,
        icon: '👣'
      });
    }
    // Calculate a base timestamp for closing events to ensure they always sort at the end.
    let maxTime = new Date(inq.created_at).getTime();
    if (isNaN(maxTime)) {
      maxTime = Date.now();
    }
    events.forEach(ev => {
      const t = new Date(ev.timestamp).getTime();
      if (!isNaN(t) && t > maxTime) {
        maxTime = t;
      }
    });

    const statusTimestamp = new Date(maxTime + 1000).toISOString();

    // 5. Booking purchase check (matched by phone, email or username)
    const cleanPhone = (ph) => {
      if (!ph) return '';
      return String(ph).replace(/\D/g, '').slice(-10);
    };

    const getUnitIdFromInquiry = (inquiry) => {
      const match = (inquiry.message || '').match(/Unit V-(\w+)/i) || (inquiry.message || '').match(/Unit (\w+)/i) || (inquiry.message || '').match(/unit (\w+)/i);
      if (match) return match[1];
      if ((inquiry.source || '').startsWith('UNIT_ASSIGNMENT_')) {
        return inquiry.source.replace('UNIT_ASSIGNMENT_', '');
      }
      return null;
    };

    const inqUnitId = getUnitIdFromInquiry(inq);

    const matchedBuyers = buyers.filter(b => {
      if (inqUnitId && String(b.unit_id) === String(inqUnitId)) {
        return true;
      }
      
      const user = (allUsers || []).find(u => u.username === b.username);
      
      if (user && user.phone && inq.phone && cleanPhone(user.phone) === cleanPhone(inq.phone)) {
        return true;
      }
      if (user && user.email && inq.email && user.email.toLowerCase().trim() === inq.email.toLowerCase().trim()) {
        return true;
      }
      if (b.username && inq.phone && cleanPhone(b.username) === cleanPhone(inq.phone)) {
        return true;
      }
      if (b.username && inq.email && b.username.toLowerCase().trim() === inq.email.toLowerCase().trim()) {
        return true;
      }
      if (b.username && inq.name && b.username.toLowerCase().replace(/\s+/g, '') === inq.name.toLowerCase().replace(/\s+/g, '')) {
        return true;
      }
      if (user && user.full_name && inq.name && user.full_name.toLowerCase().replace(/\s+/g, '') === inq.name.toLowerCase().replace(/\s+/g, '')) {
        return true;
      }
      return false;
    });

    const statusText = inq.status ? inq.status.split('|')[0].toUpperCase() : 'NEW';
    const isConverted = ['CONVERTED', 'BOOKED'].includes(statusText);

    if (matchedBuyers.length > 0) {
      matchedBuyers.forEach((buyer, bIdx) => {
        const formattedPossession = buyer.possession_date 
          ? new Date(buyer.possession_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
          : 'December 2027';

        const descText = `Contract booking registered for ₹ ${buyer.total_amount} Cr. Paid to date: ₹ ${buyer.amount_paid} Cr. Possession estimate: ${formattedPossession}`;

        let bookingTimeMs = buyer.created_at ? new Date(buyer.created_at).getTime() : null;
        if (!bookingTimeMs || bookingTimeMs <= maxTime) {
          bookingTimeMs = maxTime + 2000 + (bIdx * 100);
        }

        events.push({
          type: 'booking',
          title: `Flat Purchase Finalized: Unit ${buyer.unit_id}`,
          description: descText,
          timestamp: new Date(bookingTimeMs).toISOString(),
          icon: '🖋️'
        });
      });
    } else if (isConverted) {
      const unitText = inqUnitId ? `Unit ${inqUnitId}` : 'Flat/Property';
      events.push({
        type: 'booking',
        title: `Flat Purchase Finalized: ${unitText}`,
        description: `Flat purchase confirmed & logged in conversion records.`,
        timestamp: new Date(maxTime + 2000).toISOString(),
        icon: '🖋️'
      });
    }
    
    // 6. Current Pipeline Status Event (if not NEW)
    if (statusText !== 'NEW' && statusText !== 'UNASSIGNED') {
      if (statusText === 'LOST') {
        events.push({
          type: 'status_change',
          title: 'Lead Closed - Lost',
          description: 'The lead was marked as LOST and closed in the sales pipeline.',
          timestamp: statusTimestamp,
          icon: '❌'
        });
      } else if (['CONVERTED', 'DONE', 'BOOKED'].includes(statusText)) {
        events.push({
          type: 'status_change',
          title: 'Lead Closed - Converted',
          description: `Lead status updated to ${statusText}. Flat purchase finalized.`,
          timestamp: statusTimestamp,
          icon: '🎉'
        });
      } else {
        events.push({
          type: 'status_change',
          title: `Pipeline Stage: ${statusText}`,
          description: `Lead progressed to ${statusText} stage in the sales pipeline.`,
          timestamp: statusTimestamp,
          icon: '📈'
        });
      }
    }
    
    // Sort ascending: earliest to latest
    return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  const handleAddLogSubmit = async (e) => {
    e.preventDefault();
    if (!newLogSalesman) {
      alert('Please select a representative');
      return;
    }
    setIsSubmittingLog(true);
    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiry_id: selectedInquiry.id,
          salesman_id: newLogSalesman,
          duration: parseInt(newLogDuration) || 0,
          notes: newLogNotes,
          recording_url: `/recordings/simulated_${Date.now()}.mp3`
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        // Prepend or append to localCallLogs
        setLocalCallLogs(prev => [...prev, json.data]);
        if (onAddCallLog) {
          onAddCallLog(json.data);
        }
        setNewLogNotes('');
        setNewLogDuration('60');
      } else {
        alert(json.error || 'Failed to submit follow-up log.');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Client Name', 'Email', 'Phone', 'Aadhaar', 'Assigned To', 'Source', 'Status', 'Date'];
    const rows = filteredInquiries.map(inq => {
      const sm = getSalesmanInfo(inq.status);
      const statusText = getStatusText(inq.status);
      return [
        `"${inq.name || 'UNKNOWN'}"`,
        `"${inq.email || ''}"`,
        `"${getDisplayPhone(inq) || ''}"`,
        `"${inq.aadhaar || ''}"`,
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

  // Dynamically load representatives (active only)
  const salesReps = allUsers.filter(u => u.role === 'Sales' && u.is_active !== false);
  const repsDropdownList = salesReps.length > 0 
    ? salesReps.map(r => ({ id: r.employee_id || r.username, name: r.full_name || r.username }))
    : Object.keys(salesmenMap).map(k => ({ id: k, name: salesmenMap[k].name }));

  const timelineEvents = selectedInquiry ? getTimelineEvents(selectedInquiry) : [];
  const totalCallSeconds = localCallLogs.reduce((sum, l) => sum + (l.duration || 0), 0);
  const totalCallDurationFormatted = `${Math.floor(totalCallSeconds / 60)}m ${totalCallSeconds % 60}s`;

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
            <th style={{textAlign: 'right'}}>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {displayedInquiries.length > 0 ? displayedInquiries.map((inq, i) => {
            const sm = getSalesmanInfo(inq.status);
            const statusText = getStatusText(inq.status);
            return (
              <tr key={inq.id || i}>
                <td>
                  <strong>{inq.name?.toUpperCase() || 'UNKNOWN'}</strong>
                  {shouldMaskPhone(inq) && (
                    <span style={{
                      background: '#fef3c7',
                      color: '#b45309',
                      fontSize: '0.6rem',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      fontWeight: 'bold',
                      marginLeft: '6px',
                      border: '1px solid #fde68a',
                      display: 'inline-block',
                      verticalAlign: 'middle'
                    }}>
                      🔒 CP PROTECTED
                    </span>
                  )}
                  <br/>
                  <span className="text-muted">{inq.email} <br/> {getDisplayPhone(inq)}{inq.aadhaar ? ` | Aadhaar: ${inq.aadhaar}` : ''}</span>
                </td>
                <td>
                  <div className="salesman-info">
                     <div className={`sm-avatar ${sm.color}` || 'bg-blue'}>{sm.initials}</div>
                     <div><strong>{sm.name}</strong></div>
                  </div>
                </td>
                <td><span className="source-pill">🌐 {inq.source?.toUpperCase() || 'WEBSITE PORTAL'}</span></td>
                <td><span className={`badge ${statusText.toLowerCase().replace(' ', '-')}`}>{statusText}</span></td>
                <td className="text-muted num-mono" style={{fontSize:'0.75rem'}}>{new Date(inq.created_at).toLocaleString('en-US', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</td>
                <td style={{textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end'}}>
                  <button 
                    onClick={() => handleTriggerCall(inq)}
                    className="btn-dark"
                    style={{padding: '4px 10px', fontSize: '0.72rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '3px', background: 'var(--vanya-gold)', border: 'none'}}
                  >
                    📞 Call Rep
                  </button>
                  <button 
                    onClick={() => handleOpenTimeline(inq)} 
                    className="btn-outline" 
                    style={{padding: '4px 12px', fontSize: '0.72rem', whiteSpace: 'nowrap'}}
                  >
                    💬 Timeline
                  </button>
                </td>
              </tr>
            );
          }) : <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem'}}>No inquiries found matching "{searchQuery}".</td></tr>}
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

      {/* ========================================================= */}
      {/* CUSTOMER INTERACTION DRAWER/MODAL TIMELINE */}
      {/* ========================================================= */}
      {showTimelineModal && selectedInquiry && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(28, 27, 26, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: '750px',
            borderRadius: '6px',
            padding: '2.25rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
            border: '1px solid #e2dfd7',
            maxHeight: '90vh',
            overflowY: 'auto',
            animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {/* Header */}
            <div className="flex-between" style={{borderBottom: '1px solid #e2dfd7', paddingBottom: '1rem'}}>
              <div>
                <span style={{fontSize: '0.62rem', color: 'var(--vanya-gold)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px'}}>CLIENT TIMELINE INTERACTION HUB</span>
                <h2 className="serif" style={{margin: '0.2rem 0 0 0', fontSize: '1.6rem', color: 'var(--vanya-green)'}}>
                  {selectedInquiry.name}
                  {shouldMaskPhone(selectedInquiry) && (
                    <span style={{
                      background: '#fef3c7',
                      color: '#b45309',
                      fontSize: '0.62rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      marginLeft: '8px',
                      border: '1px solid #fde68a',
                      display: 'inline-block',
                      verticalAlign: 'middle'
                    }}>
                      🔒 CP PROTECTED
                    </span>
                  )}
                </h2>
                <span className="text-muted" style={{fontSize: '0.78rem'}}>{selectedInquiry.email} | {getDisplayPhone(selectedInquiry)}{selectedInquiry.aadhaar ? ` | Aadhaar: ${selectedInquiry.aadhaar}` : ''}</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <button
                  onClick={() => handleTriggerCall(selectedInquiry)}
                  className="btn-dark"
                  style={{padding: '6px 16px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--vanya-gold)', border: 'none'}}
                >
                  📞 Call Rep
                </button>
                <button 
                  onClick={() => setShowTimelineModal(false)}
                  style={{background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: '#9ca3af', lineHeight: 1, padding: '0.25rem'}}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Metrics subgrid */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem'}}>
              <div style={{background: 'var(--admin-surface)', border: '1px solid #e2dfd7', padding: '0.75rem 1rem', borderRadius: '4px'}}>
                <span style={{fontSize: '0.55rem', color: 'var(--text-secondary)', fontWeight: '700', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Contact Frequency</span>
                <strong className="num-mono" style={{fontSize: '1.2rem', color: 'var(--vanya-green)'}}>{localCallLogs.length} calls</strong>
              </div>
              <div style={{background: 'var(--admin-surface)', border: '1px solid #e2dfd7', padding: '0.75rem 1rem', borderRadius: '4px'}}>
                <span style={{fontSize: '0.55rem', color: 'var(--text-secondary)', fontWeight: '700', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Total Airtime</span>
                <strong className="num-mono" style={{fontSize: '1.2rem', color: 'var(--vanya-green)'}}>{totalCallDurationFormatted}</strong>
              </div>
              <div style={{background: 'var(--admin-surface)', border: '1px solid #e2dfd7', padding: '0.75rem 1rem', borderRadius: '4px'}}>
                <span style={{fontSize: '0.55rem', color: 'var(--text-secondary)', fontWeight: '700', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Assigned Rep</span>
                <strong style={{fontSize: '0.82rem', display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', marginTop: '4px', color: 'var(--vanya-green)'}}>
                  {getSalesmanInfo(selectedInquiry.status).name}
                </strong>
              </div>
              <div style={{background: 'var(--admin-surface)', border: '1px solid #e2dfd7', padding: '0.75rem 1rem', borderRadius: '4px'}}>
                <span style={{fontSize: '0.55rem', color: 'var(--text-secondary)', fontWeight: '700', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Engagement Level</span>
                <span className={`badge ${opportunities.find(o => String(o.inquiry_id) === String(selectedInquiry.id)) ? 'available' : 'negotiation'}`} style={{marginTop: '5px'}}>
                  {opportunities.find(o => String(o.inquiry_id) === String(selectedInquiry.id)) ? 'QUALIFIED VISIT' : 'LEAD STAGE'}
                </span>
              </div>
            </div>

            {/* Timeline scroll container */}
            <div style={{flex: '1 1 auto', overflowY: 'auto', maxHeight: '480px', minHeight: '380px', border: '1px solid #e2dfd7', borderRadius: '4px', padding: '1.5rem', background: '#fdfcf9'}}>
              <h4 style={{fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '1.25rem', borderBottom: '1px solid #e2dfd7', paddingBottom: '0.5rem'}}>Conversation Timeline</h4>
              
              <div style={{position: 'relative', borderLeft: '2px solid #e2dfd7', marginLeft: '1.25rem', paddingLeft: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                {timelineEvents.map((ev, idx) => (
                  <div key={idx} style={{position: 'relative'}}>
                    {/* Node bubble */}
                    <div style={{
                      position: 'absolute',
                      left: '-37px',
                      top: '2px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: ev.type === 'call' ? 'var(--vanya-gold)' : ev.type === 'booking' ? '#137333' : '#1c1b1a',
                      color: ev.type === 'call' ? '#1c1b1a' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      border: '2px solid #ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      {ev.icon}
                    </div>
                    {/* Event details */}
                    <div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <strong style={{fontSize: '0.82rem', color: 'var(--vanya-green)'}}>{ev.title}</strong>
                        <span className="num-mono text-muted" style={{fontSize: '0.68rem', fontWeight: '700'}}>
                          {new Date(ev.timestamp).toLocaleString('en-US', {month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'})}
                        </span>
                      </div>
                      <p style={{fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0', lineHeight: 1.4}}>{ev.description}</p>
                    </div>
                  </div>
                ))}
                
                {timelineEvents.length === 0 && (
                  <div style={{color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', padding: '1rem 0'}}>No conversation events logged yet.</div>
                )}
              </div>
            </div>

            {/* Log follow up form */}
            <form onSubmit={handleAddLogSubmit} style={{background: 'var(--admin-surface)', border: '1px solid #e2dfd7', padding: '1.25rem', borderRadius: '4px'}}>
              <h4 style={{fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '1rem'}}>Log Interaction Follow-up (Pre-Sales Telephony)</h4>
              
              <div style={{display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem', marginBottom: '0.75rem'}}>
                <div>
                  <label style={{display: 'block', fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem'}}>Interaction Notes / Minutes of Meeting</label>
                  <input 
                    type="text" 
                    value={newLogNotes} 
                    onChange={e => setNewLogNotes(e.target.value)} 
                    placeholder="e.g. Discussed pricing details, client will visit tomorrow..." 
                    required 
                    style={{width: '100%', height: '36px', padding: '0 8px', fontSize: '0.78rem', borderRadius: '4px', border: '1px solid #cbd5e1'}}
                  />
                </div>
                
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem'}}>
                  <div>
                    <label style={{display: 'block', fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem'}}>Rep Account</label>
                    <select
                      value={newLogSalesman}
                      onChange={e => setNewLogSalesman(e.target.value)}
                      style={{width: '100%', height: '36px', padding: '0 4px', fontSize: '0.78rem', borderRadius: '4px', border: '1px solid #cbd5e1'}}
                    >
                      {repsDropdownList.map(rep => (
                        <option key={rep.id} value={rep.id}>{rep.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem'}}>Duration (sec)</label>
                    <input 
                      type="number" 
                      value={newLogDuration} 
                      onChange={e => setNewLogDuration(e.target.value)} 
                      min="1" 
                      required 
                      style={{width: '100%', height: '36px', padding: '0 8px', fontSize: '0.78rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center'}}
                    />
                  </div>
                </div>
              </div>

              <div style={{textAlign: 'right'}}>
                <button 
                  type="submit" 
                  disabled={isSubmittingLog} 
                  className="btn-dark" 
                  style={{padding: '6px 16px', fontSize: '0.72rem'}}
                >
                  {isSubmittingLog ? 'Logging...' : 'Submit Conversation Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALING SIMULATOR OVERLAY */}
      {isDialing && (
        <div
          onClick={() => { setIsDialing(false); setDialingMessage(''); }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(3px)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease',
            cursor: 'pointer'
          }}>
          <div className="widget-card" onClick={e => e.stopPropagation()} style={{
            width: '420px',
            textAlign: 'center',
            padding: '2.5rem',
            borderLeft: '4px solid var(--vanya-gold)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            background: '#ffffff',
            borderRadius: '8px',
            position: 'relative',
            cursor: 'default',
            animation: 'modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <button 
              onClick={() => {
                setIsDialing(false);
                setDialingMessage('');
              }}
              style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#9ca3af',
                lineHeight: 1,
                padding: '0.25rem'
              }}
            >
              &times;
            </button>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>📞</div>
            <h3 className="serif" style={{ color: 'var(--vanya-green)', margin: '0 0 0.75rem 0' }}>Telephony Connector</h3>
            <p style={{ fontSize: '0.82rem', color: '#4b5563', lineHeight: 1.5, margin: 0 }}>{dialingMessage}</p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <span className="dot" style={{ width: '8px', height: '8px', background: 'var(--vanya-gold)', borderRadius: '50%', animation: 'bounce 0.6s infinite alternate' }} />
              <span className="dot" style={{ width: '8px', height: '8px', background: 'var(--vanya-gold)', borderRadius: '50%', animation: 'bounce 0.6s infinite alternate 0.2s' }} />
              <span className="dot" style={{ width: '8px', height: '8px', background: 'var(--vanya-gold)', borderRadius: '50%', animation: 'bounce 0.6s infinite alternate 0.4s' }} />
            </div>
          </div>
        </div>
      )}

      {/* Inline styles for modal animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
