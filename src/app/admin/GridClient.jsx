"use client";
import React, { useState } from 'react';

export default function GridClient({ units, inquiries, project = 'vanya-residences' }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [activePhase, setActivePhase] = useState(1);
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

  const handleCellClick = (unitId) => {
    // Look for client details in the Inquiries side-channel
    const inquiry = inquiries.find(inq => inq.source === `UNIT_ASSIGNMENT_${unitId}`);
    if (inquiry) {
      setSelectedClient({ unitId, inquiry });
    } else {
      // If no details exist, show placeholder or lookup info
      const uData = projectUnits.find(u => parseInt(u.unit_id) === unitId);
      if (uData && uData.tag_color && !['green', 'red', 'blue'].includes(uData.tag_color)) {
        setSelectedClient({ unitId, inquiry: { name: uData.tag_color, message: 'Details missing in standard pipeline.' } });
      }
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

  return (
    <>
      {/* Analytical Performance Report */}
      <div className="performance-section mb-2">
        <div style={{ textAlign: 'center' }}>
          <div>
            <h3 className="serif" style={{margin:0}}>Analytical Performance Report</h3>
            <p className="text-muted" style={{margin:0, fontSize:'0.8rem'}}>Aggregate sales intelligence & velocity tracking (Phase {activePhase})</p>
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
              <div className="bar-col"><div className="bar" style={{height: project === 'vanya-estate' ? '30%' : project === 'vanya-meadows' ? '15%' : '40%'}}></div><span>JANUARY</span></div>
              <div className="bar-col"><div className="bar" style={{height: project === 'vanya-estate' ? '45%' : project === 'vanya-meadows' ? '20%' : '55%'}}></div><span>FEBRUARY</span></div>
              <div className="bar-col"><div className="bar" style={{height: project === 'vanya-estate' ? '35%' : project === 'vanya-meadows' ? '25%' : '50%'}}></div><span>MARCH</span></div>
              <div className="bar-col"><div className="bar" style={{height: project === 'vanya-estate' ? '70%' : project === 'vanya-meadows' ? '40%' : '80%'}}></div><span>APRIL</span></div>
              <div className="bar-col"><div className="bar" style={{height: project === 'vanya-estate' ? '60%' : project === 'vanya-meadows' ? '35%' : '65%'}}></div><span>MAY</span></div>
              <div className="bar-col"><div className="bar" style={{height: project === 'vanya-estate' ? '85%' : project === 'vanya-meadows' ? '50%' : '95%'}}></div><span>JUNE</span></div>
            </div>
          </div>
          <div className="perf-card-stack">
            <div className="perf-card p-small">
              <p className="perf-label">AVG. PRICE PER UNIT</p>
              <h2 className="serif m-0">
                {project === 'vanya-estate' ? '₹ 6.5 Cr' : project === 'vanya-meadows' ? '₹ 8.2 Cr' : '₹ 4.8 Cr'}
              </h2>
              <div className="progress-bar mt-1"><div className="progress" style={{width: project === 'vanya-estate' ? '80%' : project === 'vanya-meadows' ? '90%' : '70%', background:'#113629'}}></div></div>
            </div>
            <div className="perf-card p-small">
              <p className="perf-label">TOTAL PORTFOLIO VALUE</p>
              <h2 className="serif m-0">
                {project === 'vanya-estate' ? '₹ 650 Cr' : project === 'vanya-meadows' ? '₹ 656 Cr' : '₹ 450 Cr'}
              </h2>
              <span className="text-green text-xs">
                {project === 'vanya-estate' ? '+18.4% INCREASE' : project === 'vanya-meadows' ? '+21.0% INCREASE' : '+15.2% INCREASE'}
              </span>
            </div>
            <div className="perf-card p-small">
              <p className="perf-label">CONVERSION RATE</p>
              <h2 className="serif text-blue m-0">
                {project === 'vanya-estate' ? '18.2%' : project === 'vanya-meadows' ? '12.4%' : '28.4%'}
              </h2>
              <span className="text-muted text-xs">LEAD TO DEPOSIT</span>
            </div>
          </div>
        </div>

        <div className="perf-grid-bottom mt-1">
          <div className="perf-card flex-center-left">
            <div>
              <p className="perf-label">TOTAL REVENUE</p>
              <h2 className="serif m-0">
                {project === 'vanya-estate' ? '₹ 97.5 Cr' : project === 'vanya-meadows' ? '₹ 41.0 Cr' : '₹ 180.5 Cr'}
              </h2>
              <span className="text-green text-xs font-bold">
                {project === 'vanya-estate' ? '↗ +8.5% VS LAST QUARTER' : project === 'vanya-meadows' ? '↗ +5.2% VS LAST QUARTER' : '↗ +12.4% VS LAST QUARTER'}
              </span>
            </div>
            <div className="icon-bg ml-auto">🏛️</div>
          </div>
          <div className="perf-card flex-center-left">
            <div style={{width:'100%'}}>
              <p className="perf-label">UNITS SOLD</p>
              <h2 className="serif m-0">{soldUnits} <span className="text-muted" style={{fontSize:'1rem'}}>/ {totalUnits}</span></h2>
              <div className="progress-bar mt-1"><div className="progress" style={{width:`${(soldUnits/totalUnits)*100}%`, background: '#113629'}} ></div></div>
            </div>
          </div>
          <div className="perf-card flex-center-left">
            <div>
              <p className="perf-label">AVG. SALES CYCLE</p>
              <h2 className="serif m-0">
                {project === 'vanya-estate' ? '32 Days' : project === 'vanya-meadows' ? '45 Days' : '24 Days'}
              </h2>
              <span className="text-blue text-xs font-bold">
                {project === 'vanya-estate' ? '◷ -2 DAYS IMPROVEMENT' : project === 'vanya-meadows' ? '◷ STABLE VELOCITY' : '◷ -4 DAYS IMPROVEMENT'}
              </span>
            </div>
            <div className="icon-bg ml-auto">⏱️</div>
          </div>
        </div>
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
            <h2 className="serif" style={{color: '#113629', marginBottom: '0.5rem', fontSize: '1.8rem'}}>Unit {selectedClient.unitId} Assignment</h2>
            <p style={{color: '#888', fontSize: '0.8rem', marginBottom: '2rem', letterSpacing: '0.5px'}}>Confidential Client Record</p>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '1.2rem', fontSize: '0.9rem', color: '#555'}}>
              <div>
                <strong style={{fontSize: '0.65rem', letterSpacing: '1px', color: '#888', display: 'block', marginBottom: '0.2rem'}}>FULL NAME</strong>
                <div style={{color: '#113629', fontWeight: 600, fontSize: '1.1rem'}}>{selectedClient.inquiry.name}</div>
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
              <div style={{background: '#faf9f6', padding: '1rem', border: '1px solid #eee', marginTop: '0.5rem'}}>
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
