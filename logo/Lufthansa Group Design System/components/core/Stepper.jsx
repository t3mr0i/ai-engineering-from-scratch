import React from 'react';

/** Horizontal step indicator for multi-step flows (booking, check-in). */
export function Stepper({ steps = [], current = 0 }) {
  return (
    <ol style={{ display: 'flex', alignItems: 'center', gap: 0, listStyle: 'none', margin: 0, padding: 0, fontFamily: 'var(--font-body)' }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const label = typeof s === 'string' ? s : s.label;
        return (
          <li key={i} style={{ display: 'flex', alignItems: 'center', flex: i === steps.length - 1 ? '0 0 auto' : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
              <span style={{
                width: 30, height: 30, borderRadius: '50%', flex: 'none',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 400,
                background: done ? 'var(--lhg-blue-500)' : active ? 'var(--lhg-core-blue)' : 'var(--lhg-grey-200)',
                color: done || active ? '#fff' : 'var(--lhg-slate-500)',
                border: active ? 'none' : 'none',
              }}>
                {done ? <i className="ph-bold ph-check" style={{ fontSize: 13 }} /> : i + 1}
              </span>
              <span style={{ fontSize: 14.5, fontWeight: active ? 500 : 300, color: active || done ? 'var(--lhg-core-blue)' : 'var(--lhg-slate-500)', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <span style={{ flex: 1, height: 1, margin: '0 16px', background: done ? 'var(--lhg-blue-500)' : 'var(--border-strong)' }} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
