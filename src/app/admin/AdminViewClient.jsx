"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PortfolioTable from './PortfolioTable';
import GridClient from './GridClient';
import InquiryPipelineClient from './InquiryPipelineClient';
import AdminAddBuyerClient from './AdminAddBuyerClient';
import AdminUpdateBuyerClient from './AdminUpdateBuyerClient';
import GlobalVisitsClient from './GlobalVisitsClient';
import AdminReportActionsClient from './AdminReportActionsClient';
import AdminCPCommissionsClient from './AdminCPCommissionsClient';
import AdminGlobalSearchClient from './AdminGlobalSearchClient';
import AdminAddSalesClient from './AdminAddSalesClient';
import AdminAddCPClient from './AdminAddCPClient';
import AdminAlertsCard from './AdminAlertsCard';
import { revertToAdmin, logoutUser, impersonateSales } from './actions';

export default function AdminViewClient({ inquiries, units, buyers, cpPartners, commissions, project, allUsers = [], opportunities = [] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Call logs states
  const [allCallLogs, setAllCallLogs] = useState([]);

  // Alert logs dismissed state (must be initialized before notificationAlerts useMemo)
  const [dismissedAlertIds, setDismissedAlertIds] = useState([]);

  // Dynamic notification & alert counts
  const notificationAlerts = useMemo(() => {
    const pendingVisitsCount = inquiries.filter(inq => 
      inq.status && inq.status.startsWith('SCHEDULED|')
    ).length;

    const unassignedLeadsCount = inquiries.filter(inq => {
      const isInternalAction = 
        (inq.source || '').startsWith('UNIT_ASSIGNMENT_') || 
        (inq.status || '').startsWith('SCHEDULED|') ||
        (inq.status || '').startsWith('DONE|');

      if (isInternalAction) return false;
      
      if (!inq.status) return true;
      const parts = inq.status.split('|');
      return parts.length === 1 || parts[1] === 'unassigned';
    }).length;

    const availableUnitsCount = units.filter(u => u.status === 'AVAILABLE').length;
    const totalUnitsCount = units.length || 1;
    const availablePercentage = Math.round((availableUnitsCount / totalUnitsCount) * 100);
    const isLowInventory = availablePercentage < 40;

    const items = [];
    if (unassignedLeadsCount > 0 && !dismissedAlertIds.includes('unassigned-leads')) {
      items.push({
        id: 'unassigned-leads',
        text: `${unassignedLeadsCount} unassigned pipeline leads waiting for allocation.`,
        icon: '👤',
        color: 'var(--vanya-gold)'
      });
    }
    if (pendingVisitsCount > 0 && !dismissedAlertIds.includes('pending-visits')) {
      items.push({
        id: 'pending-visits',
        text: `${pendingVisitsCount} upcoming client site visits pending briefings.`,
        icon: '📅',
        color: 'var(--vanya-gold)'
      });
    }
    if (isLowInventory && !dismissedAlertIds.includes('low-inventory')) {
      items.push({
        id: 'low-inventory',
        text: `Low Inventory Alert: ${availablePercentage}% available units left.`,
        icon: '🚨',
        color: '#c53030'
      });
    }

    // Add recent CP referrals dynamically
    const recentCpReferrals = inquiries
      .filter(inq => inq.source?.startsWith('CP_Referral|'))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 2);

    recentCpReferrals.forEach(inq => {
      const cpName = inq.source.split('|')[1];
      const alertId = `cp-ref-${inq.id}`;
      if (!dismissedAlertIds.includes(alertId)) {
        items.push({
          id: alertId,
          text: `New CP referral (${cpName}): ${inq.name}`,
          icon: '🤝',
          color: '#1a73e8'
        });
      }
    });

    // Add CP ready-to-book alerts dynamically
    const readyToBookCpLeads = inquiries.filter(inq =>
      inq.source?.startsWith('CP_Referral|') &&
      (inq.status || '').split('|')[0] === 'READY_TO_BOOK'
    );

    readyToBookCpLeads.forEach(inq => {
      const cpName = inq.source.split('|')[1];
      const alertId = `cp-ready-${inq.id}`;
      if (!dismissedAlertIds.includes(alertId)) {
        items.push({
          id: alertId,
          text: `Deal closed by CP (${cpName}): ${inq.name} is Ready to Book. Awaiting Salesperson action.`,
          icon: '🤝',
          color: 'var(--vanya-gold)'
        });
      }
    });

    return {
      items,
      count: items.length
    };
  }, [inquiries, units, dismissedAlertIds]);


  // Trace unit booking source, cp owner and salesperson
  const getUnitBookingDetails = (unitId) => {
    const assignInq = inquiries.find(inq => inq.source === `UNIT_ASSIGNMENT_${unitId}`);
    const buyer = buyers.find(b => String(b.unit_id) === String(unitId));
    
    let originalInq = null;
    if (assignInq) {
      originalInq = inquiries.find(inq => 
        !inq.source?.startsWith('UNIT_ASSIGNMENT_') && 
        (inq.phone === assignInq.phone || (inq.name && assignInq.name && inq.name.toLowerCase().trim() === assignInq.name.toLowerCase().trim()))
      );
    } else if (buyer) {
      originalInq = inquiries.find(inq => 
        !inq.source?.startsWith('UNIT_ASSIGNMENT_') && 
        inq.name && buyer.username && 
        inq.name.toLowerCase().replace(/\s+/g, '') === buyer.username.toLowerCase().replace(/\s+/g, '')
      );
    }
    
    let source = 'Direct/Website';
    let cpOwner = 'None';
    
    if (originalInq) {
      const rawSource = originalInq.source || '';
      if (rawSource.startsWith('CP_Referral|')) {
        cpOwner = rawSource.split('|')[1];
        source = `Channel Partner (${cpOwner})`;
      } else {
        source = rawSource || 'Direct/Website';
      }
    }
    
    let salesperson = 'Unassigned';
    if (assignInq && assignInq.status?.includes('|')) {
      salesperson = assignInq.status.split('|')[1];
    } else if (originalInq && originalInq.status?.includes('|')) {
      salesperson = originalInq.status.split('|')[1];
    }
    
    return {
      source,
      cpOwner,
      salesperson,
      clientName: buyer ? buyer.username : (assignInq ? assignInq.name : (originalInq ? originalInq.name : 'N/A'))
    };
  };

  // Group duplicate inquiries for Lead Clash audits
  const duplicateInquiriesGrouped = useMemo(() => {
    const duplicates = {};
    inquiries.forEach(inq => {
      if (!inq.phone || inq.source?.startsWith('UNIT_ASSIGNMENT_')) return;
      const cleanPhone = inq.phone.trim();
      if (!duplicates[cleanPhone]) {
        duplicates[cleanPhone] = [];
      }
      duplicates[cleanPhone].push(inq);
    });
    
    return Object.entries(duplicates)
      .filter(([phone, list]) => list.length > 1)
      .map(([phone, list]) => {
        const sorted = [...list].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        return {
          phone,
          firstRegistration: sorted[0],
          subsequentRegistrations: sorted.slice(1)
        };
      });
  }, [inquiries]);

  // Compute salesperson hierarchy stats
  const salespersonStats = useMemo(() => {
    const salesUsers = allUsers.filter(u => u.role === 'Sales');
    const mockExecs = [
      { username: 'SR-9999', full_name: 'Vikram Sethi' },
      { username: 'SR-1111', full_name: 'Administrator' },
      { username: 'SR-2222', full_name: 'Rahul Verma' },
      { username: 'SR-3333', full_name: 'Sneha Patil' },
      { username: 'SR-4444', full_name: 'Aditya Sharma' }
    ];
    
    const combined = [...salesUsers];
    mockExecs.forEach(m => {
      if (!combined.some(c => c.username === m.username)) {
        combined.push({ username: m.username, role: 'Sales', full_name: m.full_name });
      }
    });

    return combined.map(user => {
      const assigned = inquiries.filter(inq => {
        if (inq.source?.startsWith('UNIT_ASSIGNMENT_')) return false;
        const statusStr = inq.status || '';
        return statusStr.includes(`|${user.username}`) || statusStr === user.username;
      });

      const converted = assigned.filter(inq => inq.status?.startsWith('CONVERTED') || inq.status?.startsWith('DONE'));
      const active = assigned.filter(inq => !inq.status?.startsWith('CONVERTED') && !inq.status?.startsWith('LOST') && !inq.status?.startsWith('DONE'));
      
      const calls = allCallLogs.filter(c => c.salesman_id === user.username);
      const avgDuration = calls.length > 0 
        ? Math.round(calls.reduce((sum, c) => sum + (c.duration || 0), 0) / calls.length) 
        : 0;

      return {
        ...user,
        assignedCount: assigned.length,
        convertedCount: converted.length,
        activeCount: active.length,
        callCount: calls.length,
        avgCallDuration: avgDuration
      };
    });
  }, [allUsers, inquiries, allCallLogs]);



  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'leads') {
      fetch('/api/calls')
        .then(res => res.json())
        .then(json => {
          if (json.success) {
            setAllCallLogs(json.data || []);
          }
        })
        .catch(err => console.error('Failed to load call logs:', err));
    }
    
  }, [activeTab]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const tab = p.get('tab');
    if (tab) {
      setActiveTab(tab === 'sourcing-manager' ? 'dashboard' : tab);
    }
  }, []);

  const changeTab = (tabName) => {
    setActiveTab(tabName);
    setIsMobileSidebarOpen(false);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', tabName);
      window.history.pushState(null, '', `?${params.toString()}`);
    }
  };

  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Quick Add forms states
  const [activeQuickAddForm, setActiveQuickAddForm] = useState(null); // 'lead', 'flat'
  
  // Add Lead Form state
  const [quickLeadName, setQuickLeadName] = useState('');
  const [quickLeadPhone, setQuickLeadPhone] = useState('');
  const [quickLeadEmail, setQuickLeadEmail] = useState('');
  const [quickLeadAadhaar, setQuickLeadAadhaar] = useState('');
  const [quickLeadPincode, setQuickLeadPincode] = useState('');
  const [quickLeadRep, setQuickLeadRep] = useState('unassigned');
  const [quickLeadSubmitError, setQuickLeadSubmitError] = useState('');

  // Add Flat Form state
  const [quickFlatId, setQuickFlatId] = useState('');
  const [quickFlatFloor, setQuickFlatFloor] = useState('');
  const [quickFlatType, setQuickFlatType] = useState('3BHK');
  const [quickFlatArea, setQuickFlatArea] = useState('2400');
  const [quickFlatPrice, setQuickFlatPrice] = useState('₹ 2.50 Cr');
  const [quickFlatStatus, setQuickFlatStatus] = useState('AVAILABLE');

  // Submission handlers for Quick Add
  const handleQuickLeadSubmit = async (e) => {
    e.preventDefault();
    setQuickLeadSubmitError('');
    try {
      const messageWithPincode = `[Pincode: ${quickLeadPincode}] Generated via Admin Quick Add.`;
      
      const payload = {
        name: quickLeadName,
        phone: quickLeadPhone,
        email: quickLeadEmail,
        aadhaar: quickLeadAadhaar || null,
        message: messageWithPincode,
        source: 'Admin Quick Add',
        status: quickLeadRep === 'unassigned' ? 'NEW|unassigned' : `NEW|${quickLeadRep}`
      };

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add lead');
      }

      alert('Lead added successfully!');
      setActiveQuickAddForm(null);
      setQuickLeadName('');
      setQuickLeadPhone('');
      setQuickLeadEmail('');
      setQuickLeadAadhaar('');
      setQuickLeadPincode('');
      setQuickLeadRep('unassigned');
      
      router.refresh();
      setTimeout(() => window.location.reload(), 300);
    } catch (err) {
      setQuickLeadSubmitError(err.message);
    }
  };



  const handleQuickFlatSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        unit_id: quickFlatId,
        floor: quickFlatFloor,
        type: quickFlatType,
        area: quickFlatArea,
        price: quickFlatPrice,
        status: quickFlatStatus
      };

      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add flat');
      }

      alert('Flat added successfully!');
      setActiveQuickAddForm(null);
      setQuickFlatId('');
      setQuickFlatFloor('');
      
      router.refresh();
      setTimeout(() => window.location.reload(), 300);
    } catch (err) {
      alert('Error adding flat: ' + err.message);
    }
  };

  const weekRangeLabel = useMemo(() => {
    const now = new Date();
    const day = now.getDay(); // 0=Sun
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const start = new Date(now);
    start.setDate(now.getDate() + mondayOffset);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const fmt = (d) =>
      d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    return `${fmt(start)} - ${fmt(end)}`;
  }, []);
  
  // Leads tab sub-filter
  const [leadSubTab, setLeadSubTab] = useState('pipeline');
  // Reports tab left selection
  const [reportType, setReportType] = useState('sales');
  // Settings tab top selection
  const [settingsSubTab, setSettingsSubTab] = useState('general');
  // Settings configurations (Hydration-safe)
  const [companyName, setCompanyName] = useState('Vanya Residences Group');
  const [baseCurrency, setBaseCurrency] = useState('INR');
  const [allocationStrategy, setAllocationStrategy] = useState('active');
  const [themeMode, setThemeMode] = useState('classic');
  const [brandAccent, setBrandAccent] = useState('var(--vanya-gold)');
  const [projectTitle, setProjectTitle] = useState('Vanya Residences');
  const [minPasswordLength, setMinPasswordLength] = useState(6);
  const [sessionExpiry, setSessionExpiry] = useState('12h');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Exotel Telephony Credentials
  const [exotelSid, setExotelSid] = useState('');
  const [exotelApiKey, setExotelApiKey] = useState('');
  const [exotelToken, setExotelToken] = useState('');
  const [exotelVirtualNumber, setExotelVirtualNumber] = useState('');

  useEffect(() => {
    const ls = (k, d) => localStorage.getItem(k) || d;
    setCompanyName(ls('erp_company_name', 'Vanya Residences Group'));
    setBaseCurrency(ls('erp_base_currency', 'INR'));
    setAllocationStrategy(ls('erp_allocation_strategy', 'active'));
    setThemeMode(ls('erp_theme_mode', 'classic'));
    setBrandAccent(ls('erp_brand_accent', 'var(--vanya-gold)'));
    setProjectTitle(ls('erp_project_title', 'Vanya Residences'));
    setSessionExpiry(ls('erp_session_expiry', '12h'));
    
    // Load Exotel Credentials
    setExotelSid(ls('exotel_sid', ''));
    setExotelApiKey(ls('exotel_api_key', ''));
    setExotelToken(ls('exotel_token', ''));
    setExotelVirtualNumber(ls('exotel_virtual_number', ''));

    const savedPw = localStorage.getItem('erp_min_pw_len');
    if (savedPw) setMinPasswordLength(parseInt(savedPw, 10));
    setMfaEnabled(localStorage.getItem('erp_mfa_enabled') === 'true');
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('erp_company_name', companyName);
    localStorage.setItem('erp_base_currency', baseCurrency);
    localStorage.setItem('erp_allocation_strategy', allocationStrategy);
    localStorage.setItem('erp_theme_mode', themeMode);
    localStorage.setItem('erp_brand_accent', brandAccent);
    localStorage.setItem('erp_project_title', projectTitle);
    localStorage.setItem('erp_session_expiry', sessionExpiry);
    localStorage.setItem('erp_min_pw_len', minPasswordLength.toString());
    localStorage.setItem('erp_mfa_enabled', mfaEnabled.toString());
    
    // Save Exotel Credentials
    localStorage.setItem('exotel_sid', exotelSid);
    localStorage.setItem('exotel_api_key', exotelApiKey);
    localStorage.setItem('exotel_token', exotelToken);
    localStorage.setItem('exotel_virtual_number', exotelVirtualNumber);
    
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      window.location.reload();
    }, 1500);
  };

  // Quick lead allocation selection
  const [leadAssignState, setLeadAssignState] = useState({ leadId: null, salesmanId: '' });

  // Leads overview: view = 'week' | 'month' | 'year'
  const [leadsView, setLeadsView]     = useState('month');
  
  // Leads Overview absolute selections
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const day = new Date().getDate();
    if (day <= 7) return 0;
    if (day <= 14) return 1;
    if (day <= 21) return 2;
    return 3;
  });

  const resetToCurrentPeriod = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
    const curDay = now.getDate();
    if (curDay <= 7) setSelectedWeek(0);
    else if (curDay <= 14) setSelectedWeek(1);
    else if (curDay <= 21) setSelectedWeek(2);
    else setSelectedWeek(3);
  };

  // Dashboard view type (Analytical vs Executive)
  const [dashboardSubTab, setDashboardSubTab] = useState('analytical');

  // Analytical Performance phase toggle (Phase 1 = overview, Phase 2 = detailed)
  const [analyticalPhase, setAnalyticalPhase] = useState(1);

  // Monthly Sales Velocity absolute selections
  const [velocityRange, setVelocityRange] = useState('MONTH');
  const [velocityYear, setVelocityYear] = useState(() => new Date().getFullYear());
  const [velocityMonth, setVelocityMonth] = useState(() => new Date().getMonth());
  const [velocityWeek, setVelocityWeek] = useState(() => {
    const day = new Date().getDate();
    if (day <= 7) return 0;
    if (day <= 14) return 1;
    if (day <= 21) return 2;
    return 3;
  });

  const resetVelocityPeriod = () => {
    const now = new Date();
    setVelocityYear(now.getFullYear());
    setVelocityMonth(now.getMonth());
    const curDay = now.getDate();
    if (curDay <= 7) setVelocityWeek(0);
    else if (curDay <= 14) setVelocityWeek(1);
    else if (curDay <= 21) setVelocityWeek(2);
    else setVelocityWeek(3);
  };

  // Revenue Overview absolute selections
  const [revenueView, setRevenueView] = useState('month'); // 'week' | 'month' | 'year'
  const [revenueYear, setRevenueYear] = useState(() => new Date().getFullYear());
  const [revenueMonth, setRevenueMonth] = useState(() => new Date().getMonth());
  const [revenueWeek, setRevenueWeek] = useState(() => {
    const day = new Date().getDate();
    if (day <= 7) return 0;
    if (day <= 14) return 1;
    if (day <= 21) return 2;
    return 3;
  });
  const [revenueViewType, setRevenueViewType] = useState('past');

  const resetRevenuePeriod = () => {
    const now = new Date();
    setRevenueYear(now.getFullYear());
    setRevenueMonth(now.getMonth());
    const curDay = now.getDate();
    if (curDay <= 7) setRevenueWeek(0);
    else if (curDay <= 14) setRevenueWeek(1);
    else if (curDay <= 21) setRevenueWeek(2);
    else setRevenueWeek(3);
  };

  // Finance Page absolute selections
  const [financeView, setFinanceView] = useState('month'); // 'week' | 'month' | 'year'
  const [financeYear, setFinanceYear] = useState(() => new Date().getFullYear());
  const [financeMonth, setFinanceMonth] = useState(() => new Date().getMonth());
  const [financeWeek, setFinanceWeek] = useState(() => {
    const day = new Date().getDate();
    if (day <= 7) return 0;
    if (day <= 14) return 1;
    if (day <= 21) return 2;
    return 3;
  });
  const [financeViewType, setFinanceViewType] = useState('past');

  const resetFinancePeriod = () => {
    const now = new Date();
    setFinanceYear(now.getFullYear());
    setFinanceMonth(now.getMonth());
    const curDay = now.getDate();
    if (curDay <= 7) setFinanceWeek(0);
    else if (curDay <= 14) setFinanceWeek(1);
    else if (curDay <= 21) setFinanceWeek(2);
    else setFinanceWeek(3);
  };

  const isFinanceNextDisabled = () => {
    const now = new Date();
    const curYr = now.getFullYear();
    const curMo = now.getMonth();
    const curDay = now.getDate();
    let curWk = 0;
    if (curDay <= 7) curWk = 0;
    else if (curDay <= 14) curWk = 1;
    else if (curDay <= 21) curWk = 2;
    else curWk = 3;

    if (financeView === 'week') {
      return financeYear > curYr || 
             (financeYear === curYr && financeMonth > curMo) || 
             (financeYear === curYr && financeMonth === curMo && financeWeek >= curWk);
    }
    if (financeView === 'month') {
      return financeYear > curYr || 
             (financeYear === curYr && financeMonth >= curMo);
    }
    if (financeView === 'year') {
      return financeYear >= curYr;
    }
    return false;
  };

  const handlePrevFinancePeriod = () => {
    if (financeView === 'week') {
      if (financeWeek > 0) {
        setFinanceWeek(financeWeek - 1);
      } else {
        if (financeMonth > 0) {
          setFinanceMonth(financeMonth - 1);
          setFinanceWeek(3);
        } else {
          const prevYr = financeYear - 1;
          if (availableYears.includes(prevYr)) {
            setFinanceYear(prevYr);
            setFinanceMonth(11);
            setFinanceWeek(3);
          }
        }
      }
    } else if (financeView === 'month') {
      if (financeMonth > 0) {
        setFinanceMonth(financeMonth - 1);
      } else {
        const prevYr = financeYear - 1;
        if (availableYears.includes(prevYr)) {
          setFinanceYear(prevYr);
          setFinanceMonth(11);
        }
      }
    } else if (financeView === 'year') {
      const prevYr = financeYear - 1;
      if (availableYears.includes(prevYr)) {
        setFinanceYear(prevYr);
      }
    }
  };

  const handleNextFinancePeriod = () => {
    if (financeView === 'week') {
      if (financeWeek < 3) {
        setFinanceWeek(financeWeek + 1);
      } else {
        if (financeMonth < 11) {
          setFinanceMonth(financeMonth + 1);
          setFinanceWeek(0);
        } else {
          const nextYr = financeYear + 1;
          if (availableYears.includes(nextYr)) {
            setFinanceYear(nextYr);
            setFinanceMonth(0);
            setFinanceWeek(0);
          }
        }
      }
    } else if (financeView === 'month') {
      if (financeMonth < 11) {
        setFinanceMonth(financeMonth + 1);
      } else {
        const nextYr = financeYear + 1;
        if (availableYears.includes(nextYr)) {
          setFinanceYear(nextYr);
          setFinanceMonth(0);
        }
      }
    } else if (financeView === 'year') {
      const nextYr = financeYear + 1;
      if (availableYears.includes(nextYr)) {
        setFinanceYear(nextYr);
      }
    }
  };

  // Reusable custom Select sub-component with hover state
  const SelectField = ({ value, onChange, options, style = {} }) => {
    const [hover, setHover] = useState(false);
    return (
      <select
        value={value}
        onChange={onChange}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: '#fff',
          border: hover ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '6px 10px',
          fontSize: '0.72rem',
          fontWeight: '700',
          color: '#1e293b',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          transition: 'all 0.15s ease-in-out',
          fontFamily: 'inherit',
          ...style
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  };

  // Shared date and year lists
  const availableYears = useMemo(() => {
    const years = new Set();
    const curYear = new Date().getFullYear();
    for (let y = curYear - 2; y <= curYear + 2; y++) {
      years.add(y);
    }
    inquiries.forEach(inq => {
      if (inq.created_at) {
        const yr = new Date(inq.created_at).getFullYear();
        if (yr) years.add(yr);
      }
    });
    return Array.from(years).sort((a, b) => a - b);
  }, [inquiries]);

  const getWeek4EndDay = (yr, mo) => {
    return new Date(yr, mo + 1, 0).getDate();
  };

  const getWeekOptions = (yr, mo) => [
    { value: 0, label: `1–7` },
    { value: 1, label: `8–14` },
    { value: 2, label: `15–21` },
    { value: 3, label: `22–${getWeek4EndDay(yr, mo)}` }
  ];

  const formatCompactRupees = (valLakhs) => {
    const rupees = valLakhs * 100000;
    if (rupees === 0) return '₹0';
    if (rupees >= 10000000) {
      return `₹${(rupees / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
    }
    if (rupees >= 100000) {
      return `₹${(rupees / 100000).toFixed(2).replace(/\.00$/, '')} L`;
    }
    if (rupees >= 1000) {
      return `₹${(rupees / 1000).toFixed(1).replace(/\.0$/, '')} K`;
    }
    return `₹${rupees}`;
  };

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

    if (leadsView === 'week') {
      return selectedYear > curYr || 
             (selectedYear === curYr && selectedMonth > curMo) || 
             (selectedYear === curYr && selectedMonth === curMo && selectedWeek >= curWk);
    }
    if (leadsView === 'month') {
      return selectedYear > curYr || 
             (selectedYear === curYr && selectedMonth >= curMo);
    }
    if (leadsView === 'year') {
      return selectedYear >= curYr;
    }
    return false;
  };

  const handlePrevPeriod = () => {
    if (leadsView === 'week') {
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
    } else if (leadsView === 'month') {
      if (selectedMonth > 0) {
        setSelectedMonth(selectedMonth - 1);
      } else {
        const prevYr = selectedYear - 1;
        if (availableYears.includes(prevYr)) {
          setSelectedYear(prevYr);
          setSelectedMonth(11);
        }
      }
    } else if (leadsView === 'year') {
      const prevYr = selectedYear - 1;
      if (availableYears.includes(prevYr)) {
        setSelectedYear(prevYr);
      }
    }
  };

  const handleNextPeriod = () => {
    if (leadsView === 'week') {
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
    } else if (leadsView === 'month') {
      if (selectedMonth < 11) {
        setSelectedMonth(selectedMonth + 1);
      } else {
        const nextYr = selectedYear + 1;
        if (availableYears.includes(nextYr)) {
          setSelectedYear(nextYr);
          setSelectedMonth(0);
        }
      }
    } else if (leadsView === 'year') {
      const nextYr = selectedYear + 1;
      if (availableYears.includes(nextYr)) {
        setSelectedYear(nextYr);
      }
    }
  };

  const isVelocityNextDisabled = () => {
    const now = new Date();
    const curYr = now.getFullYear();
    const curMo = now.getMonth();
    const curDay = now.getDate();
    let curWk = 0;
    if (curDay <= 7) curWk = 0;
    else if (curDay <= 14) curWk = 1;
    else if (curDay <= 21) curWk = 2;
    else curWk = 3;

    if (velocityRange === 'WEEK') {
      return velocityYear > curYr || 
             (velocityYear === curYr && velocityMonth > curMo) || 
             (velocityYear === curYr && velocityMonth === curMo && velocityWeek >= curWk);
    }
    if (velocityRange === 'MONTH') {
      return velocityYear > curYr || 
             (velocityYear === curYr && velocityMonth >= curMo);
    }
    if (velocityRange === 'H1') {
      return velocityYear > curYr || (velocityYear === curYr && curMo < 6);
    }
    if (velocityRange === 'H2') {
      return velocityYear >= curYr;
    }
    return false;
  };

  const handlePrevVelocityPeriod = () => {
    if (velocityRange === 'WEEK') {
      if (velocityWeek > 0) {
        setVelocityWeek(velocityWeek - 1);
      } else {
        if (velocityMonth > 0) {
          setVelocityMonth(velocityMonth - 1);
          setVelocityWeek(3);
        } else {
          const prevYr = velocityYear - 1;
          if (availableYears.includes(prevYr)) {
            setVelocityYear(prevYr);
            setVelocityMonth(11);
            setVelocityWeek(3);
          }
        }
      }
    } else if (velocityRange === 'MONTH') {
      if (velocityMonth > 0) {
        setVelocityMonth(velocityMonth - 1);
      } else {
        const prevYr = velocityYear - 1;
        if (availableYears.includes(prevYr)) {
          setVelocityYear(prevYr);
          setVelocityMonth(11);
        }
      }
    } else if (velocityRange === 'H1') {
      const prevYr = velocityYear - 1;
      if (availableYears.includes(prevYr)) {
        setVelocityYear(prevYr);
        setVelocityRange('H2');
      }
    } else if (velocityRange === 'H2') {
      setVelocityRange('H1');
    }
  };

  const handleNextVelocityPeriod = () => {
    if (velocityRange === 'WEEK') {
      if (velocityWeek < 3) {
        setVelocityWeek(velocityWeek + 1);
      } else {
        if (velocityMonth < 11) {
          setVelocityMonth(velocityMonth + 1);
          setVelocityWeek(0);
        } else {
          const nextYr = velocityYear + 1;
          if (availableYears.includes(nextYr)) {
            setVelocityYear(nextYr);
            setVelocityMonth(0);
            setVelocityWeek(0);
          }
        }
      }
    } else if (velocityRange === 'MONTH') {
      if (velocityMonth < 11) {
        setVelocityMonth(velocityMonth + 1);
      } else {
        const nextYr = velocityYear + 1;
        if (availableYears.includes(nextYr)) {
          setVelocityYear(nextYr);
          setVelocityMonth(0);
        }
      }
    } else if (velocityRange === 'H1') {
      setVelocityRange('H2');
    } else if (velocityRange === 'H2') {
      const nextYr = velocityYear + 1;
      if (availableYears.includes(nextYr)) {
        setVelocityYear(nextYr);
        setVelocityRange('H1');
      }
    }
  };

  const isRevenueNextDisabled = () => {
    const now = new Date();
    const curYr = now.getFullYear();
    const curMo = now.getMonth();
    const curDay = now.getDate();
    let curWk = 0;
    if (curDay <= 7) curWk = 0;
    else if (curDay <= 14) curWk = 1;
    else if (curDay <= 21) curWk = 2;
    else curWk = 3;

    if (revenueView === 'week') {
      return revenueYear > curYr || 
             (revenueYear === curYr && revenueMonth > curMo) || 
             (revenueYear === curYr && revenueMonth === curMo && revenueWeek >= curWk);
    }
    if (revenueView === 'month') {
      return revenueYear > curYr || 
             (revenueYear === curYr && revenueMonth >= curMo);
    }
    if (revenueView === 'year') {
      return revenueYear >= curYr;
    }
    return false;
  };

  const handlePrevRevenuePeriod = () => {
    if (revenueView === 'week') {
      if (revenueWeek > 0) {
        setRevenueWeek(revenueWeek - 1);
      } else {
        if (revenueMonth > 0) {
          setRevenueMonth(revenueMonth - 1);
          setRevenueWeek(3);
        } else {
          const prevYr = revenueYear - 1;
          if (availableYears.includes(prevYr)) {
            setRevenueYear(prevYr);
            setRevenueMonth(11);
            setRevenueWeek(3);
          }
        }
      }
    } else if (revenueView === 'month') {
      if (revenueMonth > 0) {
        setRevenueMonth(revenueMonth - 1);
      } else {
        const prevYr = revenueYear - 1;
        if (availableYears.includes(prevYr)) {
          setRevenueYear(prevYr);
          setRevenueMonth(11);
        }
      }
    } else if (revenueView === 'year') {
      const prevYr = revenueYear - 1;
      if (availableYears.includes(prevYr)) {
        setRevenueYear(prevYr);
      }
    }
  };

  const handleNextRevenuePeriod = () => {
    if (revenueView === 'week') {
      if (revenueWeek < 3) {
        setRevenueWeek(revenueWeek + 1);
      } else {
        if (revenueMonth < 11) {
          setRevenueMonth(revenueMonth + 1);
          setRevenueWeek(0);
        } else {
          const nextYr = revenueYear + 1;
          if (availableYears.includes(nextYr)) {
            setRevenueYear(nextYr);
            setRevenueMonth(0);
            setRevenueWeek(0);
          }
        }
      }
    } else if (revenueView === 'month') {
      if (revenueMonth < 11) {
        setRevenueMonth(revenueMonth + 1);
      } else {
        const nextYr = revenueYear + 1;
        if (availableYears.includes(nextYr)) {
          setRevenueYear(nextYr);
          setRevenueMonth(0);
        }
      }
    } else if (revenueView === 'year') {
      const nextYr = revenueYear + 1;
      if (availableYears.includes(nextYr)) {
        setRevenueYear(nextYr);
      }
    }
  };

  // Helper to parse amount strings like "₹ 14.25 Cr" or "₹ 15.20 L" or "₹ 85,000" to Lakhs
  const parseAmountVal = (val) => {
    if (!val) return 0;
    
    if (typeof val === 'number') {
      return val < 1000 ? val * 100 : val / 100000;
    }
    
    const lowerVal = val.toString().toLowerCase();
    const cleaned = lowerVal.replace(/[^\d.]/g, '');
    let num = parseFloat(cleaned) || 0;
    
    if (lowerVal.includes('cr') || lowerVal.includes('crore')) {
      num = num * 100;
    } else if (lowerVal.includes('l') || lowerVal.includes('lakh')) {
      // already in Lakhs
    } else {
      // If no unit is specified and the number is small, assume Crores. Otherwise Rupees.
      num = num < 1000 ? num * 100 : num / 100000;
    }
    
    return num;
  };

  // Helper to compute monthly/weekly/daily revenue from real BuyerDetails and PropertyUnits
  const getRevenueData = (view = revenueView, yr = revenueYear, mo = revenueMonth, wk = revenueWeek, type = revenueViewType) => {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    const payments = (buyers || [])
      .map((b) => {
        const total = parseAmountVal(b.total_amount);
        const paid = parseAmountVal(b.amount_paid);
        const remaining = total - paid;
        
        // For actuals:
        const dtRaw = b.paid_at || b.payment_date || b.updated_at || b.created_at;
        const dtActual = dtRaw ? new Date(dtRaw) : null;
        
        // For projection:
        const dtProj = b.next_payment_date ? new Date(b.next_payment_date) : null;
        
        return { total, paid, remaining, dtActual, dtProj, rawBuyer: b };
      });

    let points = [];

    if (view === 'week') {
      let startDay = 1;
      let endDay = 7;
      if (wk === 0) { startDay = 1; endDay = 7; }
      else if (wk === 1) { startDay = 8; endDay = 14; }
      else if (wk === 2) { startDay = 15; endDay = 21; }
      else if (wk === 3) {
        startDay = 22;
        endDay = getWeek4EndDay(yr, mo);
      }

      for (let day = startDay; day <= endDay; day++) {
        const d = new Date(yr, mo, day);
        const label = `${DAYS[d.getDay()]} ${day}`;
        let value = 0;

        payments.forEach(p => {
          if (type === 'past') {
            if (p.dtActual && p.dtActual.getFullYear() === yr && p.dtActual.getMonth() === mo && p.dtActual.getDate() === day) {
              value += p.paid;
            }
          } else {
            // Projection
            if (p.dtProj && p.dtProj.getFullYear() === yr && p.dtProj.getMonth() === mo && p.dtProj.getDate() === day) {
              value += p.remaining * 0.5;
            }
          }
        });

        points.push({ label, value });
      }
    } else if (view === 'month') {
      const dim = getWeek4EndDay(yr, mo);
      const weeks = [
        { s: 1, e: 7 },
        { s: 8, e: 14 },
        { s: 15, e: 21 },
        { s: 22, e: dim }
      ];

      weeks.forEach((w, index) => {
        let value = 0;
        payments.forEach(p => {
          if (type === 'past') {
            if (p.dtActual && p.dtActual.getFullYear() === yr && p.dtActual.getMonth() === mo) {
              const dateVal = p.dtActual.getDate();
              if (dateVal >= w.s && dateVal <= w.e) {
                value += p.paid;
              }
            }
          } else {
            // Projection
            if (p.dtProj && p.dtProj.getFullYear() === yr && p.dtProj.getMonth() === mo) {
              const dateVal = p.dtProj.getDate();
              if (dateVal >= w.s && dateVal <= w.e) {
                value += p.remaining * 0.5;
              }
            }
          }
        });
        points.push({ label: `W${index + 1} (${w.s}–${w.e} ${MONTHS[mo]})`, value });
      });
    } else {
      // Year view
      MONTHS.forEach((m, monthIdx) => {
        let value = 0;
        payments.forEach(p => {
          if (type === 'past') {
            if (p.dtActual && p.dtActual.getFullYear() === yr && p.dtActual.getMonth() === monthIdx) {
              value += p.paid;
            }
          } else {
            // Projection
            if (p.dtProj && p.dtProj.getFullYear() === yr && p.dtProj.getMonth() === monthIdx) {
              value += p.remaining * 0.5;
            }
          }
        });
        points.push({ label: m, value });
      });
    }

    return points;
  };

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const formatShortDay = (d) =>
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase();

  const getWeekOfMonth = (d) => {
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const firstDay = first.getDay(); // 0=Sun
    const offset = (firstDay + 6) % 7; // Monday-based index
    return Math.floor((d.getDate() + offset - 1) / 7) + 1;
  };

  const getVelocityData = (range) => {
    const payments = (buyers || [])
      .map((b) => {
        const amtLakhs = parseAmountVal(b.amount_paid);
        const dt = b.created_at ? new Date(b.created_at) : null;
        return { amtLakhs, dt };
      })
      .filter((p) => p.dt && !Number.isNaN(p.dt.getTime()) && p.amtLakhs > 0);

    if (range === 'WEEK') {
      const yr = velocityYear;
      const mo = velocityMonth;
      let startDay = 1;
      let endDay = 7;
      if (velocityWeek === 0) { startDay = 1; endDay = 7; }
      else if (velocityWeek === 1) { startDay = 8; endDay = 14; }
      else if (velocityWeek === 2) { startDay = 15; endDay = 21; }
      else if (velocityWeek === 3) {
        startDay = 22;
        endDay = getWeek4EndDay(yr, mo);
      }

      const buckets = [];
      for (let day = startDay; day <= endDay; day++) {
        const d = new Date(yr, mo, day);
        buckets.push({ label: formatShortDay(d), day, valueLakhs: 0 });
      }

      payments.forEach((p) => {
        if (p.dt.getFullYear() === yr && p.dt.getMonth() === mo) {
          const dateVal = p.dt.getDate();
          const b = buckets.find((x) => x.day === dateVal);
          if (b) b.valueLakhs += p.amtLakhs;
        }
      });

      return buckets.map((b) => ({ label: b.label, valueCr: b.valueLakhs / 100 }));
    }

    if (range === 'MONTH') {
      const yr = velocityYear;
      const mo = velocityMonth;
      const dim = getWeek4EndDay(yr, mo);
      const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

      const weeks = [
        { s: 1, e: 7 },
        { s: 8, e: 14 },
        { s: 15, e: 21 },
        { s: 22, e: dim }
      ];

      const buckets = weeks.map((w, index) => ({
        label: `W${index + 1} (${w.s}–${w.e} ${MONTHS[mo]})`,
        s: w.s,
        e: w.e,
        valueLakhs: 0
      }));

      payments.forEach((p) => {
        if (p.dt.getFullYear() === yr && p.dt.getMonth() === mo) {
          const dateVal = p.dt.getDate();
          const b = buckets.find((x) => dateVal >= x.s && dateVal <= x.e);
          if (b) b.valueLakhs += p.amtLakhs;
        }
      });

      return buckets.map((b) => ({ label: b.label, valueCr: b.valueLakhs / 100 }));
    }

    // H1 or H2
    const yr = velocityYear;
    const startMonth = range === 'H1' ? 0 : 6; // Jan=0 or Jul=6
    const monthNames =
      range === 'H1'
        ? ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN']
        : ['JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    const buckets = monthNames.map((label, i) => ({
      label,
      monthIndex: startMonth + i,
      valueLakhs: 0
    }));

    payments.forEach((p) => {
      if (p.dt.getFullYear() !== yr) return;
      const mi = p.dt.getMonth();
      const b = buckets.find((x) => x.monthIndex === mi);
      if (b) b.valueLakhs += p.amtLakhs;
    });

    return buckets.map((b) => ({ label: b.label, valueCr: b.valueLakhs / 100 }));
  };
  const normalizeUnitStatus = (raw) => {
    const s = (raw || '').toString().trim().toUpperCase();
    if (!s) return 'AVAILABLE';
    if (s === 'SOLD' || s === 'SOLDOUT' || s === 'SOLD_OUT') return 'SOLD OUT';
    if (s === 'NEGOTIATION' || s === 'IN_NEGOTIATION' || s === 'IN-NEGOTIATION') return 'IN NEGOTIATION';
    if (s === 'BOOKED') return 'RESERVED';
    return s;
  };

  const getDashboardUnitsForProject = (proj) => {
    if (proj === 'vanya-estate') {
      const generated = [];
      for (let lvl = 1; lvl <= 10; lvl++) {
        for (let i = 1; i <= 10; i++) {
          const unitId = lvl * 100 + i;
          const seedValue = (unitId * 7) % 10;
          let status = 'AVAILABLE';
          if (seedValue < 3) status = 'SOLD OUT';
          else if (seedValue < 5) status = 'RESERVED';
          generated.push({ unit_id: unitId.toString(), floor: lvl.toString(), status });
        }
      }
      return generated;
    }

    if (proj === 'vanya-meadows') {
      const generated = [];
      for (let lvl = 1; lvl <= 10; lvl++) {
        for (let i = 1; i <= 8; i++) {
          const unitId = lvl * 100 + i;
          const seedValue = (unitId * 13) % 10;
          let status = 'AVAILABLE';
          if (seedValue < 2) status = 'SOLD OUT';
          else if (seedValue < 3) status = 'RESERVED';
          generated.push({ unit_id: unitId.toString(), floor: lvl.toString(), status });
        }
      }
      return generated;
    }

    // For vanya-residences (and any unknown projects), trust the backend query result.
    // We intentionally do NOT filter client-side by a project field because the DB may
    // store a different naming convention (and filtering can mistakenly drop all sold/reserved units).
    return (units || []);
  };

  const dashboardUnits = getDashboardUnitsForProject(project).map((u) => ({
    ...u,
    status: normalizeUnitStatus(u?.status)
  }));

  const totalLeadsCount = inquiries.filter(inq => !inq.source?.startsWith('UNIT_ASSIGNMENT_')).length;
  const soldUnitsCount = dashboardUnits.filter(u => u.status === 'SOLD OUT').length;
  const availableUnitsCount = dashboardUnits.filter(u => u.status === 'AVAILABLE').length;
  const reservedUnitsCount = dashboardUnits.filter(u => u.status === 'RESERVED' || u.status === 'IN NEGOTIATION').length;
  const activeLeadsCount = inquiries.filter(inq => 
    inq.status && !inq.status.startsWith('DONE|') && !inq.status.startsWith('SCHEDULED|') && !inq.source?.startsWith('UNIT_ASSIGNMENT_')
  ).length;
  const hotLeadsCount = inquiries.filter(inq => inq.status && inq.status.startsWith('HOT')).length;
  const conversionRate = totalLeadsCount > 0 ? Math.round((soldUnitsCount / totalLeadsCount) * 100) : 0;

  const totalUnitsCount = dashboardUnits.length;
  const soldPerc = totalUnitsCount > 0 ? Math.round((soldUnitsCount / totalUnitsCount) * 100) : 0;
  const reservedPerc = totalUnitsCount > 0 ? Math.round((reservedUnitsCount / totalUnitsCount) * 100) : 0;
  const availablePerc = totalUnitsCount > 0 ? Math.max(0, 100 - soldPerc - reservedPerc) : 0;

  const formatIndianCurrency = (amountInLakhs) => {
    const val = Math.round(amountInLakhs * 100000);
    return new Intl.NumberFormat('en-IN').format(val);
  };

  const unitPrices = units.map(u => parseAmountVal(u.price)).filter(p => p > 0);
  const avgPriceLakhs = unitPrices.length > 0 ? unitPrices.reduce((sum, p) => sum + p, 0) / unitPrices.length : 0;
  const avgPriceFormatted = formatIndianCurrency(avgPriceLakhs);

  const totalPortfolioLakhs = units.map(u => parseAmountVal(u.price)).reduce((sum, p) => sum + p, 0);
  const totalPortfolioFormatted = formatIndianCurrency(totalPortfolioLakhs);

  const totalRevenueLakhs = buyers.map(b => parseAmountVal(b.amount_paid)).reduce((sum, p) => sum + p, 0);
  const totalRevenueFormatted = formatIndianCurrency(totalRevenueLakhs);

  const totalCollectionFormatted = totalRevenueFormatted;

  const realSalesCycle = useMemo(() => {
    if (!buyers || buyers.length === 0) return 0;
    const cycles = buyers.map(b => {
      const buyerDate = new Date(b.created_at || new Date());
      let matchingInq = inquiries.find(inq => 
        inq.name && b.username && 
        inq.name.toLowerCase().replace(/\s+/g, '') === b.username.toLowerCase().replace(/\s+/g, '')
      );
      if (!matchingInq && b.unit_id) {
        const assignInq = inquiries.find(inq => inq.source === `UNIT_ASSIGNMENT_${b.unit_id}`);
        if (assignInq && assignInq.name) {
          matchingInq = inquiries.find(inq => 
            inq.name && !inq.source?.startsWith('UNIT_ASSIGNMENT_') &&
            inq.name.toLowerCase().trim() === assignInq.name.toLowerCase().trim()
          );
        }
      }
      if (matchingInq) {
        const inqDate = new Date(matchingInq.created_at);
        return Math.max(1, Math.round((buyerDate - inqDate) / (1000 * 60 * 60 * 24)));
      }
      return 0;
    }).filter(c => c > 0);
    return cycles.length > 0 ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length) : 0;
  }, [buyers, inquiries]);

  const portfolioIncreasePerc = useMemo(() => {
    if (project !== 'vanya-residences') {
      return project === 'vanya-estate' ? 18.4 : 21.0;
    }
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let recentVal = 0;
    let olderVal = 0;
    (units || []).forEach(u => {
      const price = parseAmountVal(u.price);
      const date = u.created_at ? new Date(u.created_at) : null;
      if (date && date >= thirtyDaysAgo) {
        recentVal += price;
      } else {
        olderVal += price;
      }
    });
    if (olderVal > 0 && recentVal > 0) {
      return parseFloat(((recentVal / olderVal) * 100).toFixed(1));
    }
    return 15.2; // default fallback
  }, [units, project]);

  const revenueIncreasePerc = useMemo(() => {
    if (project !== 'vanya-residences') {
      return project === 'vanya-estate' ? 8.5 : 5.2;
    }
    const now = new Date();
    const currentQuarterStart = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const prevQuarterStart = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    let currentQuarterRevenue = 0;
    let prevQuarterRevenue = 0;
    (buyers || []).forEach(b => {
      const amt = parseAmountVal(b.amount_paid);
      const date = b.created_at ? new Date(b.created_at) : null;
      if (!date || isNaN(date.getTime())) return;
      if (date >= currentQuarterStart && date <= now) {
        currentQuarterRevenue += amt;
      } else if (date >= prevQuarterStart && date < currentQuarterStart) {
        prevQuarterRevenue += amt;
      }
    });
    if (prevQuarterRevenue > 0) {
      return parseFloat(((currentQuarterRevenue - prevQuarterRevenue) / prevQuarterRevenue * 100).toFixed(1));
    } else if (currentQuarterRevenue > 0) {
      return 100.0;
    }
    return 12.4; // default fallback
  }, [buyers, project]);

  const salesCycleImprovement = useMemo(() => {
    if (project !== 'vanya-residences') {
      return project === 'vanya-estate' ? -2 : 0;
    }
    if (!buyers || buyers.length === 0) return -4;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const getAvgCycle = (filterFn) => {
      const cycles = buyers.filter(filterFn).map(b => {
        let matchingInq = inquiries.find(inq => 
          inq.name && b.username && 
          inq.name.toLowerCase().replace(/\s+/g, '') === b.username.toLowerCase().replace(/\s+/g, '')
        );
        if (!matchingInq && b.unit_id) {
          const assignInq = inquiries.find(inq => inq.source === `UNIT_ASSIGNMENT_${b.unit_id}`);
          if (assignInq && assignInq.name) {
            matchingInq = inquiries.find(inq => 
              inq.name && !inq.source?.startsWith('UNIT_ASSIGNMENT_') &&
              inq.name.toLowerCase().trim() === assignInq.name.toLowerCase().trim()
            );
          }
        }
        if (matchingInq) {
          const buyerDate = new Date(b.created_at || new Date());
          const inqDate = new Date(matchingInq.created_at);
          return Math.max(1, Math.round((buyerDate - inqDate) / (1000 * 60 * 60 * 24)));
        }
        return 0;
      }).filter(c => c > 0);
      return cycles.length > 0 ? cycles.reduce((a, b) => a + b, 0) / cycles.length : 0;
    };
    const recentAvg = getAvgCycle(b => b.created_at && new Date(b.created_at) >= thirtyDaysAgo);
    const olderAvg = getAvgCycle(b => !b.created_at || new Date(b.created_at) < thirtyDaysAgo);
    if (recentAvg > 0 && olderAvg > 0) {
      return Math.round(recentAvg - olderAvg);
    }
    return -4; // default fallback
  }, [buyers, inquiries, project]);

  const conversionRateReal = useMemo(() => {
    return totalLeadsCount > 0 ? parseFloat(((soldUnitsCount / totalLeadsCount) * 100).toFixed(1)) : 0;
  }, [soldUnitsCount, totalLeadsCount]);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const collectedThisMonthLakhs = buyers.reduce((sum, b) => {
    const paymentDate = b.created_at ? new Date(b.created_at) : new Date();
    if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
      return sum + parseAmountVal(b.amount_paid);
    }
    return sum;
  }, 0);
  const collectedThisMonthFormatted = formatIndianCurrency(collectedThisMonthLakhs);

  const totalPendingLakhs = buyers.reduce((sum, b) => {
    const total = parseAmountVal(b.total_amount);
    const paid = parseAmountVal(b.amount_paid);
    return sum + Math.max(0, total - paid);
  }, 0);
  const pendingInstallmentsFormatted = formatIndianCurrency(totalPendingLakhs);
  const totalOverdueLakhs = buyers.reduce((sum, b) => {
    const total = parseAmountVal(b.total_amount);
    const paid = parseAmountVal(b.amount_paid);
    const progress = parseFloat(b.construction_progress) || 0;
    
    // Expected payment is tied to construction progress percentage
    const expectedPayment = total * (progress / 100);
    
    if (paid < expectedPayment) {
      return sum + (expectedPayment - paid);
    }
    return sum;
  }, 0);
  const overdueAmountFormatted = formatIndianCurrency(totalOverdueLakhs);

  const handleDeleteUser = async (username, role, action = 'deactivate') => {
    const verb = action === 'activate' ? 'reactivate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${verb} the user "${username}"?`)) return;
    
    try {
      let res;
      if (role === 'Buyer') {
        res = await fetch(`/api/buyers?username=${username}`, {
          method: 'DELETE'
        });
      } else if (role === 'Sales') {
        res = await fetch(`/api/sales?username=${username}&action=${action}`, {
          method: 'DELETE'
        });
      } else {
        res = await fetch(`/api/cp?username=${username}&action=${action}`, {
          method: 'DELETE'
        });
      }
      
      const data = await res.json();
      if (data.success) {
        alert(`User "${username}" ${verb}d successfully!`);
        router.refresh();
        setTimeout(() => window.location.reload(), 300);
      } else {
        alert(data.error || `Failed to ${verb} user.`);
      }
    } catch (err) {
      alert(`Error trying to ${verb} user: ` + err.message);
    }
  };

  // Handle lead assignment
  const handleAssignLead = async (leadId, salesmanId) => {
    try {
      if (!salesmanId || salesmanId === 'unassigned') {
        alert('Salesman ID required. Please select a representative.');
        return;
      }

      const currentInquiry = inquiries.find((x) => String(x.id) === String(leadId));
      const currentStatus = (currentInquiry?.status || 'NEW').toString();
      const baseStage = currentStatus.includes('|') ? currentStatus.split('|')[0] : currentStatus;
      const nextStatus = `${baseStage}|${salesmanId}`;

      const res = await fetch(`/api/inquiries?id=${encodeURIComponent(leadId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        alert('Lead assigned successfully!');
        window.location.reload();
      } else {
        alert(data.error || 'Failed to assign lead.');
      }
    } catch (e) {
      alert('Error updating assignment.');
    }
  };

  // Projects list is now managed dynamically as a state variable

  // ── Leads Overview: data + navigation ──────────────────────────────
  const getLeadsChartInfo = () => {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const isRealInq = (inq) =>
      !inq.source?.startsWith('UNIT_ASSIGNMENT_') &&
      !inq.status?.startsWith('SCHEDULED|') &&
      !inq.status?.startsWith('DONE|');

    let points = [], periodLabel = '';

    if (leadsView === 'week') {
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
        const count = inquiries.filter(inq => {
          if (!isRealInq(inq)) return false;
          const id = new Date(inq.created_at);
          return id.getFullYear() === yr && id.getMonth() === mo && id.getDate() === day;
        }).length;
        points.push({ label, count });
      }
    } else if (leadsView === 'month') {
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
        const total = inquiries.filter(inq => {
          if (!isRealInq(inq)) return false;
          const d = new Date(inq.created_at);
          return d.getFullYear() === yr && d.getMonth() === mo && d.getDate() >= w.s && d.getDate() <= w.e;
        }).length;
        points.push({ label: `W${index + 1} (${w.s}–${w.e} ${MONTHS[mo]})`, count: total });
      });
    } else {
      const yr = selectedYear;
      periodLabel = `${yr}`;
      MONTHS.forEach((m, mo) => {
        const count = inquiries.filter(inq => {
          if (!isRealInq(inq)) return false;
          const d = new Date(inq.created_at);
          return d.getFullYear() === yr && d.getMonth() === mo;
        }).length;
        points.push({ label: m, count });
      });
    }

    return { points, periodLabel };
  };

  const { points: leadsData, periodLabel: leadsPeriodLabel } = getLeadsChartInfo();
  const leadsTotal = leadsData.reduce((s, p) => s + p.count, 0);

  // Y-axis generation: round yMaxLeads up to nearest multiple of 4 (minimum 4)
  const rawMax = Math.max(...leadsData.map(p => p.count), 0);
  const yMaxLeads = rawMax < 4 ? 4 : Math.ceil(rawMax / 4) * 4;

  const svgW = 500; const svgH = 145; const padL = 38; const padB = 30;
  const plotW = svgW - padL - 12; const plotH = svgH - padB - 12;
  const xStep   = plotW / Math.max(leadsData.length - 1, 1);
  const yOf     = (c) => 12 + plotH - (c / yMaxLeads) * plotH;
  const leadsPathD = leadsData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * xStep} ${yOf(p.count)}`).join(' ');
  const leadsFillD = leadsData.length > 0
    ? `M ${padL} ${12 + plotH} ${leadsData.map((p, i) => `L ${padL + i * xStep} ${yOf(p.count)}`).join(' ')} L ${padL + (leadsData.length - 1) * xStep} ${12 + plotH} Z`
    : '';

  // Compute dynamic Revenue Overview data
  const revMonths = getRevenueData(revenueView, revenueYear, revenueMonth, revenueWeek);
  const maxRev = Math.max(...revMonths.map(m => m.value), 10);

  // Mock activities for Dashboard Audit Log
  const activities = [
    { text: "Lead Aarav Singhania assigned to Vikram Sethi", time: "10 mins ago" },
    { text: "Booking verified for Flat 101 by Ram Kumar", time: "1 hour ago" },
    { text: "Milestone payment of ₹ 1.25 Cr verified", time: "3 hours ago" },
    { text: "Flat 204 marked as RESERVED", time: "5 hours ago" },
    { text: "CP Payout approved for Apex Luxury Realty", time: "Yesterday" }
  ];

  const getReportData = (type) => {
    let title = '';
    let headers = [];
    let rows = [];
    let summaryStats = {};

    if (type === 'sales') {
      title = 'Sales & Leads Report';
      headers = ['Name', 'Email', 'Phone', 'Aadhaar', 'Source', 'Salesperson', 'Status', 'Registered Date'];
      
      const salesInquiries = inquiries.filter(inq => 
        !(inq.source || '').startsWith('UNIT_ASSIGNMENT_') &&
        !(inq.status || '').startsWith('SCHEDULED|') &&
        !(inq.status || '').startsWith('DONE|')
      );

      rows = salesInquiries.map(inq => {
        const parts = (inq.status || '').split('|');
        const status = parts[0] || 'NEW';
        const rep = parts[1] || 'unassigned';
        return [
          inq.name || 'N/A',
          inq.email || 'N/A',
          inq.phone || 'N/A',
          inq.aadhaar || 'N/A',
          inq.source || 'Direct/Website',
          rep,
          status,
          inq.created_at ? new Date(inq.created_at).toLocaleDateString() : 'N/A'
        ];
      });

      summaryStats = {
        'Total Leads': salesInquiries.length,
        'Assigned Leads': salesInquiries.filter(inq => (inq.status || '').includes('|') && !(inq.status || '').includes('|unassigned')).length,
        'Unassigned Leads': salesInquiries.filter(inq => !(inq.status || '').includes('|') || (inq.status || '').includes('|unassigned')).length
      };
    } 
    else if (type === 'bookings') {
      title = 'Property Bookings Report';
      headers = ['Buyer Portal Account', 'Unit ID', 'Amount Paid', 'Total Equity Value', 'Handover Projection', 'Progress'];
      
      rows = buyers.map(b => [
        b.username || 'N/A',
        `Flat ${b.unit_id}`,
        b.amount_paid || 'N/A',
        b.total_amount || 'N/A',
        b.possession_date || 'DECEMBER 2027',
        `${b.construction_progress || 0}%`
      ]);

      summaryStats = {
        'Total Bookings': buyers.length,
        'Project Name': 'Vanya Residences'
      };
    } 
    else if (type === 'collections') {
      title = 'Financial Collections Report';
      headers = ['Buyer Account', 'Project', 'Demand Instalment', 'Amount Received', 'Payment Status'];
      
      rows = buyers.map(b => [
        b.username || 'N/A',
        'Vanya Residences',
        `Progress demand (${b.construction_progress || 0}%)`,
        b.amount_paid || 'N/A',
        'RECEIVED & CLEAR'
      ]);

      summaryStats = {
        'Total Collections Transacted': buyers.length,
        'Instalment Clearing Rate': '100%'
      };
    } 
    else if (type === 'inventory') {
      title = 'Property Inventory Report';
      headers = ['Unit ID', 'Floor', 'Type', 'Area (sqft)', 'Price', 'Status'];
      
      rows = units.map(u => [
        u.unit_id || 'N/A',
        u.floor || 'N/A',
        u.type || 'N/A',
        u.area || 'N/A',
        u.price || 'N/A',
        u.status || 'N/A'
      ]);

      summaryStats = {
        'Total Units': units.length,
        'Available Units': units.filter(u => u.status === 'AVAILABLE').length,
        'Reserved/Sold Units': units.filter(u => u.status !== 'AVAILABLE').length
      };
    } 
    else if (type === 'cp') {
      title = 'CP Brokers & Commissions Report';
      headers = ['Firm Name', 'RERA Registration Number', 'Commission Percentage'];
      
      rows = cpPartners.map(cp => [
        cp.firm_name || 'N/A',
        cp.rera_number || 'N/A',
        `${cp.commission_rate || 0}%`
      ]);

      summaryStats = {
        'Active CP Brokers': cpPartners.length,
        'Pending Commissions': commissions.filter(c => c.status === 'PENDING').length
      };
    }

    return { title, headers, rows, summaryStats };
  };

  const handleExportCSV = () => {
    const { title, headers, rows } = getReportData(reportType);
    const csvRows = [];
    csvRows.push([`"${title}"`]);
    csvRows.push([]);
    csvRows.push(headers.map(h => `"${h}"`).join(','));
    rows.forEach(row => {
      csvRows.push(row.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','));
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${reportType}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const { title, headers, rows, summaryStats } = getReportData(reportType);
    let html = '';
    html += '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head>';
    html += '  <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">';
    html += '  <style>';
    html += '    body { font-family: Arial, sans-serif; }';
    html += '    .title { font-size: 16px; font-weight: bold; color: #1e3a8a; }';
    html += '    .header { background-color: #f3f4f6; font-weight: bold; border: 1px solid #d1d5db; }';
    html += '    td { border: 1px solid #e5e7eb; padding: 6px; }';
    html += '    .stat-label { font-weight: bold; }';
    html += '  </style>';
    html += '</head>';
    html += '<body>';
    html += '  <table>';
    html += '    <tr><td class="title" colspan="' + headers.length + '">' + title + '</td></tr>';
    html += '    <tr><td colspan="' + headers.length + '">Generated on: ' + new Date().toLocaleString() + '</td></tr>';
    html += '    <tr></tr>';
    
    Object.entries(summaryStats).forEach(([key, val]) => {
      html += '<tr><td class="stat-label">' + key + '</td><td>' + val + '</td></tr>';
    });
    
    html += '    <tr></tr><tr>';
    headers.forEach(h => {
      html += '<td class="header">' + h + '</td>';
    });
    html += '</tr>';
    
    rows.forEach(row => {
      html += '<tr>';
      row.forEach(val => {
        html += '<td>' + val + '</td>';
      });
      html += '</tr>';
    });
    html += '  </table>';
    html += '</body>';
    html += '</html>';
    
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${reportType}_report_${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const { title, headers, rows, summaryStats } = getReportData(reportType);
    const printWindow = window.open('', '_blank');
    
    let html = '';
    html += '<html>';
    html += '<head>';
    html += '  <title>' + title + '</title>';
    html += '  <style>';
    html += '    body { font-family: "Inter", sans-serif; color: #1f2937; padding: 2rem; }';
    html += '    .header { border-bottom: 2px solid #b08e40; padding-bottom: 1rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-end; }';
    html += '    .title { font-size: 24px; font-weight: bold; color: #1e3a8a; margin: 0; }';
    html += '    .meta { font-size: 12px; color: #6b7280; text-align: right; }';
    html += '    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }';
    html += '    .stat-card { background: #fdfcf9; border: 1px solid #e2dfd7; padding: 1rem; border-radius: 8px; }';
    html += '    .stat-label { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: bold; }';
    html += '    .stat-value { font-size: 18px; font-weight: bold; color: #b08e40; margin-top: 4px; }';
    html += '    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }';
    html += '    th { background-color: #f9f6ef; border: 1px solid #e2dfd7; padding: 8px 12px; text-align: left; font-size: 12px; font-weight: bold; color: #1e3a8a; }';
    html += '    td { border: 1px solid #e2dfd7; padding: 8px 12px; font-size: 11px; color: #374151; }';
    html += '    tr:nth-child(even) { background-color: #fafafa; }';
    html += '    @media print {';
    html += '      body { padding: 0; }';
    html += '      button { display: none; }';
    html += '    }';
    html += '  </style>';
    html += '</head>';
    html += '<body>';
    html += '  <div class="header">';
    html += '    <div>';
    html += '      <h1 class="title">' + title + '</h1>';
    html += '      <p style="margin: 4px 0 0 0; font-size: 12px; color: #4b5563;">Vanya Residences Enterprise ERP Report</p>';
    html += '    </div>';
    html += '    <div class="meta">';
    html += '      <div>Date: ' + new Date().toLocaleDateString() + '</div>';
    html += '      <div>Time: ' + new Date().toLocaleTimeString() + '</div>';
    html += '    </div>';
    html += '  </div>';
    
    html += '  <div class="stats-grid">';
    Object.entries(summaryStats).forEach(([key, val]) => {
      html += '  <div class="stat-card">';
      html += '    <div class="stat-label">' + key + '</div>';
      html += '    <div class="stat-value">' + val + '</div>';
      html += '  </div>';
    });
    html += '  </div>';
    
    html += '  <table>';
    html += '    <thead>';
    html += '      <tr>';
    headers.forEach(h => {
      html += '      <th>' + h + '</th>';
    });
    html += '      </tr>';
    html += '    </thead>';
    html += '    <tbody>';
    
    rows.forEach(row => {
      html += '    <tr>';
      row.forEach(val => {
        html += '    <td>' + val + '</td>';
      });
      html += '    </tr>';
    });
    
    html += '    </tbody>';
    html += '  </table>';
    html += '  <div style="margin-top: 3rem; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 1rem;">';
    html += '    CONFIDENTIAL - FOR INTERNAL USE ONLY - GENERATED VIA VANYA CRM ERP REPORT MODULE';
    html += '  </div>';
    html += '  <script>';
    html += '    window.onload = function() {';
    html += '      window.print();';
    html += '    }';
    html += '  </script>';
    html += '</body>';
    html += '</html>';
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="admin-layout" style={{ background: 'var(--admin-bg)' }}>
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className={`admin-sidebar ${isMobileSidebarOpen ? 'open' : ''}`} style={{ background: '#ffffff', borderRight: '1px solid #f1f3f5', display: 'flex', flexDirection: 'column', width: '260px', overflowY: 'auto' }}>
        <div className="admin-sidebar-logo" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f3f5' }}>
          <h2 className="serif" style={{ color: 'var(--vanya-green)', margin: 0, fontSize: '1.25rem', letterSpacing: '1px', fontWeight: 'bold' }}>DreamSpaces</h2>
          <span className="text-muted" style={{ fontSize: '0.62rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--vanya-gold)' }}>Admin Panel</span>
        </div>

        <nav className="admin-nav" style={{ padding: '0.75rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => changeTab('dashboard')}>
            <span className="nav-icon">📊</span> Dashboard
          </button>
          <button className={activeTab === 'leads' ? 'active' : ''} onClick={() => changeTab('leads')}>
            <span className="nav-icon">👥</span> Leads
          </button>
          <button className={activeTab === 'bookings' ? 'active' : ''} onClick={() => changeTab('bookings')}>
            <span className="nav-icon">🖋️</span> Bookings
          </button>
          <button className={activeTab === 'inventory' ? 'active' : ''} onClick={() => changeTab('inventory')}>
            <span className="nav-icon">🏢</span> Inventory
          </button>
          <button className={activeTab === 'finance' ? 'active' : ''} onClick={() => changeTab('finance')}>
            <span className="nav-icon">💵</span> Finance (ERP)
          </button>
          <button className={activeTab === 'cp' ? 'active' : ''} onClick={() => changeTab('cp')}>
            <span className="nav-icon">🤝</span> CP Partners
          </button>
          <button className={activeTab === 'users' ? 'active' : ''} onClick={() => changeTab('users')}>
            <span className="nav-icon">👤</span> Users Management
          </button>
          <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => changeTab('reports')}>
            <span className="nav-icon">📄</span> Reports
          </button>
          <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => changeTab('settings')}>
            <span className="nav-icon">⚙️</span> Settings
          </button>
          <button className={activeTab === 'roles' ? 'active' : ''} onClick={() => changeTab('roles')}>
            <span className="nav-icon">🔐</span> Roles & Permissions
          </button>



          <button className={activeTab === 'alerts' ? 'active' : ''} onClick={() => changeTab('alerts')}>
            <span className="nav-icon">⚠️</span> Alerts Log
          </button>
        </nav>

        {/* Sidebar Profile & Logout */}
        <div className="admin-bottom" style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #f1f3f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--vanya-gold)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>A</div>
            <div>
              <strong style={{ fontSize: '0.8rem', display: 'block', color: 'var(--vanya-green)' }}>Admin User</strong>
              <span style={{ fontSize: '0.62rem', color: '#9ca3af' }}>SYSTEM EXECUTIVE</span>
            </div>
          </div>
          <button onClick={() => logoutUser()} className="btn-outline" style={{ width: '100%', padding: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>LOGOUT</button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      {isMobileSidebarOpen && <div className="mobile-sidebar-backdrop" onClick={() => setIsMobileSidebarOpen(false)} />}
      <main className="admin-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowX: 'hidden' }}>
        
        {/* 2. TOP NAVBAR */}
        <header className="admin-header" style={{ padding: '1rem 2.5rem', background: '#ffffff', borderBottom: '1px solid #f1f3f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="mobile-sidebar-toggle" onClick={() => setIsMobileSidebarOpen(true)}>☰</button>
            <div>
              <h1 className="serif" style={{ fontSize: '1.35rem', margin: 0, color: 'var(--vanya-green)' }}>Welcome back, Admin! 👋</h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Global Search */}
            <AdminGlobalSearchClient inquiries={inquiries} units={units} />

            {/* Notification Bell Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => { setShowNotifications(!showNotifications); setShowQuickAdd(false); }} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '4px', position: 'relative' }}
              >
                🔔
                {notificationAlerts.count > 0 && (
                  <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#c62828', color: 'white', fontSize: '0.55rem', padding: '2px 5px', borderRadius: '10px', fontWeight: 'bold' }}>
                    {notificationAlerts.count}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div style={{ position: 'absolute', top: '100%', right: 0, background: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', borderRadius: '8px', width: '280px', marginTop: '0.75rem', zIndex: 200, padding: '0.75rem' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.8rem', borderBottom: '1px solid #f1f3f5', paddingBottom: '0.5rem', marginBottom: '0.5rem', color: 'var(--vanya-green)' }}>Recent Notifications</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
                    {notificationAlerts.items.map(item => (
                      <div key={item.id} style={{ position: 'relative', padding: '6px 24px 6px 6px', background: '#fcfbf8', borderLeft: `3px solid ${item.color}`, borderRadius: '4px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span>{item.icon}</span>
                        <span style={{ flex: 1, paddingRight: '4px' }}>{item.text}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDismissedAlertIds(prev => [...prev, item.id]);
                          }}
                          style={{ position: 'absolute', top: '50%', right: '6px', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '0.9rem', padding: 0, lineHeight: 1 }}
                          title="Dismiss notification"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    {notificationAlerts.count === 0 && (
                      <div style={{ padding: '1rem', color: '#9ca3af', textAlign: 'center' }}>No new notifications.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Add Button Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => { setShowQuickAdd(!showQuickAdd); setShowNotifications(false); }} 
                className="btn-dark" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
              >
                + QUICK ADD
              </button>
              {showQuickAdd && (
                <div style={{ position: 'absolute', top: '100%', right: 0, background: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', borderRadius: '8px', width: '180px', marginTop: '0.75rem', zIndex: 200, padding: '0.5rem' }}>
                  <button onClick={() => { setActiveQuickAddForm('lead'); setShowQuickAdd(false); }} style={{ display: 'block', width: '100%', padding: '8px 12px', fontSize: '0.75rem', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', color: '#333' }}>Add New Lead</button>
                  <button onClick={() => { setActiveQuickAddForm('flat'); setShowQuickAdd(false); }} style={{ display: 'block', width: '100%', padding: '8px 12px', fontSize: '0.75rem', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', color: '#333' }}>Add Flat</button>
                  <button onClick={() => { changeTab('users'); setShowQuickAdd(false); }} style={{ display: 'block', width: '100%', padding: '8px 12px', fontSize: '0.75rem', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', color: '#333' }}>Create User</button>
                </div>
              )}
            </div>

            {/* Existing ERP Report Downloader Component */}
            <AdminReportActionsClient inquiries={inquiries} units={units} buyers={buyers} />
          </div>
        </header>

        {/* 3. ALERTS & OPERATIONAL WARNINGS OVERLAY */}
        <div style={{ padding: '1.25rem 2.5rem 0 2.5rem' }}>
          <AdminAlertsCard 
            inquiries={inquiries} 
            units={units} 
            project={project} 
            dismissedAlertIds={dismissedAlertIds} 
            onDismissAlert={(id) => setDismissedAlertIds(prev => [...prev, id])} 
          />
        </div>

        {/* ========================================================================= */}
        {/* SPA TAB CONTAINER: RENDERS SUBPAGES BASED ON STATE */}
        {/* ========================================================================= */}
        
        {/* ==================== 1. DASHBOARD PAGE ==================== */}
        {/* ==================== 1. DASHBOARD PAGE ==================== */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            
            {/* Dashboard Sub-navigation & Date */}
            <div className="mb-4" style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '100%' }}>
              <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', padding: '0.35rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <button onClick={() => setDashboardSubTab('analytical')} style={{ padding: '0.5rem 1.25rem', fontSize: '0.75rem', borderRadius: '6px', border: 'none', background: dashboardSubTab === 'analytical' ? '#fff' : 'transparent', color: dashboardSubTab === 'analytical' ? '#0f172a' : '#64748b', fontWeight: dashboardSubTab === 'analytical' ? '600' : '500', boxShadow: dashboardSubTab === 'analytical' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}>Analytical Performance</button>
                <button onClick={() => setDashboardSubTab('executive')} style={{ padding: '0.5rem 1.25rem', fontSize: '0.75rem', borderRadius: '6px', border: 'none', background: dashboardSubTab === 'executive' ? '#fff' : 'transparent', color: dashboardSubTab === 'executive' ? '#0f172a' : '#64748b', fontWeight: dashboardSubTab === 'executive' ? '600' : '500', boxShadow: dashboardSubTab === 'executive' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}>Executive Portal</button>
              </div>
              <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.75rem', color: '#334155', fontWeight: '600', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <span>📅 {weekRangeLabel}</span>
              </div>
            </div>

            {dashboardSubTab === 'analytical' ? (
              <>
            {/* ========== ANALYTICAL PERFORMANCE REPORT ========== */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e8eaed', padding: '2.5rem 2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>

              {/* Centered Report Header */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 className="serif" style={{ fontSize: '2rem', color: 'var(--vanya-green)', margin: '0 0 0.25rem 0', fontWeight: 'bold', letterSpacing: '-0.5px' }}>Analytical Performance Report</h2>
                <div style={{ width: '50px', height: '2px', background: 'var(--vanya-green)', margin: '0 auto 0.5rem auto' }}></div>
                <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: '0 0 1rem 0', fontWeight: '500' }}>
                  Aggregate sales intelligence & velocity tracking (Phase {analyticalPhase})
                </p>
                {/* Phase Dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => setAnalyticalPhase(1)}
                    style={{
                      width: analyticalPhase === 1 ? '10px' : '8px',
                      height: analyticalPhase === 1 ? '10px' : '8px',
                      borderRadius: '50%',
                      background: analyticalPhase === 1 ? 'var(--vanya-green)' : '#d1d5db',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      padding: 0
                    }}
                    aria-label="Phase 1"
                  />
                  <button
                    onClick={() => setAnalyticalPhase(2)}
                    style={{
                      width: analyticalPhase === 2 ? '10px' : '8px',
                      height: analyticalPhase === 2 ? '10px' : '8px',
                      borderRadius: '50%',
                      background: analyticalPhase === 2 ? 'var(--vanya-green)' : '#d1d5db',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      padding: 0
                    }}
                    aria-label="Phase 2"
                  />
                </div>
              </div>

              {/* ===== PHASE 1: Overview ===== */}
              {analyticalPhase === 1 && (() => {
                const velocityData = getVelocityData(velocityRange);
                const rawMaxVelocity = Math.max(...velocityData.map(d => d.valueCr), 0);
                const velocityYMax = rawMaxVelocity < 4 ? 4 : Math.ceil(rawMaxVelocity / 4) * 4;
                const targetLine = velocityYMax * 0.55;
                const totalUnits = totalUnitsCount;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* TOP ROW: Inventory Donut | Monthly Sales Velocity | Right KPI Stack */}
                    <div className="responsive-grid-3col" style={{ display: 'grid', gridTemplateColumns: '220px 410px 1fr', gap: '1.5rem', alignItems: 'stretch' }}>

                      {/* LEFT: Inventory Distribution Donut */}
                      <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>INVENTORY DISTRIBUTION</span>

                        {/* Donut Chart */}
                        <div style={{ position: 'relative', width: '135px', height: '135px', marginBottom: '0.6rem' }}>
                          <svg width="135" height="135" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f3f5" strokeWidth="3.8" />
                            {/* AVAILABLE (green) - drawn first as background arc */}
                            <circle cx="18" cy="18" r="14" fill="none" stroke="#137333" strokeWidth="4" pathLength="100"
                              strokeDasharray={`${availablePerc} ${100 - availablePerc}`} strokeDashoffset="0"
                              strokeLinecap="round"
                              style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                            {/* RESERVED (blue) */}
                            <circle cx="18" cy="18" r="14" fill="none" stroke="#1a73e8" strokeWidth="4" pathLength="100"
                              strokeDasharray={`${reservedPerc} ${100 - reservedPerc}`} strokeDashoffset={`${-availablePerc}`}
                              strokeLinecap="round"
                              style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                            {/* SOLD (dark red/maroon) */}
                            <circle cx="18" cy="18" r="14" fill="none" stroke="#8B2500" strokeWidth="4" pathLength="100"
                              strokeDasharray={`${soldPerc} ${100 - soldPerc}`} strokeDashoffset={`${-availablePerc - reservedPerc}`}
                              strokeLinecap="round"
                              style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                          </svg>
                          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <h2 className="num-mono" style={{ margin: 0, fontSize: '1.8rem', color: 'var(--vanya-green)', fontWeight: 'bold', lineHeight: 1 }}>{totalUnits}</h2>
                            <span style={{ fontSize: '0.58rem', color: '#9ca3af', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>TOTAL UNITS</span>
                          </div>
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.68rem', fontWeight: '600' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '9px', height: '9px', background: '#8B2500', borderRadius: '50%', display: 'inline-block' }}></span>
                            <span style={{ color: '#4b5563' }}>SOLD</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '9px', height: '9px', background: '#1a73e8', borderRadius: '50%', display: 'inline-block' }}></span>
                            <span style={{ color: '#4b5563' }}>RSVD</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '9px', height: '9px', background: '#137333', borderRadius: '50%', display: 'inline-block' }}></span>
                            <span style={{ color: '#4b5563' }}>AVAL</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.62rem', color: '#6b7280', marginTop: '0.3rem', fontWeight: '500' }}>
                          <span>({soldUnitsCount}) {soldPerc}%</span>
                          <span>({reservedUnitsCount}) {reservedPerc}%</span>
                          <span>({availableUnitsCount}) {availablePerc}%</span>
                        </div>
                      </div>

                      {/* CENTER: Monthly Sales Velocity Bar Chart */}
                      <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: '12px', padding: '1rem 1.25rem', maxWidth: '410px', width: '100%', margin: '0 auto' }}>

                        {/* Chart Header */}
                        <div style={{ marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#1f2937', letterSpacing: '0.5px' }}>MONTHLY SALES VELOCITY</span>
                          
                          {/* Velocity Range Filter Dropdown - Moved below title */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                            <select
                              value={velocityRange}
                              onChange={(e) => {
                                setVelocityRange(e.target.value);
                                resetVelocityPeriod();
                              }}
                              style={{
                                padding: '3px 8px',
                                fontSize: '0.68rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                background: '#fff',
                                color: '#1e293b',
                                fontWeight: '700',
                                cursor: 'pointer',
                                outline: 'none',
                                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                transition: 'all 0.15s ease-in-out'
                              }}
                            >
                              <option value="WEEK">Week View</option>
                              <option value="MONTH">Month View</option>
                              <option value="H1">Jan - Jun (H1)</option>
                              <option value="H2">Jul - Dec (H2)</option>
                            </select>

                            <span style={{ color: '#cbd5e1', fontSize: '0.72rem' }}>|</span>

                            <button onClick={handlePrevVelocityPeriod}
                              style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                            >◀</button>

                            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                              {velocityRange === 'WEEK' && (
                                <SelectField
                                  value={velocityWeek}
                                  onChange={(e) => setVelocityWeek(Number(e.target.value))}
                                  options={getWeekOptions(velocityYear, velocityMonth).map(opt => ({ value: opt.value, label: `Week ${opt.value + 1}` }))}
                                  style={{ padding: '3px 8px', fontSize: '0.68rem' }}
                                />
                              )}
                              {(velocityRange === 'WEEK' || velocityRange === 'MONTH') && (
                                <SelectField
                                  value={velocityMonth}
                                  onChange={(e) => setVelocityMonth(Number(e.target.value))}
                                  options={['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, idx) => ({ value: idx, label: m }))}
                                  style={{ padding: '3px 8px', fontSize: '0.68rem' }}
                                />
                              )}
                              <SelectField
                                value={velocityYear}
                                onChange={(e) => setVelocityYear(Number(e.target.value))}
                                options={availableYears.map(yr => ({ value: yr, label: String(yr) }))}
                                style={{ padding: '3px 8px', fontSize: '0.68rem' }}
                              />
                            </div>

                            <button onClick={handleNextVelocityPeriod}
                              disabled={isVelocityNextDisabled()}
                              style={{ 
                                width: '24px', 
                                height: '24px', 
                                borderRadius: '50%', 
                                border: '1px solid #e2e8f0', 
                                background: isVelocityNextDisabled() ? '#f1f5f9' : '#fff', 
                                cursor: isVelocityNextDisabled() ? 'not-allowed' : 'pointer', 
                                fontSize: '0.75rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                color: isVelocityNextDisabled() ? '#cbd5e1' : '#475569', 
                                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
                                transition: 'all 0.15s' 
                              }}
                              onMouseEnter={e => { if (!isVelocityNextDisabled()) e.currentTarget.style.background = '#f8fafc'; }}
                              onMouseLeave={e => { if (!isVelocityNextDisabled()) e.currentTarget.style.background = '#fff'; }}
                            >▶</button>
                          </div>

                          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#4b5563', fontWeight: '600' }}>
                              <span style={{ width: '8px', height: '8px', background: '#137333', borderRadius: '50%', display: 'inline-block' }}></span>
                              REVENUE
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#4b5563', fontWeight: '600' }}>
                              <span style={{ width: '8px', height: '8px', background: 'transparent', border: '2px solid #137333', borderRadius: '50%', display: 'inline-block', boxSizing: 'border-box' }}></span>
                              TARGET
                            </span>
                          </div>
                        </div>

                        {/* Y-Axis label */}
                        <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: '700', letterSpacing: '0.5px' }}>₹ CR REVENUE</span>

                        {/* SVG Bar Chart */}
                        <div style={{ position: 'relative', height: '180px', marginTop: '0.25rem' }}>
                          <svg viewBox="0 0 600 220" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
                            {/* Horizontal grid lines + Y-axis labels */}
                            {[0, 1, 2, 3, 4].map(i => {
                              const frac = i / 4;
                              const y = 195 - frac * 170;
                              const val = (velocityYMax * frac).toFixed(1).replace(/\.0$/, '');
                              return (
                                <g key={i}>
                                  <line x1="40" y1={y} x2="580" y2={y} stroke="#f1f3f5" strokeWidth="1" />
                                  <text x="30" y={y + 4} textAnchor="end" style={{ fontSize: '13px', fill: '#6b7280', fontWeight: '700' }}>{val}</text>
                                </g>
                              );
                            })}

                            {/* Target dashed line */}
                            <line
                              x1="40" y1={195 - (targetLine / velocityYMax) * 170}
                              x2="580" y2={195 - (targetLine / velocityYMax) * 170}
                              stroke="#137333" strokeWidth="1.5" strokeDasharray="8 4" opacity="0.4"
                            />

                            {/* Bars */}
                            {velocityData.map((d, idx) => {
                              const n = Math.max(velocityData.length, 1);
                              const totalWidth = 540;
                              const maxBarWidth = 55;
                              const minGap = 8;
                              const gap = Math.max(minGap, Math.floor(totalWidth / (n * 8)));
                              const barWidth = Math.min(maxBarWidth, Math.floor((totalWidth - gap * (n + 1)) / n));
                              const x = 40 + gap + idx * (barWidth + gap);
                              const barHeight = Math.max(3, (d.valueCr / velocityYMax) * 170);
                              const y = 195 - barHeight;
                              const labelVal = formatCompactRupees(d.valueCr * 100);

                              return (
                                <g key={idx}>
                                  {/* Bar */}
                                  <rect
                                    x={x} y={y} width={barWidth} height={barHeight}
                                    rx="4" ry="4"
                                    fill="url(#barGradient)"
                                    style={{ transition: 'height 0.5s ease, y 0.5s ease' }}
                                  />
                                  {/* Value label */}
                                  <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" style={{ fontSize: '12px', fill: '#1f2937', fontWeight: '800' }}>
                                    {labelVal}
                                  </text>
                                  {/* Month label */}
                                  {d.label.includes('(') ? (
                                    <>
                                      <text x={x + barWidth / 2} y={207} textAnchor="middle" style={{ fontSize: '11px', fill: '#4b5563', fontWeight: '700' }}>
                                        {d.label.split(' ')[0]}
                                      </text>
                                      <text x={x + barWidth / 2} y={218} textAnchor="middle" style={{ fontSize: '10px', fill: '#6b7280', fontWeight: '600' }}>
                                        {d.label.slice(d.label.indexOf('('))}
                                      </text>
                                    </>
                                  ) : (
                                    <text x={x + barWidth / 2} y={215} textAnchor="middle" style={{ fontSize: '13px', fill: '#4b5563', fontWeight: '700' }}>
                                      {d.label}
                                    </text>
                                  )}
                                </g>
                              );
                            })}

                            {/* Gradient Definition */}
                            <defs>
                              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2d7c5f" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="#b8d8c8" stopOpacity="0.6" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                      </div>

                      {/* RIGHT: 3 Stacked KPI Cards */}
                      <div className="kpi-stacked-container">

                        {/* Avg Price Per Unit */}
                        <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: '12px', padding: '1.25rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#4b5563', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.4rem' }}>AVG. PRICE PER UNIT</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ecfdf5', border: '1.5px solid #bbf0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                              </svg>
                            </div>
                            <h3 className="num-mono" style={{ margin: 0, fontSize: '1.15rem', color: 'var(--vanya-green)', fontWeight: 'bold' }}>
                              {baseCurrency === "USD" ? "$" : "₹"} {avgPriceLakhs >= 100 ? `${(avgPriceLakhs / 100).toFixed(1)} Cr` : `${avgPriceLakhs.toFixed(0)} L`}
                            </h3>
                          </div>
                        </div>

                        {/* Total Portfolio Value */}
                        <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: '12px', padding: '1.25rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#4b5563', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.4rem' }}>TOTAL PORTFOLIO VALUE</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ecfdf5', border: '1.5px solid #bbf0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3" />
                              </svg>
                            </div>
                            <h3 className="num-mono" style={{ margin: 0, fontSize: '1.15rem', color: 'var(--vanya-green)', fontWeight: 'bold' }}>
                              {baseCurrency === "USD" ? "$" : "₹"} {totalPortfolioLakhs >= 100 ? `${(totalPortfolioLakhs / 100).toFixed(1)} Cr` : `${totalPortfolioLakhs.toFixed(0)} L`}
                            </h3>
                          </div>
                          <span style={{ fontSize: '0.65rem', color: '#137333', fontWeight: '700', marginTop: '0.3rem', marginLeft: '0.1rem' }}>↑ +{project === 'vanya-estate' ? '18.4' : project === 'vanya-meadows' ? '21.0' : portfolioIncreasePerc.toFixed(1)}% INCREASE</span>
                        </div>

                        {/* Conversion Rate */}
                        <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: '12px', padding: '1.25rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#4b5563', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.4rem' }}>CONVERSION RATE</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ecfdf5', border: '1.5px solid #bbf0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                              </svg>
                            </div>
                            <h3 className="num-mono" style={{ margin: 0, fontSize: '1.15rem', color: 'var(--vanya-green)', fontWeight: 'bold' }}>
                              {project === 'vanya-estate' ? '18.2' : project === 'vanya-meadows' ? '12.4' : conversionRateReal}%
                            </h3>
                          </div>
                          <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: '600', marginTop: '0.3rem', marginLeft: '0.1rem' }}>LEAD TO DEPOSIT</span>
                        </div>
                      </div>
                    </div>

                    {/* BOTTOM ROW: Total Revenue | Units Sold | Avg Sales Cycle */}
                    <div className="responsive-grid-3col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>

                      {/* Total Revenue */}
                      <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: '12px', padding: '1.5rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', letterSpacing: '0.5px', textTransform: 'uppercase' }}>TOTAL REVENUE</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ecfdf5', border: '1.5px solid #bbf0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="2.5" strokeLinecap="round">
                              <text x="7" y="18" fill="#137333" stroke="none" fontSize="18" fontWeight="bold" fontFamily="serif">{baseCurrency === "USD" ? "$" : "₹"}</text>
                            </svg>
                          </div>
                          <h3 className="num-mono" style={{ margin: 0, fontSize: '1.7rem', color: 'var(--vanya-green)', fontWeight: 'bold' }}>
                            {baseCurrency === "USD" ? "$" : "₹"} {totalRevenueLakhs >= 100 ? `${(totalRevenueLakhs / 100).toFixed(1)} Cr` : totalRevenueFormatted}
                          </h3>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                          <span style={{ fontSize: '0.65rem', color: '#137333', fontWeight: '700' }}>↑ +{project === 'vanya-estate' ? '8.5' : project === 'vanya-meadows' ? '5.2' : revenueIncreasePerc.toFixed(1)}% VS LAST QUARTER</span>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" />
                          </svg>
                        </div>
                      </div>

                      {/* Units Sold */}
                      <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: '12px', padding: '1.5rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', letterSpacing: '0.5px', textTransform: 'uppercase' }}>UNITS SOLD</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ecfdf5', border: '1.5px solid #bbf0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                              </svg>
                            </div>
                            <h3 className="num-mono" style={{ margin: 0, fontSize: '1.7rem', color: 'var(--vanya-green)', fontWeight: 'bold' }}>
                              {soldUnitsCount} <span style={{ fontSize: '1.05rem', color: '#9ca3af', fontWeight: 'normal' }}>/ {totalUnits}</span>
                            </h3>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div style={{ marginTop: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                            <div style={{
                              background: '#137333',
                              color: 'white',
                              fontSize: '0.58rem',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              lineHeight: '1.4'
                            }}>{soldPerc}%</div>
                            <div style={{ flex: 1, height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${soldPerc}%`, background: 'linear-gradient(90deg, #137333, #2d7c5f)', borderRadius: '4px', transition: 'width 0.6s ease' }}></div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.62rem', color: '#6b7280', fontWeight: '600' }}>{soldPerc}% of Total Inventory Sold</span>
                        </div>
                      </div>

                      {/* Avg Sales Cycle */}
                      <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: '12px', padding: '1.5rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', letterSpacing: '0.5px', textTransform: 'uppercase' }}>AVG. SALES CYCLE</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ecfdf5', border: '1.5px solid #bbf0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                          </div>
                          <h3 className="num-mono" style={{ margin: 0, fontSize: '1.7rem', color: 'var(--vanya-green)', fontWeight: 'bold' }}>
                            {project === 'vanya-estate' ? 32 : project === 'vanya-meadows' ? 45 : (realSalesCycle > 0 ? realSalesCycle : 24)} Days
                          </h3>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                          <span style={{ fontSize: '0.65rem', color: '#137333', fontWeight: '700' }}>
                            {project === 'vanya-meadows' ? (
                              '◷ STABLE VELOCITY'
                            ) : salesCycleImprovement === 0 ? (
                              '◷ STABLE VELOCITY'
                            ) : salesCycleImprovement < 0 ? (
                              `↓ -${Math.abs(salesCycleImprovement)} DAYS IMPROVEMENT`
                            ) : (
                              `↑ +${salesCycleImprovement} DAYS INCREASE`
                            )}
                          </span>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ===== PHASE 2: Detailed Analytics ===== */}
              {analyticalPhase === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                  {/* Row 1: Leads Overview + Bookings by Status */}
                  <div className="responsive-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>

                    {/* ── Leads Overview Curve Chart ── */}
                    <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: '12px', padding: '1.5rem', animation: 'fadeSlideUp 0.5s ease both' }}>

                      {/* Top row: title + view tabs */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', letterSpacing: '1px', textTransform: 'uppercase' }}>Leads Overview</span>
                          <span style={{ marginLeft: '0.6rem', fontSize: '0.7rem', color: '#9ca3af' }}>{leadsTotal} leads</span>
                        </div>
                        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                          {[['week','Week'],['month','Month'],['year','Year']].map(([val, label]) => (
                            <button key={val}
                              onClick={() => { setLeadsView(val); resetToCurrentPeriod(); }}
                              style={{ padding: '4px 10px', fontSize: '0.65rem', fontWeight: '700', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                background: leadsView === val ? 'var(--vanya-green)' : 'transparent',
                                color: leadsView === val ? '#fff' : '#6b7280' }}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Navigation row: ◀ period select ▶ */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <button onClick={handlePrevPeriod}
                          style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                        >◀</button>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {leadsView === 'week' && (
                            <SelectField
                              value={selectedWeek}
                              onChange={(e) => setSelectedWeek(Number(e.target.value))}
                              options={getWeekOptions(selectedYear, selectedMonth).map(opt => ({ value: opt.value, label: `Week ${opt.value + 1} (${opt.label})` }))}
                            />
                          )}
                          {(leadsView === 'week' || leadsView === 'month') && (
                            <SelectField
                              value={selectedMonth}
                              onChange={(e) => setSelectedMonth(Number(e.target.value))}
                              options={['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, idx) => ({ value: idx, label: m }))}
                            />
                          )}
                          <SelectField
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            options={availableYears.map(yr => ({ value: yr, label: String(yr) }))}
                          />
                        </div>

                        <button onClick={handleNextPeriod}
                          disabled={isNextDisabled()}
                          style={{ 
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '50%', 
                            border: '1px solid #e2e8f0', 
                            background: isNextDisabled() ? '#f1f5f9' : '#fff', 
                            cursor: isNextDisabled() ? 'not-allowed' : 'pointer', 
                            fontSize: '0.85rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: isNextDisabled() ? '#cbd5e1' : '#475569', 
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
                            transition: 'all 0.15s' 
                          }}
                          onMouseEnter={e => { if (!isNextDisabled()) e.currentTarget.style.background = '#f8fafc'; }}
                          onMouseLeave={e => { if (!isNextDisabled()) e.currentTarget.style.background = '#fff'; }}
                        >▶</button>
                      </div>

                      {/* SVG Chart */}
                      <div style={{ height: '185px', width: '100%', position: 'relative' }}>
                        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
                          <defs>
                            <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--vanya-green)" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="var(--vanya-green)" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Y-axis: 5 nice ticks */}
                          {[0, 1, 2, 3, 4].map(i => {
                            const frac = i / 4;
                            const y    = 12 + plotH * (1 - frac);
                            const val  = Math.round(yMaxLeads * frac);
                            return (
                              <g key={i}>
                                <line x1={padL} y1={y} x2={svgW - 12} y2={y} stroke={i === 0 ? '#e5e7eb' : '#f3f4f6'} strokeDasharray={i === 0 ? '0' : '4 3'} strokeWidth={i === 0 ? 1.2 : 1} />
                                <text x={padL - 5} y={y + 4} textAnchor="end" style={{ fontSize: '0.52rem', fill: '#b0b0b0', fontFamily: 'monospace' }}>{val}</text>
                              </g>
                            );
                          })}

                          {/* Fill area */}
                          {leadsFillD && <path d={leadsFillD} fill="url(#leadGrad)" />}

                          {/* Line */}
                          {leadsPathD && (
                            <path d={leadsPathD} fill="none" stroke="var(--vanya-green)" strokeWidth="2.5"
                              strokeLinecap="round" strokeLinejoin="round"
                              style={{ strokeDasharray: 2000, strokeDashoffset: 2000, animation: 'drawLine 1.2s ease forwards' }} />
                          )}

                          {/* Data points with hover tooltip */}
                          {leadsData.map((p, i) => {
                            const cx = padL + i * xStep;
                            const cy = yOf(p.count);
                            return (
                              <g key={i} style={{ cursor: 'pointer' }}>
                                <circle cx={cx} cy={cy} r="10" fill="transparent" />
                                <circle cx={cx} cy={cy} r="4.5" fill="var(--vanya-green)" stroke="#fff" strokeWidth="2"
                                  style={{ opacity: 0, animation: `fadeIn 0.3s ease ${1 + i * 0.07}s forwards` }} />
                                <title>{p.label}: {p.count} lead{p.count !== 1 ? 's' : ''}</title>
                              </g>
                            );
                          })}

                          {/* X-axis labels — rotate if many points */}
                          {leadsData.map((p, i) => {
                            const cx = padL + i * xStep;
                            const rotate = leadsData.length > 8 ? `rotate(-35, ${cx}, ${svgH - 4})` : null;
                            return (
                              <text key={i} x={cx} y={svgH - 4}
                                textAnchor={rotate ? 'end' : 'middle'}
                                transform={rotate || ''}
                                style={{ fontSize: leadsData.length > 8 ? '0.48rem' : '0.55rem', fill: '#6b7280', fontWeight: '600' }}>
                                {p.label}
                              </text>
                            );
                          })}
                        </svg>
                      </div>

                      {/* Empty state */}
                      {leadsTotal === 0 && (
                        <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                          No leads recorded in this period
                        </div>
                      )}
                    </div>

                    {/* ── Bookings by Status Donut Chart — Real DB Data ── */}
                    <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', animation: 'fadeSlideUp 0.5s 0.15s ease both' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Bookings by Status</span>
                      {(() => {
                        // Real data from buyers table
                        const totalBk = buyers.length;
                        const confirmedBk = buyers.filter(b => (b.booking_status || b.status || '').toLowerCase().includes('confirm')).length;
                        const cancelledBk = buyers.filter(b => (b.booking_status || b.status || '').toLowerCase().includes('cancel')).length;
                        const onHoldBk   = buyers.filter(b => (b.booking_status || b.status || '').toLowerCase().includes('hold')).length;
                        const pendingBk  = Math.max(0, totalBk - confirmedBk - cancelledBk - onHoldBk);

                        const safePct = (n) => totalBk > 0 ? Math.round((n / totalBk) * 100) : 0;
                        const confPct = safePct(confirmedBk);
                        const pendPct = safePct(pendingBk);
                        const cancPct = safePct(cancelledBk);
                        const holdPct = safePct(onHoldBk);

                        // Donut segments — animated with CSS strokeDashoffset
                        const r = 15.915;
                        const circ = 2 * Math.PI * r; // ≈ 100
                        const segments = [
                          { label: 'Confirmed', count: confirmedBk, pct: confPct, color: '#137333', offset: 0 },
                          { label: 'Pending',   count: pendingBk,   pct: pendPct, color: '#c9a84c', offset: confPct },
                          { label: 'Cancelled', count: cancelledBk, pct: cancPct, color: '#c5221f', offset: confPct + pendPct },
                          { label: 'On Hold',   count: onHoldBk,   pct: holdPct, color: '#1a73e8', offset: confPct + pendPct + cancPct },
                        ];

                        return (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexGrow: 1 }}>
                            {/* Donut */}
                            <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                              <svg width="120" height="120" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="18" cy="18" r={r} fill="none" stroke="#f1f3f5" strokeWidth="4.2" />
                                {totalBk === 0 ? (
                                  <circle cx="18" cy="18" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4.2" />
                                ) : segments.map((seg, i) => seg.pct > 0 && (
                                  <circle key={i} cx="18" cy="18" r={r} fill="none"
                                    stroke={seg.color} strokeWidth="4.5"
                                    strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                                    strokeDashoffset={`-${seg.offset}`}
                                    style={{ transition: 'stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease' }} />
                                ))}
                              </svg>
                              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                                <h2 className="num-mono" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--vanya-green)', fontWeight: 'bold', animation: 'countUp 0.6s ease' }}>{totalBk}</h2>
                                <span style={{ fontSize: '0.45rem', color: '#9ca3af', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 'bold' }}>Total</span>
                              </div>
                            </div>

                            {/* Legend */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '130px' }}>
                              {segments.map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem',
                                  animation: `fadeSlideUp 0.4s ${0.1 * i}s ease both` }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ width: '9px', height: '9px', background: item.color, borderRadius: '50%', display: 'inline-block', flexShrink: 0 }}></span>
                                    <span style={{ fontWeight: '500', color: '#4b5563' }}>{item.label}</span>
                                  </div>
                                  <span style={{ fontWeight: 'bold', color: '#1c1b1a' }}>
                                    {item.count} <span style={{ fontSize: '0.62rem', color: '#888', fontWeight: 'normal' }}>({item.pct}%)</span>
                                  </span>
                                </div>
                              ))}
                              {totalBk === 0 && (
                                <div style={{ fontSize: '0.72rem', color: '#9ca3af', textAlign: 'center', marginTop: '0.5rem' }}>No bookings yet</div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Row 2: Revenue Overview + Top Projects */}
                  <div className="responsive-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>

                    {/* Revenue Overview Bar Chart */}
                    <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                      
                      {/* Top row: Title + View Tabs */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', letterSpacing: '1px', textTransform: 'uppercase' }}>Revenue Overview</span>
                        </div>
                        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                          {[['week','Week'],['month','Month'],['year','Year']].map(([val, label]) => (
                            <button key={val}
                              onClick={() => { setRevenueView(val); resetRevenuePeriod(); }}
                              style={{ padding: '4px 10px', fontSize: '0.65rem', fontWeight: '700', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                background: revenueView === val ? 'var(--vanya-green)' : 'transparent',
                                color: revenueView === val ? '#fff' : '#6b7280' }}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Controls row: Past/Projection toggle + Absolute Period navigation */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {/* Actuals vs Projection toggle */}
                        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                          <button
                            onClick={() => setRevenueViewType('past')}
                            style={{ padding: '4px 10px', fontSize: '0.65rem', fontWeight: '700', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                              background: revenueViewType === 'past' ? '#1f2937' : 'transparent',
                              color: revenueViewType === 'past' ? '#fff' : '#6b7280' }}
                          >
                            Actuals
                          </button>
                          <button
                            onClick={() => setRevenueViewType('projection')}
                            style={{ padding: '4px 10px', fontSize: '0.65rem', fontWeight: '700', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                              background: revenueViewType === 'projection' ? '#1f2937' : 'transparent',
                              color: revenueViewType === 'projection' ? '#fff' : '#6b7280' }}
                          >
                            Projection
                          </button>
                        </div>

                        {/* Absolute selectors */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button onClick={handlePrevRevenuePeriod}
                            style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                          >◀</button>

                          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                            {revenueView === 'week' && (
                              <SelectField
                                value={revenueWeek}
                                onChange={(e) => setRevenueWeek(Number(e.target.value))}
                                options={getWeekOptions(revenueYear, revenueMonth).map(opt => ({ value: opt.value, label: `Week ${opt.value + 1}` }))}
                              />
                            )}
                            {(revenueView === 'week' || revenueView === 'month') && (
                              <SelectField
                                value={revenueMonth}
                                onChange={(e) => setRevenueMonth(Number(e.target.value))}
                                options={['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, idx) => ({ value: idx, label: m }))}
                              />
                            )}
                            <SelectField
                              value={revenueYear}
                              onChange={(e) => setRevenueYear(Number(e.target.value))}
                              options={availableYears.map(yr => ({ value: yr, label: String(yr) }))}
                            />
                          </div>

                          <button onClick={handleNextRevenuePeriod}
                            disabled={isRevenueNextDisabled()}
                            style={{ 
                              width: '28px', 
                              height: '28px', 
                              borderRadius: '50%', 
                              border: '1px solid #e2e8f0', 
                              background: isRevenueNextDisabled() ? '#f1f5f9' : '#fff', 
                              cursor: isRevenueNextDisabled() ? 'not-allowed' : 'pointer', 
                              fontSize: '0.85rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              color: isRevenueNextDisabled() ? '#cbd5e1' : '#475569', 
                              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
                              transition: 'all 0.15s' 
                            }}
                            onMouseEnter={e => { if (!isRevenueNextDisabled()) e.currentTarget.style.background = '#f8fafc'; }}
                            onMouseLeave={e => { if (!isRevenueNextDisabled()) e.currentTarget.style.background = '#fff'; }}
                          >▶</button>
                        </div>
                      </div>

                      {/* Header showing total and status */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
                        <h2 className="num-mono" style={{ margin: 0, fontSize: '1.6rem', color: 'var(--vanya-green)', fontWeight: 'bold' }}>
                          {baseCurrency === "USD" ? "$" : "₹"} {
                            new Intl.NumberFormat('en-IN').format(Math.round(revMonths.reduce((sum, m) => sum + m.value, 0) * 100000))
                          }
                        </h2>
                        <span style={{ fontSize: '0.68rem', color: '#137333', fontWeight: 'bold' }}>
                          {revenueViewType === 'past' ? 'Actual Collections' : 'Projected Inflow'}
                        </span>
                      </div>

                      {/* SVG/Div Chart container */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', height: '230px', alignItems: 'flex-end', gap: '0.5rem', position: 'relative', marginTop: '1.5rem', width: '100%' }}>
                        <div style={{ position: 'absolute', bottom: '70%', left: 0, right: 0, borderTop: '2px dashed var(--vanya-gold)', opacity: 0.45, zIndex: 1 }}></div>
                        {revMonths.map((m, idx) => {
                          const maxVal = Math.max(...revMonths.map(d => d.value), 1);
                          const hPerc = Math.max(10, Math.round((m.value / maxVal) * 100));
                          
                          const numBars = revMonths.length;
                          const barWidth = numBars > 8 ? '35%' : '55%';
                          const valFontSize = numBars > 8 ? '0.58rem' : '0.75rem';
                          const labelFontSize = numBars > 8 ? '0.58rem' : '0.68rem';

                          return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end', zIndex: 2 }}>
                              <span style={{ fontSize: valFontSize, fontWeight: 'bold', color: 'var(--vanya-green)', marginBottom: '8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                {formatCompactRupees(m.value)}
                              </span>
                              <div style={{ height: `${hPerc}%`, width: barWidth, background: 'linear-gradient(180deg, #2d7c5f, #b8d8c8)', borderRadius: '5px 5px 0 0', opacity: 0.85, transition: 'height 0.3s ease' }}></div>
                              <span style={{ fontSize: labelFontSize, fontWeight: '700', color: '#4b5563', marginTop: '10px', letterSpacing: '0.3px', textAlign: 'center', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                                {m.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Top Projects by Revenue */}
                    <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Top Projects by Revenue</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flexGrow: 1, justifyContent: 'center' }}>
                        {[
                          { rank: 1, name: 'Skyvue Tower A', amount: '₹ 3,25,00,000', pct: '26%' },
                          { rank: 2, name: 'Golden Heights', amount: '₹ 2,75,00,000', pct: '22%' },
                          { rank: 3, name: 'Maple Residences', amount: '₹ 2,25,00,000', pct: '18%' },
                          { rank: 4, name: 'Sunshine Bay', amount: '₹ 1,85,00,000', pct: '15%' },
                          { rank: 5, name: 'Green Valley', amount: '₹ 1,35,00,000', pct: '11%' }
                        ].map((p, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < 4 ? '1px solid #f8f9fa' : 'none', paddingBottom: i < 4 ? '0.5rem' : '0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#888', width: '15px' }}>{p.rank}</span>
                              <div>
                                <strong style={{ fontSize: '0.8rem', color: 'var(--vanya-green)' }}>{p.name}</strong>
                                <div style={{ fontSize: '0.6rem', color: '#9ca3af' }}>Contribution: {p.pct}</div>
                              </div>
                            </div>
                            <strong style={{ fontSize: '0.8rem', color: '#137333' }}>{p.amount}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', position: 'relative', width: '100%' }}>
                {/* Executive Performance Portal Header */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <h2 className="serif" style={{ fontSize: '1.75rem', color: 'var(--vanya-green)', marginBottom: '0.25rem' }}>Executive Performance Portal</h2>
                  <p className="text-muted" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>SALES REPRESENTATIVE DIRECTORY & PIPELINE PERFORMANCE</p>
                </div>
                <div style={{ position: 'absolute', right: 0 }}>
                  <AdminAddSalesClient />
                </div>
              </div>

                {/* Salesman Cards Grid — Real data from DB, sorted by revenue */}
                <div className="responsive-grid-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                  {(() => {
                    // Build real salesman list from DB users only — no mock/fake data
                    const realExecs = allUsers
                      .filter(u => u.role === 'Sales')
                      .map(exec => {
                        // Calculate real revenue: sum of amount_paid for all buyers assigned to this salesman
                        const salesmanRevenueLakhs = buyers
                          .filter(b => b.salesman_id === exec.username || b.assigned_to === exec.username)
                          .reduce((sum, b) => sum + parseAmountVal(b.amount_paid), 0);

                        // Format revenue in Indian number system
                        const revenueFormatted = salesmanRevenueLakhs > 0
                          ? new Intl.NumberFormat('en-IN').format(Math.round(salesmanRevenueLakhs * 100000))
                          : '0';

                        // Generate initials from full name
                        const resolvedInitials = exec.full_name
                          ? exec.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                          : exec.username.substring(0, 2).toUpperCase();

                        return {
                          initials: resolvedInitials,
                          name: (exec.full_name || exec.username).toUpperCase(),
                          title: exec.employee_id || 'SALES REPRESENTATIVE',
                          id: exec.username,
                          revenueRaw: salesmanRevenueLakhs, // for sorting
                          revenue: revenueFormatted,
                          isActive: exec.is_active !== false
                        };
                      })
                      // Sort by highest revenue first
                      .sort((a, b) => b.revenueRaw - a.revenueRaw);

                    // If no real salesmen in DB yet, show empty state
                    if (realExecs.length === 0) {
                      return (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#9ca3af', fontSize: '0.85rem' }}>
                          No salespersons added yet. Use the <strong>+ Add Salesperson</strong> button above to get started.
                        </div>
                      );
                    }

                    return realExecs.map((exec, idx) => (
                      <div key={exec.id || idx} style={{ background: '#fff', border: '1px solid #f1f3f5', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', opacity: exec.isActive ? 1 : 0.6, transition: 'box-shadow 0.2s' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: exec.isActive ? '2px solid var(--vanya-green)' : '2px solid #9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: exec.isActive ? 'var(--vanya-green)' : '#9ca3af' }}>{exec.initials}</span>
                        </div>
                        <strong style={{ fontSize: '0.78rem', color: exec.isActive ? 'var(--vanya-green)' : '#6b7280', letterSpacing: '0.5px' }}>{exec.name} {exec.isActive === false && ' (Inactive)'}</strong>
                        <span style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: '600', letterSpacing: '0.5px', marginTop: '2px', marginBottom: '1rem' }}>{exec.title}</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '1rem' }}>
                          <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: '600' }}>REVENUE</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--vanya-green)' }}>{baseCurrency === 'USD' ? '$' : '₹'} {exec.revenue}</span>
                        </div>
                        <button 
                          onClick={() => window.location.href = `/admin/salesman/${exec.id}`}
                        style={{ width: '100%', padding: '0.5rem', fontSize: '0.72rem', fontWeight: 'bold', border: '1px solid var(--vanya-green)', background: '#fff', color: 'var(--vanya-green)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--vanya-green)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = 'var(--vanya-green)'; }}
                      >
                        ↗ OPEN PORTAL
                      </button>
                    </div>
                    ));
                  })()}
                </div>

                {/* Project-wide Scheduled Visits */}
                <div style={{ marginTop: '0.5rem' }}>
                  <GlobalVisitsClient inquiries={inquiries} allUsers={allUsers} />
                </div>
              </div>
            )}
          </div>
        )}



        {/* ==================== 3. LEADS PAGE ==================== */}
        {activeTab === 'leads' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            
            {/* Leads Sub-Tab Navigation Bar */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2dfd7', paddingBottom: '0.75rem' }}>
              <button 
                onClick={() => setLeadSubTab('pipeline')}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: '1px solid var(--vanya-gold)',
                  color: leadSubTab === 'pipeline' ? '#fff' : 'var(--vanya-green)',
                  background: leadSubTab === 'pipeline' ? 'var(--vanya-green)' : 'transparent',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
              >
                📋 Master Inquiry Pipeline
              </button>
              <button 
                onClick={() => setLeadSubTab('distribute')}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: '1px solid var(--vanya-gold)',
                  color: leadSubTab === 'distribute' ? '#fff' : 'var(--vanya-green)',
                  background: leadSubTab === 'distribute' ? 'var(--vanya-green)' : 'transparent',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
              >
                🔄 Reassign / Distribute Leads
              </button>
            </div>

            {/* Quick Leads assign row */}
            {leadSubTab === 'distribute' && (
              <div className="widget-card mb-2">
                <h3 className="serif" style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Reassign / Distribute Leads</h3>
                <div className="table-responsive-wrapper">
                  <table className="table-standard">
                    <thead>
                      <tr>
                        <th>LEAD NAME</th>
                        <th>SOURCE</th>
                        <th>CURRENT REPRESENTATIVE</th>
                        <th>STATUS</th>
                        <th>ASSIGNMENT ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inquiries
                        .filter(inq => !inq.source?.startsWith('UNIT_ASSIGNMENT_') && !inq.status?.startsWith('SCHEDULED|'))
                        .map((inq, i) => {
                          const repId = inq.status && inq.status.includes('|') ? inq.status.split('|')[1] : 'unassigned';
                          
                          const getRepName = (id) => {
                            if (id === 'unassigned') return 'Awaiting Alloc';
                            const dbUser = allUsers.find(u => u.username === id);
                            if (dbUser) return dbUser.full_name || dbUser.username;
                            
                            const map = {
                              'SR-9999': 'Vikram Sethi',
                              'SR-1111': 'Administrator',
                              'SR-2222': 'Rahul Verma',
                              'SR-3333': 'Sneha Patil',
                              'SR-4444': 'Aditya Sharma',
                            };
                            return map[id] || id;
                          };

                          return (
                            <tr key={inq.id || i}>
                              <td><strong>{inq.name}</strong><br/><span className="text-muted" style={{ fontSize: '0.7rem' }}>{inq.phone}</span></td>
                              <td><span className="source-pill">{inq.source || 'PORTAL'}</span></td>
                              <td><strong>{getRepName(repId)}</strong></td>
                              <td><span className={`badge ${repId === 'unassigned' ? 'sold' : 'available'}`}>{repId === 'unassigned' ? 'UNASSIGNED' : 'ASSIGNED'}</span></td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <select 
                                    value={leadAssignState.leadId === inq.id ? leadAssignState.salesmanId : repId}
                                    onChange={(e) => setLeadAssignState({ leadId: inq.id, salesmanId: e.target.value })}
                                    style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                  >
                                    <option value="unassigned">Select Rep...</option>
                                    {allUsers
                                      .filter(u => u.role === 'Sales' && u.is_active !== false)
                                      .map(u => (
                                        <option key={u.username} value={u.username}>
                                          {u.full_name || u.username} ({u.username})
                                        </option>
                                      ))
                                    }
                                  </select>
                                  <button onClick={() => handleAssignLead(inq.id, leadAssignState.salesmanId)} className="btn-dark" style={{ padding: '4px 10px', fontSize: '0.65rem' }}>ALLOCATE</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reusable InquiryPipelineClient */}
            {leadSubTab === 'pipeline' && (
              <InquiryPipelineClient 
                inquiries={inquiries} 
                allCallLogs={allCallLogs}
                opportunities={opportunities}
                allUsers={allUsers}
                buyers={buyers}
                onAddCallLog={(newLog) => setAllCallLogs(prev => [newLog, ...prev])}
                exotelSid={exotelSid}
                exotelApiKey={exotelApiKey}
                exotelToken={exotelToken}
                exotelVirtualNumber={exotelVirtualNumber}
              />
            )}
          </div>
        )}

        {/* ==================== 4. BOOKINGS PAGE ==================== */}
        {activeTab === 'bookings' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            <div className="widget-card">
              <h3 className="serif" style={{ margin: '0 0 1rem 0' }}>ERP Bookings Log</h3>
              <div className="table-responsive-wrapper">
                <table className="table-standard">
                  <thead>
                    <tr>
                      <th>BUYER PORTAL ACCOUNT</th>
                      <th>UNIT ID</th>
                      <th>AMOUNT PAID</th>
                      <th>TOTAL EQUITY VALUE</th>
                      <th>HANDOVER PROJECTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buyers.map((b, i) => (
                      <tr key={i}>
                        <td><strong>{b.username}</strong></td>
                        <td>Flat {b.unit_id}</td>
                        <td style={{ color: '#137333', fontWeight: 'bold' }}>{b.amount_paid}</td>
                        <td><strong>{b.total_amount}</strong></td>
                        <td>{b.possession_date || 'DECEMBER 2027'}</td>
                      </tr>
                    ))}
                    {buyers.length === 0 && (
                      <tr><td colSpan="5" className="text-muted" style={{ textAlign: 'center' }}>No active bookings logged. Enable Buyer Portal to begin.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 5. INVENTORY PAGE ==================== */}
        {activeTab === 'inventory' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            
            <div style={{ background: '#fff', border: '1px solid #f1f3f5', borderRadius: '12px', padding: '1rem' }}>
              <GridClient units={units} inquiries={inquiries} buyers={buyers} users={allUsers} project={project} />
            </div>
          </div>
        )}

        {/* ==================== 6. FINANCE PAGE ==================== */}
        {activeTab === 'finance' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            <div className="responsive-grid-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="widget-card">
                <span style={{ fontSize: '0.62rem', color: '#888', fontWeight: 'bold' }}>TOTAL COLLECTION</span>
                <h3 className="num-mono" style={{ margin: '0.2rem 0', color: '#137333', fontSize: '1.6rem' }}>₹ {totalCollectionFormatted}</h3>
              </div>
              <div className="widget-card">
                <span style={{ fontSize: '0.62rem', color: '#888', fontWeight: 'bold' }}>COLLECTED THIS MONTH</span>
                <h3 className="num-mono" style={{ margin: '0.2rem 0', color: '#137333', fontSize: '1.6rem' }}>₹ {collectedThisMonthFormatted}</h3>
              </div>
              <div className="widget-card">
                <span style={{ fontSize: '0.62rem', color: '#888', fontWeight: 'bold' }}>PENDING INSTALMENTS</span>
                <h3 className="num-mono" style={{ margin: '0.2rem 0', color: 'var(--vanya-gold)', fontSize: '1.6rem' }}>₹ {pendingInstallmentsFormatted}</h3>
              </div>
              <div className="widget-card">
                <span style={{ fontSize: '0.62rem', color: '#888', fontWeight: 'bold' }}>OVERDUE AMOUNT</span>
                <h3 className="num-mono" style={{ margin: '0.2rem 0', color: '#c62828', fontSize: '1.6rem' }}>₹ {overdueAmountFormatted}</h3>
              </div>
            </div>

            {/* Finance Charts */}
            <div className="responsive-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="widget-card" style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Top row: Title + View Tabs */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 className="serif" style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', color: '#1f2937' }}>Instalment Payment Trend</h3>
                  <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                    {[['week','Week'],['month','Month'],['year','Year']].map(([val, label]) => (
                      <button key={val}
                        onClick={() => { setFinanceView(val); resetFinancePeriod(); }}
                        style={{ padding: '4px 10px', fontSize: '0.65rem', fontWeight: '700', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                          background: financeView === val ? 'var(--vanya-green)' : 'transparent',
                          color: financeView === val ? '#fff' : '#6b7280' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Controls row: Past/Projection toggle + Absolute Period navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {/* Actuals vs Projection toggle */}
                  <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                    <button
                      onClick={() => setFinanceViewType('past')}
                      style={{ padding: '3px 8px', fontSize: '0.62rem', fontWeight: '700', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        background: financeViewType === 'past' ? '#1f2937' : 'transparent',
                        color: financeViewType === 'past' ? '#fff' : '#6b7280' }}
                    >
                      Actuals
                    </button>
                    <button
                      onClick={() => setFinanceViewType('projection')}
                      style={{ padding: '3px 8px', fontSize: '0.62rem', fontWeight: '700', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        background: financeViewType === 'projection' ? '#1f2937' : 'transparent',
                        color: financeViewType === 'projection' ? '#fff' : '#6b7280' }}
                    >
                      Projection
                    </button>
                  </div>

                  {/* Absolute selectors */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={handlePrevFinancePeriod}
                      style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >◀</button>

                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      {financeView === 'week' && (
                        <SelectField
                          value={financeWeek}
                          onChange={(e) => setFinanceWeek(Number(e.target.value))}
                          options={getWeekOptions(financeYear, financeMonth).map(opt => ({ value: opt.value, label: `Week ${opt.value + 1}` }))}
                        />
                      )}
                      {(financeView === 'week' || financeView === 'month') && (
                        <SelectField
                          value={financeMonth}
                          onChange={(e) => setFinanceMonth(Number(e.target.value))}
                          options={['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, idx) => ({ value: idx, label: m }))}
                        />
                      )}
                      <SelectField
                        value={financeYear}
                        onChange={(e) => setFinanceYear(Number(e.target.value))}
                        options={availableYears.map(yr => ({ value: yr, label: String(yr) }))}
                      />
                    </div>

                    <button onClick={handleNextFinancePeriod}
                      disabled={isFinanceNextDisabled()}
                      style={{ 
                        width: '26px', 
                        height: '26px', 
                        borderRadius: '50%', 
                        border: '1px solid #e2e8f0', 
                        background: isFinanceNextDisabled() ? '#f1f5f9' : '#fff', 
                        cursor: isFinanceNextDisabled() ? 'not-allowed' : 'pointer', 
                        fontSize: '0.8rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: isFinanceNextDisabled() ? '#cbd5e1' : '#475569', 
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
                        transition: 'all 0.15s' 
                      }}
                      onMouseEnter={e => { if (!isFinanceNextDisabled()) e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={e => { if (!isFinanceNextDisabled()) e.currentTarget.style.background = '#fff'; }}
                    >▶</button>
                  </div>
                </div>

                <div style={{ height: '180px', width: '100%' }}>
                  <svg viewBox="0 0 500 150" width="100%" height="100%" style={{ overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="chart-gradient-finance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#137333" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#137333" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {(() => {
                      const data = getRevenueData(financeView, financeYear, financeMonth, financeWeek, financeViewType);
                      const monthlyCollections = data.map(d => d.value);
                      const monthLabels = data.map(d => d.label);
                      
                      const maxColl = Math.max(...monthlyCollections, 1);
                      const n = data.length;
                      const plotWidth = 420;
                      const xStep = n > 1 ? plotWidth / (n - 1) : plotWidth;

                      const points = monthlyCollections.map((coll, idx) => {
                        const x = 40 + idx * xStep;
                        const y = 110 - (coll / maxColl) * 80;
                        return { x, y, coll, label: monthLabels[idx] };
                      });

                      const pathD = points.length > 0 ? `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}` : '';
                      const areaD = points.length > 0 ? `M 40 110 L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L 460 110 Z` : '';

                      const formatTrendAmount = (lakhs) => {
                        if (lakhs === 0) return '₹0';
                        return formatCompactRupees(lakhs);
                      };

                      return (
                        <>
                          {/* Grid lines */}
                          <line x1="40" y1="30" x2="460" y2="30" stroke="#f1f3f5" strokeDasharray="4 4" />
                          <line x1="40" y1="70" x2="460" y2="70" stroke="#f1f3f5" strokeDasharray="4 4" />
                          <line x1="40" y1="110" x2="460" y2="110" stroke="#e9ecef" strokeWidth="1" />

                          {/* Gradient area */}
                          {areaD && <path d={areaD} fill="url(#chart-gradient-finance)" />}

                          {/* Trend Line */}
                          {pathD && <path d={pathD} fill="none" stroke="#137333" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

                          {/* Dots, Values, and Labels */}
                          {points.map((p, idx) => {
                            const cleanLabel = p.label.includes('(') ? p.label.split(' ')[0] : p.label;
                            return (
                              <g key={idx}>
                                <circle cx={p.x} cy={p.y} r="5" fill="#137333" stroke="#fff" strokeWidth="2" />
                                <text x={p.x} y={p.y - 12} textAnchor="middle" style={{ fontSize: '0.62rem', fill: '#137333', fontWeight: 'bold' }}>
                                  {formatTrendAmount(p.coll)}
                                </text>
                                <text x={p.x} y="130" textAnchor="middle" style={{ fontSize: '0.65rem', fill: '#6c757d', fontWeight: 'bold' }}>
                                  {cleanLabel}
                                </text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
              <div className="widget-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <h3 className="serif" style={{ margin: '0 0 1rem 0' }}>Collection by Mode</h3>
                {(() => {
                  let digitalCount = 0; let bankCount = 0; let cashCount = 0;
                  buyers.forEach(b => {
                    const mode = (b.payment_mode || '').toLowerCase();
                    if (mode.includes('upi') || mode.includes('digital') || mode.includes('card')) digitalCount++;
                    else if (mode.includes('neft') || mode.includes('rtgs') || mode.includes('bank') || mode.includes('transfer')) bankCount++;
                    else if (mode.includes('cash') || mode.includes('cheque')) cashCount++;
                  });
                  const totalModes = digitalCount + bankCount + cashCount;
                  const digitalPercent = totalModes > 0 ? Math.round((digitalCount / totalModes) * 100) : 0;
                  const bankPercent = totalModes > 0 ? Math.round((bankCount / totalModes) * 100) : 0;
                  const cashPercent = totalModes > 0 ? Math.max(0, 100 - digitalPercent - bankPercent) : 0;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexGrow: 1, padding: '0.5rem 0' }}>
                      <div className="donut-chart-mock" style={{ margin: '0', background: `conic-gradient(#137333 0% ${digitalPercent}%, var(--vanya-gold) ${digitalPercent}% ${digitalPercent + bankPercent}%, #1a73e8 ${digitalPercent + bankPercent}% 100%)` }}>
                        <div className="donut-inner">
                          <h2 className="num-mono" style={{ fontSize: '1.3rem', color: '#137333' }}>{digitalPercent}%</h2>
                          <span style={{ fontSize: '0.5rem' }}>DIGITAL</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '110px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                          <span className="dot" style={{ background: '#137333', width: '10px', height: '10px', borderRadius: '50%', marginRight: '0' }} />
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#111' }}>{digitalPercent}%</div>
                            <div style={{ fontSize: '0.62rem', color: '#666' }}>Digital / UPI</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                          <span className="dot" style={{ background: 'var(--vanya-gold)', width: '10px', height: '10px', borderRadius: '50%', marginRight: '0' }} />
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#111' }}>{bankPercent}%</div>
                            <div style={{ fontSize: '0.62rem', color: '#666' }}>NEFT / RTGS</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                          <span className="dot" style={{ background: '#1a73e8', width: '10px', height: '10px', borderRadius: '50%', marginRight: '0' }} />
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#111' }}>{cashPercent}%</div>
                            <div style={{ fontSize: '0.62rem', color: '#666' }}>Cheque</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Payments Ledger table */}
            <div className="widget-card">
              <h3 className="serif" style={{ margin: '0 0 1rem 0' }}>Recent Collections Log</h3>
              <div className="table-responsive-wrapper">
                <table className="table-standard">
                  <thead>
                    <tr>
                      <th>BUYER ACCOUNT</th>
                      <th>PROJECT</th>
                      <th>UNIT / DEMAND INSTALMENT</th>
                      <th>AMOUNT RECEIVED</th>
                      <th>PAYMENT STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buyers.map((b, i) => (
                      <tr key={`bd-${i}`}>
                        <td><strong>{b.username}</strong></td>
                        <td>Vanya Residences</td>
                        <td>Unit {b.unit_id} — Progress demand ({b.construction_progress}%)</td>
                        <td style={{ color: '#137333', fontWeight: 'bold' }}>{b.amount_paid}</td>
                        <td><span className="badge available">RECEIVED &amp; CLEAR</span></td>
                      </tr>
                    ))}
                    {units
                      .filter(u =>
                        u.status === 'SOLD OUT' &&
                        u.tag_color &&
                        !['green', 'red', 'blue', ''].includes((u.tag_color || '').toLowerCase()) &&
                        !buyers.some(b => b.username?.toLowerCase().trim() === u.tag_color?.toLowerCase().trim())
                      )
                      .map((u, i) => (
                        <tr key={`leg-${i}`}>
                          <td><strong>{u.tag_color}</strong></td>
                          <td>Vanya Residences</td>
                          <td>Unit {u.unit_id} — {u.type}</td>
                          <td style={{ color: '#6b7280', fontWeight: 'bold' }}>—</td>
                          <td><span className="badge reserved">LEGACY ENTRY</span></td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 7. CP PARTNERS PAGE ==================== */}
        {activeTab === 'cp' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            <div className="responsive-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>
              {/* Commissions Approval Ledger */}
              <div>
                <AdminCPCommissionsClient initialCommissions={commissions} cpPartners={cpPartners} inquiries={inquiries} allUsers={allUsers} />
              </div>
              
              {/* CP Partner Profile registry */}
              <div className="widget-card" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
                <div className="flex-between mb-2">
                  <h3 className="serif" style={{ margin: 0 }}>Active Broker Profiles</h3>
                  <AdminAddCPClient />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {cpPartners.map((cp, idx) => (
                    <div key={cp.id || idx} style={{ border: '1px solid #f1f3f5', padding: '0.8rem 1rem', borderRadius: '8px', background: '#fafafa' }}>
                      <strong style={{ color: 'var(--vanya-green)', fontSize: '0.82rem' }}>{cp.firm_name}</strong>
                      <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.2rem' }}>RERA Registration: {cp.rera_number}</div>
                      <span className="badge available" style={{ fontSize: '0.55rem', marginTop: '0.4rem' }}>Broker Comm: {cp.commission_rate}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 8. USERS MANAGEMENT PAGE ==================== */}
        {activeTab === 'users' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            <div className="widget-card">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', gap: '1rem', width: '100%' }}>
                <div style={{ textAlign: 'center' }}>
                  <h3 className="serif" style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: 'var(--vanya-green)' }}>Users Account Registry</h3>
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Authorized CRM portals access registry</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <AdminAddSalesClient />
                  <AdminAddCPClient />
                  <AdminAddBuyerClient />
                </div>
              </div>
              
              <div className="table-responsive-wrapper">
                <table className="table-standard">
                <thead>
                  <tr>
                    <th>USERNAME</th>
                    <th>PORTAL TYPE</th>
                    <th>CREDENTIALS ENVELOPE</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Salesmen list */}
                  {allUsers.filter(u => u.role === 'Sales').map((s, idx) => {
                    const isActive = s.is_active !== false;
                    return (
                      <tr key={`sales-${idx}`}>
                        <td><strong>{s.username}</strong></td>
                        <td><span className="source-pill" style={{ color: '#137333', background: '#e6f4ea' }}>Sales Executive</span></td>
                        <td style={{ fontStyle: 'italic', fontSize: '0.75rem', color: '#9ca3af' }}>{s.full_name ? `Name: ${s.full_name}` : 'Sales Portal Access'}</td>
                        <td>
                          {isActive ? (
                            <span className="badge available">Active Portal</span>
                          ) : (
                            <span className="badge sold" style={{ background: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' }}>Deactivated</span>
                          )}
                        </td>
                        <td>
                          {isActive ? (
                            <button 
                              onClick={() => handleDeleteUser(s.username, 'Sales', 'deactivate')}
                              style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                            >
                              ❌ Deactivate
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleDeleteUser(s.username, 'Sales', 'activate')}
                              style={{ background: '#e6f4ea', color: '#137333', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#c2e7c9'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#e6f4ea'}
                            >
                              ✅ Reactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Channel Partners list */}
                  {cpPartners.map((cp, idx) => {
                    const cpUser = allUsers.find(u => u.username === cp.username);
                    const isActive = cpUser ? cpUser.is_active !== false : cp.is_active !== false;
                    return (
                      <tr key={`cp-${idx}`}>
                        <td><strong>{cp.username}</strong></td>
                        <td><span className="source-pill" style={{ color: 'var(--vanya-gold)', background: '#fdf5e6' }}>Channel Partner</span></td>
                        <td style={{ fontStyle: 'italic', fontSize: '0.75rem', color: '#9ca3af' }}>Firm: {cp.firm_name}</td>
                        <td>
                          {isActive ? (
                            <span className="badge available">Active Portal</span>
                          ) : (
                            <span className="badge sold" style={{ background: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' }}>Deactivated</span>
                          )}
                        </td>
                        <td>
                          {isActive ? (
                            <button 
                              onClick={() => handleDeleteUser(cp.username, 'ChannelPartner', 'deactivate')}
                              style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                            >
                              ❌ Deactivate
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleDeleteUser(cp.username, 'ChannelPartner', 'activate')}
                              style={{ background: '#e6f4ea', color: '#137333', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#c2e7c9'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#e6f4ea'}
                            >
                              ✅ Reactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Buyers list */}
                  {buyers.map((b, idx) => (
                    <tr key={`buyer-${idx}`}>
                      <td><strong>{b.username}</strong></td>
                      <td><span className="source-pill" style={{ color: '#1a73e8', background: '#e8f0fe' }}>Resident Buyer</span></td>
                      <td style={{ fontStyle: 'italic', fontSize: '0.75rem', color: '#9ca3af' }}>Linked to Flat {b.unit_id}</td>
                      <td><span className="badge available">Active Portal</span></td>
                      <td>
                        <button 
                          onClick={() => handleDeleteUser(b.username, 'Buyer')}
                          style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                        >
                          ❌ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        )}

        {/* ==================== 9. REPORTS PAGE ==================== */}
        {activeTab === 'reports' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
              
              {/* Left Panel report selector */}
              <div className="widget-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: 'fit-content' }}>
                <h4 className="serif" style={{ margin: '0 0 0.75rem 0', color: 'var(--vanya-green)' }}>ERP Modules</h4>
                {['sales', 'bookings', 'collections', 'inventory', 'cp'].map(r => (
                  <button 
                    key={r}
                    onClick={() => setReportType(r)}
                    style={{
                      padding: '0.6rem 1rem', textAlign: 'left', borderRadius: '6px', cursor: 'pointer',
                      border: 'none', background: reportType === r ? '#fcf6e8' : 'none',
                      color: reportType === r ? '#b08e40' : '#4b5563', fontWeight: reportType === r ? 'bold' : 'normal',
                      fontSize: '0.78rem'
                    }}
                  >
                    {r.toUpperCase()} REPORT
                  </button>
                ))}
              </div>

              {/* Right Panel export settings */}
              <div className="widget-card">
                <h3 className="serif" style={{ margin: '0 0 1rem 0' }}>ERP Report Export</h3>
                <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '2rem' }}>Export the generated {reportType} telemetry details into local files.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <button onClick={handleExportPDF} className="btn-dark">DOWNLOAD PDF</button>
                  <button onClick={handleExportExcel} className="btn-outline">DOWNLOAD EXCEL</button>
                  <button onClick={handleExportCSV} className="btn-dark" style={{ background: 'var(--vanya-gold)' }}>EXPORT CSV</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 10. SETTINGS PAGE ==================== */}
        {activeTab === 'settings' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
              
              {/* Left Settings Submenu */}
              <div className="widget-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: 'fit-content' }}>
                <button className={`btn-outline ${settingsSubTab === 'general' ? 'active' : ''}`} onClick={() => setSettingsSubTab('general')} style={{ border: 'none', textAlign: 'left' }}>General Settings</button>
                <button className={`btn-outline ${settingsSubTab === 'branding' ? 'active' : ''}`} onClick={() => setSettingsSubTab('branding')} style={{ border: 'none', textAlign: 'left' }}>Branding & Styling</button>
                <button className={`btn-outline ${settingsSubTab === 'security' ? 'active' : ''}`} onClick={() => setSettingsSubTab('security')} style={{ border: 'none', textAlign: 'left' }}>Access Security</button>
                <button className={`btn-outline ${settingsSubTab === 'telephony' ? 'active' : ''}`} onClick={() => setSettingsSubTab('telephony')} style={{ border: 'none', textAlign: 'left' }}>Telephony & Call Settings</button>
              </div>

              {/* Settings Form */}
              <div className="widget-card">
                <h3 className="serif" style={{ margin: '0 0 1.5rem 0' }}>ERP Configurations</h3>
                {settingsSubTab === 'general' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label>Enterprise Company Name</label>
                      <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} style={{ width: '96%' }} />
                    </div>
                    <div className="form-group">
                      <label>System Base Currency Display</label>
                      <select value={baseCurrency} onChange={e => setBaseCurrency(e.target.value)} style={{ width: '100%' }}>
                        <option value="INR">Indian Rupee (₹, Cr, L)</option>
                        <option value="USD">US Dollar ($)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Round-Robin Allocation Strategy</label>
                      <select value={allocationStrategy} onChange={e => setAllocationStrategy(e.target.value)} style={{ width: '100%' }}>
                        <option value="active">Active Sales Rep Priority</option>
                        <option value="weighted">Weighted Conversion Ratio</option>
                      </select>
                    </div>
                  </div>
                )}

                {settingsSubTab === 'branding' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label>Platform Theme Mode</label>
                      <select value={themeMode} onChange={e => setThemeMode(e.target.value)} style={{ width: '100%' }}>
                        <option value="classic">Classic Light (Professional)</option>
                        <option value="dark">Executive Dark Mode</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Brand Accent Color</label>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input type="color" value={brandAccent} onChange={e => setBrandAccent(e.target.value)} style={{ width: '50px', height: '40px', padding: 0, border: 'none' }} />
                        <span style={{ fontFamily: 'monospace', color: '#6b7280' }}>{brandAccent.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Project Title (Displays on Portals)</label>
                      <input type="text" value={projectTitle} onChange={e => setProjectTitle(e.target.value)} style={{ width: '96%' }} />
                    </div>
                  </div>
                )}

                {settingsSubTab === 'security' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label>Session Expiry Time</label>
                      <select value={sessionExpiry} onChange={e => setSessionExpiry(e.target.value)} style={{ width: '100%' }}>
                        <option value="4h">4 Hours</option>
                        <option value="12h">12 Hours (Default)</option>
                        <option value="24h">24 Hours</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Minimum Password Length</label>
                      <input type="number" min="6" max="20" value={minPasswordLength} onChange={e => setMinPasswordLength(parseInt(e.target.value) || 6)} style={{ width: '96%' }} />
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <input type="checkbox" id="mfaToggle" checked={mfaEnabled} onChange={e => setMfaEnabled(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                      <label htmlFor="mfaToggle" style={{ margin: 0, cursor: 'pointer' }}>Require Multi-Factor Auth (MFA) for Admin Users</label>
                    </div>
                  </div>
                )}

                {settingsSubTab === 'telephony' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--vanya-green)', fontSize: '0.9rem', fontWeight: 'bold' }}>EXOTEL TELEPHONY CONNECTOR</h4>
                    <p className="text-muted" style={{ fontSize: '0.72rem', margin: '0 0 0.5rem 0' }}>Configure live Exotel Account Credentials. Leave empty to automatically fall back to sandbox test mode.</p>
                    
                    <div className="form-group">
                      <label>Exotel Account SID</label>
                      <input 
                        type="text" 
                        value={exotelSid} 
                        onChange={e => setExotelSid(e.target.value)} 
                        placeholder="e.g. your_account_sid" 
                        style={{ width: '96%' }} 
                      />
                    </div>

                    <div className="form-group">
                      <label>Exotel API Key</label>
                      <input 
                        type="text" 
                        value={exotelApiKey} 
                        onChange={e => setExotelApiKey(e.target.value)} 
                        placeholder="e.g. your_api_key" 
                        style={{ width: '96%' }} 
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Exotel API Token</label>
                      <input 
                        type="password" 
                        value={exotelToken} 
                        onChange={e => setExotelToken(e.target.value)} 
                        placeholder="e.g. your_api_token" 
                        style={{ width: '96%' }} 
                      />
                    </div>

                    <div className="form-group">
                      <label>Exotel Virtual Number (Caller ID)</label>
                      <input 
                        type="text" 
                        value={exotelVirtualNumber} 
                        onChange={e => setExotelVirtualNumber(e.target.value)} 
                        placeholder="e.g. 080XXXXXXX" 
                        style={{ width: '96%' }} 
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                  <button className="btn-dark" onClick={handleSaveSettings} style={{ background: brandAccent, border: 'none', color: '#fff' }}>SAVE SETTINGS</button>
                  {saveSuccess && <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold' }}>✓ Settings applied successfully</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 11. ROLES & PERMISSIONS PAGE ==================== */}
        {activeTab === 'roles' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            <div className="widget-card">
              <h3 className="serif" style={{ margin: '0 0 1.25rem 0' }}>ERP System Role Access Permissions</h3>
              <div className="table-responsive-wrapper">
                <table className="table-standard">
                <thead>
                  <tr>
                    <th>ROLE NAME</th>
                    <th>PORTAL ACCESS PRIVILEGES</th>
                    <th>DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Super Admin</strong></td>
                    <td><span className="badge available">Full Access</span></td>
                    <td>Complete control over financial collections, inventory states, settings, and user registries.</td>
                  </tr>
                  <tr>
                    <td><strong>Sales Representative</strong></td>
                    <td><span className="badge reserved">Sales Portal Only</span></td>
                    <td>Access leads pipelines, manage site visits, and coordinate inventory assignments.</td>
                  </tr>
                  <tr>
                    <td><strong>Channel Partner (Broker)</strong></td>
                    <td><span className="badge reserved">CP Portal Only</span></td>
                    <td>Submit buyer referrals, access shared files/brochures, and view commission ledgers.</td>
                  </tr>
                  <tr>
                    <td><strong>Resident Buyer</strong></td>
                    <td><span className="badge reserved">Owner Portal Only</span></td>
                    <td>Inspect structural milestones, verify instalments, and download agreements.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            </div>
          </div>
        )}

        {/* ==================== 12. ALERTS LOG ==================== */}
        {activeTab === 'alerts' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            <div className="widget-card">
              <h3 className="serif" style={{ margin: '0 0 1rem 0' }}>Administrative Alerts Log</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                {notificationAlerts.items.map(item => (
                  <div key={item.id} style={{ position: 'relative', display: 'flex', gap: '1rem', padding: '1rem', background: item.color === '#c53030' ? '#fff5f5' : item.color === '#1a73e8' ? '#f0f4f9' : '#fffdf9', border: `1px solid ${item.color === '#c53030' ? '#feb2b2' : item.color === '#1a73e8' ? '#a7f3d0' : 'var(--vanya-gold)'}`, borderRadius: '8px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                    <div style={{ paddingRight: '1.5rem' }}>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: item.color === '#c53030' ? '#c53030' : item.color === '#1a73e8' ? '#1a73e8' : '#b08e40', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {(() => {
                          if (item.id === 'unassigned-leads') return 'Action Required: Unassigned Leads';
                          if (item.id === 'pending-visits') return 'Operational Warning: Pending Site Visits';
                          if (item.id === 'low-inventory') return 'System Notice: Low Inventory';
                          if (item.id.startsWith('cp-ready-')) return 'Action Required: CP Deal Ready to Book';
                          if (item.id.startsWith('cp-ref-')) return 'New CP Referral';
                          return 'Alert Notice';
                        })()}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#333' }}>{item.text}</p>
                    </div>
                    <button 
                      onClick={() => setDismissedAlertIds(prev => [...prev, item.id])} 
                      style={{ position: 'absolute', top: '10px', right: '12px', background: 'none', border: 'none', fontSize: '1.25rem', color: '#888', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                      title="Dismiss alert"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                {notificationAlerts.items.length === 0 && (
                  <div style={{ display: 'flex', gap: '1rem', padding: '1.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.8rem' }}>✅</span>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: '#166534', fontSize: '0.9rem', fontWeight: 'bold' }}>All Systems Nominal</h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#15803d' }}>No critical operational warnings or unassigned leads detected. System is running cleanly.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}




        {/* Removed duplicate bottom sections */}

      </main>

      {/* QUICK ADD FORM MODAL */}
      {activeQuickAddForm && (
        <div onClick={() => setActiveQuickAddForm(null)} style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(4px)', cursor: 'pointer'
        }}>
          <div onClick={e => e.stopPropagation()} className="widget-card" style={{ width: '450px', position: 'relative', background: '#fff', border: '1px solid var(--vanya-gold)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', cursor: 'default' }}>
            <button 
              onClick={() => setActiveQuickAddForm(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999', padding: 0, lineHeight: 1 }}
            >
              &times;
            </button>
            
            {activeQuickAddForm === 'lead' && (
              <form onSubmit={handleQuickLeadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 className="serif" style={{ color: 'var(--vanya-green)', margin: '0 0 0.5rem 0' }}>Add New Lead</h3>
                
                {quickLeadSubmitError && (
                  <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', color: '#c53030', fontWeight: 'bold' }}>
                    ⚠️ {quickLeadSubmitError}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>CLIENT NAME *</label>
                  <input 
                    type="text" required 
                    pattern="[A-Za-z\s]+" title="Name must contain only letters and spaces"
                    value={quickLeadName} onChange={e => setQuickLeadName(e.target.value)} 
                    style={{ width: '95%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>MOBILE PHONE *</label>
                    <input 
                      type="text" required 
                      minLength="10" maxLength="10" pattern="[0-9]{10}" title="Mobile number must be exactly 10 digits"
                      value={quickLeadPhone} onChange={e => setQuickLeadPhone(e.target.value)} 
                      style={{ width: '90%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>EMAIL ID *</label>
                    <input 
                      type="email" required 
                      value={quickLeadEmail} onChange={e => setQuickLeadEmail(e.target.value)} 
                      style={{ width: '90%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>AADHAAR CARD NUMBER</label>
                    <input 
                      type="text" 
                      minLength="12" maxLength="12" pattern="[0-9]{12}" title="Aadhaar number must be exactly 12 digits"
                      value={quickLeadAadhaar} onChange={e => setQuickLeadAadhaar(e.target.value)} 
                      placeholder="Optional"
                      style={{ width: '90%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>PINCODE LOCATION *</label>
                    <input 
                      type="text" required 
                      minLength="6" maxLength="6" pattern="[0-9]{6}" title="Pincode must be exactly 6 digits"
                      value={quickLeadPincode} onChange={e => setQuickLeadPincode(e.target.value)} 
                      style={{ width: '85%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>ALLOCATE REPRESENTATIVE</label>
                  <select 
                    value={quickLeadRep} onChange={e => setQuickLeadRep(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }}
                  >
                    <option value="unassigned">Awaiting Allocation (Unassigned)</option>
                    {allUsers
                      .filter(u => u.role === 'Sales' && u.is_active !== false)
                      .map(u => (
                        <option key={u.username} value={u.username}>
                          {u.full_name || u.username} ({u.username})
                        </option>
                      ))
                    }
                  </select>
                </div>

                <button type="submit" className="btn-dark" style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                  SUBMIT NEW LEAD
                </button>
              </form>
            )}


            {activeQuickAddForm === 'flat' && (
              <form onSubmit={handleQuickFlatSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 className="serif" style={{ color: 'var(--vanya-green)', margin: '0 0 0.5rem 0' }}>Add New Flat (Unit)</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>UNIT ID (NUMBER) *</label>
                    <input 
                      type="text" required placeholder="e.g. 105"
                      value={quickFlatId} onChange={e => setQuickFlatId(e.target.value)} 
                      style={{ width: '90%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>FLOOR NUMBER *</label>
                    <input 
                      type="text" required placeholder="e.g. 1"
                      value={quickFlatFloor} onChange={e => setQuickFlatFloor(e.target.value)} 
                      style={{ width: '90%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>UNIT TYPE *</label>
                    <select 
                      value={quickFlatType} onChange={e => setQuickFlatType(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }}
                    >
                      <option value="3BHK">3BHK APARTMENT</option>
                      <option value="4BHK">4BHK APARTMENT</option>
                      <option value="4BHK PENTHOUSE">4BHK PENTHOUSE</option>
                      <option value="STUDIO">STUDIO</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>AREA (SQFT) *</label>
                    <input 
                      type="text" required 
                      value={quickFlatArea} onChange={e => setQuickFlatArea(e.target.value)} 
                      style={{ width: '85%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>PRICE TAG *</label>
                    <input 
                      type="text" required placeholder="e.g. ₹ 3.50 Cr"
                      value={quickFlatPrice} onChange={e => setQuickFlatPrice(e.target.value)} 
                      style={{ width: '90%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.3rem' }}>INITIAL STATUS</label>
                    <select 
                      value={quickFlatStatus} onChange={e => setQuickFlatStatus(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }}
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="RESERVED">RESERVED</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn-dark" style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                  ADD UNIT TO INVENTORY
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
