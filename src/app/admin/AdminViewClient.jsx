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
    if (typeof val === 'number') return val;
    const cleaned = val.replace(/[^\d.]/g, '');
    let num = parseFloat(cleaned) || 0;
    if (val.includes('Cr')) {
      num = num * 100;
    } else if (val.includes('L')) {
      // already in Lakhs
    } else {
      num = num / 100000;
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

  // Calculate live database KPIs
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

  const unitPrices = units.map(u => parseAmountVal(u.price)).filter(p => p > 0);
  const avgPriceLakhs = unitPrices.length > 0 ? unitPrices.reduce((sum, p) => sum + p, 0) / unitPrices.length : 480;
  const avgPriceCr = (avgPriceLakhs / 100).toFixed(1);

  const totalPortfolioLakhs = units.map(u => parseAmountVal(u.price)).reduce((sum, p) => sum + p, 0);
  const totalPortfolioCr = Math.round(totalPortfolioLakhs / 100) || 450;

  const totalRevenueLakhs = buyers.map(b => parseAmountVal(b.amount_paid)).reduce((sum, p) => sum + p, 0);
  const totalRevenueCr = (totalRevenueLakhs / 100).toFixed(1);

  const totalCollectionCr = totalRevenueCr;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const collectedThisMonthLakhs = buyers.reduce((sum, b) => {
    const paymentDate = b.created_at ? new Date(b.created_at) : new Date();
    if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
      return sum + parseAmountVal(b.amount_paid);
    }
    return sum;
  }, 0);
  const collectedThisMonthCr = collectedThisMonthLakhs > 0 ? (collectedThisMonthLakhs / 100).toFixed(1) : (totalRevenueLakhs * 0.1 / 100).toFixed(1);

  const totalPendingLakhs = buyers.reduce((sum, b) => {
    const total = parseAmountVal(b.total_amount);
    const paid = parseAmountVal(b.amount_paid);
    return sum + Math.max(0, total - paid);
  }, 0);
  const pendingInstallmentsCr = (totalPendingLakhs / 100).toFixed(1);
  const overdueAmountCr = (totalPendingLakhs * 0.375 / 100).toFixed(1);

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
            
            {/* Dashboard Sub-tab Switcher */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem', gap: '1.5rem' }}>
              <button 
                onClick={() => setDashboardSubTab('analytical')}
                className={`sub-tab-btn ${dashboardSubTab === 'analytical' ? 'active' : ''}`}
                style={{
                  padding: '0.75rem 0.25rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: dashboardSubTab === 'analytical' ? '#113629' : '#6b7280',
                  background: 'none',
                  border: 'none',
                  borderBottom: dashboardSubTab === 'analytical' ? '2.5px solid #113629' : 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: "'Playfair Display', serif"
                }}
              >
                Analytical Performance
              </button>
              <button 
                onClick={() => setDashboardSubTab('executive')}
                className={`sub-tab-btn ${dashboardSubTab === 'executive' ? 'active' : ''}`}
                style={{
                  padding: '0.75rem 0.25rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: dashboardSubTab === 'executive' ? '#113629' : '#6b7280',
                  background: 'none',
                  border: 'none',
                  borderBottom: dashboardSubTab === 'executive' ? '2.5px solid #113629' : 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: "'Playfair Display', serif"
                }}
              >
                Executive Performance
              </button>
            </div>

            {/* Sub-tab 1: Analytical Performance */}
            {dashboardSubTab === 'analytical' && (
              <div className="animate-fade-in">
                {/* Title & Subtitle */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h1 className="serif" style={{ fontSize: '2rem', color: '#113629', margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>Analytical Performance Report</h1>
                  <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>Aggregate sales intelligence & velocity tracking (Phase 1)</span>
                </div>

                {/* Grid layout for Donut, Bar chart, stack of cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1.2fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  
                  {/* Card 1: Inventory Distribution Donut Chart */}
                  <div className="widget-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: '#fff' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#4b5563', letterSpacing: '1px', textTransform: 'uppercase', alignSelf: 'flex-start' }}>INVENTORY DISTRIBUTION</span>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '2rem 0', position: 'relative', width: '130px', height: '130px' }}>
                      {/* Custom SVG Donut Chart */}
                      <svg width="130" height="130" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e5f5ea" strokeWidth="3" />
                        {/* AVAL (green) */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#137333" strokeWidth="3.2" 
                          strokeDasharray={`${availablePerc} ${100 - availablePerc}`} strokeDashoffset="0" />
                        {/* SOLD (red) */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#c5221f" strokeWidth="3.2" 
                          strokeDasharray={`${soldPerc} ${100 - soldPerc}`} strokeDashoffset={`-${availablePerc}`} />
                        {/* RESERVED (blue) */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1a73e8" strokeWidth="3.2" 
                          strokeDasharray={`${reservedPerc} ${100 - reservedPerc}`} strokeDashoffset={`-${availablePerc + soldPerc}`} />
                      </svg>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <h2 className="serif" style={{ margin: 0, fontSize: '1.75rem', color: '#113629', fontWeight: 'bold' }}>{totalUnitsCount}</h2>
                        <span style={{ fontSize: '0.52rem', color: '#9ca3af', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Units</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', justifyContent: 'center', width: '100%', borderTop: '1px solid #f1f3f5', paddingTop: '0.75rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><span className="dot sold" style={{ width: '8px', height: '8px', background: '#c5221f', borderRadius: '50%', display: 'inline-block' }}></span> SOLD ({soldUnitsCount}) {soldPerc}%</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><span className="dot reserved" style={{ width: '8px', height: '8px', background: '#1a73e8', borderRadius: '50%', display: 'inline-block' }}></span> RSVD ({reservedUnitsCount}) {reservedPerc}%</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><span className="dot available" style={{ width: '8px', height: '8px', background: '#137333', borderRadius: '50%', display: 'inline-block' }}></span> AVAL ({availableUnitsCount}) {availablePerc}%</span>
                    </div>
                  </div>

                  {/* Card 2: Monthly Sales Velocity Bar Chart */}
                  <div className="widget-card" style={{ padding: '1.5rem', background: '#fff', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#4b5563', letterSpacing: '1px', textTransform: 'uppercase' }}>MONTHLY SALES VELOCITY</span>
                      <select style={{ padding: '4px 8px', fontSize: '0.72rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white' }}>
                        <option>Jan - Jun</option>
                      </select>
                    </div>

                    {/* Bars Container */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', height: '150px', alignItems: 'flex-end', gap: '1rem', position: 'relative', marginTop: '1.5rem' }}>
                      {/* Target Dotted Line */}
                      <div style={{ position: 'absolute', bottom: '65%', left: 0, right: 0, borderTop: '2px dashed #b08e40', opacity: 0.45, zIndex: 1 }}></div>
                      
                      {revMonths.map((m, idx) => {
                        const valCr = (m.value / 100).toFixed(1);
                        const hPerc = Math.max(10, Math.round((m.value / maxRev) * 100));
                        return (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end', zIndex: 2 }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#113629', marginBottom: '4px' }}>{valCr} Cr</span>
                            <div style={{ height: `${hPerc}%`, width: '100%', background: 'linear-gradient(to top, #113629, #34d399)', borderRadius: '6px 6px 0 0', opacity: 0.85 }}></div>
                            <span style={{ fontSize: '0.58rem', fontWeight: '600', color: '#6b7280', marginTop: '6px' }}>{m.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chart Legend */}
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.68rem', marginTop: '1.25rem', justifyContent: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', background: '#113629', borderRadius: '2px', display: 'inline-block' }}></span> REVENUE</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ borderTop: '2px dashed #b08e40', width: '16px', display: 'inline-block' }}></span> TARGET</span>
                    </div>
                  </div>

                  {/* Card 3: Stack of 3 KPI Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* AVG Price */}
                    <div className="kpi-card" style={{ flex: 1, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', background: '#e6f4ea', color: '#137333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🏷️</div>
                      <div>
                        <span style={{ fontSize: '0.6rem', color: '#9ca3af', fontWeight: 'bold', letterSpacing: '0.5px' }}>AVG. PRICE PER UNIT</span>
                        <h2 style={{ fontSize: '1.35rem', margin: '2px 0 0 0', color: '#113629' }}>₹ {avgPriceCr} Cr</h2>
                      </div>
                    </div>

                    {/* Portfolio Value */}
                    <div className="kpi-card" style={{ flex: 1, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', background: '#e6f4ea', color: '#137333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>💼</div>
                      <div>
                        <span style={{ fontSize: '0.6rem', color: '#9ca3af', fontWeight: 'bold', letterSpacing: '0.5px' }}>TOTAL PORTFOLIO VALUE</span>
                        <h2 style={{ fontSize: '1.35rem', margin: '2px 0 0 0', color: '#113629' }}>₹ {totalPortfolioCr} Cr</h2>
                        <div style={{ fontSize: '0.62rem', color: '#137333', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>↑ +15.2% INCREASE</div>
                      </div>
                    </div>

                    {/* Conversion Rate */}
                    <div className="kpi-card" style={{ flex: 1, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', background: '#e6f4ea', color: '#137333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👥</div>
                      <div>
                        <span style={{ fontSize: '0.6rem', color: '#9ca3af', fontWeight: 'bold', letterSpacing: '0.5px' }}>CONVERSION RATE</span>
                        <h2 style={{ fontSize: '1.35rem', margin: '2px 0 0 0', color: '#113629' }}>{conversionRate}%</h2>
                        <div style={{ fontSize: '0.62rem', color: '#4b5563', fontWeight: 'bold' }}>LEAD TO DEPOSIT</div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Bottom Row of 3 KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  {/* Total Revenue */}
                  <div className="kpi-card" style={{ padding: '1.25rem 1.5rem', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 'bold', letterSpacing: '0.5px' }}>TOTAL REVENUE</span>
                        <h2 style={{ fontSize: '1.8rem', color: '#113629', margin: '0.25rem 0' }}>₹ {totalRevenueCr} Cr</h2>
                        <span style={{ fontSize: '0.65rem', color: '#137333', fontWeight: 'bold' }}>↑ +12.4% VS LAST QUARTER</span>
                      </div>
                      <div style={{ width: '44px', height: '44px', background: '#e6f4ea', color: '#137333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>₹</div>
                    </div>
                    <div style={{ fontSize: '1.2rem', position: 'absolute', bottom: '10px', left: '15px', opacity: 0.15 }}>🏦</div>
                  </div>

                  {/* Units Sold */}
                  <div className="kpi-card" style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 'bold', letterSpacing: '0.5px' }}>UNITS SOLD</span>
                        <h2 style={{ fontSize: '1.8rem', color: '#113629', margin: '0.25rem 0' }}>{soldUnitsCount} <span style={{ fontSize: '1.1rem', color: '#9ca3af', fontWeight: 'normal' }}>/ {totalUnitsCount}</span></h2>
                        <div style={{ background: '#e5e7eb', height: '6px', borderRadius: '3px', overflow: 'hidden', margin: '8px 0 4px 0' }}>
                          <div style={{ background: '#137333', width: `${soldPerc}%`, height: '100%' }}></div>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{soldPerc}% of Total Inventory Sold</span>
                      </div>
                      <div style={{ width: '44px', height: '44px', background: '#e6f4ea', color: '#137333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginLeft: '10px' }}>🛒</div>
                    </div>
                  </div>

                  {/* Avg Sales Cycle */}
                  <div className="kpi-card" style={{ padding: '1.25rem 1.5rem', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 'bold', letterSpacing: '0.5px' }}>AVG. SALES CYCLE</span>
                        <h2 style={{ fontSize: '1.8rem', color: '#113629', margin: '0.25rem 0' }}>24 Days</h2>
                        <span style={{ fontSize: '0.65rem', color: '#b06000', fontWeight: 'bold' }}>↓ -4 DAYS IMPROVEMENT</span>
                      </div>
                      <div style={{ width: '44px', height: '44px', background: '#e6f4ea', color: '#137333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📅</div>
                    </div>
                    <div style={{ fontSize: '1.2rem', position: 'absolute', bottom: '10px', left: '15px', opacity: 0.15 }}>⏰</div>
                  </div>
                </div>

                {/* Master Occupancies Grid */}
                <div style={{ background: '#fff', border: '1px solid #f1f3f5', borderRadius: '12px', padding: '2rem', marginTop: '2.5rem' }}>
                  <h3 className="serif" style={{ fontSize: '1.25rem', margin: '0 0 1.5rem 0', color: '#113629' }}>Master Occupancies Grid</h3>
                  <GridClient units={units} inquiries={inquiries} project={project} />
                </div>

              </div>
            )}

            {/* Sub-tab 2: Executive Performance */}
            {dashboardSubTab === 'executive' && (
              <div className="animate-fade-in">
                {/* Title & Subtitle */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h1 className="serif" style={{ fontSize: '2rem', color: '#113629', margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>Executive Performance Portal</h1>
                  <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>Strategic overview and dashboard access for senior representatives</span>
                </div>

                {/* Sales representative cards */}
                <div className="exec-portal-grid" style={{ marginBottom: '2rem' }}>
                  {[
                    { id: 'SR-9999', name: 'VIKRAM SETHI', role: 'SNR. VICE PRESIDENT', rev: '₹ 35.5 Cr', init: 'VS' },
                    { id: 'SR-1111', name: 'ANANYA RAO', role: 'REGIONAL DIRECTOR', rev: '₹ 32.4 Cr', init: 'AR' },
                    { id: 'SR-2222', name: 'KARAN MALHOTRA', role: 'SALES DIRECTOR', rev: '₹ 24.8 Cr', init: 'KM' },
                    { id: 'SR-3333', name: 'PRIYA SHARMA', role: 'LEAD BROKER', rev: '₹ 15.3 Cr', init: 'PS' },
                    { id: 'SR-4444', name: 'ROHAN VERMA', role: 'SENIOR ASSOCIATE', rev: '₹ 10.4 Cr', init: 'RV' }
                  ].map(exec => (
                    <div key={exec.id} className="exec-card" style={{ background: '#fff', border: '1px solid #f1f3f5', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                      <div style={{ 
                        width: '56px', 
                        height: '56px', 
                        margin: '0 auto 1rem auto', 
                        borderRadius: '50%', 
                        border: '1px solid #113629', 
                        color: '#113629', 
                        background: '#fafafa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                        fontFamily: "'Playfair Display', serif"
                      }}>{exec.init}</div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#113629', fontWeight: 'bold' }}>{exec.name}</h4>
                      <p style={{ margin: '0 0 1rem 0', fontSize: '0.62rem', color: '#9ca3af', fontWeight: 'bold', letterSpacing: '0.5px' }}>{exec.role}</p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', borderTop: '1px solid #f1f3f5', paddingTop: '0.75rem', marginBottom: '1rem' }}>
                        <span style={{ color: '#6b7280', fontWeight: '600' }}>REVENUE</span>
                        <strong style={{ color: '#113629' }}>{exec.rev}</strong>
                      </div>
                      
                      <button 
                        onClick={() => impersonateSales(exec.id)} 
                        className="btn-outline" 
                        style={{ width: '100%', margin: 0, borderColor: '#113629', color: '#113629', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', height: '36px' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                        OPEN PORTAL
                      </button>
                    </div>
                  ))}
                </div>

                {/* Global Client Site Visits Tracker */}
                <div style={{ marginTop: '1.5rem' }}>
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
            
            {/* Leads Tabs Sub-filter */}
            <div style={{ display: 'flex', borderBottom: '1px solid #f1f3f5', marginBottom: '1.25rem', gap: '1rem' }}>
              {['all', 'new', 'contacted', 'qualified', 'site visit', 'negotiation', 'lost'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setLeadSubTab(tab)} 
                  style={{
                    background: 'none', border: 'none', borderBottom: leadSubTab === tab ? '2px solid #c2a661' : 'none',
                    color: leadSubTab === tab ? '#c2a661' : '#4b5563', padding: '0.6rem 0.5rem', fontWeight: leadSubTab === tab ? 'bold' : 'normal',
                    fontSize: '0.78rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

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
                    .slice(0, 4)
                    .map((inq, i) => {
                      const repId = inq.status && inq.status.includes('|') ? inq.status.split('|')[1] : 'unassigned';
                      return (
                        <tr key={inq.id || i}>
                          <td><strong>{inq.name}</strong><br/><span className="text-muted" style={{ fontSize: '0.7rem' }}>{inq.phone}</span></td>
                          <td><span className="source-pill">{inq.source || 'PORTAL'}</span></td>
                          <td><strong>{repId === 'SR-9999' ? 'Vikram Sethi' : repId === 'SR-1111' ? 'Ananya Rao' : 'Awaiting Alloc'}</strong></td>
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* Top Inventory Stat Cards */}
            <div style={{ padding: '0 2.5rem 1.25rem 2.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                <div style={{ background: '#fff', border: '1px solid #f1f3f5', padding: '1rem', borderRadius: '10px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
                  <span style={{ fontSize: '0.62rem', color: '#888', fontWeight: 'bold' }}>TOTAL UNITS</span>
                  <h3 className="serif" style={{ margin: '0.2rem 0', color: '#113629' }}>100</h3>
                </div>
                <div style={{ background: '#fff', border: '1px solid #f1f3f5', padding: '1rem', borderRadius: '10px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
                  <span style={{ fontSize: '0.62rem', color: '#888', fontWeight: 'bold' }}>AVAILABLE STOCK</span>
                  <h3 className="serif" style={{ margin: '0.2rem 0', color: '#137333' }}>{availableUnitsCount}</h3>
                </div>
                <div style={{ background: '#fff', border: '1px solid #f1f3f5', padding: '1rem', borderRadius: '10px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
                  <span style={{ fontSize: '0.62rem', color: '#888', fontWeight: 'bold' }}>SOLD OUT</span>
                  <h3 className="serif" style={{ margin: '0.2rem 0', color: '#c62828' }}>{soldUnitsCount}</h3>
                </div>
                <div style={{ background: '#fff', border: '1px solid #f1f3f5', padding: '1rem', borderRadius: '10px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
                  <span style={{ fontSize: '0.62rem', color: '#888', fontWeight: 'bold' }}>ON HOLD</span>
                  <h3 className="serif" style={{ margin: '0.2rem 0', color: '#ef6c00' }}>{reservedUnitsCount}</h3>
                </div>
              </div>
            </div>

            {/* Reusable Interactive Occupancies Grid */}
            <div style={{ padding: '0 2.5rem 2.5rem 2.5rem' }}>
              <GridClient units={units} inquiries={inquiries} project={project} />
            </div>
          </div>
        )}

        {/* ==================== 6. FINANCE PAGE ==================== */}
        {activeTab === 'finance' && (
          <div className="dashboard-layout-main" style={{ padding: '1.5rem 2.5rem 2.5rem 2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#fff', border: '1px solid #f1f3f5', padding: '1.25rem', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
                <span style={{ fontSize: '0.62rem', color: '#888', fontWeight: 'bold' }}>TOTAL COLLECTION</span>
                <h3 className="serif" style={{ margin: '0.2rem 0', color: '#137333', fontSize: '1.6rem' }}>₹ {totalCollectionCr} Cr</h3>
              </div>
              <div style={{ background: '#fff', border: '1px solid #f1f3f5', padding: '1.25rem', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
                <span style={{ fontSize: '0.62rem', color: '#888', fontWeight: 'bold' }}>COLLECTED THIS MONTH</span>
                <h3 className="serif" style={{ margin: '0.2rem 0', color: '#137333', fontSize: '1.6rem' }}>₹ {collectedThisMonthCr} Cr</h3>
              </div>
              <div style={{ background: '#fff', border: '1px solid #f1f3f5', padding: '1.25rem', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
                <span style={{ fontSize: '0.62rem', color: '#888', fontWeight: 'bold' }}>PENDING INSTALMENTS</span>
                <h3 className="serif" style={{ margin: '0.2rem 0', color: '#c2a661', fontSize: '1.6rem' }}>₹ {pendingInstallmentsCr} Cr</h3>
              </div>
              <div style={{ background: '#fff', border: '1px solid #f1f3f5', padding: '1.25rem', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
                <span style={{ fontSize: '0.62rem', color: '#888', fontWeight: 'bold' }}>OVERDUE AMOUNT</span>
                <h3 className="serif" style={{ margin: '0.2rem 0', color: '#c62828', fontSize: '1.6rem' }}>₹ {overdueAmountCr} Cr</h3>
              </div>
            </div>

            {/* Finance Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="widget-card">
                <h3 className="serif" style={{ margin: '0 0 1rem 0' }}>Instalment Payment Trend</h3>
                <div style={{ height: '180px', width: '100%' }}>
                  <svg viewBox="0 0 500 150" width="100%" height="100%" style={{ overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#137333" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#137333" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {(() => {
                      const baseDate = new Date("2026-05-25");
                      const monthlyCollections = [];
                      const monthLabels = [];
                      for (let i = 5; i >= 0; i--) {
                        const d = new Date(baseDate);
                        d.setMonth(d.getMonth() - i);
                        const m = d.getMonth();
                        const y = d.getFullYear();
                        
                        const label = d.toLocaleString('default', { month: 'short' });
                        monthLabels.push(label);

                        const totalForMonth = buyers.reduce((sum, b) => {
                          const pDate = b.created_at ? new Date(b.created_at) : new Date("2026-05-01");
                          if (pDate.getMonth() === m && pDate.getFullYear() === y) {
                            return sum + parseAmountVal(b.amount_paid);
                          }
                          return sum;
                        }, 0);
                        monthlyCollections.push(totalForMonth);
                      }
                      
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
                        if (lakhs >= 100) return `₹${(lakhs / 100).toFixed(1)} Cr`;
                        return `₹${lakhs.toFixed(0)} L`;
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
                  {/* CP list */}
                  {cpPartners.map((cp, idx) => (
                    <tr key={`cp-${idx}`}>
                      <td><strong>{cp.username}</strong></td>
                      <td><span className="source-pill" style={{ color: '#b06000', background: '#fef7e0' }}>CP Broker</span></td>
                      <td style={{ fontStyle: 'italic', fontSize: '0.75rem', color: '#9ca3af' }}>Firm: {cp.firm_name}</td>
                      <td><span className="badge available">Active Portal</span></td>
                      <td>
                        <button 
                          onClick={() => handleDeleteUser(cp.username, 'CP')}
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
