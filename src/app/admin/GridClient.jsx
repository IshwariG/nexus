"use client";
import React, { useMemo, useState } from 'react';

export default function GridClient({ units, inquiries, buyers = [], users = [], project = 'vanya-residences' }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [activePhase, setActivePhase] = useState(1);
  const [velocityRange, setVelocityRange] = useState('MONTH');
  const [velocityOffset, setVelocityOffset] = useState(0);
  const gridLevels = activePhase === 1 ? [5, 4, 3, 2, 1] : [10, 9, 8, 7, 6];

  // Dynamically filter or simulate units based on project
  let projectUnits = units;
  if (project === 'vanya-estate') {
    projectUnits = [];
    for (let lvl = 1; lvl <= 10; lvl++) {
      for (let i = 1; i <= 10; i++) {
        const unitId = lvl * 100 + i;
        const seedValue = (unitId * 7) % 10;
        let status = 'AVAILABLE';
        let tagColor = '';
        if (seedValue < 3) {
          status = 'SOLD OUT';
          tagColor = 'Ram Kumar';
        } else if (seedValue < 5) {
          status = 'RESERVED';
        }
        projectUnits.push({
          unit_id: unitId.toString(),
          floor: lvl.toString(),
          type: '3BHK VILLA',
          area: '3800',
          price: '₹ 6.50 Cr',
          status,
          tag_color: tagColor
        });
      }
    }
  } else if (project === 'vanya-meadows') {
    projectUnits = [];
    for (let lvl = 1; lvl <= 10; lvl++) {
      for (let i = 1; i <= 8; i++) { // 8 units per level
        const unitId = lvl * 100 + i;
        const seedValue = (unitId * 13) % 10;
        let status = 'AVAILABLE';
        let tagColor = '';
        if (seedValue < 2) {
          status = 'SOLD OUT';
          tagColor = 'Rajesh Gupta';
        } else if (seedValue < 3) {
          status = 'RESERVED';
        }
        projectUnits.push({
          unit_id: unitId.toString(),
          floor: lvl.toString(),
          type: '5BHK ESTATE',
          area: '7200',
          price: '₹ 8.20 Cr',
          status,
          tag_color: tagColor
        });
      }
    }
  }

  // Ensure all units for Phase 2 (floors 6-10) are AVAILABLE to show "all green" for simulated projects
  if (project !== 'vanya-residences') {
    projectUnits = projectUnits.map(u => {
      if (parseInt(u.floor) >= 6) {
        return { ...u, status: 'AVAILABLE', tag_color: '' };
      }
      return u;
    });
  }

  const handleCellClick = (unitId) => {
    // 1. Check if there is an active buyer in BuyerDetails for this unit
    const buyer = buyers.find(b => b.unit_id && b.unit_id.toString() === unitId.toString());
    if (buyer) {
      // Find the user details from the Users table
      const user = (users || []).find(u => u.username === buyer.username);
      if (user) {
        // Resolve Aadhaar from inquiries
        const matchingInquiry = (inquiries || []).find(inq => 
          (inq.phone && user.phone && inq.phone === user.phone) || 
          (inq.email && user.email && inq.email.toLowerCase() === user.email.toLowerCase()) ||
          (inq.name && user.full_name && inq.name.toLowerCase() === user.full_name.toLowerCase())
        );
        const resolvedAadhaar = matchingInquiry?.aadhaar || 'N/A';

        setSelectedClient({
          unitId,
          inquiry: {
            name: user.full_name || user.username,
            phone: user.phone || 'N/A',
            email: user.email || 'N/A',
            aadhaar: resolvedAadhaar,
            message: `Registered Buyer Profile\nUsername: ${buyer.username}\nAmount Paid: ₹ ${buyer.amount_paid} Cr / ₹ ${buyer.total_amount} Cr\nConstruction Progress: ${buyer.construction_progress}%\nPossession Date: ${buyer.possession_date || 'N/A'}`
          }
        });
        return;
      } else {
        // Fallback if user profile is missing but buyer details exist
        setSelectedClient({
          unitId,
          inquiry: {
            name: buyer.username,
            phone: 'N/A',
            email: 'N/A',
            message: `Registered Buyer Profile\nAmount Paid: ₹ ${buyer.amount_paid} Cr / ₹ ${buyer.total_amount} Cr\nConstruction Progress: ${buyer.construction_progress}%`
          }
        });
        return;
      }
    }

    // 2. If no active buyer, look for client details in the Inquiries side-channel matching tag_color
    const uData = projectUnits.find(u => parseInt(u.unit_id) === unitId);
    const expectedNameOrUser = uData?.tag_color;

    if (expectedNameOrUser && !['green', 'red', 'blue'].includes(expectedNameOrUser)) {
      // Try to find an inquiry that matches the tag_color (case insensitive username or name)
      const matchingInquiry = inquiries.find(inq => 
        inq.source === `UNIT_ASSIGNMENT_${unitId}` && 
        (inq.name?.toLowerCase() === expectedNameOrUser.toLowerCase() || 
         inq.phone === expectedNameOrUser)
      );
      if (matchingInquiry) {
        setSelectedClient({ unitId, inquiry: matchingInquiry });
        return;
      }

      // Try to find a user profile that matches the tag_color as username
      const user = (users || []).find(u => u.username?.toLowerCase() === expectedNameOrUser.toLowerCase());
      if (user) {
        setSelectedClient({
          unitId,
          inquiry: {
            name: user.full_name || user.username,
            phone: user.phone || 'N/A',
            email: user.email || 'N/A',
            message: 'Assigned user profile (No active purchase details found).'
          }
        });
        return;
      }
    }

    // 3. Fallback: find the latest inquiry for this unit assignment
    const inquiry = inquiries.find(inq => inq.source === `UNIT_ASSIGNMENT_${unitId}`);
    if (inquiry) {
      setSelectedClient({ unitId, inquiry });
    } else if (uData && uData.tag_color && !['green', 'red', 'blue'].includes(uData.tag_color)) {
      setSelectedClient({ unitId, inquiry: { name: uData.tag_color, message: 'Details missing in standard pipeline.' } });
    }
  };

  const validUnits = projectUnits.filter(u => {
    const id = parseInt(u.unit_id);
    const floor = Math.floor(id / 100);
    return gridLevels.includes(floor) && (id % 100) >= 1 && (id % 100) <= (project === 'vanya-meadows' ? 8 : 10);
  });

  const soldUnits = validUnits.filter(u => u.status === 'SOLD OUT').length;
  const reservedUnits = validUnits.filter(u => u.status === 'RESERVED' || u.status === 'IN NEGOTIATION').length;
  const availableUnits = validUnits.filter(u => u.status === 'AVAILABLE').length;
  const totalUnits = validUnits.length || 1;

  const parseAmountVal = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val < 1000 ? val * 100 : val / 100000;
    const lowerVal = val.toString().toLowerCase();
    const cleaned = lowerVal.replace(/[^\d.]/g, '');
    let num = parseFloat(cleaned) || 0;
    if (lowerVal.includes('cr') || lowerVal.includes('crore')) num = num * 100;
    else if (lowerVal.includes('l') || lowerVal.includes('lakh')) {
      // already in Lakhs
    } else {
      num = num < 1000 ? num * 100 : num / 100000;
    }
    return num;
  };

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const formatShortDay = (d) =>
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase();
  const getWeekOfMonth = (d) => {
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const firstDay = first.getDay(); // 0=Sun
    const offset = (firstDay + 6) % 7; // Monday-based
    return Math.floor((d.getDate() + offset - 1) / 7) + 1;
  };

  const velocityBars = useMemo(() => {
    const now = new Date();
    if (velocityRange === 'WEEK') {
      now.setDate(now.getDate() + (velocityOffset * 7));
    } else if (velocityRange === 'MONTH') {
      now.setDate(1);
      now.setMonth(now.getMonth() + velocityOffset);
    } else if (velocityRange === 'H1' || velocityRange === 'H2') {
      now.setFullYear(now.getFullYear() + velocityOffset);
    }

    const payments = (buyers || [])
      .map((b) => ({ amtLakhs: parseAmountVal(b.amount_paid), dt: b.created_at ? new Date(b.created_at) : null }))
      .filter((p) => p.dt && !Number.isNaN(p.dt.getTime()) && p.amtLakhs > 0);

    if (velocityRange === 'WEEK') {
      const end = startOfDay(now);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      const buckets = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        buckets.push({ label: formatShortDay(d), key: d.toISOString().slice(0, 10), valueLakhs: 0 });
      }
      payments.forEach((p) => {
        const day = startOfDay(p.dt);
        if (day < start || day > end) return;
        const key = day.toISOString().slice(0, 10);
        const b = buckets.find((x) => x.key === key);
        if (b) b.valueLakhs += p.amtLakhs;
      });
      return buckets.map((b) => ({ label: b.label, value: b.valueLakhs / 100 }));
    }

    if (velocityRange === 'MONTH') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const weeksInMonth = getWeekOfMonth(new Date(year, month + 1, 0));
      const buckets = Array.from({ length: weeksInMonth }, (_, i) => ({ label: `WK ${i + 1}`, week: i + 1, valueLakhs: 0 }));
      payments.forEach((p) => {
        if (p.dt < start || p.dt > end) return;
        const w = getWeekOfMonth(p.dt);
        const b = buckets.find((x) => x.week === w);
        if (b) b.valueLakhs += p.amtLakhs;
      });
      return buckets.map((b) => ({ label: b.label, value: b.valueLakhs / 100 }));
    }

    const half = velocityRange === 'H2' ? 'H2' : 'H1';
    const year = now.getFullYear();
    const startMonth = half === 'H1' ? 0 : 6;
    const monthNames = half === 'H1'
      ? ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE']
      : ['JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const buckets = monthNames.map((label, i) => ({ label, monthIndex: startMonth + i, valueLakhs: 0 }));
    payments.forEach((p) => {
      if (p.dt.getFullYear() !== year) return;
      const mi = p.dt.getMonth();
      const b = buckets.find((x) => x.monthIndex === mi);
      if (b) b.valueLakhs += p.amtLakhs;
    });
    return buckets.map((b) => ({ label: b.label, value: b.valueLakhs / 100 }));
  }, [buyers, velocityRange, velocityOffset]);

  const realAvgPriceLakhs = useMemo(() => {
    const prices = projectUnits.map(u => parseAmountVal(u.price)).filter(p => p > 0);
    return prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  }, [projectUnits]);

  const realTotalPortfolioLakhs = useMemo(() => {
    return projectUnits.map(u => parseAmountVal(u.price)).reduce((a, b) => a + b, 0);
  }, [projectUnits]);

  const realTotalRevenueLakhs = useMemo(() => {
    return (buyers || []).map(b => parseAmountVal(b.amount_paid)).reduce((a, b) => a + b, 0);
  }, [buyers]);

  const realConversionRate = useMemo(() => {
    const totalLeads = inquiries.filter(inq => !inq.source?.startsWith('UNIT_ASSIGNMENT_')).length;
    const soldCount = projectUnits.filter(u => u.status === 'SOLD OUT').length;
    return totalLeads > 0 ? parseFloat(((soldCount / totalLeads) * 100).toFixed(1)) : 0;
  }, [projectUnits, inquiries]);

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
    projectUnits.forEach(u => {
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
  }, [projectUnits, project]);

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

  return (
    <>
      {/* Analytical Performance Report */}
      <div className="performance-section mb-2">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h3 className="serif" style={{ fontSize: '2.2rem', color: 'var(--vanya-green)', margin: '0 0 0.4rem 0' }}>Analytical Performance Report</h3>
          <div style={{ width: '60px', height: '3px', background: 'var(--vanya-gold)', margin: '0 auto 0.5rem auto', borderRadius: '2px' }}></div>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0 }}>
            Aggregate sales intelligence & velocity tracking (Phase {activePhase})
          </p>
        </div>

        {(() => {
          const pSoldPerc = Math.round((soldUnits / totalUnits) * 100);
          const pReservedPerc = Math.round((reservedUnits / totalUnits) * 100);
          const pAvailablePerc = Math.max(0, 100 - pSoldPerc - pReservedPerc);

          const projectSoldUnitsCount = projectUnits.filter(u => u.status === 'SOLD OUT').length;
          const projectUnitsCount = projectUnits.length || 1;
          const projectSoldPerc = Math.round((projectSoldUnitsCount / projectUnitsCount) * 100);

          const pAvgPriceLakhs = project === 'vanya-estate' ? 650 : project === 'vanya-meadows' ? 820 : realAvgPriceLakhs;
          const pTotalPortfolioLakhs = project === 'vanya-estate' ? 65000 : project === 'vanya-meadows' ? 65600 : realTotalPortfolioLakhs;
          const pTotalRevenueLakhs = project === 'vanya-estate' ? 9750 : project === 'vanya-meadows' ? 4100 : realTotalRevenueLakhs;
          const pConversionRate = project === 'vanya-estate' ? 18.2 : project === 'vanya-meadows' ? 12.4 : realConversionRate;
          const pAvgSalesCycle = project === 'vanya-estate' ? 32 : project === 'vanya-meadows' ? 45 : (realSalesCycle > 0 ? realSalesCycle : 24);
          
          const formatCr = (lakhs) => lakhs >= 100 ? `${(lakhs / 100).toFixed(1)} Cr` : `${lakhs.toFixed(0)} L`;
          
          return (
            <>
              {/* ===== MAIN GRID: Donut | Bar Chart | KPI Stack ===== */}
              <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 220px', gap: '1.5rem', marginBottom: '1.5rem' }}>
                
                {/* LEFT: Inventory Distribution Donut */}
                <div className="widget-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #f1f3f5', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem' }}>INVENTORY DISTRIBUTION</span>
                  
                  {/* Refined SVG Donut Chart */}
                  <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '1rem' }}>
                    <svg width="160" height="160" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f3f5" strokeWidth="3.8" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#137333" strokeWidth="4" pathLength="100"
                        strokeDasharray={`${pAvailablePerc} ${100 - pAvailablePerc}`} strokeDashoffset="0"
                        strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#1a73e8" strokeWidth="4" pathLength="100"
                        strokeDasharray={`${pReservedPerc} ${100 - pReservedPerc}`} strokeDashoffset={`${-pAvailablePerc}`}
                        strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#8B2500" strokeWidth="4" pathLength="100"
                        strokeDasharray={`${pSoldPerc} ${100 - pSoldPerc}`} strokeDashoffset={`${-pAvailablePerc - pReservedPerc}`}
                        strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                    </svg>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                      <h2 className="serif" style={{ margin: 0, fontSize: '2.2rem', color: 'var(--vanya-green)', fontWeight: 'bold', lineHeight: 1 }}>{totalUnits}</h2>
                      <span style={{ fontSize: '0.58rem', color: '#9ca3af', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>TOTAL UNITS</span>
                    </div>
                  </div>

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
                    <span>({soldUnits}) {pSoldPerc}%</span>
                    <span>({reservedUnits}) {pReservedPerc}%</span>
                    <span>({availableUnits}) {pAvailablePerc}%</span>
                  </div>
                </div>

                {/* CENTER: Monthly Sales Velocity Bar Chart */}
                <div className="widget-card" style={{ padding: '1.5rem', background: '#fff', border: '1px solid #f1f3f5', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--vanya-green)', letterSpacing: '0.5px' }}>MONTHLY SALES VELOCITY</span>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.3rem', fontSize: '0.65rem', fontWeight: 'bold' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#137333' }}>
                          <span style={{ width: '8px', height: '8px', background: '#137333', borderRadius: '50%', display: 'inline-block' }}></span> REVENUE
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#9ca3af' }}>
                          <span style={{ width: '8px', height: '8px', background: 'none', border: '2px solid #9ca3af', borderRadius: '50%', display: 'inline-block' }}></span> TARGET
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button 
                        type="button"
                        onClick={() => setVelocityOffset(prev => prev - 1)}
                        style={{ background: '#f1f3f5', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', color: '#4b5563', fontSize: '0.9rem', fontWeight: 'bold' }}
                      >
                        &lt;
                      </button>
                      <select
                        value={velocityRange}
                        onChange={(e) => {
                          setVelocityRange(e.target.value);
                          setVelocityOffset(0);
                        }}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', color: '#374151', fontWeight: '600', outline: 'none', cursor: 'pointer' }}
                      >
                        <option value="WEEK">Week</option>
                        <option value="MONTH">Month</option>
                        <option value="H1">Jan - Jun</option>
                        <option value="H2">Jul - Dec</option>
                      </select>
                      <button 
                        type="button"
                        onClick={() => setVelocityOffset(prev => prev + 1)}
                        disabled={velocityOffset >= 0}
                        style={{ background: velocityOffset >= 0 ? '#f9fafb' : '#f1f3f5', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: velocityOffset >= 0 ? 'not-allowed' : 'pointer', color: velocityOffset >= 0 ? '#d1d5db' : '#4b5563', fontSize: '0.9rem', fontWeight: 'bold' }}
                      >
                        &gt;
                      </button>
                    </div>
                  </div>
                  {/* SVG Bar chart */}
                  {(() => {
                    const months = velocityBars.map((b) => ({
                      label: b.label,
                      value: activePhase === 2 ? b.value * 1.5 : b.value
                    }));
                    const maxVal = Math.max(...months.map(m => m.value), 1);
                    const targetLine = maxVal * 0.55;
                    
                    return (
                      <div style={{ position: 'relative', height: '220px', marginTop: '1rem' }}>
                        <svg viewBox="0 0 600 220" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
                          {[0, 0.25, 0.5, 0.75, 1].map((perc, i) => {
                            const val = (maxVal * 1.2 * perc).toFixed(1);
                            const y = 195 - (perc * 170);
                            return (
                              <g key={i}>
                                <line x1="40" y1={y} x2="580" y2={y} stroke="#f1f3f5" strokeWidth="1" />
                                <text x="30" y={y + 4} textAnchor="end" style={{ fontSize: '0.78rem', fill: '#9ca3af', fontWeight: '700' }}>{val}</text>
                              </g>
                            );
                          })}
                          
                          <line x1="40" y1={195 - (targetLine / (maxVal * 1.2)) * 170} x2="580" y2={195 - (targetLine / (maxVal * 1.2)) * 170} stroke="#137333" strokeWidth="1.5" strokeDasharray="8 4" opacity="0.4" />
                          
                          {months.map((m, idx) => {
                            const n = Math.max(months.length, 1);
                            const totalWidth = 540;
                            const maxBarWidth = 55;
                            const minGap = 8;
                            const gap = Math.max(minGap, Math.floor(totalWidth / (n * 8)));
                            const barWidth = Math.min(maxBarWidth, Math.floor((totalWidth - gap * (n + 1)) / n));
                            const x = 40 + gap + idx * (barWidth + gap);
                            const barHeight = Math.max(3, (m.value / (maxVal * 1.2)) * 170);
                            const y = 195 - barHeight;
                            const crLabel = `${m.value.toFixed(1)} Cr`;
                            
                            return (
                              <g key={idx}>
                                <rect x={x} y={y} width={barWidth} height={barHeight} rx="4" ry="4" fill="url(#barGradientGrid)" />
                                <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" style={{ fontSize: '0.70rem', fill: '#1f2937', fontWeight: '700' }}>{crLabel}</text>
                                <text x={x + barWidth / 2} y={210} textAnchor="middle" style={{ fontSize: '0.68rem', fill: '#6b7280', fontWeight: '700' }}>{m.label}</text>
                              </g>
                            );
                          })}
                          <defs>
                            <linearGradient id="barGradientGrid" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2d7c5f" stopOpacity="0.9" />
                              <stop offset="100%" stopColor="#b8d8c8" stopOpacity="0.6" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    );
                  })()}
                </div>

                {/* RIGHT: 3 Stacked KPI Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="widget-card" style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#fff', border: '1px solid #f1f3f5', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#4b5563', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>AVG. PRICE PER UNIT</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ecfdf5', border: '1.5px solid #bbf0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </div>
                      <h3 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--vanya-green)', fontWeight: 'bold' }}>₹ {formatCr(pAvgPriceLakhs)}</h3>
                    </div>
                  </div>
                  <div className="widget-card" style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#fff', border: '1px solid #f1f3f5', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#4b5563', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>TOTAL PORTFOLIO VALUE</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ecfdf5', border: '1.5px solid #bbf0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3" />
                        </svg>
                      </div>
                      <h3 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--vanya-green)', fontWeight: 'bold' }}>₹ {formatCr(pTotalPortfolioLakhs)}</h3>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#137333', fontWeight: '700', marginTop: '0.3rem', marginLeft: '0.1rem' }}>↑ +{project === 'vanya-estate' ? '18.4' : project === 'vanya-meadows' ? '21.0' : portfolioIncreasePerc.toFixed(1)}% INCREASE</span>
                  </div>
                  <div className="widget-card" style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#fff', border: '1px solid #f1f3f5', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#4b5563', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>CONVERSION RATE</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ecfdf5', border: '1.5px solid #bbf0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                      <h3 className="serif" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--vanya-green)', fontWeight: 'bold' }}>{pConversionRate}%</h3>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: '600', marginTop: '0.3rem', marginLeft: '0.1rem' }}>LEAD TO DEPOSIT</span>
                  </div>
                </div>
              </div>

              {/* ===== BOTTOM ROW: 3 KPI Cards ===== */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <div className="widget-card" style={{ padding: '1.5rem', background: '#fff', border: '1px solid #f1f3f5', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', letterSpacing: '0.5px' }}>TOTAL REVENUE</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ecfdf5', border: '1.5px solid #bbf0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="2.5" strokeLinecap="round">
                        <text x="7" y="18" fill="#137333" stroke="none" fontSize="18" fontWeight="bold" fontFamily="serif">₹</text>
                      </svg>
                    </div>
                    <h3 className="serif" style={{ margin: 0, fontSize: '1.7rem', color: 'var(--vanya-green)', fontWeight: 'bold' }}>₹ {formatCr(pTotalRevenueLakhs)}</h3>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.65rem', color: '#137333', fontWeight: '700' }}>↑ +{project === 'vanya-estate' ? '8.5' : project === 'vanya-meadows' ? '5.2' : revenueIncreasePerc.toFixed(1)}% VS LAST QUARTER</span>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" />
                    </svg>
                  </div>
                </div>

                <div className="widget-card" style={{ padding: '1.5rem', background: '#fff', border: '1px solid #f1f3f5', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', letterSpacing: '0.5px' }}>UNITS SOLD</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ecfdf5', border: '1.5px solid #bbf0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                    </div>
                    <h3 className="serif" style={{ margin: 0, fontSize: '1.7rem', color: 'var(--vanya-green)', fontWeight: 'bold' }}>{projectSoldUnitsCount} <span style={{ fontSize: '1.05rem', color: '#9ca3af', fontWeight: 'normal' }}>/ {projectUnitsCount}</span></h3>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <div style={{ background: '#137333', color: 'white', fontSize: '0.58rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>{projectSoldPerc}%</div>
                      <div style={{ flex: 1, height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${projectSoldPerc}%`, background: 'linear-gradient(90deg, #137333, #2d7c5f)', borderRadius: '4px', transition: 'width 0.6s ease' }}></div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.62rem', color: '#6b7280', fontWeight: '600' }}>{projectSoldPerc}% of Total Inventory Sold</span>
                  </div>
                </div>

                <div className="widget-card" style={{ padding: '1.5rem', background: '#fff', border: '1px solid #f1f3f5', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', letterSpacing: '0.5px' }}>AVG. SALES CYCLE</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ecfdf5', border: '1.5px solid #bbf0d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <h3 className="serif" style={{ margin: 0, fontSize: '1.7rem', color: 'var(--vanya-green)', fontWeight: 'bold' }}>{pAvgSalesCycle} Days</h3>
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
            </>
          );
        })()}
      </div>

      <div className="widget-card">
        <div className="flex-between align-start mb-1">
          <div>
            <h3 className="serif" style={{margin:'0 0 0.25rem 0'}}>Master Occupancies Grid</h3>
            <p className="text-muted" style={{margin:0}}>Strategic architectural distribution tracking (Phase {activePhase})</p>
          </div>
          <div>
            <div className="phase-buttons" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button className={activePhase === 1 ? "active" : ""} onClick={() => setActivePhase(1)}>PHASE 1: UNITS 1-50</button>
              <button className={activePhase === 2 ? "active" : ""} onClick={() => setActivePhase(2)}>PHASE 2: UNITS 51-100</button>
            </div>
            <div className="occ-legend mt-1 right">
              <span className="l-sold">SOLD</span>
              <span className="l-reserved">RESERVED</span>
              <span className="l-available">AVAILABLE</span>
            </div>
          </div>
        </div>

      <div className="grid-occupancy-structured mt-2">
        {gridLevels.map(lvl => (
          <div className="grid-row" key={lvl}>
            <div className="row-label">LVL {lvl.toString().padStart(2, '0')}</div>
            <div className="row-cells">
              {Array.from({length: project === 'vanya-meadows' ? 8 : 10}).map((_, i) => {
                const unitId = lvl * 100 + i + 1;
                const uData = projectUnits.find(u => parseInt(u.unit_id) === unitId);
                const statusClass = uData ? (uData.status === 'AVAILABLE' ? 'available' : (uData.status === 'RESERVED' || uData.status === 'IN NEGOTIATION' ? 'reserved' : 'sold')) : 'available';
                return (
                  <div key={unitId} className={`occ-cell ${statusClass}`} style={{position: 'relative', cursor: (statusClass !== 'available') ? 'pointer' : 'default'}} onClick={() => handleCellClick(unitId)}>
                    <strong>{unitId}</strong>
                    <span>{uData ? uData.status.replace(' OUT', '') : 'AVAILABLE'}</span>
                    {uData && uData.tag_color && !['green', 'red', 'blue'].includes(uData.tag_color) && (
                      <span style={{fontSize: '0.45rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px'}}>{uData.tag_color}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="occ-summary mt-3 text-center" style={{justifyContent: 'center', gap: '4rem'}}>
        <div>
          <span className="text-muted" style={{fontSize:'0.65rem', fontWeight:600, letterSpacing:'1px'}}>TOTAL SOLD PORTFOLIO</span>
          <h2 className="serif c-sold" style={{fontSize: '2rem', margin:0}}>{soldUnits}</h2>
        </div>
        <div>
          <span className="text-muted" style={{fontSize:'0.65rem', fontWeight:600, letterSpacing:'1px'}}>ACTIVE RESERVATIONS</span>
          <h2 className="serif c-reserved" style={{fontSize: '2rem', margin:0}}>{reservedUnits}</h2>
        </div>
        <div>
          <span className="text-muted" style={{fontSize:'0.65rem', fontWeight:600, letterSpacing:'1px'}}>INVENTORY AVAILABLE</span>
          <h2 className="serif c-available" style={{fontSize: '2rem', margin:0}}>{availableUnits}</h2>
        </div>
      </div>
      
    </div>

      {selectedClient && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div style={{background: 'white', padding: '3rem', width: '100%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.05)', border: '1px solid #eee', position: 'relative'}}>
            <button onClick={() => setSelectedClient(null)} style={{position: 'absolute', top: '1rem', right: '1.5rem', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888'}}>&times;</button>
            <h2 className="serif" style={{color: 'var(--vanya-green)', marginBottom: '0.5rem', fontSize: '1.8rem'}}>Unit {selectedClient.unitId} Assignment</h2>
            <p style={{color: '#888', fontSize: '0.8rem', marginBottom: '2rem', letterSpacing: '0.5px'}}>Confidential Client Record</p>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '1.2rem', fontSize: '0.9rem', color: '#555'}}>
              <div>
                <strong style={{fontSize: '0.65rem', letterSpacing: '1px', color: '#888', display: 'block', marginBottom: '0.2rem'}}>FULL NAME</strong>
                <div style={{color: 'var(--vanya-green)', fontWeight: 600, fontSize: '1.1rem'}}>{selectedClient.inquiry.name}</div>
              </div>
              {selectedClient.inquiry.phone && (
                <div>
                  <strong style={{fontSize: '0.65rem', letterSpacing: '1px', color: '#888', display: 'block', marginBottom: '0.2rem'}}>PHONE NUMBER</strong>
                  <div>{selectedClient.inquiry.phone}</div>
                </div>
              )}
              {selectedClient.inquiry.email && (
                <div>
                  <strong style={{fontSize: '0.65rem', letterSpacing: '1px', color: '#888', display: 'block', marginBottom: '0.2rem'}}>EMAIL (IF PROVIDED)</strong>
                  <div>{selectedClient.inquiry.email}</div>
                </div>
              )}
              {selectedClient.inquiry.aadhaar && selectedClient.inquiry.aadhaar !== 'N/A' && (
                <div>
                  <strong style={{fontSize: '0.65rem', letterSpacing: '1px', color: '#888', display: 'block', marginBottom: '0.2rem'}}>AADHAAR CARD NUMBER</strong>
                  <div>{selectedClient.inquiry.aadhaar}</div>
                </div>
              )}
              <div style={{background: 'var(--admin-bg)', padding: '1rem', border: '1px solid #eee', marginTop: '0.5rem'}}>
                <strong style={{fontSize: '0.65rem', letterSpacing: '1px', color: '#888', display: 'block', marginBottom: '0.5rem'}}>ADDITIONAL DETAILS</strong>
                <div style={{whiteSpace: 'pre-wrap', lineHeight: 1.6}}>{selectedClient.inquiry.message}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
