"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import './unit-details.css';

export default function UnitDetailsPage({ params }) {
  // In Next.js 15, params is a Promise that needs to be unwrapped with React.use()
  const unwrappedParams = use(params);
  const unitId = unwrappedParams.id;
  
  const router = useRouter();
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [buyerDetails, setBuyerDetails] = useState(null);
  const [buyerUser, setBuyerUser] = useState(null);
  const [unitVisits, setUnitVisits] = useState([]);
  const [editForm, setEditForm] = useState({
    type: '',
    area: '',
    price: '',
    status: '',
    client_name: '',
    username: '',
    password: '',
    total_amount: '',
    amount_paid: '',
    progress: '72',
    possession_date: '2027-12-31'
  });

  useEffect(() => {
    async function fetchUnit() {
      setLoading(true);
      const { data: uData } = await supabase
        .from('PropertyUnits')
        .select('*')
        .eq('unit_id', unitId)
        .single();
        
      if (uData) {
        setUnit(uData);
        let bData = null;
        let usrData = null;
        
        if (uData.status === 'SOLD OUT' && uData.tag_color) {
          const { data: fetchB } = await supabase
            .from('BuyerDetails')
            .select('*')
            .eq('username', uData.tag_color)
            .maybeSingle();
          bData = fetchB;
          if (bData) {
            setBuyerDetails(bData);
            const { data: fetchU } = await supabase
              .from('Users')
              .select('*')
              .eq('username', uData.tag_color)
              .maybeSingle();
            usrData = fetchU;
            if (usrData) setBuyerUser(usrData);
          }
        }
        
        setEditForm({
          type: uData.type || (parseInt(uData.unit_id) % 2 === 0 ? '3BHK PENTHOUSE' : '2BHK PENTHOUSE'),
          area: uData.area || '5400',
          price: uData.price || '₹ 14,25,00,000',
          status: uData.status || 'AVAILABLE',
          client_name: uData.status === 'SOLD OUT' ? (bData?.username || uData.tag_color || '') : (uData.tag_color || ''),
          username: bData?.username || '',
          password: usrData?.password || 'password123',
          total_amount: bData?.total_amount || uData.price || '₹ 14,25,00,000',
          amount_paid: bData?.amount_paid || '₹ 0.00',
          progress: bData?.construction_progress ? bData.construction_progress.replace('%', '') : '72',
          possession_date: bData?.possession_date || '2027-12-31'
        });
      }
      
      const { data: iData } = await supabase
        .from('Inquiries')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (iData) {
        const filteredVisits = iData.filter(inq => 
          (inq.source || '').startsWith(`UNIT_ASSIGNMENT_${unitId}`) || 
          ((inq.source || '') === 'UNIT_VISIT_SCHEDULED' && inq.message?.includes(`Unit ${unitId}`))
        );
        setUnitVisits(filteredVisits);
      }
      
      setLoading(false);
    }
    fetchUnit();
  }, [unitId]);

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const oldStatus = unit?.status;
      const oldUsername = unit?.tag_color;
      const newStatus = editForm.status;
      const newClientName = editForm.client_name;
      
      // 1. Update PropertyUnits table
      const { error: unitError } = await supabase
        .from('PropertyUnits')
        .update({
          type: editForm.type,
          area: editForm.area,
          price: editForm.price,
          status: newStatus,
          tag_color: newStatus === 'SOLD OUT' ? (editForm.username || newClientName) : newClientName
        })
        .eq('unit_id', unitId);
        
      if (unitError) throw unitError;

      // 2. Handle Buyer Account transitions
      if (newStatus === 'SOLD OUT') {
        const username = editForm.username || newClientName.toLowerCase().replace(/\s+/g, '');
        const password = editForm.password || 'password123';
        const totalAmount = editForm.total_amount || editForm.price;
        const amountPaid = editForm.amount_paid || '₹ 0.00';
        // Strip % sign and parse as integer for the database column (type: integer)
        const progress = parseInt(String(editForm.progress || '72').replace('%', ''), 10) || 72;
        const possessionDate = editForm.possession_date || '2027-12-31';

        // Check if there was an old buyer with a different username
        if (oldStatus === 'SOLD OUT' && oldUsername && oldUsername !== username) {
          // Delete old user & buyer
          await supabase.from('BuyerDetails').delete().eq('username', oldUsername);
          await supabase.from('Users').delete().eq('username', oldUsername);
        }

        // Insert or update user in Users table
        const { data: existingUser } = await supabase
          .from('Users')
          .select('username')
          .eq('username', username)
          .maybeSingle();

        if (existingUser) {
          await supabase
            .from('Users')
            .update({ password })
            .eq('username', username);
        } else {
          await supabase
            .from('Users')
            .insert([{ username, password, role: 'Buyer' }]);
        }

        // Insert or update in BuyerDetails table
        const { data: existingBuyer } = await supabase
          .from('BuyerDetails')
          .select('username')
          .eq('username', username)
          .maybeSingle();

        const buyerPayload = {
          username,
          unit_id: unitId,
          total_amount: totalAmount,
          amount_paid: amountPaid,
          construction_progress: progress,
          possession_date: possessionDate,
          milestones: [
            { step: "Foundation", status: "COMPLETED" },
            { step: "Structure", status: "IN PROGRESS" },
            { step: "Finishing", status: "PENDING" },
            { step: "Handover", status: "PENDING" }
          ]
        };

        if (existingBuyer) {
          await supabase
            .from('BuyerDetails')
            .update(buyerPayload)
            .eq('username', username);
        } else {
          await supabase
            .from('BuyerDetails')
            .insert([buyerPayload]);
        }
      } else {
        // If status is NOT SOLD OUT, check if we need to clean up old buyer account
        if (oldStatus === 'SOLD OUT' && oldUsername) {
          await supabase.from('BuyerDetails').delete().eq('username', oldUsername);
          await supabase.from('Users').delete().eq('username', oldUsername);
        }
      }

      alert("Unit details and owner registration updated successfully!");
      setShowEditModal(false);
      // Refresh page
      window.location.reload();
    } catch (err) {
      alert("Error saving details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{padding: '50px', textAlign: 'center', color: '#113629'}}>Loading unit details and registers...</div>;
  }

  const displayUnit = unit || {
    unit_id: unitId,
    status: 'IN NEGOTIATION'
  };

  const getStatusColor = (status) => {
    if (status === 'SOLD OUT') return 'red';
    if (status === 'RESERVED' || status === 'IN NEGOTIATION') return 'blue';
    return 'green';
  };

  return (
    <div className="unit-details-layout">
      {/* Sidebar */}
      <aside className="ud-sidebar">
        <div className="admin-sidebar-logo" style={{padding: '2rem 1.5rem', borderBottom: '1px solid #e0dfd5'}}>
          <h2 className="serif" style={{fontSize: '1.2rem', margin: 0, color: '#113629'}}>VANYA</h2>
          <p style={{fontSize: '0.6rem', color: '#888', margin: 0, letterSpacing: '1px'}}>HERITAGE COLLECTION</p>
        </div>
        <nav className="admin-nav" style={{flex: 1, paddingTop: '2rem'}}>
          <Link href="/admin#overview" style={{padding: '1rem 1.5rem', display: 'block', color: '#555', textDecoration: 'none', fontSize: '0.85rem'}}>
            <span style={{marginRight: '0.5rem'}}>📊</span> Dashboard
          </Link>
          <Link href="/admin#portfolio" style={{padding: '1rem 1.5rem', display: 'block', color: '#555', textDecoration: 'none', fontSize: '0.85rem'}}>
            <span style={{marginRight: '0.5rem'}}>🏢</span> Inventory
          </Link>
          <Link href="/admin#leads" style={{padding: '1rem 1.5rem', display: 'block', color: '#555', textDecoration: 'none', fontSize: '0.85rem'}}>
            <span style={{marginRight: '0.5rem'}}>👥</span> Leads
          </Link>
          <Link href="/admin#analytics" style={{padding: '1rem 1.5rem', display: 'block', color: '#555', textDecoration: 'none', fontSize: '0.85rem'}}>
            <span style={{marginRight: '0.5rem'}}>📈</span> Analytics
          </Link>
        </nav>
        
        <div style={{padding: '2rem 1.5rem'}}>
          <div style={{display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem'}}>
             <div style={{width: '32px', height: '32px', borderRadius: '50%', background: '#333'}}></div>
             <div>
               <strong style={{fontSize: '0.8rem', display: 'block'}}>Vikram S.</strong>
               <span style={{fontSize: '0.6rem', color: '#888'}}>EXECUTIVE PORTAL</span>
             </div>
          </div>
          <div style={{fontSize: '0.7rem', color: '#888', marginBottom: '1rem'}}>⚙️ SETTINGS</div>
          <div style={{fontSize: '0.7rem', color: '#888'}}>❔ SUPPORT</div>
        </div>
      </aside>

      <main className="ud-main">
        {/* Hero Section */}
        <section className="ud-hero" style={{backgroundImage: "url('/images/c1.png')"}}>
           <div className="ud-hero-card">
              <div className="ud-hero-title">
                  <div className="ud-badges">
                    <span className="ud-badge">UNIT V-{displayUnit.unit_id}</span>
                    <span className="ud-badge outline">{displayUnit.type || (parseInt(displayUnit.unit_id) % 2 === 0 ? '3 BHK' : '2 BHK')} PREMIER</span>
                 </div>
                 <h1>The Vanya<br/>{displayUnit.type || (parseInt(displayUnit.unit_id) % 2 === 0 ? 'Heritage 3BHK' : 'Heritage 2BHK')}</h1>
                 <p className="ud-hero-subtitle">
                   Floor {displayUnit.floor || (displayUnit.unit_id ? displayUnit.unit_id.toString().charAt(0) : '14')}, West Wing • {displayUnit.area || (parseInt(displayUnit.unit_id) % 2 === 0 ? '2,800' : '1,950')} Sq. Ft. • Sunset Orientation
                 </p>
              </div>
              <div className="ud-hero-actions">
                 <div style={{position: 'relative', width: '100%'}}>
                   <div className="ud-status-btn" style={{cursor: 'default'}}>
                      <span className={`status-dot ${getStatusColor(displayUnit.status)}`}></span>
                      STATUS: {displayUnit.status.replace(' OUT', '')}
                   </div>
                 </div>
                 <div className="ud-btn-group" style={{width: '100%', position: 'relative'}}>
                    <button 
                       className="ud-btn-outline" 
                       style={{flex: 1, backgroundColor: '#c2a661'}}
                       onClick={() => setShowEditModal(true)}
                    >
                       ✏️ EDIT UNIT &<br/>REGISTRATION
                    </button>
                    <button 
                      className="ud-btn-outline clear" 
                      style={{flex: 1}}
                      onClick={() => {
                        const content = `VANYA RESIDENCES - UNIT ${displayUnit.unit_id} BROCHURE\n\nConfiguration: ${displayUnit.type || (parseInt(displayUnit.unit_id) % 2 === 0 ? '3 BHK' : '2 BHK')}\nArea: ${displayUnit.area || (parseInt(displayUnit.unit_id) % 2 === 0 ? '2,800' : '1,950')} Sq. Ft.\nPrice: ${displayUnit.price || 'Negotiable'}\nStatus: ${displayUnit.status}`;
                        const blob = new Blob([content], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `Vanya_Unit_${displayUnit.unit_id}_Brochure.txt`;
                        link.click();
                      }}
                    >
                      DOWNLOAD<br/>BROCHURE
                    </button>
                 </div>
              </div>
           </div>
        </section>

        {/* Content Section */}
        <section className="ud-content">
           <div className="ud-content-left">
              <h2 className="ud-section-title">Residence Specifications</h2>
              
              <div className="ud-specs-grid">
                 <div className="ud-spec-item">
                    <p>TOTAL AREA</p>
                    <h3>{displayUnit.area || (parseInt(displayUnit.unit_id) % 2 === 0 ? '2,800' : '1,950')} <span>Sq. Ft.</span></h3>
                 </div>
                 <div className="ud-spec-item">
                    <p>BASE PRICE</p>
                    <h3>{displayUnit.price || '₹ 14,25,00,000'}</h3>
                 </div>
                 <div className="ud-spec-item">
                    <p>CAR PARKS</p>
                    <h3>04 <span>Reserved</span></h3>
                 </div>
                 <div className="ud-spec-item">
                    <p>BALCONY</p>
                    <h3>780 <span>Wrap-around</span></h3>
                 </div>
                 <div className="ud-spec-item">
                    <p>FACING</p>
                    <h3>Vastu <span>Compliant</span></h3>
                 </div>
                 <div className="ud-spec-item">
                    <p>VIEW</p>
                    <h3>Aravali <span>Hills</span></h3>
                 </div>
              </div>

              <div className="ud-images-row">
                 <img src="/images/unit_interior_1777642600392.png" alt="Interior" />
                 <img src="/images/phil1_interior_1777642492374.png" alt="Layout" />
              </div>

              <div className="ud-features-box">
                 <p className="ud-features-title">KEY LUXURY FEATURES</p>
                 <div className="ud-features-grid">
                    <div className="ud-feature-item">
                       <span>☑</span>
                       Private Elevator with Biometric Access
                    </div>
                    <div className="ud-feature-item">
                       <span>☑</span>
                       Italian Marble Flooring (Statuario)
                    </div>
                    <div className="ud-feature-item">
                       <span>☑</span>
                       Automated Climate & Lighting Control
                    </div>
                    <div className="ud-feature-item">
                       <span>☑</span>
                       Chef's Kitchen with Miele Appliances
                    </div>
                    <div className="ud-feature-item">
                       <span>☑</span>
                       Standalone Soaking Tub in Master Suite
                    </div>
                    <div className="ud-feature-item">
                       <span>☑</span>
                       Triple-height Entry Foyer
                    </div>
                 </div>
              </div>

              {/* Scheduled Site Visits Log */}
              <div style={{ marginTop: '3rem', borderTop: '1px solid #eaeaea', paddingTop: '2rem' }}>
                <h3 className="serif" style={{ fontSize: '1.5rem', color: '#113629', marginBottom: '1rem' }}>Scheduled Site Visits Log</h3>
                {unitVisits.length === 0 ? (
                  <p style={{ color: '#888', fontSize: '0.85rem', fontStyle: 'italic' }}>No visits scheduled for this unit yet.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #eee', color: '#888', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '1px' }}>
                        <th style={{ padding: '0.5rem 0' }}>CLIENT NAME</th>
                        <th style={{ padding: '0.5rem' }}>PHONE</th>
                        <th style={{ padding: '0.5rem' }}>APPOINTMENT</th>
                        <th style={{ padding: '0.5rem' }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unitVisits.map((v, i) => (
                        <tr key={v.id || i} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '0.8rem 0' }}><strong>{v.name}</strong></td>
                          <td style={{ padding: '0.8rem' }}>{v.phone}</td>
                          <td style={{ padding: '0.8rem' }}>{v.message?.includes('visit on') ? v.message.split('visit on')[1] : 'Scheduled time'}</td>
                          <td style={{ padding: '0.8rem' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                              fontWeight: 'bold',
                              background: v.status?.startsWith('SCHEDULED') ? '#fef3c7' : '#ecfdf5',
                              color: v.status?.startsWith('SCHEDULED') ? '#b45309' : '#047857'
                            }}>
                              {v.status?.startsWith('SCHEDULED') ? 'UPCOMING' : 'COMPLETED'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
           </div>

           <div className="ud-content-right">
              <div className="ud-context-card">
                 <div className="ud-context-header" style={{marginBottom: '1rem'}}>
                    <h3 className="serif" style={{color: '#113629'}}>Schedule Unit Visit</h3>
                    <span style={{background:'#e8f5e9', color:'#2e7d32', padding:'4px 8px', fontSize:'0.6rem', fontWeight:600, letterSpacing:'1px'}}>ACTION REQUIRED</span>
                 </div>
                 <p style={{color: '#666', fontSize: '0.8rem', marginBottom: '1.5rem'}}>Schedule a guided on-site visit or virtual walkthrough for this specific unit.</p>
                 
                 <form onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new FormData(e.target);
                    const data = Object.fromEntries(fd);
                    
                    // Get salesman ID from cookie
                    const salesmanId = document.cookie
                      .split('; ')
                      .find(row => row.startsWith('user_id='))
                      ?.split('=')[1] || 'Unknown';

                    await fetch('/api/inquiries', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: data.client_name,
                        email: data.client_email || '',
                        phone: data.client_phone,
                        message: `Scheduled Visit for Unit ${displayUnit.unit_id} on ${data.visit_date} at ${data.visit_time}. Notes: ${data.notes}`,
                        source: 'UNIT_VISIT_SCHEDULED',
                        status: `SCHEDULED|${salesmanId}`,
                        salesman_id: salesmanId
                      })
                    });
                    alert('Visit scheduled successfully! The lead has been added to the pipeline.');
                    e.target.reset();
                  }} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                   <div>
                      <label style={{display:'block', fontSize:'0.7rem', fontWeight:'bold', color:'#888', marginBottom:'0.3rem'}}>CLIENT NAME *</label>
                      <input type="text" name="client_name" required style={{width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px'}} />
                   </div>
                   <div>
                      <label style={{display:'block', fontSize:'0.7rem', fontWeight:'bold', color:'#888', marginBottom:'0.3rem'}}>PHONE NUMBER *</label>
                      <input type="tel" name="client_phone" required style={{width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px'}} />
                   </div>
                   <div style={{display: 'flex', gap: '1rem'}}>
                     <div style={{flex: 1}}>
                        <label style={{display:'block', fontSize:'0.7rem', fontWeight:'bold', color:'#888', marginBottom:'0.3rem'}}>DATE *</label>
                        <input type="date" name="visit_date" required style={{width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px'}} />
                     </div>
                     <div style={{flex: 1}}>
                        <label style={{display:'block', fontSize:'0.7rem', fontWeight:'bold', color:'#888', marginBottom:'0.3rem'}}>TIME *</label>
                        <input type="time" name="visit_time" required style={{width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px'}} />
                     </div>
                   </div>
                   <div>
                      <label style={{display:'block', fontSize:'0.7rem', fontWeight:'bold', color:'#888', marginBottom:'0.3rem'}}>ADDITIONAL NOTES</label>
                      <textarea name="notes" rows="3" style={{width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', resize: 'none'}}></textarea>
                   </div>
                   <button type="submit" className="ud-action-btn" style={{marginTop: '0.5rem', cursor: 'pointer', background: '#113629', color: 'white', border: 'none', padding: '1rem', width: '100%', borderRadius: '4px', fontWeight: 'bold', letterSpacing: '1px'}}>
                      CONFIRM SCHEDULE
                   </button>
                 </form>
              </div>
           </div>
        </section>
        
        <div style={{textAlign: 'center', padding: '4rem', borderTop: '1px solid #eee', color: '#888', fontSize: '0.65rem'}}>
          <h2 className="serif" style={{color: '#113629', fontSize: '1rem', letterSpacing: '2px', marginBottom: '1rem'}}>VANYA RESIDENCES</h2>
          <div style={{display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px'}}>
            <span>PRIVACY POLICY</span>
            <span>RERA DISCLOSURE</span>
            <span>SUSTAINABILITY</span>
          </div>
          <p>© 2026 VANYA RESIDENCES. ALL RIGHTS RESERVED.</p>
        </div>

        {showEditModal && (
          <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
            <div style={{background: 'white', padding: '2.5rem', width: '100%', maxWidth: '500px', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid #eee', position: 'relative', maxHeight: '90vh', overflowY: 'auto'}}>
              <button onClick={() => setShowEditModal(false)} style={{position: 'absolute', top: '1rem', right: '1.5rem', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888'}}>&times;</button>
              <h2 className="serif" style={{color: '#113629', marginBottom: '0.5rem', fontSize: '1.6rem'}}>Edit Unit & Owner Details</h2>
              <p style={{color: '#888', fontSize: '0.78rem', marginBottom: '1.5rem'}}>Modify unit specifications and update ownership credentials.</p>
              
              <form onSubmit={handleSaveDetails} style={{display: 'flex', flexDirection: 'column', gap: '0.8rem'}}>
                <div>
                  <label style={{display: 'block', fontSize: '0.65rem', fontWeight: 'bold', color: '#888', marginBottom: '0.3rem'}}>UNIT DESIGN / BHK *</label>
                  <input 
                    type="text" 
                    required 
                    value={editForm.type} 
                    onChange={e => setEditForm({ ...editForm, type: e.target.value })} 
                    style={{width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem'}} 
                  />
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div>
                    <label style={{display: 'block', fontSize: '0.65rem', fontWeight: 'bold', color: '#888', marginBottom: '0.3rem'}}>AREA (SQ. FT.) *</label>
                    <input 
                      type="text" 
                      required 
                      value={editForm.area} 
                      onChange={e => setEditForm({ ...editForm, area: e.target.value })} 
                      style={{width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem'}} 
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '0.65rem', fontWeight: 'bold', color: '#888', marginBottom: '0.3rem'}}>UNIT BASE PRICE *</label>
                    <input 
                      type="text" 
                      required 
                      value={editForm.price} 
                      onChange={e => setEditForm({ ...editForm, price: e.target.value })} 
                      style={{width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem'}} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{display: 'block', fontSize: '0.65rem', fontWeight: 'bold', color: '#888', marginBottom: '0.3rem'}}>UNIT STATUS *</label>
                  <select 
                    value={editForm.status} 
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })} 
                    style={{width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem', background: 'white'}}
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="IN NEGOTIATION">IN NEGOTIATION</option>
                    <option value="RESERVED">RESERVED</option>
                    <option value="SOLD OUT">SOLD OUT</option>
                  </select>
                </div>

                <div>
                  <label style={{display: 'block', fontSize: '0.65rem', fontWeight: 'bold', color: '#888', marginBottom: '0.3rem'}}>CLIENT / OWNER FULL NAME</label>
                  <input 
                    type="text" 
                    value={editForm.client_name} 
                    onChange={e => setEditForm({ ...editForm, client_name: e.target.value })} 
                    style={{width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem'}} 
                  />
                </div>

                {editForm.status === 'SOLD OUT' && (
                  <div style={{marginTop: '1rem', borderTop: '1px dashed #ddd', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem'}}>
                    <h3 style={{fontSize: '0.85rem', color: '#113629', margin: '0 0 0.5rem 0'}}>Buyer Login & Details</h3>
                    
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                      <div>
                        <label style={{display: 'block', fontSize: '0.65rem', fontWeight: 'bold', color: '#888', marginBottom: '0.3rem'}}>PORTAL USERNAME *</label>
                        <input 
                          type="text" 
                          required 
                          value={editForm.username} 
                          onChange={e => setEditForm({ ...editForm, username: e.target.value })} 
                          style={{width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem'}} 
                        />
                      </div>
                      <div>
                        <label style={{display: 'block', fontSize: '0.65rem', fontWeight: 'bold', color: '#888', marginBottom: '0.3rem'}}>PORTAL PASSWORD *</label>
                        <input 
                          type="text" 
                          required 
                          value={editForm.password} 
                          onChange={e => setEditForm({ ...editForm, password: e.target.value })} 
                          style={{width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem'}} 
                        />
                      </div>
                    </div>

                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                      <div>
                        <label style={{display: 'block', fontSize: '0.65rem', fontWeight: 'bold', color: '#888', marginBottom: '0.3rem'}}>TOTAL PRICE *</label>
                        <input 
                          type="text" 
                          required 
                          value={editForm.total_amount} 
                          onChange={e => setEditForm({ ...editForm, total_amount: e.target.value })} 
                          style={{width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem'}} 
                        />
                      </div>
                      <div>
                        <label style={{display: 'block', fontSize: '0.65rem', fontWeight: 'bold', color: '#888', marginBottom: '0.3rem'}}>AMOUNT PAID *</label>
                        <input 
                          type="text" 
                          required 
                          value={editForm.amount_paid} 
                          onChange={e => setEditForm({ ...editForm, amount_paid: e.target.value })} 
                          style={{width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem'}} 
                        />
                      </div>
                    </div>

                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                      <div>
                        <label style={{display: 'block', fontSize: '0.65rem', fontWeight: 'bold', color: '#888', marginBottom: '0.3rem'}}>POSSESSION DATE</label>
                        <input 
                          type="date" 
                          value={editForm.possession_date} 
                          onChange={e => setEditForm({ ...editForm, possession_date: e.target.value })} 
                          style={{width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem'}} 
                        />
                      </div>
                      <div>
                        <label style={{display: 'block', fontSize: '0.65rem', fontWeight: 'bold', color: '#888', marginBottom: '0.3rem'}}>CONSTRUCTION %</label>
                        <input 
                          type="number" 
                          min="0" 
                          max="100" 
                          value={editForm.progress} 
                          onChange={e => setEditForm({ ...editForm, progress: e.target.value })} 
                          style={{width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem'}} 
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button type="submit" style={{background: '#113629', color: 'white', border: 'none', padding: '0.8rem', fontSize: '0.8rem', letterSpacing: '2px', cursor: 'pointer', marginTop: '0.5rem', fontWeight: 'bold', borderRadius: '4px'}}>
                  SAVE CHANGES
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}