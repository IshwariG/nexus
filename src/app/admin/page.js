import "./admin.css";
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import Link from 'next/link';
import PortfolioTable from './PortfolioTable';
import GridClient from './GridClient';

function SalesView({ inquiries, units, userId }) {
  // Generate grid levels 1-5 validation
  const gridLevels = [5, 4, 3, 2, 1];
  const validUnits = units.filter(u => {
    const id = parseInt(u.unit_id);
    const floor = Math.floor(id / 100);
    return gridLevels.includes(floor) && (id % 100) >= 1 && (id % 100) <= 10;
  });

  const assignedUnits = validUnits.slice(0, 20); // Assign 20 flats to Salesman
  const totalAssigned = assignedUnits.length;
  const soldUnits = assignedUnits.filter(u => u.status === 'SOLD OUT').length;
  const inNegotiation = assignedUnits.filter(u => u.status === 'IN NEGOTIATION' || u.status === 'RESERVED').length;
  const visibleInquiries = inquiries.filter(i => i.status !== 'SOLD OUT');
  const pendingLeads = visibleInquiries.length;

  return (
    <div className="sales-layout">
      <aside className="sales-sidebar">
        <div className="sales-sidebar-logo">
          <h2>VANYA</h2>
          <p>EXECUTIVE DIGITAL</p>
        </div>
        <nav className="sales-nav">
          <Link href="/admin" className="active">Dashboard</Link>
          <Link href="/inventory">Inventory</Link>
          <a href="#">Leads</a>
          <a href="#">Analytics</a>
          <a href="#">Amenities</a>
        </nav>
        <div className="sales-bottom">
          <button className="btn-sales-new">+ NEW INQUIRY</button>
        </div>
      </aside>

      <main className="sales-main">
        <div className="sales-hero">
          <div className="hero-greeting-box">
            <h1 className="serif">Namaste, {userId}</h1>
            <p>Executive Sales Portal — Vanya Residences Heritage Collection</p>
          </div>
        </div>

        <div className="sales-content">
          <div className="sales-stats-row">
            <div className="sales-stat-card">
              <span>TOTAL ASSIGNED</span>
              <h2>{totalAssigned}</h2>
            </div>
            <div className="sales-stat-card">
              <span>UNITS SOLD</span>
              <h2>{soldUnits}</h2>
            </div>
            <div className="sales-stat-card">
              <span>IN NEGOTIATION</span>
              <h2>{inNegotiation}</h2>
            </div>
            <div className="sales-stat-card">
              <span>PENDING LEADS</span>
              <h2>{pendingLeads}</h2>
            </div>
          </div>

          <div className="widget-card">
            <h3 className="section-title serif">Portfolio Inventory</h3>
            <PortfolioTable assignedUnits={assignedUnits} />
          </div>

          <div className="widget-card">
            <div className="flex-between">
              <h3 className="section-title serif" style={{margin:0}}>Active Inquiry Pipeline <span className="badge sold">URGENT</span></h3>
              <button className="btn-dark">EXPORT CSV</button>
            </div>
            <table className="table-standard">
              <thead>
                <tr>
                  <th>CLIENT NAME</th>
                  <th>CONTACT INFORMATION</th>
                  <th>SOURCE</th>
                  <th>RECEIVED</th>
                  
                </tr>
              </thead>
              <tbody>
                {visibleInquiries.length > 0 ? visibleInquiries.map(inq => (
                  <tr key={inq.id}>
                    <td><strong>{inq.name}</strong><br/><span className="text-muted">NEW DELHI</span></td>
                    <td className="text-muted">📞 {inq.phone}<br/>✉️ {inq.email}</td>
                    <td><span style={{background: '#f5f5f5', padding: '4px 8px', fontSize: '0.65rem'}}>{inq.source}</span></td>
                    <td className="text-muted">{new Date(inq.created_at).toLocaleDateString()}</td>
                   
                  </tr>
                )) : <tr><td colSpan="5">No active leads.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="widget-card">
             <h3 className="section-title serif">Heritage Amenities Tracker</h3>
             <p className="text-muted" style={{marginTop: '-1rem', marginBottom: '1.5rem'}}>Real-time availability for client site-visits</p>
             <div className="amenities-row">
                <div className="amenity-card" style={{backgroundImage: "url('/images/unit_interior_1777642600392.png')"}}>
                  <span className="amenity-badge">AVAILABLE</span>
                  <h3 className="serif">The Ayurvedic Sanctuary</h3>
                </div>
                <div className="amenity-card" style={{backgroundImage: "url('/images/hero_building_1777640070355.png')"}}>
                  <span className="amenity-badge" style={{background: '#c62828'}}>BUSY (10:00)</span>
                  <h3 className="serif">Sky-Fitness Atrium</h3>
                </div>
                <div className="amenity-card" style={{backgroundImage: "url('/images/unit_interior_1777642600392.png')"}}>
                  <span className="amenity-badge">AVAILABLE</span>
                  <h3 className="serif">Heritage Library</h3>
                </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}


function AdminView({ inquiries, units }) {
  // Generate grid: LVL05 to LVL01
  const gridLevels = [5, 4, 3, 2, 1];

  // Only count units that actually belong in our 5-floor Master Grid to prevent mismatches
  const validUnits = units.filter(u => {
    const id = parseInt(u.unit_id);
    const floor = Math.floor(id / 100);
    return gridLevels.includes(floor) && (id % 100) >= 1 && (id % 100) <= 10;
  });

  const soldUnits = validUnits.filter(u => u.status === 'SOLD OUT').length;
  const reservedUnits = validUnits.filter(u => u.status === 'RESERVED' || u.status === 'IN NEGOTIATION').length;
  const availableUnits = validUnits.filter(u => u.status === 'AVAILABLE').length;
  const totalUnits = validUnits.length || 1;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <h2 className="serif">VANYA RESIDENCES</h2>
          <p>HERITAGE COLLECTION</p>
        </div>
        <nav className="admin-nav">
          <a href="#" className="active">
            <span className="nav-icon">📊</span> Dashboard
          </a>
          <a href="/inventory">
            <span className="nav-icon">🏢</span> Inventory
          </a>
          <a href="#">
            <span className="nav-icon">👥</span> Leads
          </a>
          <a href="#">
            <span className="nav-icon">📈</span> Analytics
          </a>
          <a href="#">
            <span className="nav-icon">💳</span> Payments
          </a>
        </nav>
        <div className="admin-bottom">
          <div className="admin-profile">
            <div className="admin-avatar"></div>
            <div>
              <strong>Admin Portal</strong>
              <span>SYSTEM EXECUTIVE</span>
            </div>
          </div>
          <button className="btn-dark mt-2" style={{width: '100%'}}>NEW INQUIRY</button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-header">
          <div>
            <h1 className="serif">Master Portfolio Overview</h1>
            <p>PROJECT ID: VNY-HRGC-001</p>
          </div>
          <div style={{display:'flex', gap:'1rem', alignItems: 'center'}}>
             <span className="text-muted" style={{fontSize: '0.7rem', fontWeight: 600}}>QUARTERLY REPORT</span>
             <span className="text-muted" style={{fontSize: '0.7rem', fontWeight: 600}}>EXPORT DATA</span>
             <span className="icon-bell">🔔</span>
          </div>
        </div>

        {/* Analytical Performance Report */}
        <div className="performance-section mb-2">
          <div style={{ textAlign: 'center' }}>
            <div>
              <h3 className="serif" style={{margin:0}}>Analytical Performance Report</h3>
              <p className="text-muted" style={{margin:0, fontSize:'0.8rem'}}>Aggregate sales intelligence & velocity tracking</p>
            </div>
            
          </div>

          <div className="perf-grid-top mt-2">
            <div className="perf-card text-center">
              <p className="perf-label">INVENTORY DISTRIBUTION</p>
              <div className="donut-chart-mock" style={{
                background: `conic-gradient(
                  #8b1c1c 0% ${(soldUnits/totalUnits)*100}%,
                  #1a4d8c ${(soldUnits/totalUnits)*100}% ${((soldUnits+reservedUnits)/totalUnits)*100}%,
                  #2e7d32 ${((soldUnits+reservedUnits)/totalUnits)*100}% 100%
                )`
              }}>
                 <div className="donut-inner">
                   <h2 className="serif" style={{margin:0, fontSize:'2rem'}}>{totalUnits}</h2>
                   <span style={{fontSize:'0.6rem', color:'#888', letterSpacing:'1px'}}>TOTAL UNITS</span>
                 </div>
              </div>
              <div className="donut-legend">
                <span><span className="dot sold"></span> SOLD ({soldUnits}) <span className="p-val">{Math.round((soldUnits/totalUnits)*100)}%</span></span>
                <span><span className="dot reserved"></span> RSVD ({reservedUnits}) <span className="p-val">{Math.round((reservedUnits/totalUnits)*100)}%</span></span>
                <span><span className="dot available"></span> AVAL ({availableUnits}) <span className="p-val">{Math.round((availableUnits/totalUnits)*100)}%</span></span>
              </div>
            </div>
            <div className="perf-card">
              <div className="flex-between mb-1">
                <p className="perf-label">MONTHLY SALES VELOCITY</p>
                <div className="chart-legend">
                  <span><span className="dot" style={{background: '#113629'}}></span> REVENUE</span>
                  <span><span className="dot" style={{background: '#c62828'}}></span> TARGET</span>
                </div>
              </div>
              <div className="bar-chart-mock">
                <div className="bar-col"><div className="bar" style={{height:'40%'}}></div><span>JANUARY</span></div>
                <div className="bar-col"><div className="bar" style={{height:'55%'}}></div><span>FEBRUARY</span></div>
                <div className="bar-col"><div className="bar" style={{height:'50%'}}></div><span>MARCH</span></div>
                <div className="bar-col"><div className="bar" style={{height:'80%'}}></div><span>APRIL</span></div>
                <div className="bar-col"><div className="bar" style={{height:'65%'}}></div><span>MAY</span></div>
                <div className="bar-col"><div className="bar" style={{height:'95%'}}></div><span>JUNE</span></div>
              </div>
            </div>
            <div className="perf-card-stack">
              <div className="perf-card p-small">
                <p className="perf-label">AVG. PRICE PER UNIT</p>
                <h2 className="serif m-0">$2.1M</h2>
                <div className="progress-bar mt-1"><div className="progress" style={{width:'70%', background:'#113629'}}></div></div>
              </div>
              <div className="perf-card p-small">
                <p className="perf-label">TOTAL PORTFOLIO VALUE</p>
                <h2 className="serif m-0">$210.5M</h2>
                <span className="text-green text-xs">+15.2% INCREASE</span>
              </div>
              <div className="perf-card p-small">
                <p className="perf-label">CONVERSION RATE</p>
                <h2 className="serif text-blue m-0">28.4%</h2>
                <span className="text-muted text-xs">LEAD TO DEPOSIT</span>
              </div>
            </div>
          </div>

          <div className="perf-grid-bottom mt-1">
            <div className="perf-card flex-center-left">
              <div>
                <p className="perf-label">TOTAL REVENUE</p>
                <h2 className="serif m-0">$142.6M</h2>
                <span className="text-green text-xs font-bold">↗ +12.4% VS LAST QUARTER</span>
              </div>
              <div className="icon-bg ml-auto">🏛️</div>
            </div>
            <div className="perf-card flex-center-left">
              <div style={{width:'100%'}}>
                <p className="perf-label">UNITS SOLD</p>
                <h2 className="serif m-0">{soldUnits} <span className="text-muted" style={{fontSize:'1rem'}}>/ {totalUnits}</span></h2>
                <div className="progress-bar mt-1"><div className="progress" style={{width:`${(soldUnits/totalUnits)*100}%`, background: '#113629'}}></div></div>
              </div>
            </div>
            <div className="perf-card flex-center-left">
              <div>
                <p className="perf-label">AVG. SALES CYCLE</p>
                <h2 className="serif m-0">24 Days</h2>
                <span className="text-blue text-xs font-bold">◷ -4 DAYS IMPROVEMENT</span>
              </div>
              <div className="icon-bg ml-auto">⏱️</div>
            </div>
          </div>
        </div>

        <div className="widget-card">
          <div className="flex-between align-start mb-1">
            <div>
              <h3 className="serif" style={{margin:'0 0 0.25rem 0'}}>Master Occupancies Grid</h3>
              <p className="text-muted" style={{margin:0}}>Strategic architectural distribution tracking (LVL01 - LVL05)</p>
            </div>
            <div>
              <div className="phase-buttons">
                <button className="active">PHASE 1: UNITS 1-50</button>
                <button>PHASE 2: UNITS 51-100</button>
              </div>
              <div className="occ-legend mt-1 right">
                <span className="l-sold">SOLD</span>
                <span className="l-reserved">RESERVED</span>
                <span className="l-available">AVAILABLE</span>
              </div>
            </div>
          </div>
          
          <GridClient units={units} inquiries={inquiries} />

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

        <div className="widget-card">
          <div className="flex-between mb-2">
            <div>
              <h3 className="serif" style={{margin:'0 0 0.25rem 0'}}>Master Inquiry Pipeline</h3>
              <p className="text-muted" style={{margin:0}}>Unified tracking of cross-channel lead acquisition</p>
            </div>
            <div style={{display:'flex', gap:'1rem'}}>
              <div className="search-box">
                 <span className="search-icon">🔍</span>
                 <input type="text" placeholder="FILTER BY CLIENT..." className="input-search" />
              </div>
              <button className="btn-dark">EXPORT LOG</button>
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
                
              </tr>
            </thead>
            <tbody>
              {inquiries.length > 0 ? inquiries.slice(0,4).map((inq, i) => (
                <tr key={inq.id || i}>
                  <td><strong>{inq.name.toUpperCase()}</strong><br/><span className="text-muted">{inq.email} <br/> {inq.phone}</span></td>
                  <td>
                    <div className="salesman-info">
                       <div className="sm-avatar bg-blue">VS</div>
                       <div><strong>Vikram Sethi</strong></div>
                    </div>
                  </td>
                  <td><span className="source-pill">🌐 {inq.source?.toUpperCase() || 'WEBSITE PORTAL'}</span></td>
                  <td><span className={`badge ${inq.status.toLowerCase().replace(' ', '-')}`}>{inq.status}</span></td>
                  <td className="text-muted" style={{fontSize:'0.75rem'}}>{new Date(inq.created_at).toLocaleString('en-US', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</td>
                  
                </tr>
              )) : <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem'}}>No inquiries found.</td></tr>}
            </tbody>
          </table>
          <div className="text-center mt-1 pt-1 border-t">
             <a href="#" className="text-muted" style={{fontSize:'0.65rem', fontWeight:600, letterSpacing:'1px', textDecoration:'none'}}>VIEW ALL 248 INQUIRIES ⌄</a>
          </div>
        </div>

        <div className="widget-card" style={{background: 'transparent', boxShadow: 'none', padding: 0}}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
             <div>
               <h3 className="serif" style={{margin:'0 0 0.25rem 0'}}>Executive Performance Portal</h3>
               <p className="text-muted" style={{margin:0}}>Strategic overview and dashboard access for senior representatives</p>
             </div>
             <a href="#" className="text-dark" style={{fontSize:'0.7rem', fontWeight:600, textDecoration:'none', letterSpacing:'1px'}}>VIEW ALL TEAMS →</a>
           </div>
           
           <div className="exec-portal-grid">
             <div className="exec-card">
               <div className="exec-avatar" style={{backgroundImage:"url('/images/unit_interior_1777642600392.png')"}}></div>
               <h4>VIKRAM SETHI</h4>
               <p>SNR. VICE PRESIDENT</p>
               <div className="exec-rev"><span>REVENUE</span><strong>$42.4M</strong></div>
               <form action={async () => {
                 "use server";
                 const cookieStore = await cookies();
                 cookieStore.set('user_role', 'Sales', { path: '/' });
                 cookieStore.set('user_id', 'SR-9999', { path: '/' });
                 const { redirect } = await import('next/navigation');
                 redirect('/admin');
               }}>
                 <button type="submit" className="btn-outline" style={{width: '100%'}}>OPEN DASHBOARD</button>
               </form>
             </div>
             <div className="exec-card">
               <div className="exec-avatar" style={{backgroundImage:"url('/images/unit_interior_1777642600392.png')"}}></div>
               <h4>ANANYA RAO</h4>
               <p>REGIONAL DIRECTOR</p>
               <div className="exec-rev"><span>REVENUE</span><strong>$38.7M</strong></div>
               <button className="btn-outline">OPEN DASHBOARD</button>
             </div>
             <div className="exec-card">
               <div className="exec-avatar" style={{backgroundImage:"url('/images/unit_interior_1777642600392.png')"}}></div>
               <h4>KARAN MALHOTRA</h4>
               <p>SALES DIRECTOR</p>
               <div className="exec-rev"><span>REVENUE</span><strong>$29.5M</strong></div>
               <button className="btn-outline">OPEN DASHBOARD</button>
             </div>
             <div className="exec-card">
               <div className="exec-avatar" style={{backgroundImage:"url('/images/unit_interior_1777642600392.png')"}}></div>
               <h4>PRIYA SHARMA</h4>
               <p>LEAD BROKER</p>
               <div className="exec-rev"><span>REVENUE</span><strong>$18.2M</strong></div>
               <button className="btn-outline">OPEN DASHBOARD</button>
             </div>
             <div className="exec-card">
               <div className="exec-avatar" style={{backgroundImage:"url('/images/unit_interior_1777642600392.png')"}}></div>
               <h4>ROHAN VERMA</h4>
               <p>SENIOR ASSOCIATE</p>
               <div className="exec-rev"><span>REVENUE</span><strong>$12.4M</strong></div>
               <button className="btn-outline">OPEN DASHBOARD</button>
             </div>
           </div>
        </div>

        <div className="widget-card mt-2 mb-2">
           <div className="flex-between mb-1">
             <h3 className="serif" style={{margin:0}}>Recent Milestones</h3>
             <span className="text-muted">⏱</span>
           </div>
           <div className="milestone-card">
              <div className="milestone-icon">📄</div>
              <div className="milestone-info">
                 <h4 style={{margin:0, fontSize:'0.9rem'}}>Sale Finalized: Penthouse 05A</h4>
                 <p className="text-muted" style={{margin:'0.2rem 0', fontSize:'0.8rem'}}>Buyer: Singhania Family Trust • Lead Exec: Vikram Sethi</p>
                 <span className="time-ago">2 HOURS AGO</span>
              </div>
           </div>
        </div>

      </main>
    </div>
  );
}


export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value || 'Admin';
  const userId = cookieStore.get('user_id')?.value || 'Unknown';
  
  let inquiries = [];
  let units = [];
  
  try {
    const { data: iData } = await supabase.from('Inquiries').select('*').order('created_at', { ascending: false });
    if (iData) inquiries = iData;
    
    const { data: uData } = await supabase.from('PropertyUnits').select('*').order('unit_id', { ascending: true });
    if (uData) units = uData;
  } catch(e) {}
  
  if (userRole === 'Sales') {
    return <SalesView inquiries={inquiries} units={units} userId={userId} />;
  }
  
  return <AdminView inquiries={inquiries} units={units} />;
}
