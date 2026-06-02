"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PortfolioTable from './PortfolioTable';
import VisitManagerClient from './VisitManagerClient';

export default function SalespersonCRMClient({ inquiries = [], units = [], buyers = [], userId = 'SR-9999', isImpersonating = false }) {
  const router = useRouter();

  // Masking helpers for CP Protection
  // Salesman CANNOT see phone/email of CP leads until the deal is CLOSED
  const shouldMaskContact = (inq) => {
    if (!inq || !inq.source || !inq.source.startsWith('CP_Referral|')) return false;
    const stage = (inq.status || '').split('|')[0].toUpperCase();
    return !['DONE', 'BOOKED', 'CONVERTED'].includes(stage);
  };

  const getDisplayPhone = (inq) => {
    if (!inq || !inq.phone) return '';
    if (shouldMaskContact(inq)) {
      const raw = String(inq.phone).trim();
      if (raw.length <= 4) return '••••••';
      return raw.slice(0, 2) + '••••' + raw.slice(-2);
    }
    return inq.phone;
  };

  const getDisplayEmail = (inq) => {
    if (!inq || !inq.email) return '';
    if (shouldMaskContact(inq)) {
      const parts = inq.email.split('@');
      if (parts.length < 2) return '•••@•••';
      return parts[0].charAt(0) + '•••@' + parts[1];
    }
    return inq.email;
  };


  // Active Tab State
  const [activeTab, setActiveTabState] = useState('dashboard');
  const [selectedLeadId, setSelectedLeadIdState] = useState(null);

  // Profile states
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    email: '',
    employee_id: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/users/profile');
        const data = await res.json();
        if (data.success && data.user) {
          setProfileData({
            full_name: data.user.full_name || '',
            phone: data.user.phone || '',
            email: data.user.email || '',
            employee_id: data.user.employee_id || ''
          });
        }
      } catch (e) {
        console.error('Failed to load profile data', e);
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: profileData.full_name,
          phone: profileData.phone,
          email: profileData.email,
          employee_id: profileData.employee_id
        })
      });
      
      const result = await res.json();
      if (result.success) {
        setProfileSuccess(result.message || 'Profile updated successfully!');
        setIsEditingProfile(false);
        // Reload to let updates propagate
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setProfileError(result.error || 'Failed to update profile.');
      }
    } catch (err) {
      setProfileError('Network error while updating profile.');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) setActiveTabState(tab);
      
      const leadId = params.get('leadId');
      if (leadId) setSelectedLeadIdState(parseInt(leadId));
    }
  }, []);

  const setActiveTab = (tabName) => {
    setActiveTabState(tabName);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', tabName);
      window.history.pushState(null, '', `?${params.toString()}`);
    }
  };

  const setSelectedLeadId = (leadId) => {
    setSelectedLeadIdState(leadId);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (leadId) {
        params.set('leadId', leadId);
      } else {
        params.delete('leadId');
      }
      window.history.pushState(null, '', `?${params.toString()}`);
    }
  };
  
  // Search & Filter state
  const [leadSearch, setLeadSearch] = useState('');
  const [leadFilter, setLeadFilter] = useState('ALL'); // 'ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'VISIT', 'PROPOSAL', 'NEGOTIATION', 'CLOSED', 'LOST'
  const [inventoryTower, setInventoryTower] = useState('ALL'); // 'ALL', 'A', 'B', 'C', 'D'
  
  // Custom local state for simulation (Tasks, Calendar events)
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Call Rahul Sharma to schedule site visit', priority: 'HIGH', done: false, date: 'Today' },
    { id: 2, text: 'Send updated 3BHK pricing sheet to Dr. Iyer', priority: 'MEDIUM', done: false, date: 'Today' },
    { id: 3, text: 'Confirm booking deposit transaction id with accounts', priority: 'HIGH', done: true, date: 'Yesterday' },
    { id: 4, text: 'Prepare weekly presentation report', priority: 'LOW', done: false, date: 'Tomorrow' },
    { id: 5, text: 'Follow up with CP Partner (Apex Luxury) on lead status', priority: 'MEDIUM', done: false, date: 'Today' }
  ]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');

  const [leadNotes, setLeadNotes] = useState({
    // inquiryId: Array of note strings
  });
  const [currentNoteText, setCurrentNoteText] = useState('');

  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [addLeadForm, setAddLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    aadhaar: '',
    source: 'Direct Sales',
    pincode: '',
    notes: ''
  });

  // Schedule Callback Modal
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false);
  const [callbackLeadId, setCallbackLeadId] = useState(null);
  const [callbackDateTime, setCallbackDateTime] = useState('');

  // Book Site Visit Modal
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [visitLeadId, setVisitLeadId] = useState(null);
  const [visitDateTime, setVisitDateTime] = useState('');
  const [visitMessage, setVisitMessage] = useState('');

  // Close Deal / Buyer Registration Modal
  const [isCloseDealModalOpen, setIsCloseDealModalOpen] = useState(false);
  const [closeDealLeadId, setCloseDealLeadId] = useState(null);

  // Dialer Simulator States
  const [isCallActive, setIsCallActive] = useState(false);
  const [dialerLead, setDialerLead] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callNotes, setCallNotes] = useState('');
  const [callLogs, setCallLogs] = useState([]);

  useEffect(() => {
    if (selectedLeadId) {
      fetch(`/api/calls?inquiry_id=${selectedLeadId}`)
        .then(res => res.json())
        .then(json => {
          if (json.success) {
            setCallLogs(json.data || []);
          }
        })
        .catch(err => console.error('Failed to fetch call logs:', err));
    } else {
      setCallLogs([]);
    }
  }, [selectedLeadId]);

  const [closeDealForm, setCloseDealForm] = useState({
    unitId: '',
    username: '',
    password: '',
    totalAmount: '',
    amountPaid: '',
    possessionDate: '2027-12-31',
    progress: '72'
  });

  // Calendar state
  const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);
  const [calendarEvents, setCalendarEvents] = useState([]); // { date: 'YYYY-MM-DD', title, type }
  const [newEventForm, setNewEventForm] = useState({ date: '', title: '', type: 'call' });
  const [showAddEventForm, setShowAddEventForm] = useState(false);

  // Build calendar events from inquiries (callbacks & visits) once on mount
  useEffect(() => {
    const extracted = [];
    myInquiries.forEach(inq => {
      if (!inq.message) return;
      // Parse [CALLBACK SET FOR <datetime>] patterns
      const cbMatches = [...inq.message.matchAll(/\[CALLBACK SET FOR ([^\]]+)\]/gi)];
      cbMatches.forEach(m => {
        const d = new Date(m[1]);
        if (!isNaN(d)) {
          extracted.push({
            date: d.toISOString().split('T')[0],
            title: `📞 ${inq.name} – Follow Up`,
            type: 'call'
          });
        }
      });
      // Parse [VISIT SCHEDULED: <datetime>] patterns
      const vsMatches = [...inq.message.matchAll(/\[VISIT SCHEDULED: ([^\]]+)\]/gi)];
      vsMatches.forEach(m => {
        const d = new Date(m[1]);
        if (!isNaN(d)) {
          extracted.push({
            date: d.toISOString().split('T')[0],
            title: `🏠 ${inq.name} – Site Visit`,
            type: 'visit'
          });
        }
      });
    });
    if (extracted.length > 0) setCalendarEvents(prev => [...prev, ...extracted]);
  }, []);

  // Salesperson Names mapping
  const salesmanNames = {
    'SR-9999': 'Vikram Sethi',
    'SR-1111': 'Ananya Rao',
    'SR-2222': 'Rahul Verma',
    'SR-3333': 'Sneha Patil',
    'SR-4444': 'Aditya Sharma'
  };
  const currentSalesmanName = profileData.full_name || salesmanNames[userId] || 'Executive Advisor';

  // Salesperson avatar meta
  const salesmanMeta = {
    'SR-9999': { initials: 'VS', color: '#1a73e8' },
    'SR-1111': { initials: 'AR', color: '#34a853' },
    'SR-2222': { initials: 'RV', color: '#ea4335' },
    'SR-3333': { initials: 'SP', color: '#fbbc05' },
    'SR-4444': { initials: 'AS', color: '#ab47bc' }
  };

  const getInitials = (name) => {
    if (!name) return 'EX';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = profileData.full_name ? getInitials(profileData.full_name) : (salesmanMeta[userId]?.initials || 'EX');
  const meta = {
    initials: initials,
    color: salesmanMeta[userId]?.color || 'var(--vanya-green)'
  };

  // --- FILTER & CALCULATIONS ---
  // Inquiries filter rule for salesman: status splits into [STATUS, salesmanId]
  const myInquiries = inquiries.filter(inq => {
    if (!inq.status) return false;
    
    // Ignore internal admin unit assignments from the pipeline
    const isInternalAction = (inq.source || '').startsWith('UNIT_ASSIGNMENT_');
    if (isInternalAction) return false;

    const parts = inq.status.split('|');
    return parts.length > 1 && parts[1] === userId;
  });

  // Assign units rule
  const validUnits = units.filter(u => {
    const id = parseInt(u.unit_id);
    const floor = Math.floor(id / 100);
    return floor >= 1 && floor <= 10 && (id % 100) >= 1 && (id % 100) <= 10;
  });

  let myUnits = [];
  if (userId === 'SR-9999') {
    myUnits = validUnits.filter(u => ['1', '2'].includes(u.floor));
  } else if (userId === 'SR-1111') {
    myUnits = validUnits.filter(u => ['3', '4'].includes(u.floor));
  } else if (userId === 'SR-2222') {
    myUnits = validUnits.filter(u => ['5', '6'].includes(u.floor));
  } else if (userId === 'SR-3333') {
    myUnits = validUnits.filter(u => ['7', '8'].includes(u.floor));
  } else if (userId === 'SR-4444') {
    myUnits = validUnits.filter(u => ['9', '10'].includes(u.floor));
  } else {
    myUnits = validUnits.slice(0, 20);
  }

  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    if (typeof priceStr === 'number') return priceStr;
    const cleaned = priceStr.replace(/[^\d.]/g, '');
    let num = parseFloat(cleaned) || 0;
    if (priceStr.toLowerCase().includes('cr')) {
      num = num * 10000000;
    } else if (priceStr.toLowerCase().includes('l') || priceStr.toLowerCase().includes('lakh')) {
      num = num * 100000;
    } else if (num <= 100) {
      num = num * 10000000;
    }
    return num;
  };

  const formatPriceCr = (value) => {
    if (value >= 10000000) {
      return `₹ ${(value / 10000000).toFixed(2)} Cr`;
    }
    if (value >= 100000) {
      return `₹ ${(value / 100000).toFixed(1)} L`;
    }
    return `₹ ${value.toLocaleString('en-IN')}`;
  };

  const myBuyerDetails = buyers.filter(b => myUnits.some(u => u.unit_id === b.unit_id));
  const closedRevenueSecured = myBuyerDetails.reduce((sum, b) => sum + parsePrice(b.amount_paid), 0);
  const closedRevenueTotal = myBuyerDetails.reduce((sum, b) => sum + parsePrice(b.total_amount), 0);

  const negotiationUnits = myUnits.filter(u => ['IN NEGOTIATION', 'RESERVED'].includes(u.status));
  const expectedRevenue = negotiationUnits.reduce((sum, u) => sum + parsePrice(u.price), 0);

  // Count active leads (status doesn't start with BOOKED, CONVERTED, LOST)
  const activeLeadsCount = myInquiries.filter(inq => {
    const s = inq.status.split('|')[0];
    return !['BOOKED', 'CONVERTED', 'LOST'].includes(s);
  }).length;

  // Leads distribution
  const totalLeads = myInquiries.length;
  const newLeads = myInquiries.filter(inq => inq.status.startsWith('NEW|')).length;
  const contactedLeads = myInquiries.filter(inq => inq.status.startsWith('CONTACTED|')).length;
  const qualifiedLeads = myInquiries.filter(inq => inq.status.startsWith('QUALIFIED|')).length;
  const visitsLeads = myInquiries.filter(inq => inq.status.startsWith('SCHEDULED|') || inq.status.startsWith('DONE|')).length;
  const proposalLeads = myInquiries.filter(inq => inq.status.startsWith('PROPOSAL|')).length;
  const negotiationLeads = myInquiries.filter(inq => inq.status.startsWith('NEGOTIATION|')).length;
  const closedLeads = myInquiries.filter(inq => inq.status.startsWith('BOOKED|') || inq.status.startsWith('CONVERTED|')).length;
  const lostLeads = myInquiries.filter(inq => inq.status.startsWith('LOST|')).length;

  // Selected Lead helper
  const selectedLead = myInquiries.find(inq => inq.id === selectedLeadId);

  // Parse location from pincode inside message
  const getCityFromPincode = (message) => {
    let city = "UNKNOWN LOCATION";
    if (message) {
      const match = message.match(/Pincode:\s*(\d{6})/i);
      if (match) {
        const pin = match[1];
        if (pin.startsWith('11')) city = 'New Delhi';
        else if (pin.startsWith('40')) city = 'Mumbai';
        else if (pin.startsWith('56')) city = 'Bangalore';
        else if (pin.startsWith('50')) city = 'Hyderabad';
        else if (pin.startsWith('60')) city = 'Chennai';
        else if (pin.startsWith('70')) city = 'Kolkata';
        else if (pin.startsWith('41')) city = 'Pune';
        else if (pin.startsWith('38')) city = 'Ahmedabad';
        else city = `PIN: ${pin}`;
      }
    }
    return city;
  };

  // Status badge style helper
  const getStatusBadge = (statusStr) => {
    const rawStatus = statusStr.split('|')[0];
    let badgeClass = 'badge ';
    let label = rawStatus;
    
    if (rawStatus === 'NEW') { badgeClass += 'sold'; label = 'New Lead'; }
    else if (rawStatus === 'CONTACTED') { badgeClass += 'negotiation'; label = 'Contacted'; }
    else if (rawStatus === 'QUALIFIED') { badgeClass += 'reserved'; label = 'Qualified'; }
    else if (rawStatus === 'SCHEDULED') { badgeClass += 'negotiation'; label = 'Visit Scheduled'; }
    else if (rawStatus === 'DONE') { badgeClass += 'available'; label = 'Visit Done'; }
    else if (rawStatus === 'PROPOSAL') { badgeClass += 'reserved'; label = 'Proposal Sent'; }
    else if (rawStatus === 'NEGOTIATION') { badgeClass += 'negotiation'; label = 'In Negotiation'; }
    else if (rawStatus === 'BOOKED' || rawStatus === 'CONVERTED') { badgeClass += 'available'; label = 'Closed Won'; }
    else if (rawStatus === 'LOST') { badgeClass += 'sold'; label = 'Lost'; }
    else { badgeClass += 'available'; }

    return <span className={badgeClass}>{label}</span>;
  };

  // --- ACTIONS ---
  const handleUpdateStatus = async (inquiryId, newStatusType) => {
    if (newStatusType === 'CONVERTED') {
      const lead = inquiries.find(inq => inq.id === inquiryId);
      setCloseDealLeadId(inquiryId);
      setCloseDealForm(prev => ({
        ...prev,
        username: lead ? lead.name.toLowerCase().replace(/\s+/g, '') : '',
        password: 'password123',
        totalAmount: '₹ 4.80 Cr',
        amountPaid: '₹ 1.20 Cr',
        unitId: ''
      }));
      setIsCloseDealModalOpen(true);
      return;
    }

    const finalStatus = `${newStatusType}|${userId}`;
    try {
      const res = await fetch(`/api/inquiries?id=${inquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: finalStatus })
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert(data.error || 'Failed to update status.');
      }
    } catch (err) {
      alert('Network error updating status.');
    }
  };

  const handleCloseDealSubmit = async (e) => {
    e.preventDefault();
    if (!closeDealForm.unitId) {
      alert('Please select a unit/flat to finalize booking.');
      return;
    }
    try {
      // 1. Create the Buyer portal login & Details, mark unit as SOLD OUT
      const resBuyer = await fetch('/api/buyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: closeDealForm.username,
          password: closeDealForm.password,
          role: 'Buyer',
          unit_id: closeDealForm.unitId,
          total_amount: closeDealForm.totalAmount,
          amount_paid: closeDealForm.amountPaid,
          construction_progress: `${closeDealForm.progress}%`,
          possession_date: closeDealForm.possessionDate
        })
      });
      const dataBuyer = await resBuyer.json();
      if (!dataBuyer.success) {
        alert(dataBuyer.error || 'Failed to register buyer details.');
        return;
      }

      // 2. Update Inquiry status to CONVERTED
      const finalStatus = `CONVERTED|${userId}`;
      const closingLead = myInquiries.find(i => i.id === closeDealLeadId);
      const resInquiry = await fetch(`/api/inquiries?id=${closeDealLeadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: finalStatus,
          message: `Closed Deal on Unit V-${closeDealForm.unitId}. Price: ${closeDealForm.totalAmount}. Paid: ${closeDealForm.amountPaid}.`
        })
      });
      const dataInquiry = await resInquiry.json();
      
      if (dataInquiry.success) {
        // 3. Trigger CP commission check — POST a UNIT_ASSIGNMENT_ inquiry so the
        //    commission auto-generation logic in /api/inquiries fires for this buyer's phone
        if (closingLead?.phone) {
          await fetch('/api/inquiries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: closingLead.name || closeDealForm.username,
              email: closingLead.email || '',
              phone: closingLead.phone,
              source: `UNIT_ASSIGNMENT_${closeDealForm.unitId}`,
              status: `CONVERTED|${userId}`,
              message: `Commission trigger for unit ${closeDealForm.unitId}`
            })
          });
        }

        alert(`Deal closed successfully!\n\nBuyer login created:\nUsername: ${closeDealForm.username}\nPassword: ${closeDealForm.password}\nFlat V-${closeDealForm.unitId} is marked as SOLD OUT.`);
        setIsCloseDealModalOpen(false);
        router.refresh();
        setTimeout(() => window.location.reload(), 300);
      } else {
        alert(dataInquiry.error || 'Failed to update inquiry status.');
      }
    } catch (err) {
      alert('Error finalizing deal closure: ' + err.message);
    }
  };

  const handleAddLeadSubmit = async (e) => {
    e.preventDefault();
    const finalStatus = `NEW|${userId}`;
    const cleanMessage = `Pincode: ${addLeadForm.pincode}. Notes: ${addLeadForm.notes}`;
    
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addLeadForm.name,
          email: addLeadForm.email,
          phone: addLeadForm.phone,
          aadhaar: addLeadForm.aadhaar,
          source: addLeadForm.source,
          status: finalStatus,
          message: cleanMessage,
          salesman_id: userId
        })
      });
      const data = await res.json();
      if (res.status === 201) {
        setIsAddLeadOpen(false);
        setAddLeadForm({ name: '', email: '', phone: '', aadhaar: '', source: 'Direct Sales', pincode: '', notes: '' });
        router.refresh();
      } else {
        alert('Failed to insert lead: ' + (data.warning || data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Network error adding lead.');
    }
  };

  const handleAddNote = async (leadId) => {
    if (!currentNoteText.trim()) return;
    const noteText = `\n[NOTE - ${new Date().toLocaleDateString()}]: ${currentNoteText}`;
    
    // Update local state for immediate feedback
    const currentNotes = leadNotes[leadId] || [];
    setLeadNotes({
      ...leadNotes,
      [leadId]: [...currentNotes, { text: currentNoteText, time: new Date().toLocaleString() }]
    });
    
    // Save to database
    const inq = myInquiries.find(i => i.id === leadId);
    const newMsg = inq ? `${inq.message || ''}${noteText}` : noteText;
    
    try {
      await fetch(`/api/inquiries?id=${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMsg })
      });
      router.refresh();
    } catch(err) {}
    
    setCurrentNoteText('');
  };

  const handleWalkInComplete = async (leadId) => {
    if (!window.confirm('Are you sure you want to mark this client\'s physical site walk-in as complete? This will promote them to Opportunity and trigger CP 30-day tagging.')) {
      return;
    }
    try {
      const res = await fetch(`/api/inquiries?id=${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: `DONE|${userId}`
        })
      });
      const json = await res.json();
      if (json.success) {
        alert('Walk-in registered! Lead promoted to Opportunity successfully. 30-day CP tagging logic is now active in database!');
        window.location.reload();
      } else {
        alert('Failed to update status: ' + json.error);
      }
    } catch(err) {
      alert('Error updating status: ' + err.message);
    }
  };

  // Task events
  const handleToggleTask = (taskId) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks([
      ...tasks,
      { id: Date.now(), text: newTaskText, priority: newTaskPriority, done: false, date: 'Today' }
    ]);
    setNewTaskText('');
  };

  // Callback / Visit updates
  const handleScheduleCallback = async (e) => {
    e.preventDefault();
    if (!callbackLeadId) return;
    const finalStatus = `CONTACTED|${userId}`;
    const timeStr = `[CALLBACK SET FOR ${callbackDateTime}]`;
    const inq = myInquiries.find(i => i.id === callbackLeadId);
    const newMsg = inq ? `${inq.message || ''}\n${timeStr}` : timeStr;

    try {
      // Patch status to contacted, append callback detail
      const res = await fetch(`/api/inquiries?id=${callbackLeadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: finalStatus, message: newMsg })
      });
      if (res.ok) {
        setIsCallbackModalOpen(false);
        setCallbackDateTime('');
        router.refresh();
      }
    } catch(err) {}
  };

  const handleBookVisit = async (e) => {
    e.preventDefault();
    if (!visitLeadId) return;
    // Set status to SCHEDULED|salesperson
    const finalStatus = `SCHEDULED|${userId}`;
    const visitNote = `\n[VISIT SCHEDULED: ${visitDateTime}] ${visitMessage}`;
    const inq = myInquiries.find(i => i.id === visitLeadId);
    const newMsg = inq ? `${inq.message || ''}${visitNote}` : visitNote;

    try {
      const res = await fetch(`/api/inquiries?id=${visitLeadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: finalStatus, message: newMsg })
      });
      if (res.ok) {
        setIsVisitModalOpen(false);
        setVisitDateTime('');
        setVisitMessage('');
        router.refresh();
      }
    } catch(err) {}
  };

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--admin-bg)' }}>
      
      {/* --- SIDEBAR --- */}
      <aside className="admin-sidebar" style={{
        width: '260px',
        background: '#ffffff',
        borderRight: '1px solid #f1f3f5',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 10,
        boxShadow: '2px 0 12px rgba(0,0,0,0.01)',
        overflowY: 'auto'
      }}>
        
        {/* Logo */}
        <div className="admin-sidebar-logo" style={{
          padding: '1.75rem 2rem',
          borderBottom: '1px solid #f1f3f5',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D9A036" strokeWidth="2.5">
            <rect x="3" y="10" width="4" height="11" rx="1" fill="#D9A036" />
            <rect x="10" y="4" width="4" height="17" rx="1" fill="var(--vanya-green)" stroke="var(--vanya-green)" />
            <rect x="17" y="7" width="4" height="14" rx="1" fill="#D9A036" />
          </svg>
          <div>
            <h2 className="serif" style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--vanya-green)' }}>DreamSpaces</h2>
            <span style={{ fontSize: '0.55rem', color: 'var(--vanya-gold)', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>Sales CRM</span>
          </div>
        </div>

        {/* User Card */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #f1f3f5',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: meta.color,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '0.9rem'
          }}>
            {meta.initials}
          </div>
          <div>
            <strong style={{ display: 'block', fontSize: '0.85rem', color: '#1f2937' }}>{currentSalesmanName}</strong>
            <span className="text-muted" style={{ fontSize: '0.7rem', display: 'block' }}>ID: {userId}</span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="admin-nav" style={{ padding: '1.25rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'inventory', label: 'Tower Inventory', icon: '🏢' },
            { id: 'leads', label: 'Leads Pipeline', icon: '🤝', count: activeLeadsCount },
            { id: 'followups', label: 'Follow Ups', icon: '📞' },
            { id: 'bookings', label: 'Bookings', icon: '🔑' },
            { id: 'visits', label: 'Site Visits', icon: '🚶‍♂️' },
            { id: 'tasks', label: 'Tasks Manager', icon: '✅' },
            { id: 'calendar', label: 'Calendar Grid', icon: '📅' },
            { id: 'reports', label: 'Reports & Analytics', icon: '📈' },
            { id: 'profile', label: 'My Profile', icon: '👤' },
            { id: 'settings', label: 'Settings', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={async () => {
                  setActiveTab(tab.id);
                  if (tab.id !== 'details') setSelectedLeadId(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                border: 'none',
                background: activeTab === tab.id ? 'rgba(194,166,97,0.1)' : 'transparent',
                color: activeTab === tab.id ? 'var(--vanya-green)' : '#4b5563',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                fontWeight: activeTab === tab.id ? '600' : '500',
                fontSize: '0.82rem',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </span>
              {tab.count !== undefined && tab.count > 0 && (
                <span style={{
                  background: '#c5221f',
                  color: 'white',
                  fontSize: '0.62rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontWeight: 'bold'
                }}>{tab.count}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer Controls */}
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #f1f3f5', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {isImpersonating && (
            <form action={async () => {
              const { revertToAdmin } = await import('./actions');
              await revertToAdmin();
            }}>
              <button type="submit" className="btn-dark" style={{
                width: '100%',
                padding: '0.6rem',
                fontSize: '0.72rem',
                background: 'var(--vanya-gold)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                letterSpacing: '0.5px'
              }}>RETURN TO ADMIN</button>
            </form>
          )}

          <form action={async () => {
            const { logoutUser } = await import('./actions');
            await logoutUser();
          }}>
            <button type="submit" className="btn-outline" style={{
              width: '100%',
              padding: '0.6rem',
              fontSize: '0.72rem',
              background: 'transparent',
              color: '#4b5563',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}>LOGOUT</button>
          </form>
        </div>
      </aside>

      {/* --- MAIN CONTENT WINDOW --- */}
      <main className="admin-main" style={{
        flex: 1,
        marginLeft: '260px',
        padding: '2.5rem',
        minHeight: '100vh',
        boxSizing: 'border-box'
      }}>
        
        {/* Header Greeting */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h1 className="serif" style={{ fontSize: '2.2rem', margin: 0, fontWeight: 'normal', color: 'var(--vanya-green)' }}>
              Namaste, {currentSalesmanName.split(' ')[0]}
            </h1>
            <p className="text-muted" style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem' }}>
              Sales Executive Portal &bull; Vanya Residences Heritage Collection
            </p>
          </div>
          <div>
            <button onClick={() => setIsAddLeadOpen(true)} className="btn-primary" style={{
              background: 'var(--vanya-green)',
              color: 'white',
              border: 'none',
              padding: '0.8rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              fontSize: '0.78rem',
              boxShadow: '0 4px 12px rgba(17,54,41,0.15)'
            }}>
              + ADD DIRECT LEAD
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: DASHBOARD */}
        {/* ============================================================== */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* KPI Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
              {[
                { label: 'Assigned Leads', val: totalLeads, desc: `${newLeads} new leads unattended`, icon: '👥', color: '#eff6ff', border: '#bfdbfe' },
                { label: 'Qualified Leads', val: qualifiedLeads, desc: `${contactedLeads} contacted in funnel`, icon: '🎯', color: '#fef3c7', border: '#fde68a' },
                { label: 'Visits Conducted', val: visitsLeads, desc: 'Property site-visits booked', icon: '🚶‍♂️', color: '#ecfdf5', border: '#a7f3d0' },
                { label: 'Closed Revenue', val: closedRevenueSecured === 0 ? '₹ 0.00' : formatPriceCr(closedRevenueSecured), desc: `${closedLeads} bookings secured`, icon: '🔑', color: '#f5f3ff', border: '#ddd6fe' }
              ].map((card, i) => (
                <div key={i} className="widget-card" style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid #f1f3f5',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <span className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>{card.label}</span>
                    <h2 className="serif" style={{ fontSize: '2rem', margin: '0.4rem 0', color: 'var(--vanya-green)' }}>{card.val}</h2>
                    <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{card.desc}</span>
                  </div>
                  <div style={{
                    fontSize: '1.8rem',
                    padding: '0.8rem',
                    borderRadius: '12px',
                    backgroundColor: card.color,
                    border: `1px solid ${card.border}`,
                    lineHeight: 1
                  }}>{card.icon}</div>
                </div>
              ))}
            </div>

            {/* Pipeline funnel and tasks row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
              
              {/* Funnel Widget */}
              <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5' }}>
                <h3 className="serif" style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: 'var(--vanya-green)' }}>Lead Pipeline Funnel Velocity</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { stage: 'Total Leads', count: totalLeads, pct: 100, color: 'var(--vanya-green)' },
                    { stage: 'Contacted', count: contactedLeads + qualifiedLeads + proposalLeads + ClosedWonCount(myInquiries), pct: Math.round(((contactedLeads + qualifiedLeads + proposalLeads + ClosedWonCount(myInquiries)) / (totalLeads || 1)) * 100), color: '#1a5c45' },
                    { stage: 'Qualified', count: qualifiedLeads + proposalLeads + ClosedWonCount(myInquiries), pct: Math.round(((qualifiedLeads + proposalLeads + ClosedWonCount(myInquiries)) / (totalLeads || 1)) * 100), color: '#2d7c5f' },
                    { stage: 'Proposals / Visits', count: proposalLeads + ClosedWonCount(myInquiries), pct: Math.round(((proposalLeads + ClosedWonCount(myInquiries)) / (totalLeads || 1)) * 100), color: 'var(--vanya-gold)' },
                    { stage: 'Closed Won', count: ClosedWonCount(myInquiries), pct: Math.round((ClosedWonCount(myInquiries) / (totalLeads || 1)) * 100), color: '#d9a036' }
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, width: '120px', color: '#4b5563' }}>{f.stage}</span>
                      <div style={{ flex: 1, height: '24px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${f.pct}%`,
                          backgroundColor: f.color,
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '0.75rem',
                          color: 'white',
                          fontSize: '0.68rem',
                          fontWeight: 'bold',
                          transition: 'width 1s ease-in-out'
                        }}>
                          {f.count} ({f.pct}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f3f5', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
                  <div>
                    <span className="text-muted" style={{ fontSize: '0.7rem', display: 'block' }}>ESTIMATED DEAL VALUE</span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--vanya-green)' }}>{expectedRevenue === 0 ? '₹ 0.00' : formatPriceCr(expectedRevenue)} expected</strong>
                  </div>
                  <div>
                    <span className="text-muted" style={{ fontSize: '0.7rem', display: 'block' }}>CONVERTED REVENUE</span>
                    <strong style={{ fontSize: '1.1rem', color: '#d9a036' }}>{closedRevenueSecured === 0 ? '₹ 0.00' : formatPriceCr(closedRevenueSecured)} secured</strong>
                  </div>
                </div>
              </div>

              {/* Tasks due today */}
              <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 className="serif" style={{ margin: 0, fontSize: '1.25rem', color: 'var(--vanya-green)' }}>Tasks Due Today</h3>
                  <button onClick={() => setActiveTab('tasks')} style={{ background: 'none', border: 'none', color: 'var(--vanya-gold)', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}>View All</button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '220px', overflowY: 'auto' }}>
                  {tasks.filter(t => t.date === 'Today').map(t => (
                    <label key={t.id} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.6rem 0.8rem',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      opacity: t.done ? 0.6 : 1,
                      borderLeft: `4px solid ${t.priority === 'HIGH' ? '#dc2626' : t.priority === 'MEDIUM' ? '#d97706' : '#2563eb'}`
                    }}>
                      <input type="checkbox" checked={t.done} onChange={() => handleToggleTask(t.id)} style={{ marginTop: '0.15rem', accentColor: 'var(--vanya-green)' }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.78rem', color: '#374151', textDecoration: t.done ? 'line-through' : 'none', display: 'block' }}>{t.text}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Site Visits Section */}
            <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h3 className="serif" style={{ margin: 0, fontSize: '1.25rem', color: 'var(--vanya-green)' }}>My Scheduled Site Visits</h3>
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.75rem' }}>Upcoming properties viewings with clients</p>
                </div>
                <button onClick={() => setActiveTab('visits')} className="btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.7rem' }}>VISIT MANAGER</button>
              </div>

              <table className="table-standard">
                <thead>
                  <tr>
                    <th>CLIENT NAME</th>
                    <th>INQUIRY MESSAGE & DETAILS</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {myInquiries
                    .filter(inq => inq.status === `SCHEDULED|${userId}` || inq.status === `DONE|${userId}`)
                    .sort((a, b) => {
                      const aUp = a.status.startsWith('SCHEDULED');
                      const bUp = b.status.startsWith('SCHEDULED');
                      return aUp === bUp ? 0 : aUp ? -1 : 1;
                    })
                    .slice(0, 5).map((inq, i) => (
                    <tr key={inq.id || i}>
                      <td>
                        <strong>{inq.name}</strong>
                        <br />
                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>📞 {getDisplayPhone(inq)}</span>
                      </td>
                      <td className="text-muted" style={{ fontSize: '0.78rem' }}>{inq.message}</td>
                      <td>
                        <span className={`badge ${inq.status.startsWith('SCHEDULED') ? 'negotiation' : 'available'}`}>
                          {inq.status.startsWith('SCHEDULED') ? 'UPCOMING' : 'COMPLETED'}
                        </span>
                      </td>
                      <td>
                        <VisitManagerClient inquiryId={inq.id} currentStatus={inq.status} salesmanId={userId} />
                      </td>
                    </tr>
                  ))}
                  {myInquiries.filter(inq => inq.status.startsWith('SCHEDULED|' + userId) || inq.status.startsWith('DONE|' + userId)).length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>No site visits currently scheduled.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Collection Targets */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5' }}>
                <h3 className="serif" style={{ margin: '0 0 1.25rem 0', fontSize: '1.25rem', color: 'var(--vanya-green)' }}>Quarterly Target Collections</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                  <svg width="100" height="100" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#eee" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#D9A036" strokeDasharray="64, 100" strokeWidth="3" />
                    <text x="18" y="20.5" fill="var(--vanya-green)" fontSize="6.5" textAnchor="middle" fontWeight="bold" style={{ transform: 'rotate(90deg)', transformOrigin: '18px 18px' }}>64%</text>
                  </svg>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#4b5563', display: 'block' }}>Total Collections Target: <strong>₹ 5.00 Cr</strong></span>
                    <span style={{ fontSize: '0.8rem', color: '#4b5563', display: 'block' }}>Achieved Collections: <strong style={{ color: '#d9a036' }}>₹ 3.20 Cr</strong></span>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginTop: '0.5rem' }}>Remaining to hit commission quota: ₹ 1.80 Cr</span>
                  </div>
                </div>
              </div>

              <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 className="serif" style={{ margin: '0 0 0.8rem 0', fontSize: '1.25rem', color: 'var(--vanya-green)' }}>Direct WhatsApp Outreach</h3>
                <p className="text-muted" style={{ margin: '0 0 1.25rem 0', fontSize: '0.78rem' }}>Directly connect with your assigned clients via pre-built templates.</p>
                <button onClick={() => setActiveTab('leads')} className="btn-primary" style={{ background: '#25d366', color: 'white', border: 'none', borderRadius: '8px', padding: '0.8rem 1rem', cursor: 'pointer', fontWeight: 'bold' }}>
                  💬 OPEN CLIENT WHATSAPP LIST
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: LEADS PIPELINE */}
        {/* ============================================================== */}
        {activeTab === 'leads' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Search and Filters */}
            <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #f1f3f5', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search leads by name, phone, email, or city..."
                  value={leadSearch}
                  onChange={e => setLeadSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              {/* Status Filters */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL', label: 'All Leads' },
                  { id: 'NEW', label: 'New' },
                  { id: 'CONTACTED', label: 'Contacted' },
                  { id: 'QUALIFIED', label: 'Qualified' },
                  { id: 'SCHEDULED', label: 'Visits' },
                  { id: 'PROPOSAL', label: 'Proposals' },
                  { id: 'NEGOTIATION', label: 'Negotiation' },
                  { id: 'BOOKED', label: 'Converted' },
                  { id: 'LOST', label: 'Lost' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setLeadFilter(f.id)}
                    style={{
                      padding: '0.5rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 'bold',
                      border: '1px solid',
                      cursor: 'pointer',
                      borderColor: leadFilter === f.id ? 'var(--vanya-green)' : '#e5e7eb',
                      background: leadFilter === f.id ? 'var(--vanya-green)' : 'white',
                      color: leadFilter === f.id ? 'white' : '#4b5563',
                      transition: 'all 0.2s'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Leads Table */}
            <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #f1f3f5' }}>
              <table className="table-standard">
                <thead>
                  <tr>
                    <th>CLIENT NAME</th>
                    <th>CONTACT DETAILS</th>
                    <th>SOURCE</th>
                    <th>RECEIVED ON</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {myInquiries
                    .filter(inq => {
                      // Text search filter
                      const q = leadSearch.toLowerCase();
                      const matchesText = inq.name.toLowerCase().includes(q) ||
                        inq.phone.toLowerCase().includes(q) ||
                        inq.email.toLowerCase().includes(q) ||
                        getCityFromPincode(inq.message).toLowerCase().includes(q);
                      
                      // Status tab filter
                      const rawStatus = inq.status.split('|')[0];
                      const matchesStatus = leadFilter === 'ALL' || rawStatus === leadFilter || (leadFilter === 'BOOKED' && rawStatus === 'CONVERTED');
                      
                      return matchesText && matchesStatus;
                    })
                    .map((inq, i) => {
                      const city = getCityFromPincode(inq.message);
                      const cleanSource = inq.source ? inq.source.split('|')[0].replace(/_/g, ' ') : 'Website Referral';

                      return (
                        <tr key={inq.id || i} style={{ cursor: 'pointer' }} onClick={() => {
                          setSelectedLeadId(inq.id);
                          setActiveTab('details');
                        }}>
                          <td>
                            <strong>{inq.name}</strong>
                            <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.1rem' }}>{city}</div>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#4b5563' }}>
                            <div>📞 {getDisplayPhone(inq)}</div>
                            <div>✉️ {getDisplayEmail(inq)}</div>
                          </td>
                          <td>
                            <span className="source-pill" style={{ textTransform: 'uppercase', fontSize: '0.62rem' }}>
                              {cleanSource}
                            </span>
                          </td>
                          <td className="text-muted" style={{ fontSize: '0.78rem' }}>
                            {new Date(inq.created_at).toLocaleDateString()}
                          </td>
                          <td>{getStatusBadge(inq.status)}</td>
                          <td onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => { setSelectedLeadId(inq.id); setActiveTab('details'); }} className="btn-dark" style={{ padding: '6px 12px', fontSize: '0.65rem', background: 'var(--vanya-green)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                View Details
                              </button>
                              <button onClick={() => {
                                const raw = inq.status.split('|')[0];
                                const nextState = raw === 'NEW' ? 'CONTACTED' : 'NEW';
                                handleUpdateStatus(inq.id, nextState);
                              }} style={{
                                padding: '6px 12px',
                                fontSize: '0.65rem',
                                border: '1px solid #ddd',
                                background: 'white',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: '#4b5563'
                              }}>
                                {inq.status.startsWith('NEW') ? 'Mark Attended' : 'Undo'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {myInquiries.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>No leads assigned yet. Click "+ ADD DIRECT LEAD" above to create one.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: LEAD DETAILS */}
        {/* ============================================================== */}
        {activeTab === 'details' && selectedLead && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Header / Back Action */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button onClick={() => setActiveTab('leads')} style={{
                background: '#fff',
                border: '1px solid #ddd',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.78rem'
              }}>&larr; Back to Leads List</button>
              
              <h2 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--vanya-green)' }}>Client Workspace: {selectedLead.name}</h2>
              {getStatusBadge(selectedLead.status)}
            </div>

            {/* Split layout: Details vs Notes/Timeline */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
              
              {/* Left Column: Metadata card & actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Details card */}
                <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', border: '1px solid #f1f3f5' }}>
                  <h3 className="serif" style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', borderBottom: '1px solid #f1f3f5', paddingBottom: '0.5rem' }}>Client Information</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.82rem' }}>
                    <div>
                      <span className="text-muted" style={{ display: 'block', fontSize: '0.68rem' }}>MOBILE PHONE</span>
                      <strong>{getDisplayPhone(selectedLead)}</strong>
                      {shouldMaskContact(selectedLead) && (
                        <span style={{
                          background: '#fef3c7',
                          color: '#b45309',
                          fontSize: '0.6rem',
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
                    </div>
                    <div>
                      <span className="text-muted" style={{ display: 'block', fontSize: '0.68rem' }}>EMAIL ADDRESS</span>
                      <strong>{getDisplayEmail(selectedLead)}</strong>
                    </div>
                    <div>
                      <span className="text-muted" style={{ display: 'block', fontSize: '0.68rem' }}>CITY / PINCODE</span>
                      <strong>{getCityFromPincode(selectedLead.message)}</strong>
                    </div>
                    <div>
                      <span className="text-muted" style={{ display: 'block', fontSize: '0.68rem' }}>ACQUISITION SOURCE</span>
                      <strong>{selectedLead.source?.split('|')[0] || 'Direct Sales'}</strong>
                    </div>
                    <div>
                      <span className="text-muted" style={{ display: 'block', fontSize: '0.68rem' }}>DATE RECEIVED</span>
                      <strong>{new Date(selectedLead.created_at).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-muted" style={{ display: 'block', fontSize: '0.68rem' }}>ORIGINAL MESSAGE</span>
                      <p style={{ background: '#f9fafb', padding: '0.6rem', borderRadius: '6px', margin: '0.2rem 0 0 0', color: '#4b5563' }}>{selectedLead.message}</p>
                    </div>
                  </div>
                </div>

                {/* Workflow Actions */}
                <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', border: '1px solid #f1f3f5' }}>
                  <h3 className="serif" style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem' }}>CRM Actions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button onClick={() => {
                      setDialerLead(selectedLead);
                      setIsCallActive(true);
                      setCallNotes('');
                      setCallDuration(0);
                      const timer = setInterval(() => {
                        setCallDuration(d => d + 1);
                      }, 1000);
                      window.callTimerRef = timer;
                    }} className="btn-outline-dark" style={{ width: '100%', padding: '0.8rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', border: '2px solid var(--vanya-green)', color: 'var(--vanya-green)' }}>
                      📞 Start Telephony Outbound Call
                    </button>
                    <button onClick={() => handleWalkInComplete(selectedLead.id)} className="btn-outline-dark" style={{ width: '100%', padding: '0.8rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', border: '2px solid var(--vanya-gold)', color: 'var(--vanya-gold)' }}>
                      🚶‍♂️ Mark Site Walk-in Complete (Promote to Opportunity)
                    </button>
                    <button onClick={() => { setCallbackLeadId(selectedLead.id); setIsCallbackModalOpen(true); }} className="btn-outline-dark" style={{ width: '100%', padding: '0.8rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      📞 Schedule Follow Up
                    </button>
                    <button onClick={() => { setVisitLeadId(selectedLead.id); setIsVisitModalOpen(true); }} className="btn-outline-dark" style={{ width: '100%', padding: '0.8rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      🚶‍♂️ Book Site Visit
                    </button>
                    <button onClick={() => handleUpdateStatus(selectedLead.id, 'PROPOSAL')} style={{ width: '100%', padding: '0.8rem', textAlign: 'left', background: 'none', border: '1px solid var(--vanya-green)', color: 'var(--vanya-green)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      📄 Send Proposal / Brochure
                    </button>
                    <button onClick={() => handleUpdateStatus(selectedLead.id, 'NEGOTIATION')} style={{ width: '100%', padding: '0.8rem', textAlign: 'left', background: 'none', border: '1px solid var(--vanya-gold)', color: 'var(--vanya-gold)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      🤝 Move to Negotiation
                    </button>
                    <button onClick={() => handleUpdateStatus(selectedLead.id, 'CONVERTED')} style={{ width: '100%', padding: '0.8rem', textAlign: 'left', background: '#d9a036', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      🎉 Close Deal (Converted Booking)
                    </button>
                    <button onClick={() => handleUpdateStatus(selectedLead.id, 'LOST')} style={{ width: '100%', padding: '0.8rem', textAlign: 'left', background: '#dc2626', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      ❌ Mark Deal as Lost
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column: Interaction timeline & Notes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Notes Input & List */}
                <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5' }}>
                  <h3 className="serif" style={{ margin: '0 0 1.25rem 0', fontSize: '1.25rem', color: 'var(--vanya-green)' }}>Client Interactions & Call Logs</h3>
                  
                  {/* Notes & Call Logs List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                    {/* Render Call Logs */}
                    {(callLogs || []).map((log, idx) => (
                      <div key={`call-${log.id || idx}`} style={{ background: '#f0f4f8', border: '1px solid #d0e0f0', padding: '1rem', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '0.82rem', color: '#1a5678' }}>📞 Outbound Call Completed</span>
                          <span style={{ fontSize: '0.72rem', background: '#e0ecf4', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Duration: {log.duration}s</span>
                        </div>
                        <p style={{ margin: '0.4rem 0 0.2rem 0', fontSize: '0.8rem', color: '#374151' }}><strong>Notes:</strong> {log.notes || 'No call disposition logged.'}</p>
                        
                        {/* Audio simulator element */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.6rem', background: '#fff', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                          <button onClick={() => alert('Simulating audio playback of call recording...')} style={{ background: 'var(--vanya-green)', border: 'none', color: 'white', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>▶</button>
                          <div style={{ flex: 1, background: '#eee', height: '4px', borderRadius: '2px' }}>
                            <div style={{ width: '40%', background: 'var(--vanya-gold)', height: '100%', borderRadius: '2px' }}></div>
                          </div>
                          <span style={{ fontSize: '0.62rem', color: '#888' }}>Recording Active</span>
                        </div>
                        
                        <span style={{ fontSize: '0.62rem', color: '#9ca3af', display: 'block', marginTop: '0.4rem' }}>Recorded on {new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    ))}

                    {/* Render standard notes */}
                    {(leadNotes[selectedLead.id] || []).map((note, i) => (
                      <div key={`note-${i}`} style={{ background: '#fdfdfd', border: '1px solid #f3f4f6', padding: '1rem', borderRadius: '8px' }}>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#374151' }}>{note.text}</p>
                        <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', marginTop: '0.4rem' }}>Logged on {note.time}</span>
                      </div>
                    ))}
                    
                    {(!callLogs || callLogs.length === 0) && (!leadNotes[selectedLead.id] || leadNotes[selectedLead.id].length === 0) && (
                      <p style={{ textAlign: 'center', color: '#9ca3af', padding: '1.5rem', fontSize: '0.8rem' }}>No client notes or call logs recorded yet.</p>
                    )}
                  </div>

                  {/* Add Note Form */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input
                      type="text"
                      placeholder="Type call outcome, client preference, or callback notes..."
                      value={currentNoteText}
                      onChange={e => setCurrentNoteText(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '0.82rem'
                      }}
                    />
                    <button onClick={() => handleAddNote(selectedLead.id)} className="btn-primary" style={{ background: 'var(--vanya-green)', color: 'white', border: 'none', borderRadius: '6px', padding: '0 1.5rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem' }}>
                      Add Note
                    </button>
                  </div>
                </div>

                {/* Status Timeline logs */}
                <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5' }}>
                  <h3 className="serif" style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: 'var(--vanya-green)' }}>Lifecycle Status Timeline</h3>
                  <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {(() => {
                      const stagesOrder = ['NEW', 'CONTACTED', 'PROPOSAL', 'SCHEDULED', 'DONE', 'NEGOTIATION', 'BOOKED', 'CONVERTED'];
                      const currentRaw = selectedLead.status.split('|')[0];
                      const currentIndex = stagesOrder.indexOf(currentRaw);
                      const hasReached = (st) => currentIndex >= stagesOrder.indexOf(st);
                      
                      return (
                        <>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '-29px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--vanya-green)' }}></span>
                            <strong style={{ fontSize: '0.82rem', display: 'block' }}>Lead Received</strong>
                            <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Assigned to {currentSalesmanName}</span>
                          </div>
                          
                          {hasReached('CONTACTED') && (
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '-29px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--vanya-gold)' }}></span>
                              <strong style={{ fontSize: '0.82rem', display: 'block' }}>First Contact Initiated</strong>
                              <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Marked attended & follow up scheduled</span>
                            </div>
                          )}
                          
                          {hasReached('PROPOSAL') && (
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '-29px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--vanya-green)' }}></span>
                              <strong style={{ fontSize: '0.82rem', display: 'block' }}>Proposal Sent</strong>
                              <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Shared brochure & proposal docs</span>
                            </div>
                          )}

                          {hasReached('SCHEDULED') && (
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '-29px', width: '12px', height: '12px', borderRadius: '50%', background: '#D9A036' }}></span>
                              <strong style={{ fontSize: '0.82rem', display: 'block' }}>Site Visit Scheduled / Done</strong>
                              <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Booked visit for client</span>
                            </div>
                          )}

                          {hasReached('NEGOTIATION') && (
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '-29px', width: '12px', height: '12px', borderRadius: '50%', background: '#d97706' }}></span>
                              <strong style={{ fontSize: '0.82rem', display: 'block' }}>In Negotiation</strong>
                              <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Discussing terms & final pricing</span>
                            </div>
                          )}

                          {hasReached('CONVERTED') && (
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '-29px', width: '12px', height: '12px', borderRadius: '50%', background: '#34a853' }}></span>
                              <strong style={{ fontSize: '0.82rem', display: 'block' }}>Booking Closed Won</strong>
                              <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Verified booking documents updated</span>
                            </div>
                          )}

                          {currentRaw === 'LOST' && (
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '-29px', width: '12px', height: '12px', borderRadius: '50%', background: '#dc2626' }}></span>
                              <strong style={{ fontSize: '0.82rem', display: 'block', color: '#dc2626' }}>Deal Lost</strong>
                              <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Client dropped out or unresponsive</span>
                            </div>
                          )}
                        </>
                      );
                    })()}

                  </div>
                </div>

              </div>

            </div>

          </div>
        )}


        {/* ============================================================== */}
        {/* TAB 5: FOLLOW UPS */}
        {/* ============================================================== */}
        {activeTab === 'followups' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--vanya-green)' }}>Callbacks & Follow Ups Dashboard</h2>
            
            <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="serif" style={{ margin: 0, fontSize: '1.25rem' }}>Pending Follow-ups Scheduler</h3>
                <span className="badge negotiation">Active</span>
              </div>

              <table className="table-standard">
                <thead>
                  <tr>
                    <th>CLIENT</th>
                    <th>OUTREACH NUMBER</th>
                    <th>EMAIL</th>
                    <th>SCHEDULED DATE</th>
                    <th>LAST STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {myInquiries.filter(inq => inq.status.includes('CONTACTED')).map((inq, i) => (
                    <tr key={inq.id || i}>
                      <td><strong>{inq.name}</strong></td>
                      <td>📞 {getDisplayPhone(inq)}</td>
                      <td>✉️ {getDisplayEmail(inq)}</td>
                      <td style={{ fontWeight: 'bold', color: '#d9a036' }}>Upcoming Callback</td>
                      <td>{getStatusBadge(inq.status)}</td>
                      <td>
                        <button onClick={() => { setSelectedLeadId(inq.id); setActiveTab('details'); }} className="btn-dark" style={{ padding: '6px 12px', fontSize: '0.68rem', borderRadius: '4px', background: 'var(--vanya-green)', color: 'white', border: 'none', cursor: 'pointer' }}>
                          Log Outcome
                        </button>
                      </td>
                    </tr>
                  ))}
                  {myInquiries.filter(inq => inq.status.includes('CONTACTED')).length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af' }}>No scheduled callbacks currently active.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: BOOKINGS */}
        {/* ============================================================== */}
        {activeTab === 'bookings' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--vanya-green)' }}>Verified Customer Bookings</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #f1f3f5' }}>
                <span className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>Bookings Achieved</span>
                <h2 className="serif" style={{ fontSize: '2rem', margin: '0.4rem 0', color: 'var(--vanya-green)' }}>{ClosedWonCount(myInquiries)}</h2>
                <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Out of 12 target properties</span>
              </div>
              <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #f1f3f5' }}>
                <span className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>Verified Value</span>
                <h2 className="serif" style={{ fontSize: '2rem', margin: '0.4rem 0', color: '#34a853' }}>₹ 85.0 L</h2>
                <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Based on deposit transactions</span>
              </div>
              <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #f1f3f5' }}>
                <span className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>RERA Status</span>
                <h2 className="serif" style={{ fontSize: '2rem', margin: '0.4rem 0', color: 'var(--vanya-gold)' }}>100%</h2>
                <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>All closed units RERA compliant</span>
              </div>
            </div>

            <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5' }}>
              <h3 className="serif" style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: 'var(--vanya-green)' }}>Active Bookings Registry</h3>
              
              <table className="table-standard">
                <thead>
                  <tr>
                    <th>BUYER NAME</th>
                    <th>EMAIL</th>
                    <th>MOBILE</th>
                    <th>INTERESTED UNIT</th>
                    <th>RERA COMPLIANCE STATUS</th>
                    <th>DEAL STAGE</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const getUnitFromMessage = (message) => {
                      if (!message) return '—';
                      const match = message.match(/Unit V-(\w+)/) || message.match(/Unit (\w+)/);
                      if (match) return `Unit V-${match[1]}`;
                      return '—';
                    };
                    return myInquiries.filter(inq => inq.status.includes('CONVERTED') || inq.status.includes('BOOKED')).map((inq, i) => (
                      <tr key={inq.id || i}>
                        <td><strong>{inq.name}</strong></td>
                        <td>{getDisplayEmail(inq)}</td>
                        <td>{getDisplayPhone(inq)}</td>
                        <td><span style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>{getUnitFromMessage(inq.message)}</span></td>
                        <td style={{ color: '#2e7d32', fontWeight: 'bold' }}>✓ REGISTERED & APPROVED</td>
                        <td><span className="badge available">CLOSED WON</span></td>
                      </tr>
                    ));
                  })()}
                  {myInquiries.filter(inq => inq.status.includes('CONVERTED') || inq.status.includes('BOOKED')).length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af' }}>No booked deals logged in your portal registry.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 7: SITE VISITS */}
        {/* ============================================================== */}
        {activeTab === 'visits' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--vanya-green)' }}>Client Site Visits Registry</h2>
            
            <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="serif" style={{ margin: 0, fontSize: '1.25rem', color: 'var(--vanya-green)' }}>Scheduled Property Showings</h3>
                <span className="badge reserved">Visits Logs</span>
              </div>

              <table className="table-standard">
                <thead>
                  <tr>
                    <th>CLIENT NAME</th>
                    <th>OUTREACH PHONE</th>
                    <th>UNIT / PLAN</th>
                    <th>APPOINTMENT WINDOW</th>
                    <th>VISIT STATUS</th>
                    <th>UPDATE STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {myInquiries
                    .filter(inq => inq.status.startsWith('SCHEDULED') || inq.status.startsWith('DONE'))
                    .sort((a, b) => {
                      const aUp = a.status.startsWith('SCHEDULED');
                      const bUp = b.status.startsWith('SCHEDULED');
                      return aUp === bUp ? 0 : aUp ? -1 : 1;
                    })
                    .map((inq, i) => (
                    <tr key={inq.id || i}>
                      <td><strong>{inq.name}</strong></td>
                      <td>{getDisplayPhone(inq)}</td>
                      <td><span style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>3BHK Supreme</span></td>
                      <td>{inq.message?.includes('visit on') ? inq.message.split('visit on')[1] : 'Upcoming scheduled time'}</td>
                      <td>
                        <span className={`badge ${inq.status.startsWith('SCHEDULED') ? 'negotiation' : 'available'}`}>
                          {inq.status.startsWith('SCHEDULED') ? 'UPCOMING' : 'COMPLETED'}
                        </span>
                      </td>
                      <td>
                        <VisitManagerClient inquiryId={inq.id} currentStatus={inq.status} salesmanId={userId} />
                      </td>
                    </tr>
                  ))}
                  {myInquiries.filter(inq => inq.status.startsWith('SCHEDULED') || inq.status.startsWith('DONE')).length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af' }}>No site viewings currently scheduled.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 8: TASKS MANAGER */}
        {/* ============================================================== */}
        {activeTab === 'tasks' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--vanya-green)' }}>My Task Board</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
              
              {/* Tasks List */}
              <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5' }}>
                <h3 className="serif" style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: 'var(--vanya-green)' }}>Assigned Checklist</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {tasks.map(t => (
                    <div key={t.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.8rem 1rem',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${t.priority === 'HIGH' ? '#dc2626' : t.priority === 'MEDIUM' ? '#d97706' : '#2563eb'}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                        <input type="checkbox" checked={t.done} onChange={() => handleToggleTask(t.id)} style={{ accentColor: 'var(--vanya-green)', cursor: 'pointer' }} />
                        <span style={{ fontSize: '0.85rem', color: '#374151', textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: t.priority === 'HIGH' ? '#fef2f2' : t.priority === 'MEDIUM' ? '#fffbeb' : '#eff6ff',
                          color: t.priority === 'HIGH' ? '#dc2626' : t.priority === 'MEDIUM' ? '#d97706' : '#2563eb'
                        }}>{t.priority}</span>
                        <button
                          onClick={() => setTasks(prev => prev.filter(task => task.id !== t.id))}
                          title="Remove task"
                          style={{
                            background: 'none',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            padding: '2px 7px',
                            lineHeight: 1,
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#dc2626'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                        >×</button>
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem', fontSize: '0.82rem' }}>No tasks yet. Add one using the form →</p>
                  )}
                </div>
              </div>

              {/* Add Task Form */}
              <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5', height: 'fit-content' }}>
                <h3 className="serif" style={{ margin: '0 0 1.25rem 0', fontSize: '1.25rem', color: 'var(--vanya-green)' }}>Create Custom Task</h3>
                <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>TASK DETAILS</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Request RERA copy for clients..."
                      value={newTaskText}
                      onChange={e => setNewTaskText(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>PRIORITY LEVEL</label>
                    <select value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.82rem' }}>
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="LOW">Low Priority</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary" style={{ background: 'var(--vanya-green)', color: 'white', border: 'none', borderRadius: '6px', padding: '0.8rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                    ADD TASK TO LIST
                  </button>
                </form>
              </div>

            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 9: CALENDAR GRID */}
        {/* ============================================================== */}
        {activeTab === 'calendar' && (() => {
          // Compute week days for current offset
          const today = new Date();
          const dayOfWeek = today.getDay(); // 0=Sun
          const monday = new Date(today);
          monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + calendarWeekOffset * 7);

          const weekDays = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
          });

          const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
          const monthName = monday.toLocaleString('default', { month: 'long', year: 'numeric' });

          const getEventsForDate = (date) => {
            const key = date.toISOString().split('T')[0];
            return calendarEvents.filter(e => e.date === key);
          };

          const isToday = (d) => {
            const t = new Date();
            return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
          };

          const typeColor = { call: '#1a73e8', visit: 'var(--vanya-green)', proposal: '#ab47bc', negotiation: '#d9a036', other: '#6b7280' };


          return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--vanya-green)' }}>My Weekly Schedule</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    onClick={() => setCalendarWeekOffset(w => w - 1)}
                    style={{ padding: '0.5rem 1.1rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
                  >‹</button>
                  <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--vanya-green)', minWidth: '160px', textAlign: 'center' }}>{monthName}</span>
                  <button
                    onClick={() => setCalendarWeekOffset(w => w + 1)}
                    style={{ padding: '0.5rem 1.1rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
                  >›</button>
                  <button
                    onClick={() => setCalendarWeekOffset(0)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--vanya-green)', background: 'var(--vanya-green)', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}
                  >Today</button>
                  <button
                    onClick={() => setShowAddEventForm(v => !v)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--vanya-gold)', background: 'var(--vanya-gold)', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}
                  >+ Add Event</button>
                </div>
              </div>

              {/* Add Event Form */}
              {showAddEventForm && (
                <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #f1f3f5' }}>
                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--vanya-green)' }}>Add New Calendar Event</h4>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      if (!newEventForm.date || !newEventForm.title) return;
                      setCalendarEvents(prev => [...prev, { ...newEventForm }]);
                      setNewEventForm({ date: '', title: '', type: 'call' });
                      setShowAddEventForm(false);
                    }}
                    style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280' }}>DATE *</label>
                      <input type="date" required value={newEventForm.date} onChange={e => setNewEventForm(f => ({ ...f, date: e.target.value }))} style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.82rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: '200px' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280' }}>EVENT TITLE *</label>
                      <input type="text" required placeholder="e.g. Call with Rahul Sharma" value={newEventForm.title} onChange={e => setNewEventForm(f => ({ ...f, title: e.target.value }))} style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.82rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280' }}>TYPE</label>
                      <select value={newEventForm.type} onChange={e => setNewEventForm(f => ({ ...f, type: e.target.value }))} style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.82rem' }}>
                        <option value="call">📞 Follow-up Call</option>
                        <option value="visit">🏠 Site Visit</option>
                        <option value="proposal">📄 Proposal</option>
                        <option value="negotiation">🤝 Negotiation</option>
                        <option value="other">📌 Other</option>
                      </select>
                    </div>
                    <button type="submit" style={{ padding: '0.65rem 1.5rem', background: 'var(--vanya-green)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem' }}>Save Event</button>
                    <button type="button" onClick={() => setShowAddEventForm(false)} style={{ padding: '0.65rem 1rem', background: 'white', color: '#6b7280', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem' }}>Cancel</button>
                  </form>
                </div>
              )}

              {/* Calendar Grid */}
              <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #f1f3f5', overflowX: 'auto' }}>
                {/* Day headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  {weekDays.map((d, idx) => (
                    <div
                      key={idx}
                      style={{
                        textAlign: 'center',
                        padding: '0.6rem 0.5rem',
                        borderRadius: '8px',
                        background: isToday(d) ? 'var(--vanya-green)' : idx >= 5 ? '#fef9ec' : 'var(--admin-bg)',
                        color: isToday(d) ? 'white' : idx >= 5 ? '#d9a036' : '#4b5563',
                        fontWeight: 'bold',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        border: isToday(d) ? '2px solid var(--vanya-green)' : '1px solid #e5e7eb'
                      }}
                      onClick={() => {
                        const key = d.toISOString().split('T')[0];
                        setNewEventForm(f => ({ ...f, date: key }));
                        setShowAddEventForm(true);
                      }}
                    >
                      <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>{DAY_LABELS[idx]}</div>
                      <div style={{ fontSize: '1.1rem', marginTop: '2px' }}>{d.getDate()}</div>
                    </div>
                  ))}
                </div>

                {/* Event cells */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(120px, 1fr))', gap: '0.75rem', minHeight: '280px' }}>
                  {weekDays.map((d, colIdx) => {
                    const evts = getEventsForDate(d);
                    return (
                      <div
                        key={colIdx}
                        style={{ background: 'var(--admin-bg)', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', minHeight: '200px' }}
                      >
                        {evts.length === 0 && (
                          <button
                            onClick={() => {
                              const key = d.toISOString().split('T')[0];
                              setNewEventForm(f => ({ ...f, date: key }));
                              setShowAddEventForm(true);
                            }}
                            style={{ background: 'none', border: '1px dashed #d1d5db', borderRadius: '6px', color: '#9ca3af', fontSize: '0.65rem', padding: '0.4rem', cursor: 'pointer', marginTop: '0.3rem', textAlign: 'center' }}
                          >
                            + Add
                          </button>
                        )}
                        {evts.map((evt, ei) => (
                          <div
                            key={ei}
                            style={{
                              padding: '0.5rem 0.4rem',
                              borderRadius: '5px',
                              fontSize: '0.68rem',
                              fontWeight: 'bold',
                              color: 'white',
                              background: typeColor[evt.type] || '#6b7280',
                              lineHeight: 1.3,
                              position: 'relative'
                            }}
                          >
                            {evt.title}
                            <button
                              onClick={() => setCalendarEvents(prev => prev.filter((_, i) => !(prev[i].date === evt.date && prev[i].title === evt.title)))}
                              style={{ position: 'absolute', top: '2px', right: '4px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '0.7rem', padding: 0, lineHeight: 1 }}
                              title="Remove event"
                            >×</button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                {Object.entries({ call: '📞 Follow-up Call', visit: '🏠 Site Visit', proposal: '📄 Proposal', negotiation: '🤝 Negotiation', other: '📌 Other' }).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: typeColor[k] }}></span>
                    <span style={{ color: '#6b7280' }}>{v}</span>
                  </div>
                ))}
              </div>

            </div>
          );
        })()}

        {/* ============================================================== */}
        {/* TAB 10: TOWER INVENTORY */}
        {/* ============================================================== */}
        {activeTab === 'inventory' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--vanya-green)' }}>Tower Inventory Board</h2>
            
            <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #f1f3f5', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#4b5563' }}>Filter by Tower:</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['ALL', 'SKYVUE A', 'SKYVUE B', 'MAPLE C', 'MAPLE D'].map((tower, idx) => {
                  const filterVal = tower === 'ALL' ? 'ALL' : tower.charAt(tower.length - 1);
                  return (
                    <button
                      key={idx}
                      onClick={() => setInventoryTower(filterVal)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 'bold',
                        border: '1px solid',
                        cursor: 'pointer',
                        borderColor: inventoryTower === filterVal ? 'var(--vanya-green)' : '#e5e7eb',
                        background: inventoryTower === filterVal ? 'var(--vanya-green)' : 'white',
                        color: inventoryTower === filterVal ? 'white' : '#4b5563'
                      }}
                    >
                      {tower}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Render Portfolio units */}
            <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5' }}>
              <h3 className="serif" style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: 'var(--vanya-green)' }}>Assigned Units Portfolio</h3>
              <PortfolioTable assignedUnits={myUnits} />
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 11: REPORTS & ANALYTICS */}
        {/* ============================================================== */}
        {activeTab === 'reports' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h2 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--vanya-green)' }}>CRM Performance Reports</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              
              {/* Chart 1: Donut Source Chart */}
              <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5', textAlign: 'center' }}>
                <h3 className="serif" style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: 'var(--vanya-green)', textAlign: 'left' }}>Leads Source Acquisition</h3>
                
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2.5rem', height: '220px' }}>
                  <svg width="150" height="150" viewBox="0 0 42 42">
                    <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#ddd" strokeWidth="5" />
                    {/* Circle slices: Website Referral (50%), Direct Outreach (30%), Channel Partners (20%) */}
                    <circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--vanya-green)" strokeWidth="5" strokeDasharray="50 100" strokeDashoffset="25" />
                    <circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--vanya-gold)" strokeWidth="5" strokeDasharray="30 100" strokeDashoffset="75" />
                    <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#ab47bc" strokeWidth="5" strokeDasharray="20 100" strokeDashoffset="5" />
                    <g fill="var(--vanya-green)" fontSize="3" fontWeight="bold">
                      <text x="21" y="21" textAnchor="middle" alignmentBaseline="middle">Sources</text>
                    </g>
                  </svg>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'left', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--vanya-green)', borderRadius: '3px' }}></span>
                      <span>Website Referral (50%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--vanya-gold)', borderRadius: '3px' }}></span>
                      <span>Direct Outreach (30%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#ab47bc', borderRadius: '3px' }}></span>
                      <span>Channel Partners (20%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart 2: Trend Line Chart */}
              <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5' }}>
                <h3 className="serif" style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: 'var(--vanya-green)' }}>Leads Volume Trend (Last 6 Months)</h3>
                
                <div style={{ position: 'relative', height: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  {/* SVG Chart Line */}
                  <svg viewBox="0 0 100 40" style={{ width: '100%', height: '160px' }}>
                    <path d="M 0 35 Q 20 20 40 28 T 80 15 T 100 8" fill="none" stroke="#D9A036" strokeWidth="2" />
                    <circle cx="0" cy="35" r="1.5" fill="var(--vanya-green)" />
                    <circle cx="20" cy="22" r="1.5" fill="var(--vanya-green)" />
                    <circle cx="40" cy="28" r="1.5" fill="var(--vanya-green)" />
                    <circle cx="60" cy="22" r="1.5" fill="var(--vanya-green)" />
                    <circle cx="80" cy="15" r="1.5" fill="var(--vanya-green)" />
                    <circle cx="100" cy="8" r="1.5" fill="var(--vanya-green)" />
                  </svg>
                  
                  {/* Labels */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888', borderTop: '1px solid #eee', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                    <span>Dec</span>
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 12: MY PROFILE */}
        {/* ============================================================== */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--vanya-green)' }}>Representative Account Profile</h2>
              {!isEditingProfile && !profileLoading && (
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="btn-dark"
                  style={{ background: 'var(--vanya-gold)', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '7px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  📝 Edit Profile
                </button>
              )}
            </div>
            
            {profileSuccess && (
              <div style={{ background: '#e6f4ea', color: '#137333', padding: '1rem', borderRadius: '8px', fontSize: '0.82rem', textAlign: 'center' }}>
                🎉 {profileSuccess}
              </div>
            )}

            {profileError && (
              <div style={{ background: '#fff5f5', color: '#c53030', border: '1px solid #feb2b2', padding: '1rem', borderRadius: '8px', fontSize: '0.82rem', textAlign: 'center' }}>
                ⚠️ {profileError}
              </div>
            )}

            {profileLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--vanya-green)' }}>Loading profile data...</div>
            ) : isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>FULL NAME</label>
                    <input 
                      type="text" 
                      required 
                      value={profileData.full_name} 
                      onChange={e => setProfileData({ ...profileData, full_name: e.target.value })} 
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem' }} 
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>EMPLOYEE ID</label>
                    <input 
                      type="text" 
                      required 
                      value={profileData.employee_id} 
                      onChange={e => setProfileData({ ...profileData, employee_id: e.target.value })} 
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem' }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>REGISTERED TELEPHONE (10-DIGIT)</label>
                    <input 
                      type="tel" 
                      required 
                      minLength={10}
                      maxLength={10}
                      pattern="[0-9]{10}"
                      onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                      value={profileData.phone} 
                      onChange={e => setProfileData({ ...profileData, phone: e.target.value })} 
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem' }} 
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>EMAIL ADDRESS</label>
                    <input 
                      type="email" 
                      required 
                      value={profileData.email} 
                      onChange={e => setProfileData({ ...profileData, email: e.target.value })} 
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem' }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn-primary" style={{ background: 'var(--vanya-green)', color: 'white', border: 'none', borderRadius: '6px', padding: '0.8rem 1.8rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem' }}>
                    SAVE CHANGES
                  </button>
                  <button type="button" onClick={() => setIsEditingProfile(false)} className="btn-outline" style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '0.8rem 1.8rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem', background: 'transparent' }}>
                    CANCEL
                  </button>
                </div>
              </form>
            ) : (
              <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid #f1f3f5', paddingBottom: '1.5rem' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: meta.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem' }}>
                    {meta.initials}
                  </div>
                  <div>
                    <h3 className="serif" style={{ margin: 0, fontSize: '1.4rem' }}>{currentSalesmanName}</h3>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>Senior Real Estate Consultant &bull; ID: {profileData.employee_id || userId}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.85rem' }}>
                  <div>
                    <span className="text-muted" style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold' }}>FIRM PARTNER</span>
                    <strong>DreamSpaces Heritage Estates</strong>
                  </div>
                  <div>
                    <span className="text-muted" style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold' }}>RERA REGISTRATION</span>
                    <strong>RERA-MUM-98765-Sales</strong>
                  </div>
                  <div>
                    <span className="text-muted" style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold' }}>OFFICE TELEPHONE</span>
                    <strong>{profileData.phone ? `+91 ${profileData.phone.replace(/(\d{5})(\d{5})/, '$1 $2')}` : '+91 98765 43210'}</strong>
                  </div>
                  <div>
                    <span className="text-muted" style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold' }}>EMAIL ADDRESS</span>
                    <strong>{profileData.email || `${currentSalesmanName.toLowerCase().replace(' ', '.')}@dreamspaces.com`}</strong>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 12 (PART 2): SETTINGS */}
        {/* ============================================================== */}
        {activeTab === 'settings' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--vanya-green)' }}>Security Settings</h2>
            
            <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5', maxWidth: '500px' }}>
              <h3 className="serif" style={{ margin: '0 0 1.25rem 0', fontSize: '1.25rem', color: 'var(--vanya-green)' }}>Update Account Credentials</h3>
              <form onSubmit={e => { e.preventDefault(); alert('Password updated successfully!'); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>CURRENT PASSWORD</label>
                  <input type="password" required placeholder="••••••••" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>NEW PASSWORD</label>
                  <input type="password" required placeholder="••••••••" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }} />
                </div>
                <button type="submit" className="btn-primary" style={{ background: 'var(--vanya-green)', color: 'white', border: 'none', borderRadius: '6px', padding: '0.8rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                  CHANGE PASSWORD
                </button>
              </form>
            </div>

          </div>
        )}

      </main>

      {/* ============================================================== */}
      {/* ADD LEAD DIALOG PORTAL */}
      {/* ============================================================== */}
      {isAddLeadOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(17, 54, 41, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            background: 'white',
            width: '100%',
            maxWidth: '500px',
            borderRadius: '20px',
            padding: '2.5rem',
            boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.75rem' }}>
              <h3 className="serif" style={{ margin: 0, fontSize: '1.4rem', color: 'var(--vanya-green)' }}>Add Direct Lead</h3>
              <button onClick={() => setIsAddLeadOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: '#aaa' }}>&times;</button>
            </div>
            
            <form onSubmit={handleAddLeadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>CLIENT NAME *</label>
                <input type="text" required placeholder="Full Name" pattern="[A-Za-z\s]+" title="Please enter letters only" value={addLeadForm.name} onChange={e => setAddLeadForm({ ...addLeadForm, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>EMAIL ADDRESS *</label>
                <input type="email" required placeholder="name@example.com" value={addLeadForm.email} onChange={e => setAddLeadForm({ ...addLeadForm, email: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>MOBILE PHONE *</label>
                <input type="tel" required placeholder="10-digit Phone" minLength={10} maxLength={10} pattern="[0-9]{10}" value={addLeadForm.phone} onChange={e => setAddLeadForm({ ...addLeadForm, phone: e.target.value.replace(/[^0-9]/g, '') })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>AADHAAR CARD NUMBER *</label>
                <input type="tel" required placeholder="12-digit Aadhaar Card Number" minLength={12} maxLength={12} pattern="[0-9]{12}" value={addLeadForm.aadhaar} onChange={e => setAddLeadForm({ ...addLeadForm, aadhaar: e.target.value.replace(/[^0-9]/g, '') })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>PINCODE *</label>
                <input type="tel" required placeholder="6-digit Area Pincode" minLength={6} maxLength={6} pattern="[0-9]{6}" value={addLeadForm.pincode} onChange={e => setAddLeadForm({ ...addLeadForm, pincode: e.target.value.replace(/[^0-9]/g, '') })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>SOURCE CHANNEL</label>
                <input type="text" placeholder="Direct Sales, Call, CP Referral..." value={addLeadForm.source} onChange={e => setAddLeadForm({ ...addLeadForm, source: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>ADDITIONAL COMMENTS</label>
                <textarea rows="3" placeholder="Interested in 3BHK high floors..." value={addLeadForm.notes} onChange={e => setAddLeadForm({ ...addLeadForm, notes: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontFamily: 'inherit', resize: 'vertical' }}></textarea>
              </div>

              <button type="submit" className="btn-primary" style={{ background: 'var(--vanya-green)', color: 'white', border: 'none', borderRadius: '6px', padding: '0.9rem', cursor: 'pointer', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                SUBMIT NEW LEAD
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SCHEDULE CALLBACK DIALOG */}
      {/* ============================================================== */}
      {isCallbackModalOpen && (
        <div onClick={() => setIsCallbackModalOpen(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, cursor: 'pointer'
        }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '12px', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', cursor: 'default' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 className="serif" style={{ margin: 0, fontSize: '1.25rem', color: 'var(--vanya-green)' }}>Schedule Client Callback</h3>
              <button onClick={() => setIsCallbackModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={handleScheduleCallback} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>CALLBACK DATE & TIME</label>
                <input type="datetime-local" required value={callbackDateTime} onChange={e => setCallbackDateTime(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
              <button type="submit" className="btn-primary" style={{ background: 'var(--vanya-green)', color: 'white', border: 'none', borderRadius: '6px', padding: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
                CONFIRM CALLBACK
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* BOOK SITE VISIT DIALOG */}
      {/* ============================================================== */}
      {isVisitModalOpen && (
        <div onClick={() => setIsVisitModalOpen(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, cursor: 'pointer'
        }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '12px', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', cursor: 'default' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 className="serif" style={{ margin: 0, fontSize: '1.25rem', color: 'var(--vanya-green)' }}>Book Site Visit Viewing</h3>
              <button onClick={() => setIsVisitModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={handleBookVisit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>VISIT DATE & TIME</label>
                <input type="datetime-local" required value={visitDateTime} onChange={e => setVisitDateTime(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>TOWER / AMENITIES TO VISIT</label>
                <input type="text" placeholder="e.g. Unit 202 & Ayurvedic Sanctuary" value={visitMessage} onChange={e => setVisitMessage(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
              <button type="submit" className="btn-primary" style={{ background: 'var(--vanya-green)', color: 'white', border: 'none', borderRadius: '6px', padding: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
                SCHEDULE APPOINTMENT
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DIALER SIMULATOR MODAL */}
      {/* ============================================================== */}
      {isCallActive && dialerLead && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '320px',
          background: 'var(--vanya-green)',
          color: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 99999,
          border: '2px solid var(--vanya-gold)',
          fontFamily: 'sans-serif'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.68rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--vanya-gold)', display: 'block', fontWeight: 'bold' }}>SYSTEM DIALER ACTIVE</span>
            <strong style={{ fontSize: '1.25rem', display: 'block', margin: '0.25rem 0' }}>{dialerLead.name}</strong>
            <span style={{ fontSize: '0.82rem', opacity: 0.8 }}>Calling: {getDisplayPhone(dialerLead)}</span>
          </div>

          {/* Animated Waveform Visualizer */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', height: '40px', alignItems: 'center', margin: '1.5rem 0' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
              <div key={val} style={{
                width: '4px',
                height: '100%',
                background: 'var(--vanya-gold)',
                borderRadius: '2px',
                animation: 'bounceWave 1.2s ease-in-out infinite alternate',
                animationDelay: `${val * 0.1}s`
              }}></div>
            ))}
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes bounceWave {
              0% { transform: scaleY(0.2); }
              100% { transform: scaleY(1.0); }
            }
          `}} />

          <div style={{ textAlign: 'center', margin: '1rem 0' }}>
            <span style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 'bold' }}>
              {Math.floor(callDuration / 60).toString().padStart(2, '0')}:{(callDuration % 60).toString().padStart(2, '0')}
            </span>
          </div>

          {/* Outcome entry during live call */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--vanya-gold)', marginBottom: '0.3rem' }}>CALL DISPOSITION NOTES</label>
            <textarea 
              value={callNotes}
              onChange={e => setCallNotes(e.target.value)}
              placeholder="Type notes while talking..."
              style={{
                width: '92%',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: 'white',
                padding: '8px',
                fontSize: '0.8rem',
                minHeight: '50px',
                resize: 'none'
              }}
            />
          </div>

          <button 
            onClick={async () => {
              clearInterval(window.callTimerRef);
              setIsCallActive(false);
              const durationSecs = callDuration;
              setCallDuration(0);
              
              try {
                const res = await fetch('/api/calls', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    inquiry_id: dialerLead.id,
                    salesman_id: userId,
                    duration: durationSecs,
                    notes: callNotes || 'Simulated call completed.'
                  })
                });
                const json = await res.json();
                if (json.success) {
                  setCallLogs(prev => [json.data, ...prev]);
                  alert('Call log recorded successfully in Supabase!');
                }
              } catch(e) {
                console.error(e);
              }
              setCallNotes('');
            }}
            style={{
              width: '100%',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '10px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🛑 HANG UP & LOG CALL
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* CLOSE DEAL / BUYER REGISTRATION DIALOG */}
      {/* ============================================================== */}
      {isCloseDealModalOpen && (
        <div onClick={() => setIsCloseDealModalOpen(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, cursor: 'pointer'
        }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', width: '100%', maxWidth: '450px', borderRadius: '12px', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto', cursor: 'default' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #f1f3f5', paddingBottom: '0.5rem' }}>
              <h3 className="serif" style={{ margin: 0, fontSize: '1.25rem', color: 'var(--vanya-green)' }}>🎉 Finalize Booking & Close Deal</h3>
              <button onClick={() => setIsCloseDealModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={handleCloseDealSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>SELECT UNIT *</label>
                <select 
                  required 
                  value={closeDealForm.unitId} 
                  onChange={e => setCloseDealForm({ ...closeDealForm, unitId: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem' }}
                >
                  <option value="">-- Select Available Unit --</option>
                  {units.filter(u => u.status === 'AVAILABLE').map(u => (
                    <option key={u.id} value={u.unit_id}>Unit V-{u.unit_id} ({u.type} - {u.price})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>BUYER USERNAME *</label>
                  <input 
                    type="text" 
                    required 
                    value={closeDealForm.username} 
                    onChange={e => setCloseDealForm({ ...closeDealForm, username: e.target.value })} 
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>BUYER PASSWORD *</label>
                  <input 
                    type="text" 
                    required 
                    value={closeDealForm.password} 
                    onChange={e => setCloseDealForm({ ...closeDealForm, password: e.target.value })} 
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>TOTAL AMOUNT *</label>
                  <input 
                    type="text" 
                    required 
                    value={closeDealForm.totalAmount} 
                    onChange={e => setCloseDealForm({ ...closeDealForm, totalAmount: e.target.value })} 
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>AMOUNT PAID *</label>
                  <input 
                    type="text" 
                    required 
                    value={closeDealForm.amountPaid} 
                    onChange={e => setCloseDealForm({ ...closeDealForm, amountPaid: e.target.value })} 
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>POSSESSION DATE</label>
                  <input 
                    type="date" 
                    value={closeDealForm.possessionDate} 
                    onChange={e => setCloseDealForm({ ...closeDealForm, possessionDate: e.target.value })} 
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>PROGRESS (%)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={closeDealForm.progress} 
                    onChange={e => setCloseDealForm({ ...closeDealForm, progress: e.target.value })} 
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem' }} 
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ background: 'var(--vanya-green)', color: 'white', border: 'none', borderRadius: '6px', padding: '0.9rem', cursor: 'pointer', fontWeight: 'bold', marginTop: '0.5rem' }}>
                CONFIRM & REGISTER BUYER
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Helpers
function ClosedWonCount(list) {
  return list.filter(l => {
    const raw = l.status.split('|')[0];
    return raw === 'BOOKED' || raw === 'CONVERTED';
  }).length;
}
