import "./admin.css";
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import Link from 'next/link';
import PortfolioTable from './PortfolioTable';
import GridClient from './GridClient';
import InquiryPipelineClient from './InquiryPipelineClient';
import SalesmanNewInquiryClient from './SalesmanNewInquiryClient';
import AdminAddBuyerClient from './AdminAddBuyerClient';
import BuyerPaymentClient from './BuyerPaymentClient';
import AdminUpdateBuyerClient from './AdminUpdateBuyerClient';

function SalesView({ inquiries, units, userId }) {
  // Generate grid levels 1-10 validation
  const validUnits = units.filter(u => {
    const id = parseInt(u.unit_id);
    const floor = Math.floor(id / 100);
    return floor >= 1 && floor <= 10 && (id % 100) >= 1 && (id % 100) <= 10;
  });

  // Assign distinct 20 flats to each salesman
  let assignedUnits = [];
  if (userId === 'SR-9999') {
    assignedUnits = validUnits.filter(u => ['1', '2'].includes(u.floor));
  } else if (userId === 'SR-1111') {
    assignedUnits = validUnits.filter(u => ['3', '4'].includes(u.floor));
  } else if (userId === 'SR-2222') {
    assignedUnits = validUnits.filter(u => ['5', '6'].includes(u.floor));
  } else if (userId === 'SR-3333') {
    assignedUnits = validUnits.filter(u => ['7', '8'].includes(u.floor));
  } else if (userId === 'SR-4444') {
    assignedUnits = validUnits.filter(u => ['9', '10'].includes(u.floor));
  } else {
    assignedUnits = validUnits.slice(0, 20); // Fallback
  }
  const totalAssigned = assignedUnits.length;
  const soldUnits = assignedUnits.filter(u => u.status === 'SOLD OUT').length;
  const inNegotiation = assignedUnits.filter(u => u.status === 'IN NEGOTIATION' || u.status === 'RESERVED').length;
  const availableUnits = assignedUnits.filter(u => u.status === 'AVAILABLE').length;

  const salesmanNames = {
    'SR-9999': 'Vikram Sethi',
    'SR-1111': 'Ananya Rao',
    'SR-2222': 'Karan Malhotra',
    'SR-3333': 'Priya Sharma',
    'SR-4444': 'Rohan Verma'
  };

  // Filter inquiries assigned to this salesman
  const visibleInquiries = inquiries.filter(inq => {
    if (!inq.status) return false;
    const parts = inq.status.split('|');
    return parts.length > 1 && parts[1] === userId;
  });

  return (
    <div className="sales-layout">
      <aside className="sales-sidebar">
        <div className="sales-sidebar-logo">
          <h2>EXECUTIVE PORTAL</h2>
          <p>VANYA RESIDENCES</p>
        </div>
        <div className="sales-profile mt-2 mb-2">
          <div className="sales-avatar">VS</div>
          <div>
            <strong>{salesmanNames[userId] || 'Executive'}</strong>
            <span className="text-muted" style={{display:'block', fontSize:'0.75rem', marginTop:'0.2rem'}}>ID: {userId}</span>
          </div>
        </div>
        <nav className="sales-nav">
          <a href="#" className="active">Overview</a>
          <a href="#">My Portfolio</a>
          <a href="#">Active Leads <span className="badge-count">{visibleInquiries.length}</span></a>
          <a href="#">Client Messages</a>
        </nav>
        
        <div className="sales-bottom mt-auto">
          <SalesmanNewInquiryClient userId={userId} />
          <form action={async () => {
             "use server";
             const cookieStore = await cookies();
             cookieStore.delete('user_role');
             cookieStore.delete('user_id');
             const { redirect } = await import('next/navigation');
             redirect('/');
          }}>
            <button type="submit" className="btn-outline mt-1" style={{width: '100%'}}>LOGOUT</button>
          </form>
        </div>
      </aside>

      <main className="sales-main">
        <div className="sales-hero">
          <div className="hero-greeting-box">
            <h1 className="serif">Namaste, {salesmanNames[userId]?.split(' ')[0] || 'Executive'}</h1>
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
              <h2 className="c-sold">{soldUnits}</h2>
            </div>
            <div className="sales-stat-card">
              <span>IN NEGOTIATION</span>
              <h2 className="text-blue">{inNegotiation}</h2>
            </div>
            <div className="sales-stat-card">
              <span>PENDING LEADS</span>
              <h2>{visibleInquiries.length}</h2>
            </div>
          </div>

          <div className="widget-card mb-2">
            <h3 className="section-title serif">Portfolio Inventory</h3>
            <PortfolioTable assignedUnits={assignedUnits} />
          </div>

        <div className="sales-grid">
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
                {visibleInquiries.length > 0 ? visibleInquiries.map((inq, i) => {
                  let city = "UNKNOWN LOCATION";
                  if (inq.message) {
                    const match = inq.message.match(/Pincode:\s*(\d{6})/i);
                    if (match) {
                      const pin = match[1];
                      if (pin.startsWith('11')) city = 'NEW DELHI';
                      else if (pin.startsWith('40')) city = 'MUMBAI';
                      else if (pin.startsWith('56')) city = 'BANGALORE';
                      else if (pin.startsWith('50')) city = 'HYDERABAD';
                      else if (pin.startsWith('60')) city = 'CHENNAI';
                      else if (pin.startsWith('70')) city = 'KOLKATA';
                      else if (pin.startsWith('41')) city = 'PUNE';
                      else if (pin.startsWith('38')) city = 'AHMEDABAD';
                      else city = `PIN: ${pin}`;
                    }
                  }
                  
                  return (
                  <tr key={inq.id || i}>
                    <td><strong>{inq.name}</strong><br/><span className="text-muted">{city}</span></td>
                    <td className="text-muted">📞 {inq.phone}<br/>✉️ {inq.email}</td>
                    <td><span style={{background: '#f5f5f5', padding: '4px 8px', fontSize: '0.65rem'}}>{inq.source?.replace(/_.*/, '')}</span></td>
                    <td className="text-muted">{new Date(inq.created_at).toLocaleDateString()}</td>
                   
                  </tr>
                )}) : <tr><td colSpan="5">No active leads.</td></tr>}
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
        </div>
      </main>
    </div>
  );
}


