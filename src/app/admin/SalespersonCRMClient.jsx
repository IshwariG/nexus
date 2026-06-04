"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PortfolioTable from './PortfolioTable';
import VisitManagerClient from './VisitManagerClient';

export default function SalespersonCRMClient({ 
  inquiries = [], 
  units = [], 
  buyers = [], 
  userId = 'SR-9999', 
  isImpersonating = false,
  cpPartners = [],
  allUsers = []
}) {
  const router = useRouter();

  // Masking helpers for CP Protection
  // Salesman CANNOT see phone/email of CP leads until the deal is CLOSED
  const shouldMaskContact = (inq) => {
    if (!inq || !inq.source || !inq.source.startsWith('CP_Referral|')) return false;
    const stage = (inq.status || '').split('|')[0].toUpperCase();
    return !['DONE', 'BOOKED', 'CONVERTED', 'READY_TO_BOOK'].includes(stage);
  };

  const getDisplayName = (inq) => {
    if (!inq || !inq.name) return '';
    if (shouldMaskContact(inq)) {
      return inq.name.split(' ').map(part => {
        if (!part) return '';
        if (part.length <= 1) return part + '•';
        return part[0] + '•'.repeat(part.length - 1);
      }).join(' ');
    }
    return inq.name;
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

  // Active Tab State
  const [activeTab, setActiveTabState] = useState('dashboard');
  const [selectedLeadId, setSelectedLeadIdState] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [reportsPeriod, setReportsPeriod] = useState('ALL');

  // Leads volume trend filter states for Reports tab
  const [trendView, setTrendView] = useState('month');
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [startMonth, setStartMonth] = useState(0);
  const [endMonth, setEndMonth] = useState(11);
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const day = new Date().getDate();
    if (day <= 7) return 0;
    if (day <= 14) return 1;
    if (day <= 21) return 2;
    return 3;
  });

  const resetToCurrentPeriod = (viewVal = trendView) => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
    setStartMonth(0);
    setEndMonth(11);
    const curDay = now.getDate();
    if (curDay <= 7) setSelectedWeek(0);
    else if (curDay <= 14) setSelectedWeek(1);
    else if (curDay <= 21) setSelectedWeek(2);
    else setSelectedWeek(3);
  };

  const getWeek4EndDay = (yr, mo) => {
    return new Date(yr, mo + 1, 0).getDate();
  };

  const getWeekOptions = (yr, mo) => [
    { value: 0, label: `1–7` },
    { value: 1, label: `8–14` },
    { value: 2, label: `15–21` },
    { value: 3, label: `22–${getWeek4EndDay(yr, mo)}` }
  ];

  const availableYears = React.useMemo(() => {
    const years = new Set();
    const curYear = new Date().getFullYear();
    for (let y = curYear - 2; y <= curYear + 2; y++) {
      years.add(y);
    }
    myInquiries.forEach(inq => {
      if (inq.created_at) {
        const yr = new Date(inq.created_at).getFullYear();
        if (yr) years.add(yr);
      }
    });
    return Array.from(years).sort((a, b) => a - b);
  }, [myInquiries]);

  const isNextDisabled = () => {
    const now = new Date();
    const curYr = now.getFullYear();
    const curMo = now.getMonth();
    const curDay = now.getDate();
    let curWk = 0;
    if (curDay <= 7) curWk = 0;
    else if (curDay <= 14) curWk = 1;
    else if (curDay <= 21) curWk = 2;
    else curWk = 3;

    if (trendView === 'week') {
      return selectedYear > curYr || 
             (selectedYear === curYr && selectedMonth > curMo) || 
             (selectedYear === curYr && selectedMonth === curMo && selectedWeek >= curWk);
    }
    if (trendView === 'month') {
      return selectedYear > curYr || 
             (selectedYear === curYr && selectedMonth >= curMo);
    }
    if (trendView === 'year') {
      return selectedYear >= curYr;
    }
    return false;
  };

  const handlePrevPeriod = () => {
    if (trendView === 'week') {
      if (selectedWeek > 0) {
        setSelectedWeek(selectedWeek - 1);
      } else {
        if (selectedMonth > 0) {
          setSelectedMonth(selectedMonth - 1);
          setSelectedWeek(3);
        } else {
          const prevYr = selectedYear - 1;
          if (availableYears.includes(prevYr)) {
            setSelectedYear(prevYr);
            setSelectedMonth(11);
            setSelectedWeek(3);
          }
        }
      }
    } else if (trendView === 'month') {
      if (selectedMonth > 0) {
        setSelectedMonth(selectedMonth - 1);
      } else {
        const prevYr = selectedYear - 1;
        if (availableYears.includes(prevYr)) {
          setSelectedYear(prevYr);
          setSelectedMonth(11);
        }
      }
    } else if (trendView === 'year') {
      const prevYr = selectedYear - 1;
      if (availableYears.includes(prevYr)) {
        setSelectedYear(prevYr);
      }
    }
  };

  const handleNextPeriod = () => {
    if (trendView === 'week') {
      if (selectedWeek < 3) {
        setSelectedWeek(selectedWeek + 1);
      } else {
        if (selectedMonth < 11) {
          setSelectedMonth(selectedMonth + 1);
          setSelectedWeek(0);
        } else {
          const nextYr = selectedYear + 1;
          if (availableYears.includes(nextYr)) {
            setSelectedYear(nextYr);
            setSelectedMonth(0);
            setSelectedWeek(0);
          }
        }
      }
    } else if (trendView === 'month') {
      if (selectedMonth < 11) {
        setSelectedMonth(selectedMonth + 1);
      } else {
        const nextYr = selectedYear + 1;
        if (availableYears.includes(nextYr)) {
          setSelectedYear(nextYr);
          setSelectedMonth(0);
        }
      }
    } else if (trendView === 'year') {
      const nextYr = selectedYear + 1;
      if (availableYears.includes(nextYr)) {
        setSelectedYear(nextYr);
      }
    }
  };

  // Profile states
  const [profileData, setProfileData] = useState(() => {
    const currentUser = (allUsers || []).find(u => u.username === userId) || {};
    return {
      full_name: currentUser.full_name || '',
      phone: currentUser.phone || '',
      email: currentUser.email || '',
      employee_id: currentUser.employee_id || ''
    };
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);

  // Construction progress update states for Salesman
  const [updatingBuyer, setUpdatingBuyer] = useState(null);
  const [updatingMilestones, setUpdatingMilestones] = useState([]);
  const [updatingProgress, setUpdatingProgress] = useState(0);
  const [updatingPossessionDate, setUpdatingPossessionDate] = useState('');
  const [updatingTotalValue, setUpdatingTotalValue] = useState('');
  const [updatingTotalPaid, setUpdatingTotalPaid] = useState('');
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [newUpdateTitle, setNewUpdateTitle] = useState('');
  const [newUpdateDescription, setNewUpdateDescription] = useState('');
  const [newUpdateDate, setNewUpdateDate] = useState('');
  const [newUpdateImage, setNewUpdateImage] = useState('');

  const handleOpenUpdateModal = (buyer) => {
    setUpdatingBuyer(buyer);
    setUpdatingProgress(buyer.construction_progress || 0);
    setUpdatingPossessionDate(buyer.possession_date || '');
    setUpdatingTotalValue(buyer.total_amount || '');
    setUpdatingTotalPaid(buyer.amount_paid || '');
    setUpdatingMilestones(buyer.milestones || [
      { step: "Foundation", status: "PENDING" },
      { step: "Structure", status: "PENDING" },
      { step: "Finishing", status: "PENDING" },
      { step: "Handover", status: "PENDING" }
    ]);
    setNewUpdateTitle('');
    setNewUpdateDescription('');
    setNewUpdateDate(new Date().toISOString().split('T')[0]);
    setNewUpdateImage('');
  };

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
      if (leadId) setSelectedLeadIdState(leadId);
    }
  }, []);

  const setActiveTab = (tabName) => {
    setActiveTabState(tabName);
    setIsMobileSidebarOpen(false);
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
    progress: '72',
    email: '',
    phone: '',
    aadhaar: ''
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
    'SR-1111': 'Administrator',
    'SR-2222': 'Rahul Verma',
    'SR-3333': 'Sneha Patil',
    'SR-4444': 'Aditya Sharma'
  };
  const currentUserObj = (allUsers || []).find(u => u.username === userId) || {};
  const currentSalesmanName = profileData.full_name || currentUserObj.full_name || salesmanNames[userId] || 'Executive Advisor';

  // Salesperson avatar meta
  const salesmanMeta = {
    'SR-9999': { initials: 'VS', color: '#1a73e8' },
    'SR-1111': { initials: 'AD', color: '#34a853' },
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

  const initials = profileData.full_name 
    ? getInitials(profileData.full_name) 
    : (currentUserObj.full_name ? getInitials(currentUserObj.full_name) : (salesmanMeta[userId]?.initials || 'EX'));
  const meta = {
    initials: initials,
    color: salesmanMeta[userId]?.color || 'var(--vanya-green)'
  };



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
    else if (rawStatus === 'READY_TO_BOOK') { badgeClass += 'ready-to-book'; label = 'Ready to Book'; }
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
        unitId: '',
        email: lead ? lead.email || '' : '',
        phone: lead ? lead.phone || '' : '',
        aadhaar: lead ? lead.aadhaar || '' : ''
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
      const closingLead = inquiries.find(i => i.id === closeDealLeadId);

      // 1. Create the Buyer portal login & Details, mark unit as SOLD OUT
      const resBuyer = await fetch('/api/buyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: closeDealForm.username,
          password: closeDealForm.password,
          role: 'Buyer',
          email: closeDealForm.email,
          phone: closeDealForm.phone,
          full_name: closingLead?.name || closeDealForm.username,
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
      const resInquiry = await fetch(`/api/inquiries?id=${closeDealLeadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: finalStatus,
          aadhaar: closeDealForm.aadhaar,
          message: `Closed Deal on Unit V-${closeDealForm.unitId}. Price: ${closeDealForm.totalAmount}. Paid: ${closeDealForm.amountPaid}.`
        })
      });
      const dataInquiry = await resInquiry.json();
      
      if (dataInquiry.success) {
        // 3. Trigger CP commission check — POST a UNIT_ASSIGNMENT_ inquiry so the
        //    commission auto-generation logic in /api/inquiries fires for this buyer's phone
        const checkPhone = closeDealForm.phone || closingLead?.phone;
        if (checkPhone) {
          await fetch('/api/inquiries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: closingLead?.name || closeDealForm.username,
              email: closeDealForm.email || closingLead?.email || '',
              phone: checkPhone,
              source: `UNIT_ASSIGNMENT_${closeDealForm.unitId}`,
              status: `CONVERTED|${userId}`,
              message: `Commission trigger for unit ${closeDealForm.unitId}`
            })
          });
        }

        alert(`Deal closed successfully!\n\nBuyer login created:\nUsername: ${closeDealForm.username}\nPassword: ${closeDealForm.password}\nFlat V-${closeDealForm.unitId} is marked as SOLD OUT.`);
        setIsCloseDealModalOpen(false);
        if (typeof window !== 'undefined') {
          window.location.href = window.location.pathname;
        } else {
          router.refresh();
        }
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
      {isMobileSidebarOpen && <div className="mobile-sidebar-backdrop" onClick={() => setIsMobileSidebarOpen(false)} />}
      <aside className={`admin-sidebar ${isMobileSidebarOpen ? 'open' : ''}`} style={{
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
            { id: 'sold_flats', label: 'Sold Flats Progress', icon: '🏗️' },
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
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <button className="mobile-sidebar-toggle" onClick={() => setIsMobileSidebarOpen(true)}>☰</button>
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
            <div className="responsive-grid-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
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
            <div className="responsive-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
              
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

              <div className="table-responsive-wrapper">
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
                        <strong>{getDisplayName(inq)}</strong>
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
                        <VisitManagerClient inquiryId={inq.id} currentStatus={inq.status} salesmanId={userId} isCpLead={shouldMaskContact(inq)} />
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
            </div>

            {/* Collection Targets */}
            <div className="responsive-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
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

            <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #f1f3f5' }}>
              <div className="table-responsive-wrapper">
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
                            <strong>{getDisplayName(inq)}</strong>
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
                              {!shouldMaskContact(inq) ? (
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
                              ) : (
                                <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontStyle: 'italic', padding: '6px 0', display: 'inline-block' }}>Managed by CP</span>
                              )}
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
              
              <h2 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--vanya-green)' }}>Client Workspace: {getDisplayName(selectedLead)}</h2>
              {getStatusBadge(selectedLead.status)}
            </div>

            {/* Split layout: Details vs Notes/Timeline */}
            <div className="responsive-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
              
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
                    {selectedLead.source?.startsWith('CP_Referral|') && (
                      <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f3f5' }}>
                        <span className="text-muted" style={{ display: 'block', fontSize: '0.68rem', color: 'var(--vanya-gold)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🤝 Referring Channel Partner</span>
                        {(() => {
                          const cpUsername = selectedLead.source?.split('|')[1];
                          const cpPartner = cpPartners.find(p => p.username === cpUsername);
                          const cpUser = allUsers.find(u => u.username === cpUsername);
                          
                          const brokerName = cpUser?.full_name || cpUser?.username || `Partner (${cpUsername})`;
                          const brokerFirm = cpPartner?.firm_name || 'Firm details unavailable';
                          const brokerPhone = cpUser?.phone || 'Phone unavailable';
                          const brokerEmail = cpUser?.email || 'Email unavailable';
                          
                          return (
                            <div style={{ marginTop: '0.5rem', background: '#faf9f6', padding: '0.75rem', borderRadius: '8px', border: '1px solid #f1eede' }}>
                              <strong style={{ display: 'block', color: 'var(--vanya-green)', fontSize: '0.85rem' }}>{brokerName}</strong>
                              <span style={{ display: 'block', fontSize: '0.72rem', color: '#666', marginBottom: '0.25rem' }}>{brokerFirm}</span>
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                                <span>📞 {brokerPhone}</span>
                                <span>•</span>
                                <span>✉️ {brokerEmail}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Workflow Actions */}
                {(() => {
                  const isCpLead = selectedLead && selectedLead.source && selectedLead.source.startsWith('CP_Referral|');
                  const isWon = selectedLead && ['CONVERTED', 'BOOKED'].includes((selectedLead.status || '').split('|')[0].toUpperCase());
                  const isLost = selectedLead && (selectedLead.status || '').split('|')[0].toUpperCase() === 'LOST';
                  const isReadyToBook = selectedLead && (selectedLead.status || '').split('|')[0].toUpperCase() === 'READY_TO_BOOK';

                  if (isWon) {
                    return (
                      <div className="widget-card" style={{ background: '#f0fdf4', borderRadius: '12px', padding: '2rem 1.75rem', border: '1px solid #bbf7d0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ fontSize: '2rem' }}>🎉</div>
                        <h3 className="serif" style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#166534' }}>Deal Finalized</h3>
                        <p style={{ fontSize: '0.78rem', color: '#15803d', lineHeight: 1.5, margin: 0 }}>
                          This deal has been successfully closed. The buyer account is created and unit booking is registered. No further actions are required.
                        </p>
                      </div>
                    );
                  }

                  if (isLost) {
                    return (
                      <div className="widget-card" style={{ background: '#fef2f2', borderRadius: '12px', padding: '2rem 1.75rem', border: '1px solid #fca5a5', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ fontSize: '2rem' }}>❌</div>
                        <h3 className="serif" style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#991b1b' }}>Deal Lost</h3>
                        <p style={{ fontSize: '0.78rem', color: '#b91c1c', lineHeight: 1.5, margin: 0 }}>
                          This deal has been marked as Lost/Rejected. No further actions are required.
                        </p>
                      </div>
                    );
                  }

                  if (isCpLead) {
                    const currentStatus = (selectedLead.status || '').split('|')[0].toUpperCase();
                    const hasWalkedIn = ['DONE', 'NEGOTIATION', 'READY_TO_BOOK', 'BOOKED', 'CONVERTED'].includes(currentStatus);

                    if (isReadyToBook) {
                      return (
                        <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', border: '1px solid #f1f3f5' }}>
                          <h3 className="serif" style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem' }}>CRM Actions</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button onClick={() => handleUpdateStatus(selectedLead.id, 'CONVERTED')} style={{ width: '100%', padding: '0.8rem', textAlign: 'center', background: '#d9a036', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                              🎉 Close Deal (Converted Booking)
                            </button>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', border: '1px solid #f1f3f5' }}>
                          <h3 className="serif" style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem' }}>CRM Actions</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {!hasWalkedIn && (
                              <button onClick={() => handleWalkInComplete(selectedLead.id)} className="btn-outline-dark" style={{ width: '100%', padding: '0.8rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', border: '2px solid var(--vanya-gold)', color: 'var(--vanya-gold)' }}>
                                🚶‍♂️ Mark Site Walk-in Complete (Promote to Opportunity)
                              </button>
                            )}
                            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '2rem 1.75rem', border: '1px dashed #cbd5e1', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ fontSize: '2rem' }}>🔒</div>
                              <h3 className="serif" style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#475569' }}>Awaiting Broker Action</h3>
                              <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                                This lead was referred by a Channel Partner. All pipeline management, site visits, and negotiation are handled directly by the broker. You will be able to close the deal once the broker marks it as <strong>Ready to Book</strong>.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  }

                  // Normal Lead CRM Actions
                  return (
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
                        <button onClick={() => { setCallbackLeadId(selectedLead.id); setIsCallbackModalOpen(true); }} className="btn-outline-dark" style={{ width: '100%', padding: '0.8rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                          📞 Schedule Follow Up
                        </button>
                        <button onClick={() => { setVisitLeadId(selectedLead.id); setIsVisitModalOpen(true); }} className="btn-outline-dark" style={{ width: '100%', padding: '0.8rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                          🚶 Book Site Visit
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
                  );
                })()}

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

                          {hasReached('DONE') && (
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '-29px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--vanya-gold)' }}></span>
                              <strong style={{ fontSize: '0.82rem', display: 'block' }}>Site Walk-in Completed</strong>
                              <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Physical site walk-in verified</span>
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

              <div className="table-responsive-wrapper">
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
                      <td><strong>{getDisplayName(inq)}</strong></td>
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

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: BOOKINGS */}
        {/* ============================================================== */}
        {activeTab === 'bookings' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--vanya-green)' }}>Verified Customer Bookings</h2>
            
            <div className="responsive-grid-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #f1f3f5' }}>
                <span className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>Bookings Achieved</span>
                <h2 className="serif" style={{ fontSize: '2rem', margin: '0.4rem 0', color: 'var(--vanya-green)' }}>{ClosedWonCount(myInquiries)}</h2>
                <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Out of 12 target properties</span>
              </div>
              <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #f1f3f5' }}>
                <span className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>Verified Value</span>
                <h2 className="serif" style={{ fontSize: '2rem', margin: '0.4rem 0', color: '#34a853' }}>
                  {closedRevenueSecured === 0 ? '₹ 0.00' : formatPriceCr(closedRevenueSecured)}
                </h2>
                <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Based on deposit transactions</span>
              </div>
              <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #f1f3f5' }}>
                <span className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>RERA Status</span>
                <h2 className="serif" style={{ fontSize: '2rem', margin: '0.4rem 0', color: 'var(--vanya-gold)' }}>
                  {ClosedWonCount(myInquiries) > 0 ? '100%' : '—'}
                </h2>
                <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                  {ClosedWonCount(myInquiries) > 0 ? `All ${ClosedWonCount(myInquiries)} closed units compliant` : 'No closed units logged'}
                </span>
              </div>
            </div>

            <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5' }}>
              <h3 className="serif" style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: 'var(--vanya-green)' }}>Active Bookings Registry</h3>
              
              <div className="table-responsive-wrapper">
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
                        <td><strong>{getDisplayName(inq)}</strong></td>
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

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: SOLD FLATS CONSTRUCTION PROGRESS */}
        {/* ============================================================== */}
        {activeTab === 'sold_flats' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--vanya-green)' }}>Sold Flats & Construction Updates</h2>
            
            <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5' }}>
              <h3 className="serif" style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--vanya-green)' }}>Customer Accounts Registry</h3>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 1.5rem 0' }}>
                All apartments sold by you. Click "Update Progress" to update milestones, construction progress percentage, or to add/remove construction timeline updates and photos visible in the buyer's portal.
              </p>
              
              <div className="table-responsive-wrapper">
                <table className="table-standard">
                  <thead>
                    <tr>
                      <th>BUYER USERNAME</th>
                      <th>UNIT ID</th>
                      <th>CONSTRUCTION PROGRESS</th>
                      <th>POSSESSION DATE</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myBuyerDetails.map((b, idx) => (
                      <tr key={b.id || idx}>
                        <td><strong>{b.username}</strong></td>
                        <td><span className="badge available" style={{ fontSize: '0.7rem' }}>V-{b.unit_id}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1, background: '#e5e7eb', height: '6px', borderRadius: '3px', minWidth: '80px' }}>
                              <div style={{ background: 'var(--vanya-green)', height: '100%', width: `${b.construction_progress}%`, borderRadius: '3px' }} />
                            </div>
                            <span>{b.construction_progress}%</span>
                          </div>
                        </td>
                        <td>{b.possession_date ? new Date(b.possession_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</td>
                        <td>
                          <button 
                            className="btn-outline" 
                            onClick={() => handleOpenUpdateModal(b)} 
                            style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: '4px', cursor: 'pointer', background: '#D9A036', color: 'white', border: 'none' }}
                          >
                            Update Progress
                          </button>
                        </td>
                      </tr>
                    ))}
                    {myBuyerDetails.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af' }}>No buyer accounts linked to your closed units.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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

              <div className="table-responsive-wrapper">
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
                      <td><strong>{getDisplayName(inq)}</strong></td>
                      <td>{getDisplayPhone(inq)}</td>
                      <td><span style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>3BHK Supreme</span></td>
                      <td>{inq.message?.includes('visit on') ? inq.message.split('visit on')[1] : 'Upcoming scheduled time'}</td>
                      <td>
                        <span className={`badge ${inq.status.startsWith('SCHEDULED') ? 'negotiation' : 'available'}`}>
                          {inq.status.startsWith('SCHEDULED') ? 'UPCOMING' : 'COMPLETED'}
                        </span>
                      </td>
                      <td>
                        <VisitManagerClient inquiryId={inq.id} currentStatus={inq.status} salesmanId={userId} isCpLead={shouldMaskContact(inq)} />
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

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 8: TASKS MANAGER */}
        {/* ============================================================== */}
        {activeTab === 'tasks' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--vanya-green)' }}>My Task Board</h2>
            
            <div className="responsive-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
              
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
        {activeTab === 'reports' && (() => {
          // --- Dynamic Calculations for Reports Filter ---
          const now = new Date();
          const filteredInq = myInquiries.filter(inq => {
            const created = new Date(inq.created_at);
            if (isNaN(created.getTime())) return true;
            const diffTime = Math.abs(now - created);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (reportsPeriod === '30D') return diffDays <= 30;
            if (reportsPeriod === '90D') return diffDays <= 90;
            if (reportsPeriod === '6M') return diffDays <= 180;
            return true; // 'ALL'
          });

          const totalReportsCount = filteredInq.length;
          
          let webCount = 0;
          let directCount = 0;
          let cpCount = 0;
          
          filteredInq.forEach(inq => {
            const src = (inq.source || '').toLowerCase();
            if (src.includes('cp_referral') || src.includes('referral') || src.includes('cp')) {
              cpCount++;
            } else if (src.includes('direct') || src.includes('admin') || src.includes('outreach')) {
              directCount++;
            } else {
              webCount++;
            }
          });

          const webPct = totalReportsCount > 0 ? Math.round((webCount / totalReportsCount) * 100) : 0;
          const directPct = totalReportsCount > 0 ? Math.round((directCount / totalReportsCount) * 100) : 0;
          const cpPct = totalReportsCount > 0 ? Math.max(0, 100 - webPct - directPct) : 0;

          const webOffset = 25;
          const directOffset = (25 - webPct);
          const cpOffset = (25 - webPct - directPct);

          // --- Dynamic Leads Volume Trend Calculations based on Week / Month / Year Filter ---
          const getLeadsChartInfo = () => {
            const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
            const isRealInq = (inq) =>
              !inq.source?.startsWith('UNIT_ASSIGNMENT_');

            let points = [], periodLabel = '';

            if (trendView === 'week') {
              const yr = selectedYear;
              const mo = selectedMonth;
              let startDay = 1;
              let endDay = 7;
              if (selectedWeek === 0) { startDay = 1; endDay = 7; }
              else if (selectedWeek === 1) { startDay = 8; endDay = 14; }
              else if (selectedWeek === 2) { startDay = 15; endDay = 21; }
              else if (selectedWeek === 3) {
                startDay = 22;
                endDay = getWeek4EndDay(yr, mo);
              }

              periodLabel = `${startDay} ${MONTHS[mo]} – ${endDay} ${MONTHS[mo]} ${yr}`;
              
              for (let day = startDay; day <= endDay; day++) {
                const d = new Date(yr, mo, day);
                const label = `${DAYS[d.getDay()]} ${day}`;
                const count = myInquiries.filter(inq => {
                  if (!isRealInq(inq)) return false;
                  const id = new Date(inq.created_at);
                  return id.getFullYear() === yr && id.getMonth() === mo && id.getDate() === day;
                }).length;
                points.push({ label, count });
              }
            } else if (trendView === 'month') {
              const yr = selectedYear;
              const mo = selectedMonth;
              const dim = getWeek4EndDay(yr, mo);
              periodLabel = `${MONTHS[mo]} ${yr}`;
              
              const weeks = [
                { s: 1, e: 7 },
                { s: 8, e: 14 },
                { s: 15, e: 21 },
                { s: 22, e: dim }
              ];
              
              weeks.forEach((w, index) => {
                const total = myInquiries.filter(inq => {
                  if (!isRealInq(inq)) return false;
                  const d = new Date(inq.created_at);
                  return d.getFullYear() === yr && d.getMonth() === mo && d.getDate() >= w.s && d.getDate() <= w.e;
                }).length;
                points.push({ label: `W${index + 1} (${w.s}–${w.e} ${MONTHS[mo]})`, count: total });
              });
            } else {
              const yr = selectedYear;
              const startMo = startMonth;
              const endMo = endMonth;
              periodLabel = `${MONTHS[startMo]} ${yr} – ${MONTHS[endMo]} ${yr}`;
              
              for (let mo = startMo; mo <= endMo; mo++) {
                const count = myInquiries.filter(inq => {
                  if (!isRealInq(inq)) return false;
                  const d = new Date(inq.created_at);
                  return d.getFullYear() === yr && d.getMonth() === mo;
                }).length;
                points.push({ label: MONTHS[mo], count });
              }
            }

            return { points, periodLabel };
          };

          const { points: trendPoints, periodLabel: trendPeriodLabel } = getLeadsChartInfo();
          const leadsTotal = trendPoints.reduce((s, p) => s + p.count, 0);

          const maxTrendCount = Math.max(...trendPoints.map(p => p.count), 1);
          const xStep = 100 / Math.max(trendPoints.length - 1, 1);
          const trendCoords = trendPoints.map((p, i) => {
            const x = i * xStep;
            const y = 35 - (p.count / maxTrendCount) * 27;
            return { x, y };
          });

          let pathD = '';
          if (trendCoords.length > 0) {
            pathD = `M ${trendCoords[0].x} ${trendCoords[0].y}`;
            for (let i = 1; i < trendCoords.length; i++) {
              const prev = trendCoords[i - 1];
              const curr = trendCoords[i];
              const cp1x = prev.x + (xStep / 2);
              const cp1y = prev.y;
              const cp2x = curr.x - (xStep / 2);
              const cp2y = curr.y;
              pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
            }
          }

          const areaD = trendCoords.length > 0 ? `${pathD} L 100 40 L 0 40 Z` : '';

          return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <h2 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--vanya-green)' }}>CRM Performance Reports</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                
                {/* Chart 1: Donut Source Chart */}
                <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5' }}>
                  
                  {/* Chart Header with Filter Select */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 className="serif" style={{ margin: 0, fontSize: '1.25rem', color: 'var(--vanya-green)' }}>Leads Source Acquisition</h3>
                    
                    <select 
                      value={reportsPeriod}
                      onChange={(e) => setReportsPeriod(e.target.value)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.72rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        background: '#fff',
                        color: '#1e293b',
                        fontWeight: '700',
                        cursor: 'pointer',
                        outline: 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <option value="30D">Last 30 Days</option>
                      <option value="90D">Last 90 Days</option>
                      <option value="6M">Last 6 Months</option>
                      <option value="ALL">All Time</option>
                    </select>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2.5rem', height: '220px' }}>
                    <svg width="150" height="150" viewBox="0 0 42 42">
                      <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="5" />
                      
                      {/* Animated/Interactive Circle slices */}
                      <circle 
                        cx="21" cy="21" r="15.9155" fill="none" 
                        stroke="var(--vanya-green)" strokeWidth="5" 
                        strokeDasharray={`${webPct} 100`} 
                        strokeDashoffset={webOffset} 
                        style={{
                          transition: 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      />
                      <circle 
                        cx="21" cy="21" r="15.9155" fill="none" 
                        stroke="var(--vanya-gold)" strokeWidth="5" 
                        strokeDasharray={`${directPct} 100`} 
                        strokeDashoffset={directOffset} 
                        style={{
                          transition: 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      />
                      <circle 
                        cx="21" cy="21" r="15.9155" fill="none" 
                        stroke="#ab47bc" strokeWidth="5" 
                        strokeDasharray={`${cpPct} 100`} 
                        strokeDashoffset={cpOffset} 
                        style={{
                          transition: 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      />
                      <g fill="var(--vanya-green)" fontSize="3" fontWeight="bold">
                        <text x="21" y="19" textAnchor="middle" alignmentBaseline="middle">Sources</text>
                        <text x="21" y="24" textAnchor="middle" alignmentBaseline="middle" fontSize="2.2" fill="#6b7280" fontWeight="normal">
                          {totalReportsCount} Leads
                        </text>
                      </g>
                    </svg>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'left', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--vanya-green)', borderRadius: '3px' }}></span>
                        <span style={{ fontWeight: '600' }}>Website Referral ({webPct}%)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--vanya-gold)', borderRadius: '3px' }}></span>
                        <span style={{ fontWeight: '600' }}>Direct Outreach ({directPct}%)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#ab47bc', borderRadius: '3px' }}></span>
                        <span style={{ fontWeight: '600' }}>Channel Partners ({cpPct}%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart 2: Trend Line Chart */}
                <div className="widget-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #f1f3f5' }}>
                  
                  {/* Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h3 className="serif" style={{ margin: 0, fontSize: '1.25rem', color: 'var(--vanya-green)' }}>Leads Volume Trend</h3>
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>Total in period: {leadsTotal} leads ({trendPeriodLabel})</span>
                    </div>
                    
                    {/* View selector: Week, Month, Year */}
                    <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                      {[['week','Week'],['month','Month'],['year','Year']].map(([val, label]) => (
                        <button key={val}
                          onClick={() => { setTrendView(val); resetToCurrentPeriod(val); }}
                          style={{ padding: '4px 10px', fontSize: '0.65rem', fontWeight: '700', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            background: trendView === val ? 'var(--vanya-green)' : 'transparent',
                            color: trendView === val ? '#fff' : '#6b7280' }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Navigation row: ◀ period select ▶ */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <button onClick={handlePrevPeriod}
                      style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >◀</button>
                    
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      {trendView === 'week' && (
                        <select
                          value={selectedWeek}
                          onChange={(e) => setSelectedWeek(Number(e.target.value))}
                          style={{ padding: '3px 8px', fontSize: '0.68rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', fontWeight: 'bold', color: '#1e293b' }}
                        >
                          {getWeekOptions(selectedYear, selectedMonth).map(opt => (
                            <option key={opt.value} value={opt.value}>{`Week ${opt.value + 1} (${opt.label})`}</option>
                          ))}
                        </select>
                      )}
                      {(trendView === 'week' || trendView === 'month') && (
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(Number(e.target.value))}
                          style={{ padding: '3px 8px', fontSize: '0.68rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', fontWeight: 'bold', color: '#1e293b' }}
                        >
                          {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, idx) => (
                            <option key={idx} value={idx}>{m}</option>
                          ))}
                        </select>
                      )}
                      {trendView === 'year' && (
                        <>
                          <span style={{ fontSize: '0.7rem', color: '#4b5563', fontWeight: 'bold' }}>From</span>
                          <select
                            value={startMonth}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setStartMonth(val);
                              if (val > endMonth) setEndMonth(val);
                            }}
                            style={{ padding: '3px 8px', fontSize: '0.68rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', fontWeight: 'bold', color: '#1e293b' }}
                          >
                            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, idx) => (
                              <option key={idx} value={idx}>{m}</option>
                            ))}
                          </select>
                          <span style={{ fontSize: '0.7rem', color: '#4b5563', fontWeight: 'bold' }}>To</span>
                          <select
                            value={endMonth}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setEndMonth(val);
                              if (val < startMonth) setStartMonth(val);
                            }}
                            style={{ padding: '3px 8px', fontSize: '0.68rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', fontWeight: 'bold', color: '#1e293b' }}
                          >
                            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, idx) => (
                              <option key={idx} value={idx}>{m}</option>
                            ))}
                          </select>
                        </>
                      )}
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        style={{ padding: '3px 8px', fontSize: '0.68rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', fontWeight: 'bold', color: '#1e293b' }}
                      >
                        {availableYears.map(yr => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>

                    <button onClick={handleNextPeriod}
                      disabled={isNextDisabled()}
                      style={{ 
                        width: '26px', 
                        height: '26px', 
                        borderRadius: '50%', 
                        border: '1px solid #e2e8f0', 
                        background: '#fff', 
                        cursor: isNextDisabled() ? 'not-allowed' : 'pointer', 
                        fontSize: '0.75rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: isNextDisabled() ? '#cbd5e1' : '#475569', 
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
                        opacity: isNextDisabled() ? 0.5 : 1,
                        transition: 'all 0.15s' 
                      }}
                      onMouseEnter={e => { if(!isNextDisabled()) e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={e => { if(!isNextDisabled()) e.currentTarget.style.background = '#fff'; }}
                    >▶</button>
                  </div>
                  
                  <div style={{ position: 'relative', height: '170px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    
                    <svg viewBox="0 0 100 40" style={{ width: '100%', height: '120px' }}>
                      <defs>
                        <linearGradient id="goldGradientReportsDynamic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D9A036" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#D9A036" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Area Chart Gradient Fill */}
                      {areaD && <path d={areaD} fill="url(#goldGradientReportsDynamic)" style={{ transition: 'd 0.8s ease' }} />}
                      
                      {/* Smooth Line Curve */}
                      {pathD && <path d={pathD} fill="none" stroke="#D9A036" strokeWidth="1.8" style={{ transition: 'd 0.8s ease' }} />}
                      
                      {/* Interactive node circles with tooltips */}
                      {trendCoords.map((coord, idx) => (
                        <g key={idx} style={{ cursor: 'pointer' }}>
                          <circle 
                            cx={coord.x} 
                            cy={coord.y} 
                            r="1.8" 
                            fill="var(--vanya-green)" 
                            stroke="#ffffff"
                            strokeWidth="0.5"
                            style={{ 
                              transition: 'cx 0.8s ease, cy 0.8s ease, r 0.15s ease' 
                            }}
                            onMouseEnter={e => e.currentTarget.setAttribute('r', '2.8')}
                            onMouseLeave={e => e.currentTarget.setAttribute('r', '1.8')}
                          />
                          {/* Mini Tooltip Count values on hover */}
                          <text 
                            x={coord.x} 
                            y={coord.y - 4} 
                            textAnchor="middle" 
                            fontSize="2.5" 
                            fill="#1e293b" 
                            fontWeight="bold"
                            style={{ opacity: 0.85 }}
                          >
                            {trendPoints[idx].count}
                          </text>
                        </g>
                      ))}
                    </svg>
                    
                    {/* Labels */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#6b7280', borderTop: '1px solid #e2e8f0', marginTop: '0.5rem', paddingTop: '0.5rem', fontWeight: '600', overflowX: 'auto', gap: '0.2rem' }}>
                      {trendPoints.map((tp, idx) => (
                        <span key={idx} style={{ display: 'inline-block', whiteSpace: 'nowrap', textAlign: 'center', flex: 1 }}>{tp.label}</span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

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
                    <strong>{profileData.phone ? `+91 ${profileData.phone.replace(/(\d{5})(\d{5})/, '$1 $2')}` : (currentUserObj.phone ? `+91 ${currentUserObj.phone.replace(/(\d{5})(\d{5})/, '$1 $2')}` : '+91 98765 43210')}</strong>
                  </div>
                  <div>
                    <span className="text-muted" style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold' }}>EMAIL ADDRESS</span>
                    <strong>{profileData.email || currentUserObj.email || `${currentSalesmanName.toLowerCase().replace(' ', '.')}@dreamspaces.com`}</strong>
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
            <strong style={{ fontSize: '1.25rem', display: 'block', margin: '0.25rem 0' }}>{getDisplayName(dialerLead)}</strong>
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
            <span style={{ fontSize: '1.5rem', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold' }}>
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
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>BUYER EMAIL ID</label>
                  <input 
                    type="email" 
                    value={closeDealForm.email} 
                    onChange={e => setCloseDealForm({ ...closeDealForm, email: e.target.value })} 
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>BUYER PHONE NUMBER</label>
                  <input 
                    type="tel" 
                    value={closeDealForm.phone} 
                    onChange={e => setCloseDealForm({ ...closeDealForm, phone: e.target.value })} 
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>BUYER AADHAAR CARD NUMBER</label>
                <input 
                  type="tel" 
                  minLength="12" 
                  maxLength="12" 
                  pattern="[0-9]{12}" 
                  title="Aadhaar number must be exactly 12 digits"
                  value={closeDealForm.aadhaar} 
                  onChange={e => setCloseDealForm({ ...closeDealForm, aadhaar: e.target.value.replace(/[^0-9]/g, '') })} 
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem' }} 
                />
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

      {/* ============================================================== */}
      {/* SALESMAN UPDATE BUYER RECORD MODAL */}
      {/* ============================================================== */}
      {updatingBuyer && (
        <div onClick={() => setUpdatingBuyer(null)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, cursor: 'pointer'
        }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', width: '100%', maxWidth: '450px', borderRadius: '12px', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto', cursor: 'default' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #f1f3f5', paddingBottom: '0.5rem' }}>
              <h3 className="serif" style={{ margin: 0, fontSize: '1.25rem', color: 'var(--vanya-green)' }}>Update Progress: {updatingBuyer.username}</h3>
              <button onClick={() => setUpdatingBuyer(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSavingProgress(true);
              try {
                const res = await fetch(`/api/buyers?username=${encodeURIComponent(updatingBuyer.username)}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    unit_id: updatingBuyer.unit_id,
                    total_amount: updatingTotalValue,
                    amount_paid: updatingTotalPaid,
                    construction_progress: updatingProgress,
                    possession_date: updatingPossessionDate,
                    milestones: updatingMilestones
                  })
                });
                const data = await res.json();
                if (data.success) {
                  alert('Buyer record and milestones updated successfully!');
                  setUpdatingBuyer(null);
                  router.refresh();
                  setTimeout(() => window.location.reload(), 500);
                } else {
                  alert('Error: ' + data.error);
                }
              } catch (err) {
                alert('Network error.');
              } finally {
                setIsSavingProgress(false);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>UNIT ID</label>
                  <input type="text" readOnly value={updatingBuyer.unit_id} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem', background: '#f5f5f5' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>PROGRESS (%)</label>
                  <input type="number" min="0" max="100" value={updatingProgress} onChange={e => setUpdatingProgress(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>TOTAL VALUE</label>
                  <input type="text" required value={updatingTotalValue} onChange={e => setUpdatingTotalValue(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>TOTAL PAID</label>
                  <input type="text" required value={updatingTotalPaid} onChange={e => setUpdatingTotalPaid(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>POSSESSION DATE</label>
                <input type="date" required value={updatingPossessionDate} onChange={e => setUpdatingPossessionDate(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>CONSTRUCTION MILESTONES</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.66rem', background: '#fafafa', border: '1px solid #f1f3f5', padding: '0.8rem', borderRadius: '8px' }}>
                  {updatingMilestones.filter(m => m.step !== 'CONSTRUCTION_UPDATES').map((m, idx) => (
                    <div key={m.step || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>{m.step}</span>
                      <select 
                        value={m.status} 
                        onChange={(e) => {
                          const newM = [...updatingMilestones];
                          const targetIdx = newM.findIndex(orig => orig.step === m.step);
                          if (targetIdx !== -1) {
                            newM[targetIdx] = { ...newM[targetIdx], status: e.target.value };
                            setUpdatingMilestones(newM);
                          }
                        }}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.75rem', width: '130px', background: '#fff' }}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="IN PROGRESS">IN PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>CONSTRUCTION UPDATES & PHOTO LOGS</label>
                <div style={{ background: '#fafafa', border: '1px solid #f1f3f5', padding: '0.8rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* List of existing updates */}
                  {(() => {
                    const updatesItem = updatingMilestones.find(m => m.step === 'CONSTRUCTION_UPDATES');
                    const updates = updatesItem?.updates || [];
                    if (updates.length === 0) {
                      return <span style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>No log updates added yet.</span>;
                    }
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                        {updates.map((upd, uIdx) => (
                          <div key={uIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'white', padding: '0.4rem', borderRadius: '4px', border: '1px solid #eee' }}>
                            {upd.image && <img src={upd.image} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <strong style={{ fontSize: '0.72rem', display: 'block', color: 'var(--vanya-green)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{upd.title}</strong>
                              <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>{upd.date}</span>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => {
                                const newM = [...updatingMilestones];
                                const itemIdx = newM.findIndex(m => m.step === 'CONSTRUCTION_UPDATES');
                                if (itemIdx !== -1) {
                                  const updatedList = newM[itemIdx].updates.filter((_, i) => i !== uIdx);
                                  newM[itemIdx] = { ...newM[itemIdx], updates: updatedList };
                                  setUpdatingMilestones(newM);
                                }
                              }} 
                              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1.25rem', lineHeight: '1' }}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Form to add a new update */}
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#374151' }}>Add New Photo / Log:</span>
                    <input 
                      type="text" 
                      placeholder="Update Title (e.g. 12th Floor slab)" 
                      value={newUpdateTitle} 
                      onChange={e => setNewUpdateTitle(e.target.value)} 
                      style={{ padding: '0.4rem 0.6rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.75rem' }} 
                    />
                    <input 
                      type="date" 
                      value={newUpdateDate} 
                      onChange={e => setNewUpdateDate(e.target.value)} 
                      style={{ padding: '0.4rem 0.6rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.75rem' }} 
                    />
                    <textarea 
                      placeholder="Brief Description..." 
                      value={newUpdateDescription} 
                      onChange={e => setNewUpdateDescription(e.target.value)} 
                      rows="2"
                      style={{ padding: '0.4rem 0.6rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.75rem', resize: 'vertical' }} 
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>Upload Photo:</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewUpdateImage(reader.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                        style={{ fontSize: '0.7rem' }}
                      />
                      {newUpdateImage && (
                        <div style={{ marginTop: '0.25rem' }}>
                          <img src={newUpdateImage} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                        </div>
                      )}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        if (!newUpdateTitle.trim() || !newUpdateDate) {
                          alert('Title and Date are required.');
                          return;
                        }
                        const newM = [...updatingMilestones];
                        let itemIdx = newM.findIndex(m => m.step === 'CONSTRUCTION_UPDATES');
                        const newUpd = {
                          title: newUpdateTitle.trim(),
                          date: newUpdateDate,
                          description: newUpdateDescription.trim(),
                          image: newUpdateImage
                        };
                        if (itemIdx === -1) {
                          newM.push({
                            step: 'CONSTRUCTION_UPDATES',
                            status: 'COMPLETED',
                            updates: [newUpd]
                          });
                        } else {
                          const currentUpdates = newM[itemIdx].updates || [];
                          newM[itemIdx] = {
                            ...newM[itemIdx],
                            updates: [...currentUpdates, newUpd]
                          };
                        }
                        setUpdatingMilestones(newM);
                        setNewUpdateTitle('');
                        setNewUpdateDescription('');
                        setNewUpdateImage('');
                      }} 
                      style={{ background: 'var(--vanya-gold)', color: 'white', padding: '0.5rem', border: 'none', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold', marginTop: '0.25rem' }}
                    >
                      + Add Log Update & Photo
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-dark" style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', cursor: 'pointer', background: '#D9A036', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }} disabled={isSavingProgress}>
                {isSavingProgress ? 'SAVING CHANGES...' : 'UPDATE BUYER PROGRESS'}
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
