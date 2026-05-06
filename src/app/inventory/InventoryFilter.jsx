"use client";
import { useState } from 'react';
import Link from 'next/link';

export default function InventoryFilter({ initialUnits }) {
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Residences');

  const filteredUnits = initialUnits.filter(unit => {
    if (statusFilter !== 'All Status' && unit.status.toUpperCase() !== statusFilter.toUpperCase()) return false;
    if (typeFilter !== 'All Residences' && !unit.type.includes(typeFilter.replace('BHK', ''))) return false;
    return true;
  });

  return (
    <>
      <div className="filters-bar">
        <div className="filter-group">
          <label>STATUS</label>
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option>All Status</option>
            <option>Available</option>
            <option>Reserved</option>
            <option>Sold Out</option>
          </select>
        </div>
        <div className="filter-group">
          <label>UNIT TYPE</label>
          <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option>All Residences</option>
            <option>2BHK</option>
            <option>3BHK</option>
          </select>
        </div>
        <button className="btn btn-outline-dark filter-btn" onClick={() => {
          setStatusFilter('All Status');
          setTypeFilter('All Residences');
        }}>RESET FILTERS</button>
      </div>

      <div className="grid-4 units-grid">
        {filteredUnits.length > 0 ? filteredUnits.map((unit, i) => (
          <div key={i} className="unit-card">
            <div className="unit-img-wrapper">
              <span className={`status-tag status-${unit.status === 'SOLD OUT' ? 'red' : unit.status === 'AVAILABLE' ? 'green' : 'blue'}`}>{unit.status}</span>
              <img src={unit.img} alt={`Unit ${unit.unit_id}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </div>
            <div className="unit-info">
              <div className="unit-header">
                <h3>Unit {unit.unit_id}</h3>
                <span className="unit-floor">{unit.floor}</span>
              </div>
              <div className="unit-details">
                <div className="detail-row">
                  <span>TYPE</span>
                  <strong>{unit.type}</strong>
                </div>
                <div className="detail-row">
                  <span>AREA</span>
                  <strong>{unit.area}</strong>
                </div>
                <div className="detail-row">
                  <span>PRICE</span>
                  <strong>{unit.price}</strong>
                </div>
              </div>
              <Link href={`/inquiry?source=Unit%20V-${unit.unit_id}`} className="btn btn-primary w-100" style={{display: 'block', textAlign: 'center', textDecoration: 'none'}}>
                {unit.status === 'AVAILABLE' ? 'SCHEDULE VIEWING' : 'JOIN WAITLIST'}
              </Link>
            </div>
          </div>
        )) : (
          <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '3rem'}}>
            <h3>No units match your selected filters.</h3>
          </div>
        )}
      </div>
    </>
  );
}
