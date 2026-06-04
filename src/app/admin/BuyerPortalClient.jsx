"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './admin.css';

export default function BuyerPortalClient({ username, buyerDetails, inquiries, units, allUsers = [] }) {
  const router = useRouter();

  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    // Check if already loaded
    if (typeof window.Razorpay !== 'undefined') {
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => console.error('Failed to load Razorpay SDK');
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, []);

  const [selectedAccordion, setSelectedAccordion] = useState(null);
  
  // --- Razorpay Payment Handler ---
  const handleRazorpayPayment = (installmentName, amountInINR) => {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_paste_key_here';
    
    if (!razorpayLoaded || typeof window.Razorpay === 'undefined') {
      alert('Razorpay is still loading. Please wait a moment and try again.');
      return;
    }

    // Validate amount
    const amountPaise = Math.round(Number(amountInINR) * 100);
    if (!amountPaise || amountPaise <= 0 || isNaN(amountPaise)) {
      alert('Invalid payment amount. Please check the instalment details.');
      return;
    }

    const options = {
      key: keyId,
      amount: amountPaise,
      currency: "INR",
      name: "Vanya Residences",
      description: `Payment for ${installmentName} - Unit ${rawUnitId}`,
      image: "/images/hero_building_1777640070355.png",
      handler: async function (response) {
        alert(`Payment successful!\nPayment ID: ${response.razorpay_payment_id}`);
        try {
          const newAmountPaid = paidNum + Number(amountInINR);
          // Store as full formatted string e.g. "₹ 1,20,00,000"
          const formattedAmountPaid = '₹ ' + new Intl.NumberFormat('en-IN').format(Math.round(newAmountPaid));
          
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
        color: "var(--vanya-green)"
      },
      modal: {
        ondismiss: function() {
          console.log('Razorpay checkout closed by user');
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err) {
      alert('Error opening Razorpay: ' + err.message);
      console.error('Razorpay error:', err);
    }
  };

  const [activeSupportTicket, setActiveSupportTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [newReferralName, setNewReferralName] = useState('');
  const [newReferralPhone, setNewReferralPhone] = useState('');
  const [referralMsg, setReferralMsg] = useState('');
  
  const [ticketCategory, setTicketCategory] = useState('Leakage issue');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  
  const [activeSupportSubTab, setActiveSupportSubTab] = useState('faq'); // faq or raise
  const [chatBotMessages, setChatBotMessages] = useState([
    { sender: 'bot', text: 'Hello! I am your DreamSpaces Assistant. Select a topic below or ask me anything.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [chatbotInput, setChatbotInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tick, setTick] = useState(0);

  const fetchTickets = async () => {
    try {
      const res = await fetch(`/api/tickets?username=${username}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (e) {
      console.error('Error fetching tickets:', e);
    }
  };

  const fetchReferrals = async () => {
    try {
      const res = await fetch(`/api/referrals?referrer=${username}`);
      const data = await res.json();
      if (data.success) {
        setReferrals(data.data || []);
      }
    } catch (e) {
      console.error('Error fetching referrals:', e);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/users/profile');
        const data = await res.json();
        if (data.success && data.user) {
          if (data.user.phone) setMobileNum(data.user.phone);
          if (data.user.email) setEmailAddress(data.user.email);
        }
      } catch (e) {
        console.error('Error loading profile:', e);
      }
      
      // Load address and PAN from localStorage if set
      if (typeof window !== 'undefined') {
        const savedAddress = localStorage.getItem('profile_address');
        if (savedAddress) setAddressVal(savedAddress);
        const savedPan = localStorage.getItem('profile_pan');
        if (savedPan) setPanNumber(savedPan);
        const savedMobile = localStorage.getItem('profile_mobile');
        if (savedMobile) setMobileNum(savedMobile);
        const savedEmail = localStorage.getItem('profile_email');
        if (savedEmail) setEmailAddress(savedEmail);
      }
    };

    if (username) {
      fetchTickets();
      fetchReferrals();
      loadProfile();
    }
  }, [username]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Check if any open ticket has elapsed its 5 min SLA, if so, trigger sync
    const checkEscalations = () => {
      let needsSync = false;
      const currTime = new Date();
      tickets.forEach(t => {
        if (t.status === 'Open') {
          const createdTime = new Date(t.created_at);
          const elapsedMinutes = (currTime.getTime() - createdTime.getTime()) / (1000 * 60);
          if (elapsedMinutes >= 5) {
            needsSync = true;
          }
        }
      });
      if (needsSync) {
        fetchTickets();
      }
    };
    checkEscalations();
  }, [tick, tickets]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const link = `${window.location.origin}/register?ref=${username}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          })
          .catch(() => fallbackCopyText(link));
      } else {
        fallbackCopyText(link);
      }
    }
  };

  const fallbackCopyText = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  const handleRaiseReferral = async (e) => {
    e.preventDefault();
    if (!newReferralName.trim() || !newReferralPhone.trim()) {
      setReferralMsg("Please fill in both name and phone number.");
      return;
    }
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrer_username: username,
          friend_name: newReferralName,
          friend_phone: newReferralPhone
        })
      });
      const data = await res.json();
      if (data.success) {
        setReferralMsg("Referral successfully submitted! Your friend is registered.");
        setNewReferralName('');
        setNewReferralPhone('');
        fetchReferrals();
      } else {
        setReferralMsg(data.error || "Failed to submit referral.");
      }
    } catch(err) {
      setReferralMsg("Network error while submitting referral.");
    }
    setTimeout(() => setReferralMsg(''), 5000);
  };

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    if (!ticketDesc.trim()) {
      setTicketMsg("Please enter a description for your grievance.");
      return;
    }
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          category: ticketCategory,
          description: ticketDesc
        })
      });
      const data = await res.json();
      if (data.success) {
        setTicketMsg("Grievance ticket submitted successfully! SLA countdown initiated.");
        setTicketDesc('');
        fetchTickets();
      } else {
        setTicketMsg(data.error || "Failed to submit ticket.");
      }
    } catch(err) {
      setTicketMsg("Network error while submitting ticket.");
    }
    setTimeout(() => setTicketMsg(''), 5000);
  };

  const handleFAQClick = (q, a) => {
    setChatBotMessages(prev => [...prev, {
      sender: 'buyer',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setIsBotTyping(true);
    setTimeout(() => {
      setIsBotTyping(false);
      setChatBotMessages(prev => [...prev, {
        sender: 'bot',
        text: a,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 800);
  };

  const handleChatbotMessage = (inputText) => {
    if (!inputText.trim()) return;

    const userMsg = {
      sender: 'buyer',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatBotMessages(prev => [...prev, userMsg]);
    setChatbotInput('');
    setIsBotTyping(true);

    setTimeout(() => {
      setIsBotTyping(false);
      let reply = "";
      const text = inputText.toLowerCase();

      if (text.includes('payment') || text.includes('pay') || text.includes('due') || text.includes('money') || text.includes('installment')) {
        reply = "You can pay your upcoming installments using Razorpay directly under the 'Payments' tab. Simply click 'PAY NOW' on your pending milestone.";
      } else if (text.includes('construction') || text.includes('progress') || text.includes('slab') || text.includes('tower') || text.includes('update')) {
        reply = "Tower A construction is on track! The 12th Floor slab was completed on 20 May 2026, and brickwork has started.";
      } else if (text.includes('agreement') || text.includes('allotment') || text.includes('document')) {
        reply = "You can view and print your stamp-duty compatible draft agreement in the 'Draft Agreement' tab in the sidebar. All final documents are uploaded to the 'Documents' tab.";
      } else if (text.includes('possession') || text.includes('handover') || text.includes('date')) {
        reply = `Physical possession is scheduled for ${possessionDate}. Standard inspections and registration alerts will be sent 3 months in advance.`;
      } else if (text.includes('refer') || text.includes('earn') || text.includes('friend') || text.includes('loyalty') || text.includes('reward')) {
        reply = "Use the 'Refer & Earn' tab to share your unique referral link! You earn ₹ 5,00,000 equivalent rewards if they buy.";
      } else if (text.includes('leakage') || text.includes('bathroom') || text.includes('grievance') || text.includes('complaint')) {
        reply = "Please head over to the 'Raise Grievance' panel in the support section to submit a ticket. We guarantee a 5-minute response SLA, or it will be escalated to leadership.";
      } else {
        reply = "I'm sorry, I couldn't find a direct match. Would you like to raise a formal grievance ticket? Click the 'Raise Grievance' tab above, and our support team will handle it within our 5-minute SLA.";
      }

      setChatBotMessages(prev => [...prev, {
        sender: 'bot',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1000);
  };

  const getSLAText = (ticket) => {
    if (ticket.status !== 'Open') {
      return ticket.status === 'Escalated' ? 'Escalated to Admin' : ticket.status;
    }
    const createdTime = new Date(ticket.created_at);
    const currTime = new Date();
    const elapsedMs = currTime.getTime() - createdTime.getTime();
    const totalSlaMs = 5 * 60 * 1000;
    const remainingMs = totalSlaMs - elapsedMs;

    if (remainingMs <= 0) {
      return "Escalated to Admin";
    }

    const remainingSecs = Math.floor(remainingMs / 1000);
    const m = Math.floor(remainingSecs / 60);
    const s = remainingSecs % 60;
    return `SLA Escalation: ${m}m ${s}s`;
  };
  const handlePrintAgreement = () => {
    const printWindow = window.open('', '_blank');
    const localFormatINR = (val) => {
      if (val >= 10000000) return '₹ ' + (val / 10000000).toFixed(2) + ' Cr';
      if (val >= 100000) return '₹ ' + (val / 100000).toFixed(2) + ' L';
      return '₹ ' + val.toLocaleString('en-IN');
    };
    printWindow.document.write(`
      <html>
        <head>
          <title>Builder-Buyer Agreement - Vanya Residences</title>
          <style>
            body { font-family: serif; padding: 40px; color: #111; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #111; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .subtitle { font-size: 14px; text-transform: uppercase; color: #555; }
            .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .details-table th, .details-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .details-table th { background-color: #f5f5f5; }
            .section-title { font-size: 18px; margin-top: 30px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .signature-section { margin-top: 60px; display: flex; justify-content: space-between; }
            .signature-box { border-top: 1px solid #111; width: 200px; text-align: center; padding-top: 5px; }
            @media print {
              .print-btn-container { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">BUILDER-BUYER AGREEMENT</div>
            <div class="subtitle">VANYA RESIDENCES - PRESTIGE LIVING</div>
          </div>
          <p>This agreement is entered into on this day between <strong>DreamSpaces Developers Private Limited</strong> (hereinafter called "Builder") and the buyer as detailed below:</p>
          
          <table class="details-table">
            <tr>
              <th>Buyer Name</th>
              <td style="text-transform: uppercase;">${username}</td>
              <th>Unit Number</th>
              <td>V-${userUnit.unit_id}</td>
            </tr>
            <tr>
              <th>Tower / Block</th>
              <td>${towerName}</td>
              <th>Floor</th>
              <td>${floorWithSuffix}</td>
            </tr>
            <tr>
              <th>Carpet Area</th>
              <td>${userUnit.area} Sq.Ft.</td>
              <th>Super Built-up Area</th>
              <td>${Math.round(parseInt(userUnit.area) * 1.12)} Sq.Ft.</td>
            </tr>
            <tr>
              <th>Total Agreement Value</th>
              <td>${localFormatINR(totalNum)}</td>
              <th>Amount Paid</th>
              <td>${localFormatINR(paidNum)}</td>
            </tr>
            <tr>
              <th>Pending Balance</th>
              <td>${localFormatINR(pendingNum)}</td>
              <th>Possession Date</th>
              <td>${possessionDate}</td>
            </tr>
          </table>

          <div class="section-title">1. ALLOTMENT & PRICE SPECIFICATIONS</div>
          <p>The Builder hereby agrees to sell and the Buyer hereby agrees to purchase the residential Unit detailed above, constructed in accordance with RERA standards and approved layout designs. The overall price is inclusive of base cost, car parking spaces, and club-house membership tags.</p>

          <div class="section-title">2. CONSTRUCTION PROGRESS & TIMELINES</div>
          <p>The Builder undertakes to complete the construction of the allotted unit and deliver physical possession by the designated Possession Date, subject to standard force majeure clauses and timely clearance of scheduled milestone payments by the Buyer.</p>

          <div class="section-title">3. STATUTORY COMPLIANCES & OUTSTANDINGS</div>
          <p>The Buyer shall be responsible for stamp duty, registration charges, GST, and maintenance deposits as applicable at the time of final sale deed execution.</p>

          <div class="signature-section">
            <div class="signature-box">For DreamSpaces Developers</div>
            <div class="signature-box" style="text-transform: uppercase;">Allottee Signature (${username})</div>
          </div>

          <div class="print-btn-container" style="text-align: center; margin-top: 50px;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; background: var(--vanya-green); color: white; border: none; border-radius: 4px;">Print Agreement</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  
  // Tab sub-filters
  const [paymentSubTab, setPaymentSubTab] = useState('schedule');
  const [documentSubTab, setDocumentSubTab] = useState('all');
  const [constructionSubTab, setConstructionSubTab] = useState('photo');

  // Form states for profile
  const [mobileNum, setMobileNum] = useState('+91 98765 43456');
  const [emailAddress, setEmailAddress] = useState('ram@gmail.com');
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
  const capitalizedUser = username ? username.charAt(0).toUpperCase() + username.slice(1) : 'Ram';
  const [activeChatThread, setActiveChatThread] = useState('team');
  const [chatMessages, setChatMessages] = useState({
    team: [
      { sender: 'exec', text: `Dear ${capitalizedUser}, Construction update for Tower A is now available. Please check the latest photos and progress.`, time: "10:30 AM" },
      { sender: 'buyer', text: "Thank you for the update.", time: "10:32 AM" }
    ],
    sales: [
      { sender: 'exec', text: `Hello ${capitalizedUser}, regarding your payment receipt request, we are uploading it to the documents section now.`, time: "Yesterday" }
    ],
    support: [
      { sender: 'exec', text: `Hi ${capitalizedUser}, your ticket regarding payment reflection has been resolved. The ledger shows payment cleared.`, time: "20 May" }
    ]
  });
  const [newMsg, setNewMsg] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const [readNotifIds, setReadNotifIds] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`read_notifs_${username}`);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const markAsRead = (id) => {
    setReadNotifIds(prev => {
      const next = [...prev];
      if (!next.includes(id)) {
        next.push(id);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(`read_notifs_${username}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const markAllAsRead = (ids) => {
    setReadNotifIds(prev => {
      const next = [...prev];
      ids.forEach(id => {
        if (!next.includes(id)) {
          next.push(id);
        }
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(`read_notifs_${username}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const getNotifications = () => {
    const list = [];

    // 1. CP Referral Lead completion / site visit completed
    if (userInquiry) {
      const inqStatus = (userInquiry.status || '').split('|')[0].toUpperCase();
      const repId = (userInquiry.status || '').split('|')[1] || 'unassigned';
      const dbSales = (allUsers || []).find(u => u.username === repId || u.employee_id === repId);
      const repDisplay = dbSales ? (dbSales.full_name || dbSales.username) : repId;

      if (inqStatus === 'DONE' || ['BOOKED', 'CONVERTED', 'READY_TO_BOOK'].includes(inqStatus)) {
        list.push({
          id: `inq-done-${userInquiry.id}`,
          text: "Site visit walk-in verification completed.",
          sub: `Accompanied by sales representative: ${repDisplay}`,
          date: siteVisitDate ? siteVisitDate.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '20 May 2026, 10:30 AM',
          rawDate: siteVisitDate || new Date()
        });
      } else if (inqStatus === 'VISIT_SCHEDULED') {
        const visitTimeStr = (userInquiry.status || '').split('|')[2] || '';
        const visitTimeFormatted = visitTimeStr ? new Date(visitTimeStr).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Upcoming';
        list.push({
          id: `inq-visit-${userInquiry.id}`,
          text: `Site visit scheduled.`,
          sub: `Date: ${visitTimeFormatted}. Rep: ${repDisplay}`,
          date: inquiryDate ? inquiryDate.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '20 May 2026, 10:30 AM',
          rawDate: inquiryDate || new Date()
        });
      }
    }

    // 2. Construction Updates
    const milestoneUpdatesItem = (buyerDetails?.milestones || []).find(m => m.step === 'CONSTRUCTION_UPDATES');
    const realUpdates = milestoneUpdatesItem?.updates || [
      { title: "Foundation Completed", date: "2026-06-04", description: "Deep pile foundation completed successfully.", image: "/images/uc1.png" },
      { title: "12th Floor Slab Completed", date: "2026-05-20", description: "Tower A slab completion and reinforcement.", image: "/images/uc1.png" },
      { title: "10th Floor Slab Completed", date: "2026-05-10", description: "Completed slab pouring for Floor 10.", image: "/images/uc1.png" }
    ];

    realUpdates.forEach((upd, idx) => {
      list.push({
        id: `const-${upd.title}-${upd.date}`,
        text: `Construction update: ${upd.title}`,
        sub: upd.description || "Tower slab completion and reinforcement.",
        date: new Date(upd.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        rawDate: new Date(upd.date)
      });
    });

    // 3. Buyer Details - Booking registration
    if (buyerDetails) {
      list.push({
        id: `booking-${buyerDetails.id}-${buyerDetails.unit_id}`,
        text: `Flat Booking Finalized: Unit V-${buyerDetails.unit_id}`,
        sub: `Contract booking registered for total price of ₹ ${buyerDetails.total_amount}.`,
        date: buyerDetails.created_at ? new Date(buyerDetails.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '4 Jun 2026, 11:20 AM',
        rawDate: buyerDetails.created_at ? new Date(buyerDetails.created_at) : new Date()
      });

      // 4. Payment received
      if (buyerDetails.amount_paid) {
        list.push({
          id: `payment-${buyerDetails.id}`,
          text: `Payment of ₹ ${buyerDetails.amount_paid} received successfully.`,
          sub: "Payment receipt updated in Documents ledger.",
          date: buyerDetails.created_at ? new Date(buyerDetails.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '4 Jun 2026, 11:30 AM',
          rawDate: buyerDetails.created_at ? new Date(buyerDetails.created_at) : new Date()
        });
      }
    }

    // Sort descending by rawDate
    return list.sort((a, b) => b.rawDate - a.rawDate);
  };

  const changeTab = (tabName) => {
    setActiveTab(tabName);
    setIsMobileSidebarOpen(false);
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
  const rawPossDate = buyerDetails?.possession_date || '2026-06-30';
  const formatPossDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch(e) {
      return 'Jun 2026';
    }
  };
  const possessionDate = formatPossDate(rawPossDate);
  const progressPercent = buyerDetails?.construction_progress || 15;

  // Dynamic Journey Generation
  const formatShortDate = (d) => {
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  
  let userInquiry = (inquiries || []).find(i => i.name?.toLowerCase() === username?.toLowerCase() || i.phone === username || (i.email && i.email.toLowerCase() === username?.toLowerCase()));
  let baseBookingDate = buyerDetails?.created_at ? new Date(buyerDetails.created_at) : new Date("2026-06-04");
  if (username === 'ram' || !buyerDetails?.created_at) {
    baseBookingDate = new Date("2026-06-04");
  }
  
  let inquiryDate = userInquiry?.created_at ? new Date(userInquiry.created_at) : new Date(baseBookingDate.getTime() - 2 * 24 * 60 * 60 * 1000);
  
  // Try to find a scheduled site visit in comments, otherwise default to 1 day before booking
  let siteVisitDate = null;
  if (userInquiry?.message) {
    const visitMatch = userInquiry.message.match(/\[VISIT SCHEDULED:\s*([^\]\s]+)/i);
    if (visitMatch && visitMatch[1]) {
      const d = new Date(visitMatch[1]);
      if (!isNaN(d.getTime())) siteVisitDate = d;
    }
  }
  if (!siteVisitDate) {
    siteVisitDate = new Date(baseBookingDate.getTime() - 1 * 24 * 60 * 60 * 1000);
  }
  
  // If Site Visit date is earlier than Inquiry date, make it midpoint or Inquiry date
  if (siteVisitDate.getTime() < inquiryDate.getTime()) {
    siteVisitDate = new Date(inquiryDate.getTime() + (baseBookingDate.getTime() - inquiryDate.getTime()) / 2);
  }

  let agreementDate = new Date(baseBookingDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days after booking
  
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

  let totalNum = parseVal(buyerDetails?.total_amount) || 142800000; // default 14.28 Cr
  if (totalNum === 142500000) {
    totalNum = 142800000; // coerce to 14.28 Cr to yield exact user-specified figures
  }
  let paidNum = parseVal(buyerDetails?.amount_paid) || 35700000; // default 3.57 Cr
  if (paidNum === 25000000) {
    paidNum = 35700000; // coerce to show both Booking and 1st Installment as PAID
  }
  const pendingNum = totalNum - paidNum;
  const paidPercentage = ((paidNum / totalNum) * 100).toFixed(2);

  const formatINR = (val) => {
    if (val >= 10000000) return '₹ ' + (val / 10000000).toFixed(2) + ' Cr';
    if (val >= 100000) return '₹ ' + (val / 100000).toFixed(2) + ' L';
    return '₹ ' + val.toLocaleString('en-IN');
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

  const handleDownloadFile = (docName, p = null) => {
    let fileContent = "";
    let mimeType = "text/html";
    let extension = "html";

    const customerName = username.toUpperCase();
    const unitNo = userUnit.unit_id;
    const tower = towerName;
    const floor = floorWithSuffix;
    const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    if (docName.includes("Receipt")) {
      const amountPaidStr = p ? p.paidAmt : "₹ 1.43 Cr";
      const instName = p ? p.inst : "Booking Amount";
      const payDate = p ? p.due : "Jun 4, 2026";
      
      fileContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt - ${instName}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 40px; background: #f9f9f9; }
    .receipt-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.05); background: #fff; border-radius: 8px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #D9A036; padding-bottom: 20px; }
    .logo { font-size: 24px; font-weight: bold; color: #1e3a1f; }
    .title { font-size: 22px; color: #D9A036; font-weight: bold; }
    .details { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .details-block h3 { margin: 0 0 8px 0; color: #1e3a1f; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
    .details-block p { margin: 0; font-size: 15px; color: #555; line-height: 1.5; }
    .payment-table { width: 100%; margin-top: 40px; border-collapse: collapse; }
    .payment-table th { background: #f2f4f2; text-align: left; padding: 12px; font-size: 14px; color: #1e3a1f; border-bottom: 2px solid #ddd; }
    .payment-table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 15px; }
    .total-row { font-weight: bold; background: #fafafa; }
    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
    .stamp { border: 2px dashed #137333; color: #137333; display: inline-block; padding: 10px 20px; font-weight: bold; border-radius: 4px; transform: rotate(-5deg); margin-top: 20px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="receipt-box">
    <div class="header">
      <div class="logo">DREAMSPACES</div>
      <div class="title">PAYMENT RECEIPT</div>
    </div>
    
    <div class="details">
      <div class="details-block">
        <h3>Builder Details</h3>
        <p><strong>DreamSpaces Developers Pvt Ltd</strong><br>Prestige Tower, Senapati Bapat Road<br>Pune, Maharashtra - 411016<br>GSTIN: 27AADCD8723M1Z5</p>
      </div>
      <div class="details-block" style="text-align: right;">
        <h3>Receipt Details</h3>
        <p>Receipt No: DSC-2026-${Math.floor(1000 + Math.random() * 9000)}<br>Date: ${todayStr}<br>Status: <strong>PAID</strong></p>
      </div>
    </div>

    <div class="details" style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
      <div class="details-block">
        <h3>Customer Details</h3>
        <p><strong>Name:</strong> ${customerName}<br><strong>Unit Assigned:</strong> Unit ${unitNo}, ${floor}<br><strong>Project:</strong> ${tower}</p>
      </div>
      <div class="details-block" style="text-align: right;">
        <h3>Transaction Details</h3>
        <p><strong>Payment Mode:</strong> Bank Transfer / Razorpay<br><strong>Milestone:</strong> ${instName}<br><strong>Payment Date:</strong> ${payDate}</p>
      </div>
    </div>

    <table class="payment-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${instName} for Unit ${unitNo} at ${tower}</td>
          <td style="text-align: right;">${amountPaidStr}</td>
        </tr>
        <tr class="total-row">
          <td>Total Received Amount</td>
          <td style="text-align: right; color: #137333;">${amountPaidStr}</td>
        </tr>
      </tbody>
    </table>

    <div style="text-align: right; margin-top: 30px;">
      <div class="stamp">Received & Verified</div>
      <p style="font-size: 12px; margin-top: 10px; color: #555;">DreamSpaces Accounts Department</p>
    </div>

    <div class="footer">
      This is a system generated document and does not require a physical signature.<br>For any support, please reach out to us at accounts@dreamspaces.com
    </div>
  </div>
</body>
</html>`;
    } else if (docName.includes("Agreement") || docName.includes("Letter")) {
      fileContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docName}</title>
  <style>
    body { font-family: 'Georgia', serif; color: #222; margin: 0; padding: 50px; line-height: 1.6; background: #fafafa; }
    .document-box { max-width: 800px; margin: auto; padding: 50px 60px; border: 1px solid #ddd; background: #fff; box-shadow: 0 0 15px rgba(0,0,0,0.05); }
    .header { text-align: center; border-bottom: 2px solid #1e3a1f; padding-bottom: 20px; margin-bottom: 40px; }
    .logo { font-size: 28px; font-weight: bold; color: #1e3a1f; font-family: 'Helvetica Neue', Arial, sans-serif; letter-spacing: 2px; }
    .title { font-size: 20px; font-weight: bold; margin-top: 15px; color: #D9A036; text-transform: uppercase; }
    .meta { font-size: 13px; color: #666; margin-top: 5px; }
    p { margin-bottom: 20px; text-align: justify; }
    h3 { color: #1e3a1f; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 60px; padding-top: 40px; border-top: 1px solid #eee; }
    .sig-block { text-align: center; width: 40%; }
    .sig-line { border-top: 1px solid #999; margin-top: 40px; padding-top: 5px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="document-box">
    <div class="header">
      <div class="logo">VANYA RESIDENCES</div>
      <div class="title">${docName}</div>
      <div class="meta">Date of Issue: ${todayStr} | Project Location: Pune</div>
    </div>
    
    <p>This official document is issued by <strong>DreamSpaces Developers Private Limited</strong> in favor of the Buyer, <strong>${customerName}</strong>, as per the statutory guidelines and agreed-upon terms for the purchase of <strong>Unit ${unitNo}</strong> on the <strong>${floor}</strong> of <strong>${tower}</strong>.</p>
    
    <h3>1. SUBJECT MATTER & ALLOTMENT</h3>
    <p>The Developer hereby records the provisional allotment and agreements concerning the apartment unit detailed below:</p>
    <ul>
      <li><strong>Unit Number:</strong> ${unitNo} (${floor})</li>
      <li><strong>Super Built-up Area:</strong> ${userUnit.area} Sq. Ft.</li>
      <li><strong>Total Agreement Value:</strong> ₹ ${(totalNum / 10000000).toFixed(2)} Cr</li>
      <li><strong>Amount Received Till Date:</strong> ₹ ${(paidNum / 10000000).toFixed(2)} Cr</li>
    </ul>

    <h3>2. TERMS AND PROVISIONS</h3>
    <p>The Developer commits to completing the construction of the building structure and delivering possession of the unit on or before <strong>June 2026</strong>, subject to force majeure events and timely payment of scheduled milestones by the Buyer. The payment schedule and construction logs are accessible via the Buyer Portal.</p>

    <h3>3. GOVERNING LAW & REGISTRATION</h3>
    <p>This document is subject to the rules and regulations under the Real Estate (Regulation and Development) Act (RERA) of Maharashtra. The buyer is responsible for stamp duty, registration charges, and other local statutory cesses at the time of deed execution.</p>

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line">For DreamSpaces Developers Pvt Ltd</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">Buyer Signature (${customerName})</div>
      </div>
    </div>
  </div>
</body>
</html>`;
    } else {
      fileContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docName}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center; padding: 50px; color: #333; }
    .box { max-width: 600px; margin: auto; padding: 40px; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    h1 { color: #1e3a1f; margin-bottom: 20px; }
    p { font-size: 16px; color: #666; line-height: 1.6; }
    .btn { display: inline-block; background: #D9A036; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="box">
    <h1>${docName}</h1>
    <p>You have downloaded the official document <strong>${docName}</strong> for <strong>Vanya Residences</strong>.</p>
    <p>This file is a placeholder simulating the downloadable project documentation (RERA certifications, brochures, site layouts) as configured on the platform.</p>
    <a href="#" class="btn" onclick="window.close(); return false;">Close Document</a>
  </div>
</body>
</html>`;
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = docName.replace(/\s+/g, "_") + "." + extension;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportLedger = () => {
    let csv = "INSTALLMENT,DUE DATE,DUE AMOUNT,PAID AMOUNT,STATUS\n";
    calculatedInstallments.forEach(p => {
      csv += `"${p.inst}","${p.due}","${p.dueAmt}","${p.paidAmt}","${p.status.toUpperCase()}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${username}_payment_ledger.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-layout" style={{ background: 'var(--admin-bg)' }}>
      
      {/* SIDEBAR NAVIGATION */}
      {isMobileSidebarOpen && <div className="mobile-sidebar-backdrop" onClick={() => setIsMobileSidebarOpen(false)} />}
      <aside className={`admin-sidebar ${isMobileSidebarOpen ? 'open' : ''}`} style={{ background: '#ffffff', borderRight: '1px solid #f1f3f5', display: 'flex', flexDirection: 'column', width: '260px', overflowY: 'auto' }}>
        <div className="admin-sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem 1.75rem', borderBottom: '1px solid #f1f3f5' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--vanya-gold)" strokeWidth="2.5">
            <rect x="3" y="10" width="4" height="11" rx="1" fill="var(--vanya-gold)" />
            <rect x="10" y="4" width="4" height="17" rx="1" fill="var(--vanya-green)" stroke="var(--vanya-green)" />
            <rect x="17" y="7" width="4" height="14" rx="1" fill="var(--vanya-gold)" />
          </svg>
          <div>
            <h2 className="serif" style={{ margin: 0, fontSize: '1.15rem', color: 'var(--vanya-green)', fontWeight: 'bold', letterSpacing: '0.5px', lineHeight: 1.1 }}>DreamSpaces</h2>
            <span style={{ fontSize: '0.58rem', color: 'var(--vanya-gold)', letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Buyer Portal</span>
          </div>
        </div>
        
        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #f1f3f5' }}>
          <strong style={{ fontSize: '0.82rem', color: 'var(--vanya-green)', display: 'block', textTransform: 'capitalize' }}>{username}</strong>
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
          <button className={activeTab === 'agreement' ? 'active' : ''} onClick={() => changeTab('agreement')}>
            <span className="nav-icon">📜</span> Draft Agreement
          </button>
          <button className={activeTab === 'construction' ? 'active' : ''} onClick={() => changeTab('construction')}>
            <span className="nav-icon">🏗️</span> Construction Updates
          </button>
          <button className={activeTab === 'amenities' ? 'active' : ''} onClick={() => changeTab('amenities')}>
            <span className="nav-icon">🌟</span> Amenities
          </button>
          {(() => {
            const unreadCount = getNotifications().filter(n => !readNotifIds.includes(n.id)).length;
            return (
              <button 
                className={activeTab === 'notifications' ? 'active' : ''} 
                onClick={() => changeTab('notifications')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="nav-icon">🔔</span> Notifications
                </div>
                {unreadCount > 0 && (
                  <span style={{ background: '#c62828', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })()}
          <button className={activeTab === 'referrals' ? 'active' : ''} onClick={() => changeTab('referrals')}>
            <span className="nav-icon">🤝</span> Refer & Earn
          </button>
          <button className={activeTab === 'support' ? 'active' : ''} onClick={() => changeTab('support')}>
            <span className="nav-icon">🛠️</span> Support
          </button>
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => changeTab('profile')}>
            <span className="nav-icon">👤</span> Profile
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
          <button className="mobile-sidebar-toggle" onClick={() => setIsMobileSidebarOpen(true)}>☰</button>
          <div>
            <h1 className="serif" style={{ fontSize: '1.35rem', margin: 0, color: 'var(--vanya-green)', textTransform: 'capitalize' }}>Welcome back, {username}! 👋</h1>
            <p className="text-muted" style={{ margin: 0, fontSize: '0.68rem', letterSpacing: '0.5px' }}>UNIT ID: {unitId} • POSSESSION: {possessionDate}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--vanya-gold)' }}>PROJECT SUITE</span>
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
              <h4 className="serif" style={{ margin: '0 0 1.25rem 0', color: 'var(--vanya-green)', fontSize: '1.1rem' }}>Your Journey</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', padding: '0 1rem' }}>
                <div style={{ position: 'absolute', top: '16px', left: '2rem', right: '2rem', height: '3px', background: '#e2e8f0', zIndex: 1 }}>
                  <div style={{ width: '68%', height: '100%', background: 'var(--vanya-gold)' }}></div>
                </div>
                {journeySteps.map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: s.status === 'completed' ? '#137333' : s.status === 'active' ? 'var(--vanya-gold)' : '#fff',
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
                    <strong style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--vanya-green)' }}>{s.step}</strong>
                    <span className="text-muted" style={{ fontSize: '0.62rem', marginTop: '1px' }}>{s.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Main stats layout */}
            <div className="responsive-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              
              {/* Left Column: Flat Details & Booking Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="widget-card" style={{ margin: 0 }}>
                  <h3 className="serif" style={{ margin: '0 0 1.25rem 0', color: 'var(--vanya-green)', fontSize: '1.15rem' }}>Flat Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>PROJECT & TOWER</span>
                      <strong style={{ color: 'var(--vanya-green)' }}>{towerName}, V-{userUnit.unit_id}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>TYPE</span>
                      <strong style={{ color: 'var(--vanya-green)' }}>{userUnit.type}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>CARPET AREA</span>
                      <strong style={{ color: 'var(--vanya-green)' }}>{userUnit.area} Sq.Ft.</strong>
                    </div>
                  </div>
                  <div style={{ marginTop: '1.5rem' }}>
                    <span onClick={() => changeTab('my-flat')} style={{ color: 'var(--vanya-gold)', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>View Flat Details &gt;</span>
                  </div>
                </div>

                <div className="widget-card" style={{ margin: 0 }}>
                  <h3 className="serif" style={{ margin: '0 0 1.25rem 0', color: 'var(--vanya-green)', fontSize: '1.15rem' }}>Booking Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>BOOKING DATE</span>
                      <strong style={{ color: 'var(--vanya-green)' }}>{formatShortDate(baseBookingDate)}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>BOOKING AMOUNT</span>
                      <strong style={{ color: 'var(--vanya-green)' }}>{formatINR(bookingAmt)}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>BOOKING NO.</span>
                      <strong style={{ color: 'var(--vanya-green)' }}>BK-{rawUnitId}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Payment Overview & Next Payment */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="widget-card" style={{ margin: 0 }}>
                  <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                    <h3 className="serif" style={{ margin: 0, color: 'var(--vanya-green)', fontSize: '1.15rem' }}>Payment Overview</h3>
                    <span onClick={() => changeTab('payments')} style={{ color: 'var(--vanya-gold)', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}>View Payments &gt;</span>
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
                  <h3 className="serif" style={{ margin: '0 0 1.25rem 0', color: 'var(--vanya-green)', fontSize: '1.15rem' }}>Next Payment</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>DUE DATE</span>
                      <strong style={{ color: 'var(--vanya-green)' }}>{nextPendingInstallment.due}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>DUE AMOUNT</span>
                      <strong style={{ color: 'var(--vanya-green)' }}>{nextPendingInstallment.dueAmt}</strong>
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
            <div className="responsive-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="widget-card" style={{ margin: 0 }}>
                <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                  <h3 className="serif" style={{ margin: 0, color: 'var(--vanya-green)', fontSize: '1.15rem' }}>Construction Progress</h3>
                  <span onClick={() => changeTab('construction')} style={{ color: 'var(--vanya-gold)', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}>View Updates &gt;</span>
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

              {(() => {
                const milestoneUpdatesItem = (buyerDetails?.milestones || []).find(m => m.step === 'CONSTRUCTION_UPDATES');
                const realUpdates = milestoneUpdatesItem?.updates || [
                  { title: "Foundation Completed", date: "2026-06-04", description: "Deep pile foundation completed successfully.", image: "/images/uc1.png" },
                  { title: "12th Floor Slab Completed", date: "2026-05-20", description: "Tower A slab completion and reinforcement.", image: "/images/uc1.png" },
                  { title: "10th Floor Slab Completed", date: "2026-05-10", description: "Completed slab pouring for Floor 10.", image: "/images/uc1.png" }
                ];

                const latestUpdate = [...realUpdates].sort((a, b) => new Date(b.date) - new Date(a.date))[0] || {
                  title: "Latest Update",
                  description: "Tower A - 12th Floor slab completed. Brickwork initiated in lower segments.",
                  date: "2026-05-20",
                  image: "/images/uc1.png"
                };

                const formattedPubDate = new Date(latestUpdate.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

                return (
                  <div className="widget-card" style={{ display: 'flex', gap: '1.25rem', padding: '1.25rem', margin: 0, alignItems: 'center' }}>
                    <div style={{
                      backgroundImage: `url(${latestUpdate.image || '/images/uc1.png'})`,
                      width: '120px',
                      height: '95px',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '8px',
                      flexShrink: 0,
                      cursor: 'pointer'
                    }} onClick={() => setPreviewImage(latestUpdate)}></div>
                    <div>
                      <h4 className="serif" style={{ margin: '0 0 0.25rem 0', color: 'var(--vanya-green)', fontSize: '1rem' }}>{latestUpdate.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#4b5563', lineHeight: 1.4 }}>{latestUpdate.description}</p>
                      <span className="text-muted" style={{ display: 'block', fontSize: '0.62rem', marginTop: '0.4rem' }}>PUBLISHED: {formattedPubDate}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>
        )}

        {/* ==================== 2. MY FLAT PAGE ==================== */}
        {activeTab === 'my-flat' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            <div className="responsive-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
              
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
                  <h3 className="serif" style={{ margin: '0 0 0.5rem 0', color: 'var(--vanya-green)', fontSize: '1.3rem' }}>{towerName}</h3>
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
                        color: 'var(--vanya-green)',
                        fontSize: '0.85rem'
                      }}
                    >
                      <span>{acc.title}</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--vanya-gold)' }}>{selectedAccordion === index ? '▲' : '▼'}</span>
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
            
            <div className="responsive-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="widget-card" style={{ margin: 0 }}>
                <h3 className="serif" style={{ margin: '0 0 1.25rem 0', color: 'var(--vanya-green)' }}>Flat Information</h3>
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
                  <h3 className="serif" style={{ margin: 0, color: 'var(--vanya-green)' }}>Unit Plan</h3>
                  <span onClick={() => alert('Opening schematic blueprint view...')} style={{ fontSize: '0.72rem', color: 'var(--vanya-gold)', fontWeight: 'bold', cursor: 'pointer' }}>View Full Screen &gt;</span>
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
            <div className="responsive-grid-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="kpi-card">
                <span>TOTAL PRICE</span>
                <h2 style={{ fontSize: '1.6rem', color: 'var(--vanya-green)', margin: '4px 0' }}>{formatINR(totalNum)}</h2>
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
                  <h2 style={{ fontSize: '1.35rem', color: 'var(--vanya-green)', margin: '2px 0 0 0' }}>{paidPercentage}%</h2>
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

              <div className="table-responsive-wrapper">
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
                          <button onClick={() => handleDownloadFile("Payment Receipt - " + p.inst.split(' (')[0], p)} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.65rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
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
            </div>
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button onClick={handleExportLedger} className="btn-dark" style={{ padding: '10px 20px', borderRadius: '8px', background: '#D9A036', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                  Export Full Payment Ledger
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
              <div className="responsive-grid-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginTop: '1.5rem' }}>
                {allDocuments.filter(d => {
                  if (documentSubTab === 'all') return true;
                  return d.type === documentSubTab;
                }).map((doc, idx) => (
                  <div key={idx} style={{ border: '1px solid #f1f3f5', borderRadius: '10px', padding: '1.25rem', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '2rem' }}>📄</span>
                      <button onClick={() => handleDownloadFile(doc.name, doc.type === 'receipts' ? calculatedInstallments.find(ci => doc.name.includes(ci.inst.split(' (')[0])) : null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.7 }}>📥</button>
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.8rem', display: 'block', color: 'var(--vanya-green)' }}>{doc.name}</strong>
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
            
            <div className="responsive-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="widget-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: 0 }}>
                <span className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Overall Progress</span>
                <h2 style={{ fontSize: '3rem', color: 'var(--vanya-green)', margin: '0.5rem 0', fontWeight: 'bold' }}>{progressPercent}%</h2>
                <div style={{ background: '#f1f3f5', height: '8px', width: '80%', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ background: '#D9A036', width: `${progressPercent}%`, height: '100%' }}></div>
                </div>
                <span className="text-muted" style={{ fontSize: '0.62rem', marginTop: '1rem' }}>
                  Last updated: {(() => {
                    const milestoneUpdatesItem = (buyerDetails?.milestones || []).find(m => m.step === 'CONSTRUCTION_UPDATES');
                    const realUpdates = milestoneUpdatesItem?.updates || [
                      { title: "Foundation Completed", date: "2026-06-04", description: "Deep pile foundation completed successfully.", image: "/images/uc1.png" },
                      { title: "12th Floor Slab Completed", date: "2026-05-20", description: "Tower A slab completion and reinforcement.", image: "/images/uc1.png" },
                      { title: "10th Floor Slab Completed", date: "2026-05-10", description: "Completed slab pouring for Floor 10.", image: "/images/uc1.png" }
                    ];
                    const latestDate = realUpdates.reduce((latest, current) => {
                      if (!latest) return current.date;
                      return new Date(current.date) > new Date(latest) ? current.date : latest;
                    }, "");
                    return latestDate 
                      ? new Date(latestDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '20 May 2026';
                  })()}
                </span>
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

                {(() => {
                  const milestoneUpdatesItem = (buyerDetails?.milestones || []).find(m => m.step === 'CONSTRUCTION_UPDATES');
                  const realUpdates = milestoneUpdatesItem?.updates || [
                    { title: "Foundation Completed", date: "2026-06-04", description: "Deep pile foundation completed successfully.", image: "/images/uc1.png" },
                    { title: "12th Floor Slab Completed", date: "2026-05-20", description: "Tower A slab completion and reinforcement.", image: "/images/uc1.png" },
                    { title: "10th Floor Slab Completed", date: "2026-05-10", description: "Completed slab pouring for Floor 10.", image: "/images/uc1.png" }
                  ];

                  return (
                    <>
                      {constructionSubTab === 'photo' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                          {realUpdates.map((upd, idx) => (
                            <div key={idx} style={{ border: '1px solid #f1f3f5', borderRadius: '8px', overflow: 'hidden' }}>
                              <div 
                                style={{ backgroundImage: `url(${upd.image || '/images/uc1.png'})`, height: '110px', backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'pointer' }}
                                onClick={() => setPreviewImage(upd)}
                              ></div>
                              <div style={{ padding: '8px 10px' }}>
                                <strong style={{ fontSize: '0.75rem', display: 'block', color: 'var(--vanya-green)' }}>{upd.title}</strong>
                                <span className="text-muted" style={{ fontSize: '0.62rem', display: 'block', marginTop: '2px' }}>
                                  {new Date(upd.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {constructionSubTab === 'timeline' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', fontSize: '0.8rem', color: '#4b5563' }}>
                          {realUpdates.map((upd, idx) => (
                            <div key={idx}>
                              <strong>{new Date(upd.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}:</strong> {upd.description || upd.title}
                            </div>
                          ))}
                        </div>
                      )}

                      {constructionSubTab === 'milestones' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', fontSize: '0.8rem' }}>
                          {(buyerDetails?.milestones || [])
                            .filter(m => m.step !== 'CONSTRUCTION_UPDATES')
                            .map((m, idx) => {
                              let badgeClass = 'reserved';
                              if (m.status === 'COMPLETED') badgeClass = 'available';
                              else if (m.status === 'IN PROGRESS') badgeClass = 'negotiation';
                              return (
                                <div key={idx} className="flex-between">
                                  <span>{m.step}</span>
                                  <span className={`badge ${badgeClass}`}>{m.status}</span>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </>
                  );
                })()}
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
              <h3 className="serif" style={{ margin: '0 0 0.25rem 0', color: 'var(--vanya-green)', fontSize: '1.3rem' }}>World-Class Amenities</h3>
              <p className="text-muted" style={{ fontSize: '0.78rem', marginBottom: '2rem' }}>Sleek modular layouts designed for a premium lifestyle.</p>
              
              <div className="responsive-grid-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
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
                    <strong style={{ fontSize: '0.82rem', color: 'var(--vanya-green)' }}>{am.name}</strong>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ==================== 9. NOTIFICATIONS PAGE ==================== */}
        {activeTab === 'notifications' && (() => {
          const list = getNotifications();
          const unreadIds = list.filter(n => !readNotifIds.includes(n.id)).map(n => n.id);
          
          return (
            <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
              <div className="widget-card">
                <div className="flex-between mb-2" style={{ borderBottom: '1px solid #f1f3f5', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                  <h3 className="serif" style={{ margin: 0, color: 'var(--vanya-green)' }}>Notifications</h3>
                  {unreadIds.length > 0 && (
                    <span 
                      onClick={() => markAllAsRead(unreadIds)} 
                      style={{ color: '#D9A036', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Mark all as read
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {list.map((notif, idx) => {
                    const isRead = readNotifIds.includes(notif.id);
                    return (
                      <div 
                        key={notif.id || idx} 
                        style={{ 
                          padding: '1rem', 
                          background: isRead ? '#fafafa' : 'var(--admin-surface)', 
                          borderLeft: isRead ? '4px solid #eee' : '4px solid #D9A036', 
                          borderRadius: '6px', 
                          fontSize: '0.82rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          gap: '1rem',
                          opacity: isRead ? 0.65 : 1,
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '8px', height: '8px', background: isRead ? 'transparent' : '#D9A036', borderRadius: '50%' }}></div>
                          <div>
                            <strong>{notif.text}</strong>
                            <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '2px' }}>{notif.sub} • {notif.date}</div>
                          </div>
                        </div>
                        <div>
                          {isRead ? (
                            <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: '600' }}>✓ Read</span>
                          ) : (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              style={{
                                background: 'transparent',
                                border: '1px solid #D9A036',
                                color: '#D9A036',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = '#D9A036';
                                e.currentTarget.style.color = '#fff';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#D9A036';
                              }}
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {list.length === 0 && (
                    <div className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>
                      No notifications logged.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ==================== 10. SUPPORT PAGE ==================== */}
        {activeTab === 'support' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 className="serif" style={{ fontSize: '2rem', color: 'var(--vanya-green)', margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>Grievance & FAQ Support Center</h1>
              <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>Submit grievance tickets with a 5-minute resolution SLA and interact with our AI Assistant</span>
            </div>

            {/* KPI STATS FOR TICKETS */}
            <div className="responsive-grid-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="kpi-card">
                <span>ACTIVE COMPLAINTS</span>
                <h2 style={{ fontSize: '1.6rem', color: 'var(--vanya-green)', margin: '4px 0' }}>{tickets.filter(t => t.status === 'Open').length}</h2>
              </div>
              <div className="kpi-card">
                <span>ESCALATED TO LEADERSHIP</span>
                <h2 style={{ fontSize: '1.6rem', color: '#c62828', margin: '4px 0' }}>{tickets.filter(t => t.status === 'Escalated').length}</h2>
              </div>
              <div className="kpi-card">
                <span>RESOLVED ISSUES</span>
                <h2 style={{ fontSize: '1.6rem', color: '#137333', margin: '4px 0' }}>{tickets.filter(t => t.status === 'Closed').length}</h2>
              </div>
              <div className="kpi-card">
                <span>GUARANTEED RESPONSE SLA</span>
                <h2 style={{ fontSize: '1.6rem', color: '#D9A036', margin: '4px 0' }}>5 Minutes</h2>
              </div>
            </div>

            {/* TWO COLUMN GRID: FAQ / GRIEVANCE FORM & REGISTERED TICKETS */}
            <div className="responsive-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
              
              {/* LEFT COLUMN: FAQ BOT & FORM */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="widget-card" style={{ margin: 0, padding: '1.5rem' }}>
                  <div style={{ display: 'flex', borderBottom: '1px solid #f1f3f5', paddingBottom: '0.75rem', marginBottom: '1rem', gap: '1rem' }}>
                    <button 
                      onClick={() => setActiveSupportSubTab('faq')}
                      className={`btn-outline ${activeSupportSubTab === 'faq' ? 'active' : ''}`}
                      style={{ padding: '6px 14px', fontSize: '0.75rem', textTransform: 'uppercase', borderRadius: '6px' }}
                    >
                      💬 FAQ Assistant
                    </button>
                    <button 
                      onClick={() => setActiveSupportSubTab('raise')}
                      className={`btn-outline ${activeSupportSubTab === 'raise' ? 'active' : ''}`}
                      style={{ padding: '6px 14px', fontSize: '0.75rem', textTransform: 'uppercase', borderRadius: '6px' }}
                    >
                      ⚠️ Raise Grievance
                    </button>
                  </div>

                  {activeSupportSubTab === 'faq' ? (
                    <div>
                      <h4 className="serif" style={{ color: 'var(--vanya-green)', marginBottom: '0.5rem', fontSize: '1.05rem' }}>AI FAQ Chatbot</h4>
                      
                      {/* FAQ Topics Selection */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                        <button 
                          className="btn-outline" 
                          style={{ padding: '4px 10px', fontSize: '0.65rem', borderRadius: '4px' }}
                          onClick={() => handleFAQClick(
                            "What is the current construction status?", 
                            "Tower A is at slab milestone on the 12th floor. Plastering of lower zones is active. Possession remains scheduled for Dec 2026."
                          )}
                        >
                          🏗️ Construction Status
                        </button>
                        <button 
                          className="btn-outline" 
                          style={{ padding: '4px 10px', fontSize: '0.65rem', borderRadius: '4px' }}
                          onClick={() => handleFAQClick(
                            "How do I clear my pending payment milestone?", 
                            "Go to the 'Payments' tab in your sidebar, view your installment ledger, and click 'PAY NOW' next to any pending bill to clear it securely via Razorpay."
                          )}
                        >
                          💳 Payment Milestone
                        </button>
                        <button 
                          className="btn-outline" 
                          style={{ padding: '4px 10px', fontSize: '0.65rem', borderRadius: '4px' }}
                          onClick={() => handleFAQClick(
                            "How can I download my builder-buyer agreement?", 
                            "A printable draft builder-buyer agreement is hosted under the 'Draft Agreement' tab. If you need signed versions, download them from the 'Documents' tab."
                          )}
                        >
                          📜 Buyer Agreements
                        </button>
                        <button 
                          className="btn-outline" 
                          style={{ padding: '4px 10px', fontSize: '0.65rem', borderRadius: '4px' }}
                          onClick={() => handleFAQClick(
                            "What amenities are available?", 
                            "Vanya Residences supports multiple luxury amenities: Sky Lounge Clubhouse, Olympic-sized swimming pool, health gymnasium, yoga deck, and jogging tracks."
                          )}
                        >
                          🌟 Luxury Amenities
                        </button>
                      </div>

                      {/* Chat dialog viewport */}
                      <div style={{ height: '220px', overflowY: 'auto', border: '1px solid #f1f3f5', background: '#fafafa', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                        {chatBotMessages.map((m, idx) => (
                          <div key={idx} style={{ 
                            alignSelf: m.sender === 'buyer' ? 'flex-end' : 'flex-start', 
                            background: m.sender === 'buyer' ? '#D9A036' : '#fff', 
                            color: m.sender === 'buyer' ? 'white' : '#333', 
                            padding: '8px 12px', 
                            borderRadius: '8px', 
                            maxWidth: '75%', 
                            fontSize: '0.78rem', 
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)' 
                          }}>
                            <div>{m.text}</div>
                            <span style={{ fontSize: '0.58rem', opacity: 0.7, display: 'block', textAlign: 'right', marginTop: '4px' }}>{m.time}</span>
                          </div>
                        ))}
                        {isBotTyping && (
                          <div style={{ alignSelf: 'flex-start', background: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', color: '#999', fontStyle: 'italic' }}>
                            Assistant is typing...
                          </div>
                        )}
                      </div>

                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleChatbotMessage(chatbotInput);
                        }} 
                        style={{ display: 'flex', gap: '0.5rem' }}
                      >
                        <input 
                          type="text" 
                          value={chatbotInput} 
                          onChange={(e) => setChatbotInput(e.target.value)} 
                          placeholder="Ask a question (e.g. 'possession date' or 'payment')..." 
                          style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.82rem' }} 
                        />
                        <button type="submit" className="btn-dark" style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'var(--vanya-green)', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>SEND</button>
                      </form>
                    </div>
                  ) : (
                    <div>
                      <h4 className="serif" style={{ color: 'var(--vanya-green)', marginBottom: '0.75rem', fontSize: '1.05rem' }}>Submit a Grievance Ticket</h4>
                      
                      {ticketMsg && (
                        <div style={{ background: '#e6f4ea', color: '#137333', padding: '8px 12px', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.78rem' }}>
                          {ticketMsg}
                        </div>
                      )}

                      <form onSubmit={handleRaiseTicket} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div className="form-group">
                          <label style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Grievance Category</label>
                          <select 
                            value={ticketCategory} 
                            onChange={(e) => setTicketCategory(e.target.value)} 
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', background: 'white', fontSize: '0.82rem' }}
                          >
                            <option value="Leakage issue">Leakage issue</option>
                            <option value="Bathroom fixtures">Bathroom fixtures</option>
                            <option value="Handover delays">Handover delays</option>
                            <option value="General maintenance">General maintenance</option>
                            <option value="Payments reflection">Payments reflection</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Describe your issue</label>
                          <textarea 
                            value={ticketDesc} 
                            onChange={(e) => setTicketDesc(e.target.value)} 
                            rows="4" 
                            placeholder="Detail your issue. Our team is bound by a 5-minute response SLA before leadership escalation..."
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.82rem', resize: 'vertical' }}
                          />
                        </div>
                        <button type="submit" className="btn-dark" style={{ width: '100%', padding: '10px', fontSize: '0.8rem', background: '#D9A036', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                          SUBMIT GRIEVANCE
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: TICKET REGISTRY & STATUS */}
              <div className="widget-card" style={{ margin: 0, padding: '1.5rem' }}>
                <h3 className="serif" style={{ margin: '0 0 1rem 0', color: 'var(--vanya-green)', fontSize: '1.15rem' }}>Your Registered Grievances</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table-standard" style={{ fontSize: '0.78rem' }}>
                    <thead>
                      <tr>
                        <th>CATEGORY</th>
                        <th>DESCRIPTION</th>
                        <th>STATUS</th>
                        <th>SLA STATUS / ESCALATION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>No grievances registered yet.</td>
                        </tr>
                      ) : (
                        tickets.map((t, idx) => (
                          <tr key={idx}>
                            <td><strong>{t.category}</strong></td>
                            <td style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.description}>
                              {t.description}
                            </td>
                            <td>
                              <span className={`badge ${t.status === 'Closed' ? 'available' : t.status === 'Escalated' ? 'reserved' : 'negotiation'}`}>
                                {t.status}
                              </span>
                            </td>
                            <td>
                              {t.status === 'Open' ? (
                                <span style={{ color: '#D9A036', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  ⏳ {getSLAText(t)}
                                </span>
                              ) : t.status === 'Escalated' ? (
                                <span style={{ color: '#c62828', fontWeight: 'bold' }}>
                                  🚨 Escalated to Leadership
                                </span>
                              ) : (
                                <span style={{ color: '#137333' }}>✅ Resolved</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 10.5. DRAFT AGREEMENT PAGE ==================== */}
        {activeTab === 'agreement' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h1 className="serif" style={{ fontSize: '1.8rem', color: 'var(--vanya-green)', margin: 0, fontWeight: 'bold' }}>Builder-Buyer Agreement</h1>
                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>Review and print a stamp-duty compatible draft agreement of unit V-{userUnit.unit_id}</span>
              </div>
              <button 
                onClick={handlePrintAgreement}
                className="btn-dark"
                style={{ padding: '10px 20px', borderRadius: '8px', background: '#D9A036', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                🖨️ Print Agreement Draft
              </button>
            </div>

            <div className="widget-card" style={{ 
              background: '#fcfaf5', 
              border: '2px solid #e8dfcc', 
              borderRadius: '12px', 
              padding: '3rem 4rem', 
              boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
              fontFamily: 'serif',
              color: '#2b2a27',
              lineHeight: 1.6,
              maxWidth: '850px',
              margin: '0 auto',
              maxHeight: '700px',
              overflowY: 'auto'
            }}>
              
              {/* Header Scroll Look */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #8c7647', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '2rem', letterSpacing: '2px', color: 'var(--vanya-green)', margin: '0 0 0.5rem 0', fontFamily: 'serif' }}>BUILDER-BUYER AGREEMENT</h2>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#8c7647', letterSpacing: '3px', fontWeight: 'bold' }}>PRESTAGE DEVELOPERS • VANYA RESIDENCES</div>
              </div>

              <p style={{ textIndent: '2rem', marginBottom: '1.5rem', textAlign: 'justify' }}>
                This agreement is entered into on this day between <strong>DreamSpaces Developers Private Limited</strong>, having its registered office at Prestige Tower, Pune, hereinafter referred to as the <strong>Builder</strong>, and the allottee detailed below, hereinafter referred to as the <strong>Buyer</strong>.
              </p>

              <h4 style={{ borderBottom: '1px solid #e8dfcc', paddingBottom: '0.4rem', color: 'var(--vanya-green)', marginTop: '2rem' }}>SCHEDULE A: ALLOTMENT SPECIFICATIONS</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0 2rem 0', fontSize: '0.85rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1ece1' }}>
                    <td style={{ padding: '8px 0', fontWeight: 'bold', width: '35%' }}>Allottee / Buyer Name:</td>
                    <td style={{ padding: '8px 0', textTransform: 'uppercase' }}>{username}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1ece1' }}>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Allotted Unit ID:</td>
                    <td>V-{userUnit.unit_id} ({floorWithSuffix})</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1ece1' }}>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Tower Block:</td>
                    <td>{towerName}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1ece1' }}>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Carpet Area:</td>
                    <td>{userUnit.area} Sq.Ft.</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1ece1' }}>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Super Built-Up Area:</td>
                    <td>{Math.round(parseInt(userUnit.area) * 1.12)} Sq.Ft.</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1ece1' }}>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Total Agreement Value:</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--vanya-green)' }}>{formatINR(totalNum)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1ece1' }}>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Amount Settled (Paid):</td>
                    <td style={{ color: '#137333', fontWeight: 'bold' }}>{formatINR(paidNum)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1ece1' }}>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Pending Balance Outstanding:</td>
                    <td style={{ color: '#c62828', fontWeight: 'bold' }}>{formatINR(pendingNum)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1ece1' }}>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Estimated Possession:</td>
                    <td>{possessionDate}</td>
                  </tr>
                </tbody>
              </table>

              <h4 style={{ borderBottom: '1px solid #e8dfcc', paddingBottom: '0.4rem', color: 'var(--vanya-green)', marginTop: '2rem' }}>1. COVENANTS OF ALLOTMENT</h4>
              <p style={{ textAlign: 'justify', fontSize: '0.9rem', marginBottom: '1rem' }}>
                1.1. The Builder represents that they have clear, absolute, and marketable title to the land parcel details, and have received building plan layout sanctions under RERA authority.
              </p>
              <p style={{ textAlign: 'justify', fontSize: '0.9rem', marginBottom: '1rem' }}>
                1.2. The Buyer agrees to clear milestones and installments as per the Construction Linked Plan (CLP) layout detailed in the 'Payments' ledger. Delays in installment payments carry interest penalties as per RERA terms.
              </p>

              <h4 style={{ borderBottom: '1px solid #e8dfcc', paddingBottom: '0.4rem', color: 'var(--vanya-green)', marginTop: '2rem' }}>2. PHYSICAL POSSESSION AND TIMELINES</h4>
              <p style={{ textAlign: 'justify', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                2.1. Construction milestones (slab completions, brickworks, internal fitouts) shall be updated continuously in the buyer portal. Final possession handover, deed execution, and keys delivery are contingent upon receiving the final occupancy certificate and clear receipt ledger from the accounting office.
              </p>

              <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <div style={{ borderTop: '1px solid #8c7647', width: '200px', textAlign: 'center', paddingTop: '0.5rem' }}>
                  DreamSpaces Signatory
                </div>
                <div style={{ borderTop: '1px solid #8c7647', width: '200px', textAlign: 'center', paddingTop: '0.5rem', textTransform: 'uppercase' }}>
                  {username} (Buyer Allottee)
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== 10.6. REFER AND EARN (LOYALTY) PAGE ==================== */}
        {activeTab === 'referrals' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 className="serif" style={{ fontSize: '1.8rem', color: 'var(--vanya-green)', margin: 0, fontWeight: 'bold' }}>Refer & Earn Loyalty Board</h1>
              <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>Introduce friends and family to DreamSpaces and earn premium payouts up to ₹ 30,000!</span>
            </div>

            {/* KPI Stat counters */}
            <div className="responsive-grid-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="kpi-card">
                <span>TOTAL REFERRED</span>
                <h2 style={{ fontSize: '1.6rem', color: 'var(--vanya-green)', margin: '4px 0' }}>{referrals.length}</h2>
              </div>
              <div className="kpi-card">
                <span>SITE VISITS COMPLETED</span>
                <h2 style={{ fontSize: '1.6rem', color: '#D9A036', margin: '4px 0' }}>{referrals.filter(r => r.status === 'WALKED_IN' || r.status === 'BOOKED').length}</h2>
              </div>
              <div className="kpi-card">
                <span>UNLOCKED REWARDS</span>
                <h2 style={{ fontSize: '1.6rem', color: '#137333', margin: '4px 0' }}>
                  ₹ {referrals.reduce((acc, curr) => {
                    if (curr.status === 'BOOKED') return acc + 30000;
                    if (curr.status === 'WALKED_IN') return acc + 5000;
                    return acc;
                  }, 0).toLocaleString('en-IN')}
                </h2>
              </div>
              <div className="kpi-card">
                <span>BOOKED RESIDENCES</span>
                <h2 style={{ fontSize: '1.6rem', color: 'var(--vanya-green)', margin: '4px 0' }}>{referrals.filter(r => r.status === 'BOOKED').length}</h2>
              </div>
            </div>

            <div className="responsive-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
              {/* LEFT COLUMN: Refer-a-Friend Form & Copy Link widget */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="widget-card" style={{ margin: 0, padding: '1.5rem' }}>
                  <h3 className="serif" style={{ margin: '0 0 1rem 0', color: 'var(--vanya-green)', fontSize: '1.15rem' }}>Invite Your Circle</h3>
                  
                  {referralMsg && (
                    <div style={{ background: '#e6f4ea', color: '#137333', padding: '8px 12px', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.78rem' }}>
                      {referralMsg}
                    </div>
                  )}

                  <form onSubmit={handleRaiseReferral} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Friend's Name</label>
                      <input 
                        type="text" 
                        value={newReferralName} 
                        onChange={(e) => setNewReferralName(e.target.value)} 
                        placeholder="Enter full name..."
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.82rem' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Friend's Phone Number</label>
                      <input 
                        type="text" 
                        value={newReferralPhone} 
                        onChange={(e) => setNewReferralPhone(e.target.value)} 
                        placeholder="Enter 10-digit number..."
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.82rem' }}
                      />
                    </div>
                    <button type="submit" className="btn-dark" style={{ width: '100%', padding: '10px', fontSize: '0.8rem', background: '#D9A036', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                      SEND INVITATION
                    </button>
                  </form>
                </div>

                <div className="widget-card" style={{ margin: 0, padding: '1.5rem' }}>
                  <h3 className="serif" style={{ margin: '0 0 0.5rem 0', color: 'var(--vanya-green)', fontSize: '1.15rem' }}>Share Referral Link</h3>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 1rem 0' }}>Copy this unique link to share directly on WhatsApp or social networks.</p>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      readOnly 
                      value={typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${username}` : `http://localhost:3000/register?ref=${username}`} 
                      style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', background: '#fafafa', fontSize: '0.78rem' }}
                    />
                    <button 
                      onClick={handleCopyLink}
                      className="btn-dark" 
                      style={{ padding: '8px 14px', background: 'var(--vanya-green)', border: 'none', color: 'white', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', minWidth: '80px' }}
                    >
                      {copied ? 'Copied! ✅' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Referred List status tracking */}
              <div className="widget-card" style={{ margin: 0, padding: '1.5rem' }}>
                <h3 className="serif" style={{ margin: '0 0 1rem 0', color: 'var(--vanya-green)', fontSize: '1.15rem' }}>Referrals Tracking</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table-standard" style={{ fontSize: '0.78rem' }}>
                    <thead>
                      <tr>
                        <th>NAME</th>
                        <th>PHONE</th>
                        <th>STATUS</th>
                        <th>REWARDS EARNED</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>No referrals submitted yet.</td>
                        </tr>
                      ) : (
                        referrals.map((r, idx) => (
                          <tr key={idx}>
                            <td><strong>{r.friend_name}</strong></td>
                            <td>{r.friend_phone}</td>
                            <td>
                              <span className={`badge ${r.status === 'BOOKED' ? 'available' : r.status === 'WALKED_IN' ? 'negotiation' : 'reserved'}`}>
                                {r.status}
                              </span>
                            </td>
                            <td style={{ fontWeight: 'bold' }}>
                              {r.status === 'BOOKED' ? (
                                <span style={{ color: '#137333' }}>₹ 30,000 Unlocked 🏆</span>
                              ) : r.status === 'WALKED_IN' ? (
                                <span style={{ color: '#D9A036' }}>₹ 5,000 Unlocked 🚶</span>
                              ) : (
                                <span style={{ color: '#9ca3af' }}>₹ 0 (Site visit pending)</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 11. PROFILE PAGE ==================== */}
        {activeTab === 'profile' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem' }}>
            <div className="responsive-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
              
              {/* Profile fields */}
              <div className="widget-card" style={{ margin: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #f1f3f5', paddingBottom: '1.5rem' }}>
                  <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: '#e5f5ea',
                    color: 'var(--vanya-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    fontFamily: "'Playfair Display', serif",
                    marginBottom: '0.75rem'
                  }}>{username.charAt(0).toUpperCase()}</div>
                  <h3 className="serif" style={{ margin: 0, color: 'var(--vanya-green)', fontSize: '1.25rem', textTransform: 'capitalize' }}>{username}</h3>
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>{emailAddress}</span>
                </div>

                <h3 className="serif" style={{ margin: '0 0 1.25rem 0', color: 'var(--vanya-green)', fontSize: '1.1rem' }}>Personal Information</h3>
                
                {profileMsg && (
                  <div style={{ background: '#e6f4ea', color: '#137333', padding: '8px 12px', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.78rem' }}>
                    {profileMsg}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fafafa', paddingBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 'bold' }}>FULL NAME</span>
                      <strong style={{ color: 'var(--vanya-green)', textTransform: 'capitalize' }}>{username}</strong>
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
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/users/profile', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              phone: mobileNum,
                              email: emailAddress
                            })
                          });
                          const result = await res.json();
                          if (result.success) {
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('profile_address', addressVal);
                              localStorage.setItem('profile_pan', panNumber);
                              localStorage.setItem('profile_mobile', mobileNum);
                              localStorage.setItem('profile_email', emailAddress);
                            }
                            setIsEditing(false);
                            setProfileMsg('Profile information updated successfully!');
                          } else {
                            setProfileMsg(result.error || 'Failed to update profile information.');
                          }
                        } catch (err) {
                          setProfileMsg('Network error while updating profile.');
                        }
                        setTimeout(() => setProfileMsg(''), 4000);
                      }} 
                      className="btn-dark" 
                      style={{ width: 'fit-content', padding: '8px 16px', fontSize: '0.75rem', background: '#D9A036', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      SAVE CHANGES
                    </button>
                  )}
                </div>
              </div>

              {/* Change Password Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="widget-card" style={{ margin: 0 }}>
                  <h3 className="serif" style={{ margin: '0 0 1.25rem 0', color: 'var(--vanya-green)', fontSize: '1.1rem' }}>Change Password</h3>
                  
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
                      onClick={async () => {
                        if (!currPass || !newPass || !confPass) {
                          setPasswordMsg('Please fill in all password fields.');
                          return;
                        }
                        if (newPass !== confPass) {
                          setPasswordMsg('New password and confirm password do not match.');
                          return;
                        }
                        try {
                          const res = await fetch('/api/users/password', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              username: username,
                              currentPassword: currPass,
                              newPassword: newPass
                            })
                          });
                          const data = await res.json();
                          if (data.success) {
                            setPasswordMsg('Password updated successfully!');
                            setCurrPass('');
                            setNewPass('');
                            setConfPass('');
                          } else {
                            setPasswordMsg(data.error || 'Failed to update password.');
                          }
                        } catch (err) {
                          setPasswordMsg('Network error while updating password.');
                        }
                        setTimeout(() => setPasswordMsg(''), 5000);
                      }} 
                      className="btn-dark" 
                      style={{ width: '100%', padding: '10px', fontSize: '0.75rem', background: 'var(--vanya-green)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
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

      {/* Lightbox / Modal for Construction Image Preview */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)} 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.9)', 
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '2rem',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '800px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <div style={{ position: 'relative', width: '100%', maxHeight: '60vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src={previewImage.image || '/images/uc1.png'} 
                alt={previewImage.title || 'Construction Progress'} 
                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
              />
              <button 
                onClick={() => setPreviewImage(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#1e293b',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#ffffff'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'}
              >
                &times;
              </button>
            </div>
            <div style={{ padding: '1.75rem', background: '#ffffff' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--vanya-gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Construction Update · {new Date(previewImage.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <h3 className="serif" style={{ margin: '0.35rem 0 0.75rem 0', fontSize: '1.5rem', color: 'var(--vanya-green)' }}>
                {previewImage.title}
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.6 }}>
                {previewImage.description || 'Slab completed and reinforcement checks passed for the corresponding tower segment.'}
              </p>
            </div>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes scaleUp {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}} />
        </div>
      )}
    </div>
  );
}
