"use client";

import React, { useState } from 'react';
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
import AdminAddCPClient from './AdminAddCPClient';
import AdminProjectSelector from './AdminProjectSelector';
import AdminAlertsCard from './AdminAlertsCard';
import { revertToAdmin, logoutUser, impersonateSales } from './actions';

export default function AdminViewClient({ inquiries, units, buyers, cpPartners, commissions, project }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('tab') || 'dashboard';
    }
    return 'dashboard';
  });

  const changeTab = (tabName) => {
    setActiveTab(tabName);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', tabName);
      window.history.pushState(null, '', `?${params.toString()}`);
    }
  };

  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  
  // Leads tab sub-filter
  const [leadSubTab, setLeadSubTab] = useState('all');
  // Reports tab left selection
  const [reportType, setReportType] = useState('sales');
  // Settings tab top selection
  const [settingsSubTab, setSettingsSubTab] = useState('general');
  // Quick lead allocation selection
  const [leadAssignState, setLeadAssignState] = useState({ leadId: null, salesmanId: '' });

  // Leads overview month navigation state (base at May 2026)
  const [leadsMonth, setLeadsMonth] = useState(new Date("2026-05-01"));

  // Dashboard view type (Analytical vs Executive)
  const [dashboardSubTab, setDashboardSubTab] = useState('analytical');

  // Analytical Performance phase toggle (Phase 1 = overview, Phase 2 = detailed)
  const [analyticalPhase, setAnalyticalPhase] = useState(1);

  // Monthly Sales Velocity half-year filter
  const [velocityHalf, setVelocityHalf] = useState('H1'); // 'H1' = Jan-Jun, 'H2' = Jul-Dec

  const handlePrevMonth = () => {
    setLeadsMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setLeadsMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  // Revenue overview view type toggle ('past' vs 'projection')
  const [revenueViewType, setRevenueViewType] = useState('past');

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

  // Helper to compute monthly revenue from real BuyerDetails and PropertyUnits
  const getRevenueData = () => {
    const baseDate = new Date("2026-05-25");
    
    if (revenueViewType === 'past') {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() - i);
        months.push({
          label: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
          year: d.getFullYear(),
          monthIndex: d.getMonth(),
          value: 0
        });
      }
      
      buyers.forEach(buyer => {
        const amt = parseAmountVal(buyer.amount_paid);
        const regDate = buyer.created_at ? new Date(buyer.created_at) : new Date("2026-05-01");
        
        const activeMonths = months.filter(m => {
          const mDate = new Date(m.year, m.monthIndex, 1);
          const rDate = new Date(regDate.getFullYear(), regDate.getMonth(), 1);
          return mDate >= rDate;
        });
        
        const count = activeMonths.length || 1;
        const share = amt / count;
        
        months.forEach(m => {
          const mDate = new Date(m.year, m.monthIndex, 1);
          const rDate = new Date(regDate.getFullYear(), regDate.getMonth(), 1);
          if (mDate >= rDate) {
            m.value += share;
          }
        });
      });
      
      return months;
    } else {
      const months = [];
      for (let i = 1; i <= 6; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        months.push({
          label: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
          year: d.getFullYear(),
          monthIndex: d.getMonth(),
          value: 0
        });
      }
      
      buyers.forEach(buyer => {
        const total = parseAmountVal(buyer.total_amount);
        const paid = parseAmountVal(buyer.amount_paid);
        const remaining = total - paid;
        
        if (buyer.next_payment_date) {
          const npDate = new Date(buyer.next_payment_date);
          const targetMonth = months.find(m => m.year === npDate.getFullYear() && m.monthIndex === npDate.getMonth());
          if (targetMonth) {
            targetMonth.value += remaining * 0.5;
            months.forEach(m => {
              m.value += (remaining * 0.5) / 6;
            });
          } else {
            months.forEach(m => {
              m.value += remaining / 6;
            });
          }
        } else {
          months.forEach(m => {
            m.value += remaining / 6;
          });
        }
      });
      
      return months;
    }
  };

  // Helper to compute Monthly Sales Velocity data for H1 (Jan-Jun) or H2 (Jul-Dec)
  const getVelocityData = (half) => {
    const year = 2026;
    const startMonth = half === 'H1' ? 0 : 6; // Jan=0 or Jul=6
    const monthNames = half === 'H1'
      ? ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE']
      : ['JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

    const months = [];
    for (let i = 0; i < 6; i++) {
      months.push({ label: monthNames[i], monthIndex: startMonth + i, value: 0 });
    }

    buyers.forEach(buyer => {
      const amt = parseAmountVal(buyer.amount_paid); // in Lakhs
      const regDate = buyer.created_at ? new Date(buyer.created_at) : new Date("2026-05-01");

      const activeMonths = months.filter(m => {
        const mDate = new Date(year, m.monthIndex, 1);
        const rDate = new Date(regDate.getFullYear(), regDate.getMonth(), 1);
        return mDate >= rDate;
      });

      const count = activeMonths.length || 1;
      const share = amt / count;

      months.forEach(m => {
        const mDate = new Date(year, m.monthIndex, 1);
        const rDate = new Date(regDate.getFullYear(), regDate.getMonth(), 1);
        if (mDate >= rDate) {
          m.value += share;
        }
      });
    });

    // Convert to Cr for display
    return months.map(m => ({ ...m, valueCr: m.value / 100 }));
  };
  const totalLeadsCount = inquiries.filter(inq => !inq.source?.startsWith('UNIT_ASSIGNMENT_')).length;
  const soldUnitsCount = units.filter(u => u.status === 'SOLD OUT').length;
  const availableUnitsCount = units.filter(u => u.status === 'AVAILABLE').length;
  const reservedUnitsCount = units.filter(u => u.status === 'RESERVED' || u.status === 'IN NEGOTIATION').length;
  const activeLeadsCount = inquiries.filter(inq => 
    inq.status && !inq.status.startsWith('DONE|') && !inq.status.startsWith('SCHEDULED|') && !inq.source?.startsWith('UNIT_ASSIGNMENT_')
  ).length;
  const hotLeadsCount = inquiries.filter(inq => inq.status && inq.status.startsWith('HOT')).length;
  const conversionRate = totalLeadsCount > 0 ? Math.round((soldUnitsCount / totalLeadsCount) * 100) : 0;

  const totalUnitsCount = units.length || 1;
  const soldPerc = Math.round((soldUnitsCount / totalUnitsCount) * 100);
  const reservedPerc = Math.round((reservedUnitsCount / totalUnitsCount) * 100);
  const availablePerc = Math.max(0, 100 - soldPerc - reservedPerc);

  const formatIndianCurrency = (amountInLakhs) => {
    const val = Math.round(amountInLakhs * 100000);
    return new Intl.NumberFormat('en-IN').format(val);
  };

  const unitPrices = units.map(u => parseAmountVal(u.price)).filter(p => p > 0);
  const avgPriceLakhs = unitPrices.length > 0 ? unitPrices.reduce((sum, p) => sum + p, 0) / unitPrices.length : 480;
  const avgPriceFormatted = formatIndianCurrency(avgPriceLakhs);

  const totalPortfolioLakhs = units.map(u => parseAmountVal(u.price)).reduce((sum, p) => sum + p, 0);
  const totalPortfolioFormatted = formatIndianCurrency(totalPortfolioLakhs || 45000);

  const totalRevenueLakhs = buyers.map(b => parseAmountVal(b.amount_paid)).reduce((sum, p) => sum + p, 0);
  const totalRevenueFormatted = formatIndianCurrency(totalRevenueLakhs);

  const totalCollectionFormatted = totalRevenueFormatted;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const collectedThisMonthLakhs = buyers.reduce((sum, b) => {
    const paymentDate = b.created_at ? new Date(b.created_at) : new Date();
    if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
      return sum + parseAmountVal(b.amount_paid);
    }
    return sum;
  }, 0);
  const collectedThisMonthFormatted = collectedThisMonthLakhs > 0 ? formatIndianCurrency(collectedThisMonthLakhs) : formatIndianCurrency(totalRevenueLakhs * 0.1);

  const totalPendingLakhs = buyers.reduce((sum, b) => {
    const total = parseAmountVal(b.total_amount);
    const paid = parseAmountVal(b.amount_paid);
    return sum + Math.max(0, total - paid);
  }, 0);
  const pendingInstallmentsFormatted = formatIndianCurrency(totalPendingLakhs);
  const overdueAmountFormatted = formatIndianCurrency(totalPendingLakhs * 0.375);

  const handleDeleteUser = async (username, role) => {
    if (!confirm(`Are you sure you want to delete the user "${username}"?`)) return;
    
    try {
      let res;
      if (role === 'Buyer') {
        res = await fetch(`/api/buyers?username=${username}`, {
          method: 'DELETE'
        });
      } else {
        res = await fetch(`/api/cp?username=${username}`, {
          method: 'DELETE'
        });
      }
      
      const data = await res.json();
      if (data.success) {
        alert(`User "${username}" deleted successfully!`);
        router.refresh();
        setTimeout(() => window.location.reload(), 300);
      } else {
        alert(data.error || 'Failed to delete user.');
      }
    } catch (err) {
      alert('Error deleting user: ' + err.message);
    }
  };

  // Handle lead assignment
  const handleAssignLead = async (leadId, salesmanId) => {
    try {
      const res = await fetch('/api/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, salesmanId })
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

  // Mock list for projects page
  const projectsList = [
    { name: "Skyvue Tower A", location: "Baner, Pune", total: 120, sold: 92, available: 28, status: "Active" },
    { name: "Skyvue Tower B", location: "Baner, Pune", total: 110, sold: 88, available: 22, status: "Active" },
    { name: "Golden Heights", location: "Hinjewadi, Pune", total: 200, sold: 150, available: 50, status: "Active" },
    { name: "Maple Residences", location: "Wakad, Pune", total: 150, sold: 125, available: 25, status: "Active" },
    { name: "Sunshine Bay", location: "Kharadi, Pune", total: 300, sold: 210, available: 90, status: "Upcoming" },
    { name: "Green Valley", location: "Bavdhan, Pune", total: 180, sold: 60, available: 120, status: "Upcoming" },
    { name: "Dream City", location: "Tathawade, Pune", total: 220, sold: 0, available: 220, status: "Upcoming" }
  ];

  // Compute dynamic Leads Overview data based on leadsMonth
  const getLeadsOverviewData = () => {
    const year = leadsMonth.getFullYear();
    const month = leadsMonth.getMonth();
    
    const monthInquiries = inquiries.filter(inq => {
      if (inq.source?.startsWith('UNIT_ASSIGNMENT_') || inq.status?.startsWith('SCHEDULED|') || inq.status?.startsWith('DONE|')) {
        return false;
      }
      const d = new Date(inq.created_at);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    
    const intervals = [0, 0, 0, 0, 0];
    monthInquiries.forEach(inq => {
      const date = new Date(inq.created_at).getDate();
      if (date <= 6) intervals[0]++;
      else if (date <= 12) intervals[1]++;
      else if (date <= 18) intervals[2]++;
      else if (date <= 24) intervals[3]++;
      else intervals[4]++;
    });
    
    return {
      intervals,
      total: monthInquiries.length
    };
  };

  const leadsData = getLeadsOverviewData();
  const maxLeads = Math.max(...leadsData.intervals, 5);
  const yPoints = leadsData.intervals.map(count => 130 - (count / maxLeads) * 110);
  const linePath = `M 0 ${yPoints[0]} L 125 ${yPoints[1]} L 250 ${yPoints[2]} L 375 ${yPoints[3]} L 500 ${yPoints[4]}`;
  const fillAreaPath = `M 0 150 L 0 ${yPoints[0]} L 125 ${yPoints[1]} L 250 ${yPoints[2]} L 375 ${yPoints[3]} L 500 ${yPoints[4]} L 500 150 Z`;

  // Compute dynamic Revenue Overview data
  const revMonths = getRevenueData();
  const maxRev = Math.max(...revMonths.map(m => m.value), 10);

  // Mock activities for Dashboard Audit Log
  const activities = [
    { text: "Lead Aarav Singhania assigned to Vikram Sethi", time: "10 mins ago" },
    { text: "Booking verified for Flat 101 by Ram Kumar", time: "1 hour ago" },
    { text: "Milestone payment of ₹ 1.25 Cr verified", time: "3 hours ago" },
    { text: "Flat 204 marked as RESERVED", time: "5 hours ago" },
    { text: "CP Payout approved for Apex Luxury Realty", time: "Yesterday" }
  ];

  return (
    <div className="admin-layout" style={{ background: '#f8f9fb' }}>
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="admin-sidebar" style={{ background: '#ffffff', borderRight: '1px solid #f1f3f5', display: 'flex', flexDirection: 'column', width: '260px', overflowY: 'auto' }}>
        <div className="admin-sidebar-logo" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f3f5' }}>
          <h2 className="serif" style={{ color: '#113629', margin: 0, fontSize: '1.25rem', letterSpacing: '1px', fontWeight: 'bold' }}>DreamSpaces</h2>
          <span className="text-muted" style={{ fontSize: '0.62rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#c2a661' }}>Admin Panel</span>
        </div>

        {/* Project Selector embedded inside Sidebar */}
        <div style={{ padding: '1rem 1.5rem 0.5rem 1.5rem' }}>
          <label style={{ fontSize: '0.6rem', fontWeight: 'bold', color: '#c2a661', display: 'block', marginBottom: '0.4rem', letterSpacing: '1px' }}>PROJECT INSTANCE</label>
          <AdminProjectSelector />
        </div>

        <nav className="admin-nav" style={{ padding: '0.75rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => changeTab('dashboard')}>
            <span className="nav-icon">📊</span> Dashboard
          </button>
          <button className={activeTab === 'projects' ? 'active' : ''} onClick={() => changeTab('projects')}>
            <span className="nav-icon">🗺️</span> Projects
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
            <div style={{ width: '36px', height: '36px', background: '#c2a661', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>A</div>
            <div>
              <strong style={{ fontSize: '0.8rem', display: 'block', color: '#113629' }}>Admin User</strong>
              <span style={{ fontSize: '0.62rem', color: '#9ca3af' }}>SYSTEM EXECUTIVE</span>
            </div>
          </div>
          <button onClick={() => logoutUser()} className="btn-outline" style={{ width: '100%', padding: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>LOGOUT</button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="admin-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowX: 'hidden' }}>
        
        {/* 2. TOP NAVBAR */}
        <header className="admin-header" style={{ padding: '1rem 2.5rem', background: '#ffffff', borderBottom: '1px solid #f1f3f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
          <div>
            <h1 className="serif" style={{ fontSize: '1.35rem', margin: 0, color: '#113629' }}>Welcome back, Admin! 👋</h1>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af' }}>Here's what's happening in your business today.</p>
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
                <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#c62828', color: 'white', fontSize: '0.55rem', padding: '2px 5px', borderRadius: '10px', fontWeight: 'bold' }}>3</span>
              </button>
              {showNotifications && (
                <div style={{ position: 'absolute', top: '100%', right: 0, background: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', borderRadius: '8px', width: '280px', marginTop: '0.75rem', zIndex: 200, padding: '0.75rem' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.8rem', borderBottom: '1px solid #f1f3f5', paddingBottom: '0.5rem', marginBottom: '0.5rem', color: '#113629' }}>Recent Notifications</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
                    <div style={{ padding: '6px', background: '#fcfbf8', borderLeft: '3px solid #c2a661', borderRadius: '4px' }}>New CP referral lead registered</div>
                    <div style={{ padding: '6px', background: '#fcfbf8', borderLeft: '3px solid #c2a661', borderRadius: '4px' }}>Overdue instalment milestone triggered</div>
                    <div style={{ padding: '6px', background: '#fff', borderRadius: '4px' }}>Site Visit complete: Penthouse 101</div>
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
                  <button onClick={() => { changeTab('leads'); setShowQuickAdd(false); }} style={{ display: 'block', width: '100%', padding: '8px 12px', fontSize: '0.75rem', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', color: '#333' }}>Add New Lead</button>
                  <button onClick={() => { changeTab('projects'); setShowQuickAdd(false); }} style={{ display: 'block', width: '100%', padding: '8px 12px', fontSize: '0.75rem', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', color: '#333' }}>Add Project</button>
                  <button onClick={() => { changeTab('inventory'); setShowQuickAdd(false); }} style={{ display: 'block', width: '100%', padding: '8px 12px', fontSize: '0.75rem', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', color: '#333' }}>Add Flat</button>
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
          <AdminAlertsCard inquiries={inquiries} units={units} project={project} />
        </div>

        {/* ========================================================================= */}
        {/* SPA TAB CONTAINER: RENDERS SUBPAGES BASED ON STATE */}
        {/* ========================================================================= */}
        
        {/* ==================== 1. DASHBOARD PAGE ==================== */}
        {/* ==================== 1. DASHBOARD PAGE ==================== */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            
            {/* Header section */}
            <div className="flex-between mb-3" style={{ alignItems: 'flex-start' }}>
              <div>
                <h1 className="serif" style={{ fontSize: '1.6rem', color: '#113629', margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>Welcome back, Admin! 👋</h1>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.72rem' }}>Here's what's happening in your business today.</p>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setDashboardSubTab('analytical')} className={dashboardSubTab === 'analytical' ? 'btn-dark' : 'btn-outline'} style={{ padding: '0.4rem 1rem', fontSize: '0.7rem' }}>Analytical Performance</button>
                  <button onClick={() => setDashboardSubTab('executive')} className={dashboardSubTab === 'executive' ? 'btn-dark' : 'btn-outline'} style={{ padding: '0.4rem 1rem', fontSize: '0.7rem' }}>Executive Portal</button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', border: '1px solid #f1f3f5', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.7rem', color: '#6b7280', fontWeight: '600', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
                <span>📅 20 May 2026 - 26 May 2026</span>
              </div>
            </div>

            {dashboardSubTab === 'analytical' ? (
              <>
            {/* ========== ANALYTICAL PERFORMANCE REPORT ========== */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e8eaed', padding: '2.5rem 2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>

              {/* Centered Report Header */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 className="serif" style={{ fontSize: '2rem', color: '#113629', margin: '0 0 0.25rem 0', fontWeight: 'bold', letterSpacing: '-0.5px' }}>Analytical Performance Report</h2>
                <div style={{ width: '50px', height: '2px', background: '#113629', margin: '0 auto 0.5rem auto' }}></div>
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
                      background: analyticalPhase === 1 ? '#113629' : '#d1d5db',
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
                      background: analyticalPhase === 2 ? '#113629' : '#d1d5db',
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
                const velocityData = getVelocityData(velocityHalf);
                const maxVelocity = Math.max(...velocityData.map(d => d.valueCr), 1);
                const targetLine = maxVelocity * 0.55; // target line at ~55% of max
                const yAxisMax = Math.ceil(maxVelocity * 1.2);
                const ySteps = [0, 2, 4, 6, 8];
                const effectiveMax = Math.max(yAxisMax, 8);
                const totalUnits = units.length || 50;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* TOP ROW: Inventory Donut | Monthly Sales Velocity | Right KPI Stack */}
                    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 220px', gap: '1.5rem', alignItems: 'stretch' }}>

                      {/* LEFT: Inventory Distribution Donut */}
                      <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem' }}>INVENTORY DISTRIBUTION</span>

                        {/* Donut Chart */}
                        <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '1rem' }}>
                          <svg width="160" height="160" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f3f5" strokeWidth="3.8" />
                            {/* AVAILABLE (green) - drawn first as background arc */}
                            <circle cx="18" cy="18" r="14" fill="none" stroke="#137333" strokeWidth="4"
                              strokeDasharray={`${availablePerc} ${100 - availablePerc}`} strokeDashoffset="0"
                              strokeLinecap="round"
                              style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                            {/* RESERVED (blue) */}
                            <circle cx="18" cy="18" r="14" fill="none" stroke="#1a73e8" strokeWidth="4"
                              strokeDasharray={`${reservedPerc} ${100 - reservedPerc}`} strokeDashoffset={`${-availablePerc}`}
                              strokeLinecap="round"
                              style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                            {/* SOLD (dark red/maroon) */}
                            <circle cx="18" cy="18" r="14" fill="none" stroke="#8B2500" strokeWidth="4"
                              strokeDasharray={`${soldPerc} ${100 - soldPerc}`} strokeDashoffset={`${-availablePerc - reservedPerc}`}
                              strokeLinecap="round"
                              style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                          </svg>
                          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <h2 className="serif" style={{ margin: 0, fontSize: '2.2rem', color: '#113629', fontWeight: 'bold', lineHeight: 1 }}>{totalUnits}</h2>
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
                      <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: '12px', padding: '1.5rem 1.75rem' }}>

                        {/* Chart Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <div>
                            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#1f2937', letterSpacing: '0.5px' }}>MONTHLY SALES VELOCITY</span>
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

                          {/* Half-Year Filter Dropdown */}
                          <select
                            value={velocityHalf}
                            onChange={(e) => setVelocityHalf(e.target.value)}
                            style={{
                              padding: '0.4rem 0.75rem',
                              fontSize: '0.75rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              background: '#fff',
                              color: '#374151',
                              fontWeight: '600',
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                          >
                            <option value="H1">Jan - Jun</option>
                            <option value="H2">Jul - Dec</option>
                          </select>
                        </div>

                        {/* Y-Axis label */}
                        <span style={{ fontSize: '0.6rem', color: '#9ca3af', fontWeight: '600' }}>₹ Cr</span>

                        {/* SVG Bar Chart */}
                        <div style={{ position: 'relative', height: '220px', marginTop: '0.25rem' }}>
                          <svg viewBox="0 0 600 220" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
                            {/* Horizontal grid lines + Y-axis labels */}
                            {[0, 2, 4, 6, 8].map((val, i) => {
                              const y = 195 - (val / effectiveMax) * 170;
                              return (
                                <g key={i}>
                                  <line x1="40" y1={y} x2="580" y2={y} stroke="#f1f3f5" strokeWidth="1" />
                                  <text x="30" y={y + 4} textAnchor="end" style={{ fontSize: '0.6rem', fill: '#9ca3af', fontWeight: '600' }}>{val}</text>
                                </g>
                              );
                            })}

                            {/* Target dashed line */}
                            <line
                              x1="40" y1={195 - (targetLine / effectiveMax) * 170}
                              x2="580" y2={195 - (targetLine / effectiveMax) * 170}
                              stroke="#137333" strokeWidth="1.5" strokeDasharray="8 4" opacity="0.4"
                            />

                            {/* Bars */}
                            {velocityData.map((d, idx) => {
                              const barWidth = 55;
                              const gap = (540 - barWidth * 6) / 7;
                              const x = 40 + gap + idx * (barWidth + gap);
                              const barHeight = Math.max(3, (d.valueCr / effectiveMax) * 170);
                              const y = 195 - barHeight;
                              const crLabel = d.valueCr >= 0.1 ? `${d.valueCr.toFixed(1)} Cr` : d.valueCr > 0 ? `${(d.valueCr * 100).toFixed(0)} L` : '0';

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
                                  <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" style={{ fontSize: '0.62rem', fill: '#1f2937', fontWeight: '700' }}>
                                    {crLabel}
                                  </text>
                                  {/* Month label */}
                                  <text x={x + barWidth / 2} y={210} textAnchor="middle" style={{ fontSize: '0.55rem', fill: '#6b7280', fontWeight: '600' }}>
                                    {d.label}
                                  </text>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        {/* Avg Price Per Unit */}
                        <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: '12px', padding: '1.25rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#4b5563', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.4rem' }}>AVG. PRICE PER UNIT</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ecfdf5', border: '1.5px solid #bbf0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                              </svg>
                            </div>
                            <h3 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: '#113629', fontWeight: 'bold' }}>
                              ₹ {avgPriceLakhs >= 100 ? `${(avgPriceLakhs / 100).toFixed(1)} Cr` : `${avgPriceLakhs.toFixed(0)} L`}
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
                            <h3 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: '#113629', fontWeight: 'bold' }}>
                              ₹ {totalPortfolioLakhs >= 100 ? `${(totalPortfolioLakhs / 100).toFixed(1)} Cr` : `${totalPortfolioLakhs.toFixed(0)} L`}
                            </h3>
                          </div>
                          <span style={{ fontSize: '0.65rem', color: '#137333', fontWeight: '700', marginTop: '0.3rem', marginLeft: '0.1rem' }}>↑ +15.2% INCREASE</span>
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
                            <h3 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: '#113629', fontWeight: 'bold' }}>
                              {conversionRate > 0 ? `${conversionRate}%` : `${totalLeadsCount > 0 ? ((soldUnitsCount / totalLeadsCount) * 100).toFixed(1) : '0'}%`}
                            </h3>
                          </div>
                          <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: '600', marginTop: '0.3rem', marginLeft: '0.1rem' }}>LEAD TO DEPOSIT</span>
                        </div>
                      </div>
                    </div>

                    {/* BOTTOM ROW: Total Revenue | Units Sold | Avg Sales Cycle */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>

                      {/* Total Revenue */}
                      <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: '12px', padding: '1.5rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', letterSpacing: '0.5px', textTransform: 'uppercase' }}>TOTAL REVENUE</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ecfdf5', border: '1.5px solid #bbf0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="2.5" strokeLinecap="round">
                              <text x="7" y="18" fill="#137333" stroke="none" fontSize="18" fontWeight="bold" fontFamily="serif">₹</text>
                            </svg>
                          </div>
                          <h3 className="serif" style={{ margin: 0, fontSize: '1.7rem', color: '#113629', fontWeight: 'bold' }}>
                            ₹ {totalRevenueLakhs >= 100 ? `${(totalRevenueLakhs / 100).toFixed(1)} Cr` : totalRevenueFormatted}
                          </h3>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                          <span style={{ fontSize: '0.65rem', color: '#137333', fontWeight: '700' }}>↑ +12.4% VS LAST QUARTER</span>
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
                            <h3 className="serif" style={{ margin: 0, fontSize: '1.7rem', color: '#113629', fontWeight: 'bold' }}>
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
                          <h3 className="serif" style={{ margin: 0, fontSize: '1.7rem', color: '#113629', fontWeight: 'bold' }}>
                            {(() => {
                              const cycles = buyers.map(b => {
                                const buyerDate = new Date(b.created_at || '2026-05-01');
                                const matchingInq = inquiries.find(inq => inq.name && b.username && inq.name.toLowerCase().replace(/\s+/g, '') === b.username.toLowerCase());
                                if (matchingInq) {
                                  const inqDate = new Date(matchingInq.created_at);
                                  return Math.max(1, Math.round((buyerDate - inqDate) / (1000 * 60 * 60 * 24)));
                                }
                                return 24;
                              });
                              return cycles.length > 0 ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length) : 24;
                            })()} Days
                          </h3>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                          <span style={{ fontSize: '0.65rem', color: '#137333', fontWeight: '700' }}>↓ -4 DAYS IMPROVEMENT</span>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>

                    {/* Leads Overview Curve Chart */}
                    <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: '12px', padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', letterSpacing: '1px', textTransform: 'uppercase' }}>Leads Overview</span>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.68rem', fontWeight: 'bold' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b08e40' }}>
                            <span style={{ width: '8px', height: '8px', background: '#b08e40', borderRadius: '50%', display: 'inline-block' }}></span> This Month
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1a73e8' }}>
                            <span style={{ width: '8px', height: '8px', background: '#1a73e8', borderRadius: '50%', display: 'inline-block' }}></span> Last Month
                          </span>
                        </div>
                      </div>
                      <div style={{ height: '180px', width: '100%', position: 'relative' }}>
                        <svg viewBox="0 0 500 150" width="100%" height="100%" style={{ overflow: 'visible' }}>
                          <line x1="30" y1="20" x2="470" y2="20" stroke="#f1f3f5" strokeDasharray="3 3" />
                          <line x1="30" y1="65" x2="470" y2="65" stroke="#f1f3f5" strokeDasharray="3 3" />
                          <line x1="30" y1="110" x2="470" y2="110" stroke="#f1f3f5" strokeDasharray="3 3" />
                          <line x1="30" y1="130" x2="470" y2="130" stroke="#e9ecef" strokeWidth="1" />
                          <path d="M 30 110 C 100 80, 150 120, 220 70 C 290 30, 360 90, 420 50 C 450 35, 460 40, 470 45" fill="none" stroke="#1a73e8" strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
                          <path d="M 30 95 C 100 65, 140 100, 220 50 C 300 10, 350 70, 420 30 C 445 15, 460 20, 470 15" fill="none" stroke="#b08e40" strokeWidth="3.5" strokeLinecap="round" />
                          {[{ x: 30, y: 95 }, { x: 103, y: 73 }, { x: 176, y: 80 }, { x: 249, y: 35 }, { x: 322, y: 48 }, { x: 395, y: 38 }, { x: 470, y: 15 }].map((node, i) => (
                            <circle key={i} cx={node.x} cy={node.y} r="4.5" fill="#b08e40" stroke="#fff" strokeWidth="2.5" />
                          ))}
                          {['20 May', '21 May', '22 May', '23 May', '24 May', '25 May', '26 May'].map((label, idx) => {
                            const x = 30 + idx * 73.3;
                            return (<text key={idx} x={x} y="148" textAnchor="middle" style={{ fontSize: '0.62rem', fill: '#888', fontWeight: 'bold' }}>{label}</text>);
                          })}
                        </svg>
                      </div>
                    </div>

                    {/* Bookings by Status Donut Chart */}
                    <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Bookings by Status</span>
                      {(() => {
                        const totalBk = buyers.length || 562;
                        const confirmedBk = Math.round(totalBk * 0.49);
                        const pendingBk = Math.round(totalBk * 0.28);
                        const cancelledBk = Math.round(totalBk * 0.13);
                        const onHoldBk = Math.max(0, totalBk - confirmedBk - pendingBk - cancelledBk);
                        const confPct = Math.round((confirmedBk / totalBk) * 100);
                        const pendPct = Math.round((pendingBk / totalBk) * 100);
                        const cancPct = Math.round((cancelledBk / totalBk) * 100);
                        const holdPct = Math.max(0, 100 - confPct - pendPct - cancPct);
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexGrow: 1 }}>
                            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                              <svg width="120" height="120" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f3f5" strokeWidth="4.2" />
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#137333" strokeWidth="4.5" strokeDasharray={`${confPct} ${100 - confPct}`} strokeDashoffset="0" />
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#c2a661" strokeWidth="4.5" strokeDasharray={`${pendPct} ${100 - pendPct}`} strokeDashoffset={`-${confPct}`} />
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#c5221f" strokeWidth="4.5" strokeDasharray={`${cancPct} ${100 - cancPct}`} strokeDashoffset={`-${confPct + pendPct}`} />
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1a73e8" strokeWidth="4.5" strokeDasharray={`${holdPct} ${100 - holdPct}`} strokeDashoffset={`-${confPct + pendPct + cancPct}`} />
                              </svg>
                              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                <h2 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: '#113629', fontWeight: 'bold' }}>{totalBk}</h2>
                                <span style={{ fontSize: '0.45rem', color: '#9ca3af', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 'bold' }}>Total</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', minWidth: '130px' }}>
                              {[
                                { label: 'Confirmed', count: confirmedBk, pct: confPct, color: '#137333' },
                                { label: 'Pending', count: pendingBk, pct: pendPct, color: '#c2a661' },
                                { label: 'Cancelled', count: cancelledBk, pct: cancPct, color: '#c5221f' },
                                { label: 'On Hold', count: onHoldBk, pct: holdPct, color: '#1a73e8' }
                              ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ width: '8px', height: '8px', background: item.color, borderRadius: '50%', display: 'inline-block' }}></span>
                                    <span style={{ fontWeight: '500', color: '#4b5563' }}>{item.label}</span>
                                  </div>
                                  <span style={{ fontWeight: 'bold', color: '#113' }}>{item.count} <span style={{ fontSize: '0.62rem', color: '#888', fontWeight: 'normal' }}>({item.pct}%)</span></span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Row 2: Revenue Overview + Top Projects */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>

                    {/* Revenue Overview Bar Chart */}
                    <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: '12px', padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', letterSpacing: '1px', textTransform: 'uppercase' }}>Revenue Overview</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
                        <h2 className="serif" style={{ margin: 0, fontSize: '1.6rem', color: '#113629', fontWeight: 'bold' }}>₹ {totalRevenueFormatted}</h2>
                        <span style={{ fontSize: '0.68rem', color: '#137333', fontWeight: 'bold' }}>↑ 15% from last month</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', height: '140px', alignItems: 'flex-end', gap: '1rem', position: 'relative', marginTop: '1.5rem' }}>
                        <div style={{ position: 'absolute', bottom: '70%', left: 0, right: 0, borderTop: '2px dashed #c2a661', opacity: 0.45, zIndex: 1 }}></div>
                        {revMonths.map((m, idx) => {
                          const valFormatted = new Intl.NumberFormat('en-IN').format(Math.round(m.value * 100000));
                          const maxVal = Math.max(...revMonths.map(d => d.value));
                          const hPerc = Math.max(10, Math.round((m.value / maxVal) * 100));
                          return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end', zIndex: 2 }}>
                              <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#113629', marginBottom: '4px' }}>{valFormatted}</span>
                              <div style={{ height: `${hPerc}%`, width: '70%', background: 'linear-gradient(180deg, #2d7c5f, #b8d8c8)', borderRadius: '4px 4px 0 0', opacity: 0.85 }}></div>
                              <span style={{ fontSize: '0.58rem', fontWeight: '600', color: '#6b7280', marginTop: '6px' }}>{m.label.toUpperCase()}</span>
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
                                <strong style={{ fontSize: '0.8rem', color: '#113629' }}>{p.name}</strong>
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
                {/* Executive Performance Portal Header */}
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <h2 className="serif" style={{ fontSize: '2rem', color: '#113629', marginBottom: '0.5rem' }}>Executive Performance Portal</h2>
                  <div style={{ width: '60px', height: '3px', background: '#c2a661', margin: '0 auto 0.5rem auto', borderRadius: '2px' }}></div>
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0 }}>Strategic overview and dashboard access for senior representatives</p>
                </div>

                {/* Salesman Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.25rem' }}>
                  {[
                    { initials: 'VS', name: 'VIKRAM SETHI', title: 'SNR. VICE PRESIDENT', id: 'SR-9999', revenue: '35,50,00,000' },
                    { initials: 'AR', name: 'ANANYA RAO', title: 'REGIONAL DIRECTOR', id: 'SR-1111', revenue: '32,40,00,000' },
                    { initials: 'RV', name: 'RAHUL VERMA', title: 'SALES DIRECTOR', id: 'SR-2222', revenue: '24,80,00,000' },
                    { initials: 'SP', name: 'SNEHA PATIL', title: 'LEAD BROKER', id: 'SR-3333', revenue: '15,30,00,000' },
                    { initials: 'AS', name: 'ADITYA SHARMA', title: 'SENIOR ASSOCIATE', id: 'SR-4444', revenue: '10,40,00,000' }
                  ].map((exec, idx) => (
                    <div key={idx} style={{ background: '#fff', border: '1px solid #f1f3f5', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', transition: 'box-shadow 0.2s' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid #113629', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#113629' }}>{exec.initials}</span>
                      </div>
                      <strong style={{ fontSize: '0.78rem', color: '#113629', letterSpacing: '0.5px' }}>{exec.name}</strong>
                      <span style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: '600', letterSpacing: '0.5px', marginTop: '2px', marginBottom: '1rem' }}>{exec.title}</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: '600' }}>REVENUE</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#113629' }}>₹ {exec.revenue}</span>
                      </div>
                      <button 
                        onClick={() => impersonateSales(exec.id)}
                        style={{ width: '100%', padding: '0.5rem', fontSize: '0.72rem', fontWeight: 'bold', border: '1px solid #113629', background: '#fff', color: '#113629', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#113629'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#113629'; }}
                      >
                        ↗ OPEN PORTAL
                      </button>
                    </div>
                  ))}
                </div>

                {/* Project-wide Scheduled Visits */}
                <div style={{ marginTop: '0.5rem' }}>
                  <GlobalVisitsClient inquiries={inquiries} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 2. PROJECTS PAGE ==================== */}
        {activeTab === 'projects' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            <div className="widget-card">
              <div className="flex-between mb-2">
                <h3 className="serif" style={{ margin: 0 }}>Projects List</h3>
                <button className="btn-dark" style={{ padding: '0.5rem 1rem', fontSize: '0.72rem' }}>+ Add Project</button>
              </div>
              <table className="table-standard">
                <thead>
                  <tr>
                    <th>PROJECT NAME</th>
                    <th>LOCATION</th>
                    <th>TOTAL UNITS</th>
                    <th>SOLD UNITS</th>
                    <th>AVAILABLE UNITS</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {projectsList.map((p, i) => (
                    <tr key={i}>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.location}</td>
                      <td>{p.total}</td>
                      <td style={{ color: '#c62828', fontWeight: 'bold' }}>{p.sold}</td>
                      <td style={{ color: '#137333', fontWeight: 'bold' }}>{p.available}</td>
                      <td>
                        <span className={`badge ${p.status === 'Active' ? 'available' : 'negotiation'}`}>
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== 3. LEADS PAGE ==================== */}
        {activeTab === 'leads' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            

            {/* Quick Leads assign row */}
            <div className="widget-card mb-2">
              <h3 className="serif" style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Reassign / Distribute Leads</h3>
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
                        const map = {
                          'SR-9999': 'Vikram Sethi',
                          'SR-1111': 'Ananya Rao',
                          'SR-2222': 'Rahul Verma',
                          'SR-3333': 'Sneha Patil',
                          'SR-4444': 'Aditya Sharma',
                        };
                        return map[id] || 'Awaiting Alloc';
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
                                <option value="SR-9999">Vikram Sethi (SR-9999)</option>
                                <option value="SR-1111">Ananya Rao (SR-1111)</option>
                                <option value="SR-2222">Rahul Verma (SR-2222)</option>
                                <option value="SR-3333">Sneha Patil (SR-3333)</option>
                                <option value="SR-4444">Aditya Sharma (SR-4444)</option>
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

            {/* Reusable InquiryPipelineClient */}
            <InquiryPipelineClient inquiries={inquiries} />
          </div>
        )}

        {/* ==================== 4. BOOKINGS PAGE ==================== */}
        {activeTab === 'bookings' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            <div className="widget-card">
              <h3 className="serif" style={{ margin: '0 0 1rem 0' }}>ERP Bookings Log</h3>
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
        )}

        {/* ==================== 5. INVENTORY PAGE ==================== */}
        {activeTab === 'inventory' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            
            <div style={{ background: '#fff', border: '1px solid #f1f3f5', borderRadius: '12px', padding: '1rem' }}>
              <GridClient units={units} inquiries={inquiries} project={project} />
            </div>
          </div>
        )}

        {/* ==================== 6. FINANCE PAGE ==================== */}
        {activeTab === 'finance' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="widget-card">
                <span style={{ fontSize: '0.62rem', color: '#888', fontWeight: 'bold' }}>TOTAL COLLECTION</span>
                <h3 className="serif" style={{ margin: '0.2rem 0', color: '#137333', fontSize: '1.6rem' }}>₹ {totalCollectionFormatted}</h3>
              </div>
              <div className="widget-card">
                <span style={{ fontSize: '0.62rem', color: '#888', fontWeight: 'bold' }}>COLLECTED THIS MONTH</span>
                <h3 className="serif" style={{ margin: '0.2rem 0', color: '#137333', fontSize: '1.6rem' }}>₹ {collectedThisMonthFormatted}</h3>
              </div>
              <div className="widget-card">
                <span style={{ fontSize: '0.62rem', color: '#888', fontWeight: 'bold' }}>PENDING INSTALMENTS</span>
                <h3 className="serif" style={{ margin: '0.2rem 0', color: '#c2a661', fontSize: '1.6rem' }}>₹ {pendingInstallmentsFormatted}</h3>
              </div>
              <div className="widget-card">
                <span style={{ fontSize: '0.62rem', color: '#888', fontWeight: 'bold' }}>OVERDUE AMOUNT</span>
                <h3 className="serif" style={{ margin: '0.2rem 0', color: '#c62828', fontSize: '1.6rem' }}>₹ {overdueAmountFormatted}</h3>
              </div>
            </div>

            {/* Finance Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="widget-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 className="serif" style={{ margin: 0 }}>Instalment Payment Trend</h3>
                  <select 
                    value={revenueViewType}
                    onChange={(e) => setRevenueViewType(e.target.value)}
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', color: '#374151', fontWeight: '600', cursor: 'pointer' }}
                  >
                    <option value="past">Last 6 Months</option>
                    <option value="projection">Next 6 Months</option>
                  </select>
                </div>
                <div style={{ height: '180px', width: '100%' }}>
                  <svg viewBox="0 0 500 150" width="100%" height="100%" style={{ overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#137333" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#137333" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {(() => {
                      const data = getRevenueData();
                      const monthlyCollections = data.map(d => d.value);
                      const monthLabels = data.map(d => d.label);
                      
                      const maxColl = Math.max(...monthlyCollections, 1);
                      const points = monthlyCollections.map((coll, idx) => {
                        const x = 40 + idx * 84; // 40 to 460 range
                        const y = 110 - (coll / maxColl) * 80; // 30 to 110 range
                        return { x, y, coll, label: monthLabels[idx] };
                      });

                      const pathD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
                      const areaD = `M 40 110 L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L 460 110 Z`;

                      const formatTrendAmount = (lakhs) => {
                        if (lakhs === 0) return '₹0';
                        return `₹${new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(Math.round(lakhs * 100000))}`;
                      };

                      return (
                        <>
                          {/* Grid lines */}
                          <line x1="40" y1="30" x2="460" y2="30" stroke="#f1f3f5" strokeDasharray="4 4" />
                          <line x1="40" y1="70" x2="460" y2="70" stroke="#f1f3f5" strokeDasharray="4 4" />
                          <line x1="40" y1="110" x2="460" y2="110" stroke="#e9ecef" strokeWidth="1" />

                          {/* Gradient area */}
                          <path d={areaD} fill="url(#chart-gradient)" />

                          {/* Trend Line */}
                          <path d={pathD} fill="none" stroke="#137333" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                          {/* Dots, Values, and Labels */}
                          {points.map((p, idx) => (
                            <g key={idx}>
                              <circle cx={p.x} cy={p.y} r="5" fill="#137333" stroke="#fff" strokeWidth="2" />
                              <text x={p.x} y={p.y - 12} textAnchor="middle" style={{ fontSize: '0.62rem', fill: '#137333', fontWeight: 'bold' }}>
                                {formatTrendAmount(p.coll)}
                              </text>
                              <text x={p.x} y="130" textAnchor="middle" style={{ fontSize: '0.65rem', fill: '#6c757d', fontWeight: 'bold' }}>
                                {p.label}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
              <div className="widget-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <h3 className="serif" style={{ margin: '0 0 1rem 0' }}>Collection by Mode</h3>
                {(() => {
                  const digitalPercent = Math.min(98, 70 + (buyers.length * 2));
                  const bankPercent = Math.max(1, Math.round((100 - digitalPercent) * 0.7));
                  const cashPercent = 100 - digitalPercent - bankPercent;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexGrow: 1, padding: '0.5rem 0' }}>
                      <div className="donut-chart-mock" style={{ margin: '0', background: `conic-gradient(#137333 0% ${digitalPercent}%, #c2a661 ${digitalPercent}% ${digitalPercent + bankPercent}%, #1a73e8 ${digitalPercent + bankPercent}% 100%)` }}>
                        <div className="donut-inner">
                          <h2 className="serif" style={{ fontSize: '1.3rem', color: '#137333' }}>{digitalPercent}%</h2>
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
                          <span className="dot" style={{ background: '#c2a661', width: '10px', height: '10px', borderRadius: '50%', marginRight: '0' }} />
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
              <table className="table-standard">
                <thead>
                  <tr>
                    <th>BUYER ACCOUNT</th>
                    <th>PROJECT</th>
                    <th>DEMAND INSTALMENT</th>
                    <th>AMOUNT RECEIVED</th>
                    <th>PAYMENT STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {buyers.map((b, i) => (
                    <tr key={i}>
                      <td><strong>{b.username}</strong></td>
                      <td>Vanya Residences</td>
                      <td>Progress demand ({b.construction_progress}%)</td>
                      <td style={{ color: '#137333', fontWeight: 'bold' }}>{b.amount_paid}</td>
                      <td><span className="badge available">RECEIVED & CLEAR</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== 7. CP PARTNERS PAGE ==================== */}
        {activeTab === 'cp' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>
              {/* Commissions Approval Ledger */}
              <div>
                <AdminCPCommissionsClient initialCommissions={commissions} cpPartners={cpPartners} />
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
                      <strong style={{ color: '#113629', fontSize: '0.82rem' }}>{cp.firm_name}</strong>
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
              <div className="flex-between mb-2">
                <div>
                  <h3 className="serif" style={{ margin: 0 }}>Users Account Registry</h3>
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.7rem' }}>Authorized CRM portals access registry</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <AdminAddBuyerClient />
                </div>
              </div>
              
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
                          style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                          }}
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
        )}

        {/* ==================== 9. REPORTS PAGE ==================== */}
        {activeTab === 'reports' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
              
              {/* Left Panel report selector */}
              <div className="widget-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: 'fit-content' }}>
                <h4 className="serif" style={{ margin: '0 0 0.75rem 0', color: '#113629' }}>ERP Modules</h4>
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
                  <button className="btn-dark">DOWNLOAD PDF</button>
                  <button className="btn-outline">DOWNLOAD EXCEL</button>
                  <button className="btn-dark" style={{ background: '#c2a661' }}>EXPORT CSV</button>
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
              </div>

              {/* Settings Form */}
              <div className="widget-card">
                <h3 className="serif" style={{ margin: '0 0 1.5rem 0' }}>ERP Configurations</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label>Enterprise Company Name</label>
                    <input type="text" defaultValue="Vanya Residences Group" style={{ width: '96%' }} />
                  </div>
                  <div className="form-group">
                    <label>System Base Currency Display</label>
                    <select style={{ width: '100%' }}>
                      <option value="INR">Indian Rupee (₹, Cr, L)</option>
                      <option value="USD">US Dollar ($)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Round-Robin Allocation Strategy</label>
                    <select style={{ width: '100%' }}>
                      <option value="active">Active Sales Rep Priority</option>
                      <option value="weighted">Weighted Conversion Ratio</option>
                    </select>
                  </div>
                  <button className="btn-dark" style={{ alignSelf: 'flex-start', marginTop: '1rem' }}>SAVE SETTINGS</button>
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
        )}

        {/* ==================== 12. ALERTS LOG ==================== */}
        {activeTab === 'alerts' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            <div className="widget-card">
              <h3 className="serif" style={{ margin: '0 0 1rem 0' }}>Administrative Alerts Log</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>🚨</span>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: '#c53030' }}>Low Available Stock: Tower A</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#742a2a' }}>Units in Tower A are currently under 30% available capacity. Please schedule subsequent phase launch.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#fffdf9', border: '1px solid #c2a661', borderRadius: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: '#b08e40' }}>15 Pending Lead Followups Awaiting Rep Action</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#555' }}>Rep logs show delayed callbacks to qualified leads. Immediate distribution advised.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Removed duplicate bottom sections */}

      </main>
    </div>
  );
}
