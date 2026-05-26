"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './admin.css';

export default function BuyerPortalClient({ username, buyerDetails, inquiries, units }) {
  const router = useRouter();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('tab') || 'dashboard';
    }
    return 'dashboard';
  });

  const [selectedAccordion, setSelectedAccordion] = useState(null);
  const [activeSupportTicket, setActiveSupportTicket] = useState(null);
  
  // Tab sub-filters
  const [paymentSubTab, setPaymentSubTab] = useState('schedule');
  const [documentSubTab, setDocumentSubTab] = useState('all');
  const [constructionSubTab, setConstructionSubTab] = useState('photo');

  // Form states for profile
  const [mobileNum, setMobileNum] = useState('+91 93765 43210');
  const [emailAddress, setEmailAddress] = useState('rahul.sharma@email.com');
  const [addressVal, setAddressVal] = useState('101, Green Residency, Baner, Pune - 411045');
  const [panNumber, setPanNumber] = useState('ABCDE1234F');
  const [isEditing, setIsEditing] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Password update form
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confPass, setConfPass] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  // Message chat history
  const [activeChatThread, setActiveChatThread] = useState('team');
  const [chatMessages, setChatMessages] = useState({
    team: [
      { sender: 'exec', text: "Dear Rahul, Construction update for Tower A is now available. Please check the latest photos and progress.", time: "10:30 AM" },
      { sender: 'buyer', text: "Thank you for the update.", time: "10:32 AM" }
    ],
    sales: [
      { sender: 'exec', text: "Hello Rahul, regarding your payment receipt request, we are uploading it to the documents section now.", time: "Yesterday" }
    ],
    support: [
      { sender: 'exec', text: "Hi Rahul, your ticket regarding payment reflection has been resolved. The ledger shows payment cleared.", time: "20 May" }
    ]
  });
  const [newMsg, setNewMsg] = useState('');

  const changeTab = (tabName) => {
    setActiveTab(tabName);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', tabName);
      window.history.pushState(null, '', `?${params.toString()}`);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setChatMessages({
      ...chatMessages,
      [activeChatThread]: [
        ...chatMessages[activeChatThread],
        { sender: 'buyer', text: newMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]
    });
    setNewMsg('');
  };

  const toggleAccordion = (index) => {
    setSelectedAccordion(selectedAccordion === index ? null : index);
  };

  // Safe variables parsing from database details
  const rawUnitId = buyerDetails?.unit_id || '102';
  const unitId = rawUnitId.startsWith('A') ? rawUnitId : `A ${rawUnitId}`;

  const userUnit = units.find(u => u.unit_id === rawUnitId || parseInt(u.unit_id) === parseInt(rawUnitId)) || {
    unit_id: rawUnitId,
    floor: rawUnitId.length > 2 ? rawUnitId.slice(0, -2) : '1',
    type: '3 BHK Premium',
    area: '1025',
    price: '₹ 1.15 Cr',
    status: 'SOLD OUT'
  };

  const getFloorSuffix = (floorStr) => {
    const f = parseInt(floorStr) || 1;
    if (f === 11 || f === 12 || f === 13) return `${f}th`;
    const lastDigit = f % 10;
    if (lastDigit === 1) return `${f}st`;
    if (lastDigit === 2) return `${f}nd`;
    if (lastDigit === 3) return `${f}rd`;
    return `${f}th`;
  };
  const floorVal = userUnit.floor || (userUnit.unit_id.length > 2 ? userUnit.unit_id.slice(0, -2) : '1');
  const floorWithSuffix = `${getFloorSuffix(floorVal)} Floor`;

  const towerName = userUnit.type && userUnit.type.toLowerCase().includes('villa') ? 'Vanya Estate' :
                    userUnit.type && userUnit.type.toLowerCase().includes('estate') ? 'Vanya Meadows' :
                    rawUnitId.startsWith('B') ? 'Skyview Tower B' : 'Skyview Tower A';
  
  // Format possession date
  const rawPossDate = buyerDetails?.possession_date || '2026-12-31';
  const formatPossDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch(e) {
      return 'Dec 2026';
    }
  };
  const possessionDate = formatPossDate(rawPossDate);
  const progressPercent = buyerDetails?.construction_progress || 15;

  // Dynamic Journey Generation
  const formatShortDate = (d) => {
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  
  let userInquiry = (inquiries || []).find(i => i.name?.toLowerCase().includes(username?.toLowerCase()) || i.phone === username);
  let baseBookingDate = buyerDetails?.created_at ? new Date(buyerDetails.created_at) : new Date("2026-01-20");
  
  let inquiryDate = userInquiry?.created_at ? new Date(userInquiry.created_at) : new Date(baseBookingDate.getTime() - 10 * 24 * 60 * 60 * 1000);
  let siteVisitDate = new Date(inquiryDate.getTime() + 8 * 24 * 60 * 60 * 1000);
  if (siteVisitDate > baseBookingDate) siteVisitDate = new Date(baseBookingDate.getTime() - 2 * 24 * 60 * 60 * 1000);
  let agreementDate = new Date(baseBookingDate.getTime() + 8 * 24 * 60 * 60 * 1000);
  
  const now = new Date();
  
  const journeySteps = [
    { step: "Inquiry", date: formatShortDate(inquiryDate), status: inquiryDate <= now ? "completed" : "pending" },
    { step: "Site Visit", date: formatShortDate(siteVisitDate), status: siteVisitDate <= now ? "completed" : "pending" },
    { step: "Booking", date: formatShortDate(baseBookingDate), status: baseBookingDate <= now ? "completed" : "pending" },
    { step: "Agreement", date: formatShortDate(agreementDate), status: agreementDate <= now ? "completed" : "pending" },
    { step: "Construction", date: "In Progress", status: "active" },
    { step: "Possession", date: possessionDate, status: "pending" },
    { step: "Registration", date: "Upcoming", status: "pending" }
  ];

  // Helper to parse database values like '13', '14 cr', '2.50' to raw numbers
  const parseVal = (str) => {
    if (!str) return 0;
    if (typeof str === 'number') return str;
    const cleaned = str.replace(/[^\d.]/g, '');
    let num = parseFloat(cleaned) || 0;
    // Assume numbers <= 100 in database represent Crores
    if (num <= 100) {
      num = num * 10000000;
    }
    return num;
  };

  const totalNum = parseVal(buyerDetails?.total_amount) || 140000000; // default 14 Cr
  const paidNum = parseVal(buyerDetails?.amount_paid) || 25000000; // default 2.5 Cr
  const pendingNum = totalNum - paidNum;
  const paidPercentage = ((paidNum / totalNum) * 100).toFixed(2);

  const formatINR = (val) => {
    if (val >= 10000000) return '₹ ' + (val / 10000000).toFixed(2) + ' Cr';
    if (val >= 100000) return '₹ ' + (val / 100000).toFixed(2) + ' L';
    return '₹ ' + val.toLocaleString('en-IN');
  };

  const handleRazorpayPayment = (installmentName, amountInINR) => {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_paste_key_here';
    
    if (typeof window.Razorpay === 'undefined') {
      alert('Razorpay SDK failed to load. Please check your internet connection.');
      return;
    }

    const options = {
      key: keyId,
      amount: amountInINR * 100, // in paisa
      currency: "INR",
      name: "Vanya Residences",
      description: `Payment for ${installmentName} - Unit ${rawUnitId}`,
      image: "/images/hero_building_1777640070355.png",
      handler: async function (response) {
        alert(`Payment successful!\nPayment ID: ${response.razorpay_payment_id}`);
        try {
          const newAmountPaid = paidNum + amountInINR;
          const formattedAmountPaid = '₹ ' + (newAmountPaid / 10000000).toFixed(2) + ' Cr';
          
          const res = await fetch(`/api/buyers?username=${username}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount_paid: formattedAmountPaid
            })
          });
          const result = await res.json();
          if (result.success) {
            alert('Your dashboard payment status has been updated in real-time!');
            router.refresh();
            setTimeout(() => window.location.reload(), 300);
          } else {
            alert('Failed to save payment status to database.');
          }
        } catch (e) {
          alert('Error updating payment: ' + e.message);
        }
      },
      prefill: {
        name: username,
        email: `${username}@vanya.com`,
        contact: "9999999999"
      },
      theme: {
        color: "#113629"
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const getRelativeDateStr = (baseDate, monthsToAdd, targetDay) => {
    const d = new Date(baseDate.getTime());
    d.setMonth(d.getMonth() + monthsToAdd);
    if (targetDay) {
      d.setDate(targetDay);
    }
    return formatShortDate(d);
  };

  const bookingAmt = Math.round(totalNum * 0.10);
  const foundationAmt = Math.round(totalNum * 0.15);
  const slab1Amt = Math.round(totalNum * 0.15);
  const slab5Amt = Math.round(totalNum * 0.15);
  const slab12Amt = Math.round(totalNum * 0.15);
  const finishingAmt = totalNum - (bookingAmt + foundationAmt + slab1Amt + slab5Amt + slab12Amt);

  const installments = [
    { id: 1, inst: "Booking Amount", due: formatShortDate(baseBookingDate), amount: bookingAmt },
    { id: 2, inst: "1st Installment (Foundation)", due: getRelativeDateStr(baseBookingDate, 1, 25), amount: foundationAmt },
    { id: 3, inst: "2nd Installment (Slab 1)", due: getRelativeDateStr(baseBookingDate, 2, 25), amount: slab1Amt },
    { id: 4, inst: "3rd Installment (Slab 5)", due: getRelativeDateStr(baseBookingDate, 3, 25), amount: slab5Amt },
    { id: 5, inst: "4th Installment (Slab 12)", due: getRelativeDateStr(baseBookingDate, 4, 25), amount: slab12Amt },
    { id: 6, inst: "5th Installment (Finishing)", due: getRelativeDateStr(baseBookingDate, 6, 25), amount: finishingAmt }
  ];

  let cumulative = 0;
  const calculatedInstallments = installments.map((inst, index) => {
    cumulative += inst.amount;
    let status = 'upcoming';
    let paidAmt = 0;
    
    if (paidNum >= cumulative) {
      status = 'paid';
      paidAmt = inst.amount;
    } else {
      const prevCumulative = cumulative - inst.amount;
      if (paidNum > prevCumulative) {
        paidAmt = paidNum - prevCumulative;
      }
      const isFirstUnpaid = index === 0 || paidNum >= prevCumulative;
      status = isFirstUnpaid ? 'pending' : 'upcoming';
    }
    
    return {
      id: inst.id,
      inst: inst.inst,
      due: inst.due,
      dueAmt: formatINR(inst.amount),
      paidAmt: formatINR(paidAmt),
      status: status,
      rawAmount: inst.amount,
      rawPaid: paidAmt
    };
  });

  const paidReceipts = calculatedInstallments
    .filter(p => p.status === 'paid')
    .map(p => ({
      name: `Payment Receipt - ${p.inst.split(' (')[0]}`,
      type: "receipts",
      size: "1.2 MB",
      date: p.due
    }));

  const allDocuments = [
    { name: "Booking Agreement", type: "agreements", size: "2.4 MB", date: formatShortDate(baseBookingDate) },
    { name: "Builder Buyer Agreement", type: "agreements", size: "12.8 MB", date: formatShortDate(agreementDate) },
    ...paidReceipts,
    { name: "Allotment Letter", type: "legal", size: "3.5 MB", date: formatShortDate(agreementDate) },
    { name: "RERA Registration", type: "legal", size: "5.8 MB", date: formatShortDate(inquiryDate) },
    { name: "Project Brochure", type: "other", size: "15.4 MB", date: formatShortDate(inquiryDate) }
  ];

  const nextPendingInstallment = calculatedInstallments.find(p => p.status === 'pending') || {
    inst: "No Pending Dues",
    due: "N/A",
    dueAmt: "₹ 0",
    rawAmount: 0,
    rawPaid: 0
  };

  return (
    <div className="admin-layout" style={{ background: '#f8f9fb' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="admin-sidebar" style={{ background: '#ffffff', borderRight: '1px solid #f1f3f5', display: 'flex', flexDirection: 'column', width: '260px', overflowY: 'auto' }}>
        <div className="admin-sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem 1.75rem', borderBottom: '1px solid #f1f3f5' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c2a661" strokeWidth="2.5">
            <rect x="3" y="10" width="4" height="11" rx="1" fill="#c2a661" />
            <rect x="10" y="4" width="4" height="17" rx="1" fill="#113629" stroke="#113629" />
            <rect x="17" y="7" width="4" height="14" rx="1" fill="#c2a661" />
          </svg>
          <div>
            <h2 className="serif" style={{ margin: 0, fontSize: '1.15rem', color: '#113629', fontWeight: 'bold', letterSpacing: '0.5px', lineHeight: 1.1 }}>DreamSpaces</h2>
            <span style={{ fontSize: '0.58rem', color: '#c2a661', letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Buyer Portal</span>
          </div>
        </div>
        
        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #f1f3f5' }}>
          <strong style={{ fontSize: '0.82rem', color: '#113629', display: 'block', textTransform: 'capitalize' }}>{username}</strong>
          <span className="text-muted" style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }}>RESIDENT OWNER</span>
        </div>

        <nav className="admin-nav" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => changeTab('dashboard')}>
            <span className="nav-icon">📊</span> Dashboard
          </button>
          <button className={activeTab === 'my-flat' || activeTab === 'flat-details' ? 'active' : ''} onClick={() => changeTab('my-flat')}>
            <span className="nav-icon">🏠</span> My Flat
          </button>
          <button className={activeTab === 'payments' ? 'active' : ''} onClick={() => changeTab('payments')}>
            <span className="nav-icon">💳</span> Payments
          </button>
          <button className={activeTab === 'documents' ? 'active' : ''} onClick={() => changeTab('documents')}>
            <span className="nav-icon">📂</span> Documents
          </button>
          <button className={activeTab === 'construction' ? 'active' : ''} onClick={() => changeTab('construction')}>
            <span className="nav-icon">🏗️</span> Construction Updates
          </button>
          <button className={activeTab === 'amenities' ? 'active' : ''} onClick={() => changeTab('amenities')}>
            <span className="nav-icon">🌟</span> Amenities
          </button>
          <button className={activeTab === 'messages' ? 'active' : ''} onClick={() => changeTab('messages')}>
            <span className="nav-icon">✉️</span> Messages
          </button>
          <button className={activeTab === 'notifications' ? 'active' : ''} onClick={() => changeTab('notifications')}>
            <span className="nav-icon">🔔</span> Notifications
          </button>
          <button className={activeTab === 'support' ? 'active' : ''} onClick={() => changeTab('support')}>
            <span className="nav-icon">🛠️</span> Support
          </button>
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => changeTab('profile')}>
            <span className="nav-icon">👤</span> Profile
          </button>
          <button onClick={() => {
             document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
             document.cookie = "user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
             window.location.href = "/";
          }}>
            <span className="nav-icon">🚪</span> Logout
          </button>
        </nav>
        
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #f1f3f5' }}>
          <form action={async () => {
             document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
             document.cookie = "user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
             window.location.href = "/";
          }}>
            <button type="submit" className="btn-outline" style={{ width: '100%', cursor: 'pointer', borderColor: '#e5e7eb', color: '#4b5563' }}>LOGOUT</button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="admin-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '260px' }}>
        
        {/* HEADER BAR */}
        <header className="admin-header" style={{ background: 'white', padding: '1rem 2.5rem', borderBottom: '1px solid #f1f3f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="serif" style={{ fontSize: '1.35rem', margin: 0, color: '#113629', textTransform: 'capitalize' }}>Welcome back, {username}! 👋</h1>
            <p className="text-muted" style={{ margin: 0, fontSize: '0.68rem', letterSpacing: '0.5px' }}>UNIT ID: {unitId} • POSSESSION: {possessionDate}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#c2a661' }}>PROJECT SUITE</span>
            <select style={{ padding: '6px 12px', fontSize: '0.75rem', border: '1px solid #ccc', borderRadius: '6px', background: 'white' }}>
              <option>Skyview Tower A - {unitId}</option>
            </select>
          </div>
        </header>

        {/* ==================== 1. DASHBOARD (HOME) ==================== */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            
            {/* Horizontal Journey Timeline */}
            <div className="widget-card" style={{ marginBottom: '1.5rem', background: '#white' }}>
              <h4 className="serif" style={{ margin: '0 0 1.25rem 0', color: '#113629', fontSize: '1.1rem' }}>Your Journey</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', padding: '0 1rem' }}>
                <div style={{ position: 'absolute', top: '16px', left: '2rem', right: '2rem', height: '3px', background: '#e2e8f0', zIndex: 1 }}>
                  <div style={{ width: '68%', height: '100%', background: '#c2a661' }}></div>
                </div>
                {journeySteps.map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: s.status === 'completed' ? '#137333' : s.status === 'active' ? '#c2a661' : '#fff',
                      border: s.status === 'pending' ? '2px solid #cbd5e1' : 'none',
                      color: s.status === 'pending' ? '#64748b' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 'bold'
                    }}>
                      {s.status === 'completed' ? '✓' : s.status === 'active' ? '🏗️' : idx + 1}
                    </div>
                    <strong style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#113629' }}>{s.step}</strong>
                    <span className="text-muted" style={{ fontSize: '0.62rem', marginTop: '1px' }}>{s.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Main stats layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              
              {/* Left Column: Flat Details & Booking Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="widget-card" style={{ margin: 0 }}>
                  <h3 className="serif" style={{ margin: '0 0 1.25rem 0', color: '#113629', fontSize: '1.15rem' }}>Flat Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>PROJECT & TOWER</span>
                      <strong style={{ color: '#113629' }}>{towerName}, V-{userUnit.unit_id}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>TYPE</span>
                      <strong style={{ color: '#113629' }}>{userUnit.type}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>CARPET AREA</span>
                      <strong style={{ color: '#113629' }}>{userUnit.area} Sq.Ft.</strong>
                    </div>
                  </div>
                  <div style={{ marginTop: '1.5rem' }}>
                    <span onClick={() => changeTab('my-flat')} style={{ color: '#c2a661', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>View Flat Details &gt;</span>
                  </div>
                </div>

                <div className="widget-card" style={{ margin: 0 }}>
                  <h3 className="serif" style={{ margin: '0 0 1.25rem 0', color: '#113629', fontSize: '1.15rem' }}>Booking Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>BOOKING DATE</span>
                      <strong style={{ color: '#113629' }}>{formatShortDate(baseBookingDate)}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>BOOKING AMOUNT</span>
                      <strong style={{ color: '#113629' }}>{formatINR(bookingAmt)}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>BOOKING NO.</span>
                      <strong style={{ color: '#113629' }}>BK-{rawUnitId}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Payment Overview & Next Payment */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="widget-card" style={{ margin: 0 }}>
                  <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                    <h3 className="serif" style={{ margin: 0, color: '#113629', fontSize: '1.15rem' }}>Payment Overview</h3>
                    <span onClick={() => changeTab('payments')} style={{ color: '#c2a661', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}>View Payments &gt;</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f3f5', paddingBottom: '0.4rem' }}>
                      <span>Total Price:</span>
                      <strong>{formatINR(totalNum)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#137333', borderBottom: '1px solid #f1f3f5', paddingBottom: '0.4rem' }}>
                      <span>Paid Amount:</span>
                      <strong>{formatINR(paidNum)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c62828' }}>
                      <span>Pending Amount:</span>
                      <strong>{formatINR(pendingNum)}</strong>
                    </div>
                  </div>
                </div>

                <div className="widget-card" style={{ display: 'flex', flexDirection: 'column', margin: 0 }}>
                  <h3 className="serif" style={{ margin: '0 0 1.25rem 0', color: '#113629', fontSize: '1.15rem' }}>Next Payment</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>DUE DATE</span>
                      <strong style={{ color: '#113629' }}>{nextPendingInstallment.due}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>DUE AMOUNT</span>
                      <strong style={{ color: '#113629' }}>{nextPendingInstallment.dueAmt}</strong>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (nextPendingInstallment.rawAmount > 0) {
                        const unpaidAmt = nextPendingInstallment.rawAmount - nextPendingInstallment.rawPaid;
                        handleRazorpayPayment(nextPendingInstallment.inst, unpaidAmt);
                      } else {
                        alert("No pending payments due!");
                      }
                    }} 
                    className="btn-dark" 
                    style={{ width: '100%', height: '40px', background: '#D9A036', color: 'white', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 'bold', letterSpacing: '0.5px' }}
                  >
                    PAY NOW
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Row: Construction Progress & Latest Update */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="widget-card" style={{ margin: 0 }}>
                <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                  <h3 className="serif" style={{ margin: 0, color: '#113629', fontSize: '1.15rem' }}>Construction Progress</h3>
                  <span onClick={() => changeTab('construction')} style={{ color: '#c2a661', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}>View Updates &gt;</span>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <div className="flex-between" style={{ marginBottom: '0.5rem', fontSize: '0.82rem' }}>
                    <span>Overall Progress</span>
                    <strong>{progressPercent}%</strong>
                  </div>
                  <div style={{ background: '#f0f0f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ background: '#D9A036', width: `${progressPercent}%`, height: '100%' }}></div>
                  </div>
                  <span className="text-muted" style={{ display: 'block', fontSize: '0.68rem', marginTop: '1rem' }}>Last updated: 20 May 2026</span>
                </div>
              </div>

              <div className="widget-card" style={{ display: 'flex', gap: '1.25rem', padding: '1.25rem', margin: 0, alignItems: 'center' }}>
                <div style={{
                  backgroundImage: "url('/images/uc1.png')",
                  width: '120px',
                  height: '95px',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '8px',
                  flexShrink: 0
                }}></div>
                <div>
                  <h4 className="serif" style={{ margin: '0 0 0.25rem 0', color: '#113629', fontSize: '1rem' }}>Latest Update</h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#4b5563', lineHeight: 1.4 }}>Tower A - 12th Floor slab completed. Brickwork initiated in lower segments.</p>
                  <span className="text-muted" style={{ display: 'block', fontSize: '0.62rem', marginTop: '0.4rem' }}>PUBLISHED: 20 May 2026</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ==================== 2. MY FLAT PAGE ==================== */}
        {activeTab === 'my-flat' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
              
              {/* Flat Details visual Card (Left Side matching Screen 3) */}
              <div className="widget-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', margin: 0, padding: '1.5rem' }}>
                <div style={{
                  backgroundImage: "url('/images/hero_building_1777640070355.png')",
                  height: '240px',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '12px'
                }}></div>
                <div>
                  <h3 className="serif" style={{ margin: '0 0 0.5rem 0', color: '#113629', fontSize: '1.3rem' }}>{towerName}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.82rem', color: '#4b5563', borderTop: '1px solid #f1f3f5', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                    <div><strong>Flat Unit:</strong> V-{userUnit.unit_id}, {floorWithSuffix}</div>
                    <div><strong>Residence Design:</strong> {userUnit.type}</div>
                    <div><strong>Carpet Size:</strong> {userUnit.area} sq.ft.</div>
                    <div><strong>Super Built-up:</strong> {Math.round(parseInt(userUnit.area) * 1.12)} sq.ft.</div>
                    <div><strong>Vastu Orientation:</strong> East Facing Atrium</div>
                  </div>
                  <button onClick={() => changeTab('flat-details')} className="btn-dark" style={{ marginTop: '1.5rem', width: '100%', background: '#D9A036', border: 'none', height: '38px', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                    View Floor Plan &gt;
                  </button>
                </div>
              </div>

              {/* Accordion List (Right Side matching Screen 3) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { 
                    title: "Flat Information", 
                    content: (
                      <table className="table-standard" style={{ fontSize: '0.78rem' }}>
                        <tbody>
                          <tr><td><strong>Tower</strong></td><td>{towerName}</td></tr>
                          <tr><td><strong>Flat No.</strong></td><td>V-{userUnit.unit_id}</td></tr>
                          <tr><td><strong>Floor</strong></td><td>{floorWithSuffix}</td></tr>
                          <tr><td><strong>Unit Type</strong></td><td>{userUnit.type}</td></tr>
                          <tr><td><strong>Carpet Area</strong></td><td>{userUnit.area} Sq.Ft.</td></tr>
                          <tr><td><strong>Facing</strong></td><td>East Facing</td></tr>
                        </tbody>
                      </table>
                    )
                  },
                  { title: "Unit Plan & Layout", content: "Our premium 3 BHK design contains a master bedroom suite, double balconies, modular kitchen layouts, and utility spaces." },
                  { title: "3D Walkthrough", content: "A 3D virtual walkthrough represents typical fitouts, floor finishes, and interior styling options." },
                  { title: "Location in Tower", content: `Unit V-${userUnit.unit_id} enjoys direct sunrise views and garden layouts.` },
                  { title: "Specifications", content: "Standard fitouts include vitrified tile floorings, double-glazing windows, RERA-approved fire suppression, and smart locks." },
                  { 
                    title: "Price Breakup", 
                    content: `Base Value: ${userUnit.price}\nStamp Duty: ₹ 7.20 L\nGST: ₹ 2.80 L\nAmenities & Parking charges: ₹ 5.00 L`
                  }
                ].map((acc, index) => (
                  <div key={index} style={{ border: '1px solid #f1f3f5', borderRadius: '10px', overflow: 'hidden', background: '#white', boxShadow: '0 2px 5px rgba(0,0,0,0.01)' }}>
                    <button 
                      onClick={() => toggleAccordion(index)}
                      style={{
                        width: '100%',
                        padding: '1.1rem 1.25rem',
                        background: '#fff',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontWeight: 'bold',
                        color: '#113629',
                        fontSize: '0.85rem'
                      }}
                    >
                      <span>{acc.title}</span>
                      <span style={{ fontSize: '0.68rem', color: '#c2a661' }}>{selectedAccordion === index ? '▲' : '▼'}</span>
                    </button>
                    {selectedAccordion === index && (
                      <div style={{ padding: '1.25rem', background: '#fdfcf9', fontSize: '0.8rem', borderTop: '1px solid #f1f3f5', lineHeight: 1.5, color: '#4b5563' }}>
                        {typeof acc.content === 'string' ? <div style={{ whiteSpace: 'pre-line' }}>{acc.content}</div> : acc.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ==================== 3. FLAT DETAILS PAGE ==================== */}
        {activeTab === 'flat-details' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            <button onClick={() => changeTab('my-flat')} className="btn-outline" style={{ marginBottom: '1.5rem', padding: '6px 14px', borderColor: '#ccc', borderRadius: '6px', background: 'white' }}>← Back to My Flat</button>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="widget-card" style={{ margin: 0 }}>
                <h3 className="serif" style={{ margin: '0 0 1.25rem 0', color: '#113629' }}>Flat Information</h3>
                <table className="table-standard" style={{ fontSize: '0.82rem' }}>
                  <tbody>
                    <tr><td><strong>Tower</strong></td><td>{towerName}</td></tr>
                    <tr><td><strong>Flat No.</strong></td><td>V-{userUnit.unit_id}</td></tr>
                    <tr><td><strong>Floor</strong></td><td>{floorWithSuffix}</td></tr>
                    <tr><td><strong>Unit Type</strong></td><td>{userUnit.type}</td></tr>
                    <tr><td><strong>Carpet Area</strong></td><td>{userUnit.area} Sq.Ft.</td></tr>
                    <tr><td><strong>Built-up Area</strong></td><td>{Math.round(parseInt(userUnit.area) * 1.12)} Sq.Ft.</td></tr>
                    <tr><td><strong>Balcony Area</strong></td><td>{Math.round(parseInt(userUnit.area) * 0.12)} Sq.Ft.</td></tr>
                    <tr><td><strong>Facing</strong></td><td>East Facing</td></tr>
                    <tr><td><strong>Possession Date</strong></td><td>{possessionDate}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="widget-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', margin: 0 }}>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="serif" style={{ margin: 0, color: '#113629' }}>Unit Plan</h3>
                  <span onClick={() => alert('Opening schematic blueprint view...')} style={{ fontSize: '0.72rem', color: '#c2a661', fontWeight: 'bold', cursor: 'pointer' }}>View Full Screen &gt;</span>
                </div>
                <div style={{
                  backgroundImage: "url('/images/floor_plan_3bhk.png')",
                  width: '100%',
                  height: '240px',
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  border: '1px solid #f1f3f5',
                  borderRadius: '8px'
                }}></div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 4. PAYMENTS PAGE ==================== */}
        {activeTab === 'payments' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            
            {/* Top Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="kpi-card">
                <span>TOTAL PRICE</span>
                <h2 style={{ fontSize: '1.6rem', color: '#113629', margin: '4px 0' }}>{formatINR(totalNum)}</h2>
              </div>
              <div className="kpi-card">
                <span>PAID AMOUNT</span>
                <h2 style={{ fontSize: '1.6rem', color: '#137333', margin: '4px 0' }}>{formatINR(paidNum)}</h2>
              </div>
              <div className="kpi-card">
                <span>PENDING AMOUNT</span>
                <h2 style={{ fontSize: '1.6rem', color: '#c62828', margin: '4px 0' }}>{formatINR(pendingNum)}</h2>
              </div>
              
              {/* Circular SVG Percentage Ring */}
              <div className="kpi-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem' }}>
                <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                  <svg width="48" height="48" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f3f5" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#D9A036" strokeWidth="3.2" 
                      strokeDasharray={`${paidPercentage} ${100 - paidPercentage}`} strokeDashoffset="25" />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.62rem', fontWeight: 'bold', color: '#D9A036' }}>
                    {Math.round(paidPercentage)}%
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 'bold' }}>PAID PERCENTAGE</span>
                  <h2 style={{ fontSize: '1.35rem', color: '#113629', margin: '2px 0 0 0' }}>{paidPercentage}%</h2>
                </div>
              </div>
            </div>

            <div className="widget-card">
              <div className="flex-between mb-2" style={{ borderBottom: '1px solid #f1f3f5', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['schedule', 'history', 'upcoming'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setPaymentSubTab(t)}
                      className={`btn-outline ${paymentSubTab === t ? 'active' : ''}`}
                      style={{ padding: '6px 14px', fontSize: '0.72rem', textTransform: 'uppercase', borderRadius: '6px' }}
                    >
                      {t.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <table className="table-standard" style={{ marginTop: '1rem' }}>
                <thead>
                  <tr>
                    <th>INSTALLMENT</th>
                    <th>DUE DATE</th>
                    <th>DUE AMOUNT</th>
                    <th>PAID AMOUNT</th>
                    <th>STATUS</th>
                    <th>RECEIPT / ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedInstallments.filter(p => {
                    if (paymentSubTab === 'history') return p.status === 'paid';
                    if (paymentSubTab === 'upcoming') return p.status === 'pending' || p.status === 'upcoming';
                    return true; // schedule
                  }).map((p, idx) => (
                    <tr key={idx}>
                      <td><strong>{p.inst}</strong></td>
                      <td>{p.due}</td>
                      <td>{p.dueAmt}</td>
                      <td style={{ color: p.status === 'paid' ? '#137333' : '#333' }}>{p.paidAmt}</td>
                      <td>
                        <span className={`badge ${p.status === 'paid' ? 'available' : p.status === 'pending' ? 'negotiation' : 'reserved'}`}>
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {p.status === 'paid' ? (
                          <button onClick={() => alert('Downloading payment receipt pdf...')} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.65rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                            📥 Receipt
                          </button>
                        ) : p.status === 'pending' ? (
                          <button onClick={() => handleRazorpayPayment(p.inst, p.rawAmount - p.rawPaid)} className="btn-dark" style={{ padding: '4px 12px', fontSize: '0.65rem', borderRadius: '4px', background: '#D9A036', color: 'white', border: 'none', cursor: 'pointer' }}>PAY NOW</button>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Awaiting milestone completion</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button onClick={() => alert('Full scheduled ledger exported.')} className="btn-dark" style={{ padding: '10px 20px', borderRadius: '8px', background: '#D9A036', border: 'none', color: 'white', fontWeight: 'bold' }}>
                  View Full Payment Schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 5. DOCUMENTS PAGE ==================== */}
        {activeTab === 'documents' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            <div className="widget-card">
              <div className="flex-between mb-2" style={{ borderBottom: '1px solid #f1f3f5', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['all', 'legal', 'agreements', 'receipts', 'other'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setDocumentSubTab(t)}
                      className={`btn-outline ${documentSubTab === t ? 'active' : ''}`}
                      style={{ padding: '6px 14px', fontSize: '0.72rem', textTransform: 'uppercase', borderRadius: '6px' }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Documents grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginTop: '1.5rem' }}>
                {allDocuments.filter(d => {
                  if (documentSubTab === 'all') return true;
                  return d.type === documentSubTab;
                }).map((doc, idx) => (
                  <div key={idx} style={{ border: '1px solid #f1f3f5', borderRadius: '10px', padding: '1.25rem', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '2rem' }}>📄</span>
                      <button onClick={() => alert(`Downloading ${doc.name}...`)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.7 }}>📥</button>
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.8rem', display: 'block', color: '#113629' }}>{doc.name}</strong>
                      <span className="text-muted" style={{ fontSize: '0.68rem', display: 'block', marginTop: '2px' }}>PDF • {doc.size}</span>
                    </div>
                    <span className="text-muted" style={{ fontSize: '0.62rem', borderTop: '1px solid #eee', paddingTop: '0.5rem', marginTop: '0.25rem' }}>UPLOADED: {doc.date}</span>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                <button onClick={() => alert('Document request sent to concierge desk.')} className="btn-dark" style={{ padding: '10px 20px', borderRadius: '8px', background: '#D9A036', border: 'none', color: 'white', fontWeight: 'bold' }}>
                  Request Document
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 6. CONSTRUCTION UPDATES PAGE ==================== */}
        {activeTab === 'construction' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="widget-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: 0 }}>
                <span className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Overall Progress</span>
                <h2 style={{ fontSize: '3rem', color: '#113629', margin: '0.5rem 0', fontWeight: 'bold' }}>{progressPercent}%</h2>
                <div style={{ background: '#f1f3f5', height: '8px', width: '80%', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ background: '#D9A036', width: `${progressPercent}%`, height: '100%' }}></div>
                </div>
                <span className="text-muted" style={{ fontSize: '0.62rem', marginTop: '1rem' }}>Last updated: 20 May 2026</span>
              </div>

              <div className="widget-card" style={{ margin: 0 }}>
                <div className="flex-between mb-2">
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['photo', 'timeline', 'milestones'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setConstructionSubTab(t)}
                        className={`btn-outline ${constructionSubTab === t ? 'active' : ''}`}
                        style={{ padding: '6px 14px', fontSize: '0.72rem', textTransform: 'uppercase', borderRadius: '6px' }}
                      >
                        {t.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {constructionSubTab === 'photo' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                    {[
                      { title: "12th Floor Slab Completed", date: "20 May 2026" },
                      { title: "10th Floor Slab Completed", date: "10 May 2026" },
                      { title: "8th Floor Slab Completed", date: "30 Apr 2026" }
                    ].map((upd, idx) => (
                      <div key={idx} style={{ border: '1px solid #f1f3f5', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ backgroundImage: "url('/images/uc1.png')", height: '110px', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                        <div style={{ padding: '8px 10px' }}>
                          <strong style={{ fontSize: '0.75rem', display: 'block', color: '#113629' }}>{upd.title}</strong>
                          <span className="text-muted" style={{ fontSize: '0.62rem', display: 'block', marginTop: '2px' }}>{upd.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {constructionSubTab === 'timeline' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', fontSize: '0.8rem', color: '#4b5563' }}>
                    <div><strong>May 2026:</strong> 12th Floor Slab Completed, brickwork initiation.</div>
                    <div><strong>April 2026:</strong> 8th and 9th Floor plumbing and electrical conduits.</div>
                    <div><strong>March 2026:</strong> Foundation waterproofing completion.</div>
                  </div>
                )}

                {constructionSubTab === 'milestones' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', fontSize: '0.8rem' }}>
                    <div className="flex-between"><span>Foundation Slabs</span><span className="badge available">Completed</span></div>
                    <div className="flex-between"><span>Structure Towers</span><span className="badge negotiation">In Progress</span></div>
                    <div className="flex-between"><span>Interior Fitouts</span><span className="badge reserved">Pending</span></div>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button onClick={() => alert('Full construction photo log downloaded.')} className="btn-dark" style={{ padding: '10px 20px', borderRadius: '8px', background: '#D9A036', border: 'none', color: 'white', fontWeight: 'bold' }}>
                View All Updates
              </button>
            </div>
          </div>
        )}

        {/* ==================== 7. AMENITIES PAGE ==================== */}
        {activeTab === 'amenities' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            <div className="widget-card">
              <h3 className="serif" style={{ margin: '0 0 0.25rem 0', color: '#113629', fontSize: '1.3rem' }}>World-Class Amenities</h3>
              <p className="text-muted" style={{ fontSize: '0.78rem', marginBottom: '2rem' }}>Sleek modular layouts designed for a premium lifestyle.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                {[
                  { name: "Club House", icon: "🏛️" },
                  { name: "Swimming Pool", icon: "🏊" },
                  { name: "Gymnasium", icon: "🏋️" },
                  { name: "Kids Play Area", icon: "🧸" },
                  { name: "Landscaped Garden", icon: "🌳" },
                  { name: "Multipurpose Hall", icon: "🎪" },
                  { name: "Indoor Games", icon: "🎱" },
                  { name: "Yoga Deck", icon: "🧘" },
                  { name: "Jogging Track", icon: "🏃" },
                  { name: "24x7 Security", icon: "🛡️" },
                  { name: "Power Backup", icon: "⚡" },
                  { name: "Parking Atrium", icon: "🚗" }
                ].map((am, idx) => (
                  <div key={idx} style={{ border: '1px solid #f1f3f5', borderRadius: '12px', padding: '1.5rem 1.25rem', textAlign: 'center', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '2rem' }}>{am.icon}</span>
                    <strong style={{ fontSize: '0.82rem', color: '#113629' }}>{am.name}</strong>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                <button onClick={() => alert('Booking system simulated.')} className="btn-dark" style={{ padding: '10px 20px', borderRadius: '8px', background: '#D9A036', border: 'none', color: 'white', fontWeight: 'bold' }}>
                  View All Amenities
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 8. MESSAGES PAGE ==================== */}
        {activeTab === 'messages' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', height: '450px' }}>
              
              {/* Sidebar chats threads */}
              <div className="widget-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', margin: 0 }}>
                <h4 className="serif" style={{ margin: '0 0 1rem 0', color: '#113629', fontSize: '1rem' }}>Conversations</h4>
                
                <button 
                  onClick={() => setActiveChatThread('team')}
                  className={`btn-outline ${activeChatThread === 'team' ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '10px', width: '100%', textAlign: 'left', border: 'none', borderRadius: '8px' }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#113629', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>DS</div>
                  <div>
                    <strong style={{ fontSize: '0.8rem', display: 'block' }}>DreamSpaces Team</strong>
                    <span style={{ fontSize: '0.62rem', color: '#888' }}>Concierge Support</span>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveChatThread('sales')}
                  className={`btn-outline ${activeChatThread === 'sales' ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '10px', width: '100%', textAlign: 'left', border: 'none', borderRadius: '8px' }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#c2a661', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>RM</div>
                  <div>
                    <strong style={{ fontSize: '0.8rem', display: 'block' }}>Rahul Mehta</strong>
                    <span style={{ fontSize: '0.62rem', color: '#888' }}>Sales Representative</span>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveChatThread('support')}
                  className={`btn-outline ${activeChatThread === 'support' ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '10px', width: '100%', textAlign: 'left', border: 'none', borderRadius: '8px' }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#9ca3af', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>CS</div>
                  <div>
                    <strong style={{ fontSize: '0.8rem', display: 'block' }}>Customer Support</strong>
                    <span style={{ fontSize: '0.62rem', color: '#888' }}>ERP Desk</span>
                  </div>
                </button>
              </div>

              {/* Active chat pane */}
              <div className="widget-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.25rem', margin: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #f1f3f5', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: activeChatThread === 'team' ? '#113629' : activeChatThread === 'sales' ? '#c2a661' : '#9ca3af', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {activeChatThread === 'team' ? 'DS' : activeChatThread === 'sales' ? 'RM' : 'CS'}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.85rem', display: 'block', color: '#113629' }}>
                      {activeChatThread === 'team' ? 'DreamSpaces Team' : activeChatThread === 'sales' ? 'Rahul Mehta' : 'Customer Support'}
                    </strong>
                    <span style={{ fontSize: '0.65rem', color: '#137333', fontWeight: 'bold' }}>● ONLINE</span>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #f1f3f5', padding: '1rem', borderRadius: '8px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {chatMessages[activeChatThread]?.map((m, idx) => (
                    <div key={idx} style={{ 
                      alignSelf: m.sender === 'buyer' ? 'flex-end' : 'flex-start', 
                      background: m.sender === 'buyer' ? '#D9A036' : '#fff', 
                      color: m.sender === 'buyer' ? 'white' : '#333', 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      maxWidth: '70%', 
                      fontSize: '0.8rem', 
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)' 
                    }}>
                      <div>{m.text}</div>
                      <span style={{ fontSize: '0.58rem', opacity: 0.7, display: 'block', textAlign: 'right', marginTop: '4px' }}>{m.time}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <input type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Type your message..." style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.82rem' }} />
                  <button type="submit" className="btn-dark" style={{ padding: '8px 16px', fontSize: '0.8rem', background: '#113629', border: 'none', color: 'white', borderRadius: '6px' }}>SEND</button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* ==================== 9. NOTIFICATIONS PAGE ==================== */}
        {activeTab === 'notifications' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            <div className="widget-card">
              <div className="flex-between mb-2" style={{ borderBottom: '1px solid #f1f3f5', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <h3 className="serif" style={{ margin: 0, color: '#113629' }}>Notifications</h3>
                <span onClick={() => alert('All notifications marked as read.')} style={{ color: '#D9A036', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}>Mark all as read</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { text: `Your payment of ₹ 5,00,000 has been received.`, sub: "Payment receipt updated in Documents", date: "20 May 2026, 10:30 AM" },
                  { text: "Construction update for Tower A is available.", sub: "Check photo log under Construction tab", date: "20 May 2026, 04:30 PM" },
                  { text: "Your document [Payment Receipt - Mar] is uploaded.", sub: "Agreements and Receipts folder", date: "15 May 2026, 11:20 AM" },
                  { text: "Upcoming payment of ₹ 2,45,000 is due on 25 May 2026.", sub: "Instalment schedule 4th stage", date: "10 May 2026, 09:00 AM" },
                  { text: "Site visit scheduled on 25 May 2026 at 11:00 AM.", sub: "Accompanied by Rahul Mehta (Sales Rep)", date: "09 May 2026, 05:30 PM" }
                ].map((notif, idx) => (
                  <div key={idx} style={{ padding: '1rem', background: idx < 2 ? '#faf6eb' : '#fff', borderLeft: idx < 2 ? '4px solid #D9A036' : '4px solid #eee', borderRadius: '6px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '8px', height: '8px', background: idx < 2 ? '#D9A036' : 'transparent', borderRadius: '50%' }}></div>
                    <div>
                      <strong>{notif.text}</strong>
                      <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '2px' }}>{notif.sub} • {notif.date}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <span onClick={() => alert('Showing all historical notifications')} style={{ color: '#D9A036', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>View All Notifications</span>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 10. SUPPORT PAGE ==================== */}
        {activeTab === 'support' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 className="serif" style={{ fontSize: '2rem', color: '#113629', margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>Support</h1>
              <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>We are here to help you</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="kpi-card" style={{ cursor: 'pointer', textAlign: 'center', padding: '1.25rem' }} onClick={() => alert('Opening ticket raising window...')}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>🎫</span>
                <strong style={{ fontSize: '0.85rem', color: '#113629' }}>Raise a Ticket</strong>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.65rem', marginTop: '4px' }}>Create a request and our team will assist you</span>
              </div>
              <div className="kpi-card" style={{ cursor: 'pointer', textAlign: 'center', padding: '1.25rem' }} onClick={() => alert('View FAQ list.')}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>❓</span>
                <strong style={{ fontSize: '0.85rem', color: '#113629' }}>FAQ</strong>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.65rem', marginTop: '4px' }}>Find answers to frequently asked questions</span>
              </div>
              <div className="kpi-card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📞</span>
                <strong style={{ fontSize: '0.85rem', color: '#113629' }}>Call Us</strong>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#c2a661', marginTop: '4px' }}>+91 98765 43210</strong>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.65rem', marginTop: '4px' }}>Mon - Sat (10 AM - 7 PM)</span>
              </div>
              <div className="kpi-card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>✉️</span>
                <strong style={{ fontSize: '0.85rem', color: '#113629' }}>Email Us</strong>
                <strong style={{ display: 'block', fontSize: '0.82rem', color: '#c2a661', marginTop: '4px' }}>support@dreamspaces.com</strong>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.65rem', marginTop: '4px' }}>We reply within 24 hrs</span>
              </div>
            </div>

            <div className="widget-card">
              <h3 className="serif" style={{ margin: '0 0 1.25rem 0', color: '#113629' }}>My Tickets</h3>
              <table className="table-standard">
                <thead>
                  <tr>
                    <th>TICKET ID</th>
                    <th>DESCRIPTION</th>
                    <th>CREATED DATE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: "#DB-1021", title: "Payment not reflected", date: "20 May 2026", status: "Open" },
                    { id: "#DB-9984", title: "RERA carpet size verification", date: "15 Apr 2026", status: "Closed" }
                  ].map((t, idx) => (
                    <tr key={idx}>
                      <td><strong>{t.id}</strong></td>
                      <td>{t.title}</td>
                      <td>{t.date}</td>
                      <td>
                        <span className={`badge ${t.status === 'Open' ? 'negotiation' : 'available'}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <span onClick={() => alert('Opening ticket list ledger...')} style={{ color: '#D9A036', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>View All Tickets</span>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 11. PROFILE PAGE ==================== */}
        {activeTab === 'profile' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
              
              {/* Profile fields */}
              <div className="widget-card" style={{ margin: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #f1f3f5', paddingBottom: '1.5rem' }}>
                  <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: '#e5f5ea',
                    color: '#113629',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    fontFamily: "'Playfair Display', serif",
                    marginBottom: '0.75rem'
                  }}>{username.charAt(0).toUpperCase()}</div>
                  <h3 className="serif" style={{ margin: 0, color: '#113629', fontSize: '1.25rem', textTransform: 'capitalize' }}>{username}</h3>
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>{emailAddress}</span>
                </div>

                <h3 className="serif" style={{ margin: '0 0 1.25rem 0', color: '#113629', fontSize: '1.1rem' }}>Personal Information</h3>
                
                {profileMsg && (
                  <div style={{ background: '#e6f4ea', color: '#137333', padding: '8px 12px', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.78rem' }}>
                    {profileMsg}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fafafa', paddingBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>FULL NAME</span>
                      <strong style={{ color: '#113629', textTransform: 'capitalize' }}>{username}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fafafa', paddingBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>MOBILE NUMBER</span>
                      {isEditing ? (
                        <input type="text" value={mobileNum} onChange={(e) => setMobileNum(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.8rem', width: '200px' }} />
                      ) : (
                        <span>{mobileNum}</span>
                      )}
                    </div>
                    {!isEditing ? (
                      <span onClick={() => setIsEditing(true)} style={{ color: '#D9A036', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Edit</span>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fafafa', paddingBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>EMAIL ADDRESS</span>
                      {isEditing ? (
                        <input type="email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.8rem', width: '200px' }} />
                      ) : (
                        <span>{emailAddress}</span>
                      )}
                    </div>
                    {!isEditing ? (
                      <span onClick={() => setIsEditing(true)} style={{ color: '#D9A036', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Edit</span>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fafafa', paddingBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>RESIDENCE ADDRESS</span>
                      {isEditing ? (
                        <input type="text" value={addressVal} onChange={(e) => setAddressVal(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.8rem', width: '90%' }} />
                      ) : (
                        <span>{addressVal}</span>
                      )}
                    </div>
                    {!isEditing ? (
                      <span onClick={() => setIsEditing(true)} style={{ color: '#D9A036', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Edit</span>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fafafa', paddingBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>PAN NUMBER</span>
                      {isEditing ? (
                        <input type="text" value={panNumber} onChange={(e) => setPanNumber(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.8rem', width: '200px' }} />
                      ) : (
                        <span>{panNumber}</span>
                      )}
                    </div>
                    {!isEditing ? (
                      <span onClick={() => setIsEditing(true)} style={{ color: '#D9A036', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Edit</span>
                    ) : null}
                  </div>

                  {isEditing && (
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setProfileMsg('Profile information updated successfully!');
                        setTimeout(() => setProfileMsg(''), 3000);
                      }} 
                      className="btn-dark" 
                      style={{ width: 'fit-content', padding: '8px 16px', fontSize: '0.75rem', background: '#D9A036', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}
                    >
                      SAVE CHANGES
                    </button>
                  )}
                </div>
              </div>

              {/* Change Password Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="widget-card" style={{ margin: 0 }}>
                  <h3 className="serif" style={{ margin: '0 0 1.25rem 0', color: '#113629', fontSize: '1.1rem' }}>Change Password</h3>
                  
                  {passwordMsg && (
                    <div style={{ background: '#fce8e6', color: '#c5221f', padding: '8px 12px', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.78rem' }}>
                      {passwordMsg}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.72rem', color: '#6b7280' }}>Current Password</label>
                      <input type="password" value={currPass} onChange={(e) => setCurrPass(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.72rem', color: '#6b7280' }}>New Password</label>
                      <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.72rem', color: '#6b7280' }}>Confirm Password</label>
                      <input type="password" value={confPass} onChange={(e) => setConfPass(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                    </div>
                    <button 
                      onClick={() => {
                        setCurrPass('');
                        setNewPass('');
                        setConfPass('');
                        setPasswordMsg('Current password matches verified user.');
                        setTimeout(() => setPasswordMsg(''), 3000);
                      }} 
                      className="btn-dark" 
                      style={{ width: '100%', padding: '10px', fontSize: '0.75rem', background: '#113629', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      UPDATE PASSWORD
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
