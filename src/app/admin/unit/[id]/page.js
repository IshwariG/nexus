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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    async function fetchUnit() {
      const { data, error } = await supabase
        .from('PropertyUnits')
        .select('*')
        .eq('unit_id', unitId)
        .single();
        
      if (data) setUnit(data);
      setLoading(false);
    }
    fetchUnit();
  }, [unitId]);

  const [showClientModal, setShowClientModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');
  
  const updateStatus = async (newStatus) => {
    if (newStatus === 'SOLD OUT' || newStatus === 'IN NEGOTIATION' || newStatus === 'RESERVED') {
      setPendingStatus(newStatus);
      setShowClientModal(true);
      setIsDropdownOpen(false);
      return;
    }

    // Optimistic update for AVAILABLE
    setUnit(prev => ({ ...prev, status: newStatus, tag_color: '' }));
    setIsDropdownOpen(false);
    
    // Database update
    const { error } = await supabase
      .from('PropertyUnits')
      .update({ status: newStatus, tag_color: '' })
      .eq('unit_id', unitId);
      
    if (error) {
      alert("Error updating status: " + error.message);
    } else {
      router.refresh();
    }
  };

  const submitClientDetails = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Save to Inquiries as a side-channel to store full client details
    await fetch('/api/inquiries', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        message: `Address: ${data.address}, Pincode: ${data.pincode}, Aadhaar: ${data.aadhaar}, Unit Type: ${data.unit_type}`,
        source: `UNIT_ASSIGNMENT_${unitId}`
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    // Optimistic update
    setUnit(prev => ({ ...prev, status: pendingStatus, tag_color: data.name }));
    setShowClientModal(false);
    
    // Database update PropertyUnits
    const { error } = await supabase
      .from('PropertyUnits')
      .update({ status: pendingStatus, tag_color: data.name })
      .eq('unit_id', unitId);
      
    if (error) {
      alert("Error updating status: " + error.message);
    } else {
      router.refresh();
    }
  };

  if (loading) {
    return <div style={{padding: '50px', textAlign: 'center'}}>Loading unit details...</div>;
  }

  // Fallback if not found
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
          <Link href="/admin" style={{padding: '1rem 1.5rem', display: 'block', color: '#555', textDecoration: 'none', fontSize: '0.85rem'}}>
            <span style={{marginRight: '0.5rem'}}>📊</span> Dashboard
          </Link>
          <Link href="/inventory" style={{padding: '1rem 1.5rem', display: 'block', background: '#113629', color: 'white', textDecoration: 'none', fontSize: '0.85rem'}}>
            <span style={{marginRight: '0.5rem'}}>🏢</span> Inventory
          </Link>
          <a href="#" style={{padding: '1rem 1.5rem', display: 'block', color: '#555', textDecoration: 'none', fontSize: '0.85rem'}}>
            <span style={{marginRight: '0.5rem'}}>👥</span> Leads
          </a>
          <a href="#" style={{padding: '1rem 1.5rem', display: 'block', color: '#555', textDecoration: 'none', fontSize: '0.85rem'}}>
            <span style={{marginRight: '0.5rem'}}>📈</span> Analytics
          </a>
          <a href="#" style={{padding: '1rem 1.5rem', display: 'block', color: '#555', textDecoration: 'none', fontSize: '0.85rem'}}>
            <span style={{marginRight: '0.5rem'}}>💳</span> Payments
          </a>
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
                    <span className="ud-badge outline">{displayUnit.type || 'LUXURY APARTMENT'}</span>
                 </div>
                 <h1>The Amaranta<br/>Sky-Villa</h1>
                 <p className="ud-hero-subtitle">
                   Floor {displayUnit.unit_id ? displayUnit.unit_id.toString().charAt(0) : '14'}, West Wing • 5,400 Sq. Ft. • Sunset Orientation
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
                       style={{flex: 1}}
                       onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                       UPDATE<br/>STATUS
                    </button>
                    {isDropdownOpen && (
                      <div className="ud-status-dropdown" style={{display: 'flex', top: '100%', left: 0, width: '50%'}}>
                        <div className="ud-dropdown-item" onClick={() => updateStatus('AVAILABLE')}>AVAILABLE</div>
                        <div className="ud-dropdown-item" onClick={() => updateStatus('IN NEGOTIATION')}>IN NEGOTIATION</div>
                        <div className="ud-dropdown-item" onClick={() => updateStatus('SOLD OUT')}>SOLD OUT</div>
                      </div>
                    )}
                    <button className="ud-btn-outline clear" style={{flex: 1}}>DOWNLOAD<br/>BROCHURE</button>
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
                    <h3>5,400 <span>Sq. Ft.</span></h3>
                 </div>
                 <div className="ud-spec-item">
                    <p>CEILING HEIGHT</p>
                    <h3>12.5 <span>Feet</span></h3>
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
                   await fetch('/api/inquiries', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({
                       name: data.client_name,
                       email: data.client_email || '',
                       phone: data.client_phone,
                       message: `Scheduled Visit for Unit ${displayUnit.unit_id} on ${data.visit_date} at ${data.visit_time}. Notes: ${data.notes}`,
                       source: 'UNIT_VISIT_SCHEDULED'
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

        {showClientModal && (
          <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
            <div style={{background: 'white', padding: '3rem', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.05)', border: '1px solid #eee', position: 'relative'}}>
              <button onClick={() => setShowClientModal(false)} style={{position: 'absolute', top: '1rem', right: '1.5rem', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888'}}>&times;</button>
              <h2 className="serif" style={{color: '#113629', marginBottom: '0.5rem', fontSize: '1.8rem'}}>Client Registration</h2>
              <p style={{color: '#888', fontSize: '0.8rem', marginBottom: '2rem', letterSpacing: '0.5px'}}>Complete the mandatory assignment details to update the Master Occupancy Grid.</p>
              
              <form onSubmit={submitClientDetails} style={{display: 'flex', flexDirection: 'column', gap: '0.8rem'}}>
  <div>
    <label style={{display: 'block', fontSize: '0.7rem', letterSpacing: '1px', color: '#888', marginBottom: '0.3rem'}}>FULL NAME *</label>
    <input type="text" name="name" required style={{width: '100%', padding: '0.4rem 0', border: 'none', borderBottom: '1px solid #ddd', fontSize: '1rem', outline: 'none'}} />
  </div>
  <div>
    <label style={{display: 'block', fontSize: '0.7rem', letterSpacing: '1px', color: '#888', marginBottom: '0.3rem'}}>PHONE NUMBER *</label>
    <input type="tel" name="phone" required style={{width: '100%', padding: '0.4rem 0', border: 'none', borderBottom: '1px solid #ddd', fontSize: '1rem', outline: 'none'}} />
  </div>
  <div>
    <label style={{display: 'block', fontSize: '0.7rem', letterSpacing: '1px', color: '#888', marginBottom: '0.3rem'}}>AADHAAR NUMBER *</label>
    <input type="text" name="aadhaar" required style={{width: '100%', padding: '0.4rem 0', border: 'none', borderBottom: '1px solid #ddd', fontSize: '1rem', outline: 'none'}} />
  </div>
  <div>
    <label style={{display: 'block', fontSize: '0.7rem', letterSpacing: '1px', color: '#888', marginBottom: '0.3rem'}}>RESIDENTIAL ADDRESS *</label>
    <input type="text" name="address" required style={{width: '100%', padding: '0.4rem 0', border: 'none', borderBottom: '1px solid #ddd', fontSize: '1rem', outline: 'none'}} />
  </div>
  <div>
    <label style={{display: 'block', fontSize: '0.7rem', letterSpacing: '1px', color: '#888', marginBottom: '0.3rem'}}>PINCODE *</label>
    <input type="text" name="pincode" required style={{width: '100%', padding: '0.4rem 0', border: 'none', borderBottom: '1px solid #ddd', fontSize: '1rem', outline: 'none'}} />
  </div>
  <div>
    <label style={{display: 'block', fontSize: '0.7rem', letterSpacing: '1px', color: '#888', marginBottom: '0.3rem'}}>UNIT TYPE *</label>
    <select name="unit_type" required defaultValue="" style={{width: '100%', padding: '0.4rem 0', border: 'none', borderBottom: '1px solid #ddd', fontSize: '1rem', outline: 'none', background: 'transparent', color: '#222', cursor: 'pointer'}}>
  <option value="" disabled>Select BHK Type</option>
  <option value="2BHK">2 BHK</option>
  <option value="3BHK">3 BHK</option>
</select>
  </div>
  <button type="submit" style={{background: '#113629', color: 'white', border: 'none', padding: '0.8rem', fontSize: '0.8rem', letterSpacing: '2px', cursor: 'pointer', marginTop: '0.5rem'}}>
    AUTHORIZE ASSIGNMENT
  </button>
</form>
</div>
 </div>
   )}
      </main>
    </div>
  );
}