function BuyerView({ userId, buyerDetails }) {
  const milestones = buyerDetails?.milestones || [
    { step: "Foundation", status: "COMPLETED" },
    { step: "Structure", status: "IN PROGRESS" },
    { step: "Finishing", status: "PENDING" },
    { step: "Handover", status: "PENDING" }
  ];

  return (
    <div className="admin-layout" style={{background: '#fcfcfc'}}>

      <aside className="admin-sidebar" style={{background: '#113629'}}>
        <div className="admin-sidebar-logo">
          <h2 className="serif" style={{color: 'white'}}>MY VANYA</h2>
          <p style={{color: 'rgba(255,255,255,0.6)'}}>OWNER PORTAL</p>
        </div>
        <nav className="admin-nav">
          <a href="#" className="active" style={{color: '#fff', background: 'rgba(255,255,255,0.1)'}}><span className="nav-icon">🏠</span> Residence Overview</a>
          <a href="#" style={{color: 'rgba(255,255,255,0.6)'}}><span className="nav-icon">🏗️</span> Construction Log</a>
          <a href="#" style={{color: 'rgba(255,255,255,0.6)'}}><span className="nav-icon">💳</span> Financials</a>
          <a href="#" style={{color: 'rgba(255,255,255,0.6)'}}><span className="nav-icon">📂</span> Documents</a>
        </nav>
        
        <div className="admin-user mt-auto" style={{
          borderTop: '1px solid rgba(255,255,255,0.1)', 
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div className="admin-avatar" style={{
            background: '#c9a96e', 
            color: '#fff', 
            fontWeight: 'bold',
            flexShrink: 0,
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%'
          }}>{userId?.charAt(0).toUpperCase()}</div>
          <div style={{display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
            <strong style={{
              color: 'white', 
              fontSize: '0.9rem', 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              display: 'block'
            }}>{userId}</strong>
            <span style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem', letterSpacing: '0.5px'}}>RESIDENT OWNER</span>
          </div>
        </div>
        <form action={async () => {
           "use server";
           const cookieStore = await cookies();
           cookieStore.delete('user_role');
           cookieStore.delete('user_id');
           const { redirect } = await import('next/navigation');
           redirect('/');
        }}>
          <button type="submit" className="btn-outline mt-1" style={{width: '90%', margin: '0 auto 1.5rem auto', borderColor: 'rgba(255,255,255,0.2)', color: '#fff'}}>LOGOUT</button>
        </form>
      </aside>

      <main className="admin-main" style={{padding: '2rem 3rem'}}>
        <div className="admin-header" style={{background: 'transparent', border: 'none', padding: 0, marginBottom: '2.5rem'}}>
          <div>
            <h1 className="serif" style={{fontSize: '2.4rem'}}>Welcome to Vanya, {userId}</h1>
            <p className="text-muted" style={{fontSize: '0.8rem', letterSpacing: '1px'}}>UNIT {buyerDetails?.unit_id || '101'} • HERITAGE COLLECTION • TOWER A</p>
          </div>
          <div style={{display: 'flex', gap: '1.5rem', alignItems: 'center'}}>
             <div style={{textAlign: 'right'}}>
                <p className="text-muted" style={{fontSize: '0.65rem', marginBottom: '0.2rem'}}>ESTIMATED POSSESSION</p>
                <strong style={{color: '#113629'}}>{buyerDetails?.possession_date || 'DECEMBER 2027'}</strong>
             </div>
             <span className="icon-bell" style={{fontSize: '1.2rem'}}>🔔</span>
          </div>
        </div>

        <div className="grid-2">
          {/* Construction Progress Card */}
          <div className="widget-card" style={{padding: '0', overflow: 'hidden'}}>
            <div style={{
              backgroundImage: "url('/images/uc1.png')",
              height: '240px',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(to top, rgba(17,54,41,0.9) 0%, transparent 70%)'
              }}></div>
              <div style={{position: 'absolute', bottom: '1.5rem', left: '2rem', color: '#fff'}}>
                <span className="badge" style={{background: '#c9a96e', color: '#fff', marginBottom: '0.5rem'}}>SITE UPDATE: MAY 2026</span>
                <h3 className="serif" style={{margin: 0, fontSize: '1.4rem'}}>Tower A: Structural Phase</h3>
              </div>
            </div>
            
            <div style={{padding: '2rem'}}>
              <div className="flex-between" style={{marginBottom: '0.5rem'}}>
                <h4 className="serif" style={{fontSize: '1.1rem'}}>Global Project Progress</h4>
                <span style={{fontWeight: '700', color: '#113629'}}>{buyerDetails?.construction_progress || 35}%</span>
              </div>
              <div style={{background: '#f0f0f0', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '1.5rem'}}>
                <div style={{background: '#113629', width: `${buyerDetails?.construction_progress || 35}%`, height: '100%', borderRadius: '4px'}}></div>
              </div>
              
              <div className="milestones-list" style={{borderTop: '1px solid #f0f0f0', paddingTop: '1.5rem'}}>
                {milestones.map((m, i) => (
                  <div key={i} className="flex-between" style={{marginBottom: '0.8rem', opacity: m.status === 'PENDING' ? 0.4 : 1}}>
                    <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%', 
                        background: m.status === 'COMPLETED' ? '#113629' : m.status === 'IN PROGRESS' ? '#c9a96e' : '#eee',
                        display: 'flex', alignItems: 'center', justifyCenter: 'center', color: '#fff', fontSize: '0.7rem'
                      }}>
                        {m.status === 'COMPLETED' ? '✓' : ''}
                      </div>
                      <span style={{fontSize: '0.85rem', fontWeight: 500}}>{m.step}</span>
                    </div>
                    <span style={{fontSize: '0.65rem', fontWeight: 700, color: m.status === 'IN PROGRESS' ? '#c9a96e' : '#777'}}>{m.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-column" style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            {/* Financial Card */}
            <div className="widget-card" style={{margin: 0}}>
              <div className="flex-between mb-2">
                <h3 className="serif">Financial Summary</h3>
                <span className="text-muted">💳</span>
              </div>
              <div className="flex-between" style={{alignItems: 'flex-end', marginBottom: '1.5rem'}}>
                <div>
                  <p className="text-muted" style={{fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem'}}>OWNERSHIP VALUE</p>
                  <h2 className="serif" style={{margin: 0, fontSize: '2rem'}}>{buyerDetails?.total_amount || '₹ 14.25 Cr'}</h2>
                </div>
                <div style={{textAlign: 'right'}}>
                  <p className="text-muted" style={{fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem'}}>EQUITY PAID</p>
                  <h3 className="serif" style={{margin: 0, color: '#2e7d32'}}>{buyerDetails?.amount_paid || '₹ 5.00 Cr'}</h3>
                </div>
              </div>
              
              <div style={{background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #edf2f7'}}>
                <div className="flex-between">
                   <span style={{fontSize: '0.8rem', fontWeight: 600}}>Next Scheduled Payment</span>
                   <span className="badge" style={{background: '#fff3e0', color: '#ef6c00'}}>DUE IN 12 DAYS</span>
                </div>
                <div className="flex-between mt-1">
                   <h3 className="serif" style={{margin: 0}}>₹ 1.25 Cr</h3>
                   <span className="text-muted" style={{fontSize: '0.75rem'}}>{buyerDetails?.next_payment_date || 'June 15, 2026'}</span>
                </div>
              </div>
              <BuyerPaymentClient unitId={buyerDetails?.unit_id || '101'} amountDue="₹ 1.25 Cr" />
            </div>

            <div className="widget-card" style={{margin: 0, flex: 1}}>
              <h3 className="serif mb-2">Essential Documents</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <div className="flex-between" style={{padding: '1rem', border: '1px solid #f0f0f0', borderRadius: '10px'}}>
                  <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                    <span style={{fontSize: '1.5rem'}}>📄</span>
                    <div>
                      <p style={{margin: 0, fontSize: '0.85rem', fontWeight: 600}}>Registered Sale Agreement</p>
                      <span className="text-muted" style={{fontSize: '0.7rem'}}>PDF • 4.2 MB</span>
                    </div>
                  </div>
                  <a href="/sale_agreement.pdf" download="Vanya_Sale_Agreement.pdf" className="text-blue" style={{textDecoration: 'none', fontWeight: 700}}>DOWNLOAD</a>
                </div>
                <div className="flex-between" style={{padding: '1rem', border: '1px solid #f0f0f0', borderRadius: '10px'}}>
                  <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                    <span style={{fontSize: '1.5rem'}}>🏗️</span>
                    <div>
                      <p style={{margin: 0, fontSize: '0.85rem', fontWeight: 600}}>Unit Specification & Floor Plan</p>
                      <span className="text-muted" style={{fontSize: '0.7rem'}}>PDF • 2.1 MB</span>
                    </div>
                  </div>
                  <a href="/floor_plan.pdf" download="Vanya_Floor_Plan.pdf" className="text-blue" style={{textDecoration: 'none', fontWeight: 700}}>DOWNLOAD</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


function AdminView({ inquiries, units, buyers }) {
  
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
          <a href="#pipeline">
            <span className="nav-icon">👥</span> Leads
          </a>
          <a href="#buyers">
            <span className="nav-icon">🔐</span> Buyers
          </a>
          <a href="#analytics">
            <span className="nav-icon">📈</span> Analytics
          </a>
          <a href="#">
            <span className="nav-icon">⚙️</span> Settings
          </a>
        </nav>
        
        <div className="admin-user mt-auto" style={{
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          borderTop: '1px solid #f0f0f0'
        }}>
          <div className="admin-avatar" style={{
            background: 'var(--vanya-green)',
            color: '#fff',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            fontWeight: 'bold',
            flexShrink: 0
          }}>A</div>
          <div style={{display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
            <strong style={{
              fontSize: '0.9rem', 
              color: '#111',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>Admin Portal</strong>
            <span style={{fontSize: '0.65rem', color: '#b0b8c4'}}>SYSTEM EXECUTIVE</span>
          </div>
        </div>
        <button className="btn-dark mt-2" style={{width: '100%'}}>NEW INQUIRY</button>
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

        <div id="analytics">
          <GridClient units={units} inquiries={inquiries} />
        </div>

        <div id="buyers" className="widget-card mt-2">
           <div className="flex-between mb-2">
             <div>
               <h3 className="serif" style={{margin:0}}>Buyer Portal Management</h3>
               <p className="text-muted" style={{margin:0}}>Update construction progress and financial records for owners</p>
             </div>
             <div style={{display:'flex', gap:'1rem'}}>
               <div className="search-box">
                 <span className="search-icon">🔍</span>
                 <input className="input-search" placeholder="Search Buyers..." style={{width: '180px'}} />
               </div>
               <AdminAddBuyerClient />
             </div>
           </div>
           <table className="table-standard">
             <thead>
               <tr>
                 <th>BUYER NAME</th>
                 <th>UNIT ID</th>
                 <th>PROGRESS</th>
                 <th>TOTAL DUE</th>
                 <th>PAID</th>
                 <th>ACTIONS</th>
               </tr>
             </thead>
             <tbody>
               {buyers?.length > 0 ? buyers.map((b, i) => (
                 <tr key={i}>
                   <td><strong>{b.username}</strong></td>
                   <td>{b.unit_id}</td>
                   <td>
                     <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                       <div style={{width:'50px', background:'#eee', height:'4px'}}>
                         <div style={{width:`${b.construction_progress}%`, background:'#113629', height:'100%'}}></div>
                       </div>
                       <span style={{fontSize:'0.7rem'}}>{b.construction_progress}%</span>
                     </div>
                   </td>
                   <td>{b.total_amount}</td>
                   <td>{b.amount_paid}</td>
                   <td>
                     <AdminUpdateBuyerClient buyer={b} />
                   </td>
                 </tr>
               )) : (
                 <tr>
                   <td colSpan="6" style={{textAlign:'center', padding:'2rem'}} className="text-muted">No buyer accounts active. Add your first buyer to enable the Owner Portal.</td>
                 </tr>
               )}
             </tbody>
           </table>
        </div>

        <div id="pipeline" className="mt-2">
          <InquiryPipelineClient inquiries={inquiries} />
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
               <form action={async () => {
                 "use server";
                 const cookieStore = await cookies();
                 cookieStore.set('user_role', 'Sales', { path: '/' });
                 cookieStore.set('user_id', 'SR-1111', { path: '/' });
                 const { redirect } = await import('next/navigation');
                 redirect('/admin');
               }}>
                 <button type="submit" className="btn-outline" style={{width: '100%'}}>OPEN DASHBOARD</button>
               </form>
             </div>
             <div className="exec-card">
               <div className="exec-avatar" style={{backgroundImage:"url('/images/unit_interior_1777642600392.png')"}}></div>
               <h4>KARAN MALHOTRA</h4>
               <p>SALES DIRECTOR</p>
               <div className="exec-rev"><span>REVENUE</span><strong>$29.5M</strong></div>
               <form action={async () => {
                 "use server";
                 const cookieStore = await cookies();
                 cookieStore.set('user_role', 'Sales', { path: '/' });
                 cookieStore.set('user_id', 'SR-2222', { path: '/' });
                 const { redirect } = await import('next/navigation');
                 redirect('/admin');
               }}>
                 <button type="submit" className="btn-outline" style={{width: '100%'}}>OPEN DASHBOARD</button>
               </form>
             </div>
             <div className="exec-card">
               <div className="exec-avatar" style={{backgroundImage:"url('/images/unit_interior_1777642600392.png')"}}></div>
               <h4>PRIYA SHARMA</h4>
               <p>LEAD BROKER</p>
               <div className="exec-rev"><span>REVENUE</span><strong>$18.2M</strong></div>
               <form action={async () => {
                 "use server";
                 const cookieStore = await cookies();
                 cookieStore.set('user_role', 'Sales', { path: '/' });
                 cookieStore.set('user_id', 'SR-3333', { path: '/' });
                 const { redirect } = await import('next/navigation');
                 redirect('/admin');
               }}>
                 <button type="submit" className="btn-outline" style={{width: '100%'}}>OPEN DASHBOARD</button>
               </form>
             </div>
             <div className="exec-card">
               <div className="exec-avatar" style={{backgroundImage:"url('/images/unit_interior_1777642600392.png')"}}></div>
               <h4>ROHAN VERMA</h4>
               <p>SENIOR ASSOCIATE</p>
               <div className="exec-rev"><span>REVENUE</span><strong>$12.4M</strong></div>
               <form action={async () => {
                 "use server";
                 const cookieStore = await cookies();
                 cookieStore.set('user_role', 'Sales', { path: '/' });
                 cookieStore.set('user_id', 'SR-4444', { path: '/' });
                 const { redirect } = await import('next/navigation');
                 redirect('/admin');
               }}>
                 <button type="submit" className="btn-outline" style={{width: '100%'}}>OPEN DASHBOARD</button>
               </form>
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
  let buyers = [];
  let currentBuyer = null;
  
  try {
    const { data: iData } = await supabase.from('Inquiries').select('*').order('created_at', { ascending: false });
    if (iData) inquiries = iData;
    
    const { data: uData } = await supabase.from('PropertyUnits').select('*').order('unit_id', { ascending: true });
    if (uData) units = uData;

    const { data: bData } = await supabase.from('BuyerDetails').select('*');
    if (bData) buyers = bData;

    if (userRole === 'Buyer') {
      currentBuyer = buyers.find(b => b.username === userId);
    }
  } catch(e) {}
  
  if (userRole === 'Sales') {
    return <SalesView inquiries={inquiries} units={units} userId={userId} />;
  }

  if (userRole === 'Buyer') {
    return <BuyerView userId={userId} buyerDetails={currentBuyer} />;
  }
  
  return <AdminView inquiries={inquiries} units={units} buyers={buyers} />;
}
