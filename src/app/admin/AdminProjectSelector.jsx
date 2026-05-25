"use client";

import React, { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminProjectSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const currentProject = searchParams.get('project') || 'vanya-residences';

  const handleChange = (e) => {
    const val = e.target.value;
    const tab = searchParams.get('tab') || 'dashboard';
    startTransition(() => {
      router.push(`/admin?project=${val}&tab=${tab}`);
    });
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <select
        value={currentProject}
        onChange={handleChange}
        disabled={isPending}
        style={{
          background: 'white',
          border: '1px solid #c2a661',
          padding: '8px 36px 8px 16px',
          borderRadius: '8px',
          fontSize: '0.78rem',
          fontWeight: '600',
          color: '#113629',
          outline: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(194, 166, 97, 0.1)',
          fontFamily: 'inherit',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          appearance: 'none',
          transition: 'all 0.2s ease',
          opacity: isPending ? 0.7 : 1
        }}
      >
        <option value="vanya-residences">Vanya Residences (Tower A-C)</option>
        <option value="vanya-estate">Vanya Estate</option>
        <option value="vanya-meadows">Vanya Meadows</option>
      </select>
      <span style={{
        position: 'absolute',
        right: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        fontSize: '0.6rem',
        color: '#c2a661'
      }}>▼</span>
    </div>
  );
}
