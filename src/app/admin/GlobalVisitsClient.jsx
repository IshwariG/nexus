"use client";

import { useState, useMemo } from 'react';

export default function GlobalVisitsClient({ inquiries, allUsers = [] }) {
  const [searchQuery, setSearchQuery]   = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [perPage, setPerPage]           = useState(10);

  // Build salesman lookup from real DB users — no hardcoded names
  const salesmanMap = useMemo(() => {
    const map = {};
    allUsers.filter(u => u.role === 'Sales').forEach(u => {
      map[u.username] = u.full_name || u.username;
    });
    return map;
  }, [allUsers]);

  const resolveSalesmanName = (id) => salesmanMap[id] || id || '—';

  // Filter: only inquiries whose status contains SCHEDULED or DONE stage
  const allVisits = useMemo(() => {
    return (inquiries || []).filter(inq => {
      if (!inq?.status) return false;
      const stage = inq.status.split('|')[0]?.toUpperCase();
      return stage === 'SCHEDULED' || stage === 'DONE';
    });
  }, [inquiries]);

  // Apply search filter
  const filteredVisits = useMemo(() => {
    if (!searchQuery.trim()) return allVisits;
    const q = searchQuery.toLowerCase();
    return allVisits.filter(inq => {
      const salesmanId = inq.status.split('|')[1] || '';
      const sName = resolveSalesmanName(salesmanId).toLowerCase();
      return (
        (inq.name || '').toLowerCase().includes(q) ||
        (inq.phone || '').toLowerCase().includes(q) ||
        sName.includes(q)
      );
    });
  }, [allVisits, searchQuery, salesmanMap]);

  // Pagination
  const totalPages   = Math.max(1, Math.ceil(filteredVisits.length / perPage));
  const safePage     = Math.min(currentPage, totalPages);
  const pageStart    = (safePage - 1) * perPage;
  const pageEnd      = Math.min(pageStart + perPage, filteredVisits.length);
  const pageVisits   = filteredVisits.slice(pageStart, pageEnd);

  const goPage = (p) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));

  // Generate page numbers to show (max 5 buttons)
  const pageNumbers = useMemo(() => {
    const pages = [];
    const start = Math.max(1, safePage - 2);
    const end   = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [safePage, totalPages]);

  const btnStyle = (active) => ({
    border: active ? 'none' : '1px solid #e5e7eb',
    background: active ? 'var(--vanya-green)' : '#fff',
    color: active ? '#fff' : '#4b5563',
    width: '28px', height: '28px',
    borderRadius: '50%',
    fontWeight: active ? 'bold' : '400',
    cursor: 'pointer',
    fontSize: '0.75rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s'
  });

  return (
    <div id="visits" className="widget-card mt-2">

      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem', gap: '0.85rem', width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <h3 className="section-title serif" style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: 'var(--vanya-green)' }}>
            Project-wide Scheduled Visits
          </h3>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Global tracking of site walkthroughs and meeting statuses
          </p>
        </div>
        <div className="search-box">
          <span className="search-icon" style={{ fontSize: '0.8rem' }}>🔍</span>
          <input
            className="input-search"
            placeholder="Search by client or salesman..."
            style={{ width: '260px', fontSize: '0.8rem', padding: '0.5rem 0.5rem 0.5rem 2rem' }}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <table className="table-standard">
        <thead>
          <tr>
            <th>CLIENT</th>
            <th>ASSIGNED SALESMAN</th>
            <th>SCHEDULE DETAILS</th>
            <th>CURRENT STATUS</th>
          </tr>
        </thead>
        <tbody>
          {pageVisits.map((inq, i) => {
            const parts      = (inq.status || '').split('|');
            const stage      = (parts[0] || '').toUpperCase();
            const salesmanId = parts[1] || '';
            const sName      = resolveSalesmanName(salesmanId);
            const isDone     = stage === 'DONE';

            return (
              <tr key={inq.id || i}>
                <td>
                  <strong>{inq.name || '—'}</strong>
                  <br />
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>{inq.phone || ''}</span>
                </td>
                <td>
                  <span className="badge" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', textTransform: 'none', fontWeight: '600', fontSize: '0.72rem', padding: '4px 10px', borderRadius: '12px' }}>
                    {sName}
                  </span>
                </td>
                <td style={{ fontSize: '0.78rem', color: '#4b5563', maxWidth: '220px' }}>
                  {inq.message || inq.visit_date || '—'}
                </td>
                <td>
                  {isDone ? (
                    <span style={{ background: '#e6f4ea', color: '#137333', padding: '5px 12px', borderRadius: '20px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                      VISIT DONE
                    </span>
                  ) : (
                    <span style={{ background: '#fef7e0', color: '#b06000', padding: '5px 12px', borderRadius: '20px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem' }}>
                      ⏳ PENDING VISIT
                    </span>
                  )}
                </td>
              </tr>
            );
          })}

          {pageVisits.length === 0 && (
            <tr>
              <td colSpan="4" className="text-muted" style={{ textAlign: 'center', padding: '2.5rem' }}>
                {searchQuery ? `No visits found for "${searchQuery}".` : 'No scheduled visits yet. Visits appear here when an inquiry is moved to the Scheduled stage.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', padding: '0.75rem 0.5rem 0.25rem', borderTop: '1px solid #f1f3f5', fontSize: '0.75rem', color: '#6b7280', flexWrap: 'wrap', gap: '0.5rem' }}>

        {/* Entry count */}
        <div>
          Showing {filteredVisits.length === 0 ? 0 : pageStart + 1}–{pageEnd} of {filteredVisits.length} entries
        </div>

        {/* Page buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            onClick={() => goPage(safePage - 1)}
            disabled={safePage === 1}
            style={{ ...btnStyle(false), opacity: safePage === 1 ? 0.35 : 1 }}
          >‹</button>

          {pageNumbers.map(p => (
            <button key={p} onClick={() => goPage(p)} style={btnStyle(p === safePage)}>{p}</button>
          ))}

          <button
            onClick={() => goPage(safePage + 1)}
            disabled={safePage === totalPages}
            style={{ ...btnStyle(false), opacity: safePage === totalPages ? 0.35 : 1 }}
          >›</button>
        </div>

        {/* Per-page selector */}
        <div>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
            style={{ padding: '4px 8px', fontSize: '0.72rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', color: '#4b5563', cursor: 'pointer' }}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>
    </div>
  );
}
