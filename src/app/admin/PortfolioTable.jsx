"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function PortfolioTable({ assignedUnits }) {
  const [showAll, setShowAll] = useState(false);
  const displayUnits = showAll ? assignedUnits : assignedUnits.slice(0, 4);

  return (
    <>
      <table className="table-standard">
        <thead>
          <tr>
            <th>FLAT NO.</th>
            <th>STATUS</th>
            <th>CLIENT</th>
            <th>PRICE</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {displayUnits.map(u => (
            <tr key={u.id}>
              <td><strong>V-{u.unit_id}</strong></td>
              <td><span className={`badge ${u.status === 'SOLD OUT' ? 'sold' : u.status === 'RESERVED' || u.status === 'IN NEGOTIATION' ? 'negotiation' : 'available'}`}>{u.status}</span></td>
              <td className="text-muted">{u.tag_color && !['green', 'red', 'blue'].includes(u.tag_color) ? u.tag_color.toUpperCase() : '—'}</td>
              <td>{u.price}</td>
              <td><Link href={`/admin/unit/${u.unit_id}`} style={{color: '#888', fontSize: '0.7rem', textDecoration: 'none', fontWeight: 600}}>VIEW DETAILS →</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!showAll && assignedUnits.length > 4 && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button className="btn-dark" onClick={() => setShowAll(true)} style={{ background: '#113629', padding: '0.5rem 1rem', fontSize: '0.7rem', border: 'none', color: 'white', cursor: 'pointer', letterSpacing: '1px' }}>SEE MORE ({assignedUnits.length - 4} REMAINING)</button>
        </div>
      )}
      {showAll && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button className="btn-outline-dark" onClick={() => setShowAll(false)} style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', border: '1px solid #113629', color: '#113629', cursor: 'pointer', letterSpacing: '1px', background: 'transparent' }}>SHOW LESS</button>
        </div>
      )}
    </>
  );
}
