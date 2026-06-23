import React from 'react';

/** Large thin statistic with optional arc ring — the LHG report hero number. */
export function Stat({ value, unit = '', label = '', tone = 'blue', progress = null }) {
  const colors = {
    blue: 'var(--lhg-blue-500)', core: 'var(--lhg-core-blue)',
    red: 'var(--lhg-red)', teal: 'var(--lhg-teal)', purple: 'var(--lhg-purple)', sand: 'var(--lhg-sand)',
  };
  const c = colors[tone] || colors.blue;
  const ring = progress != null;
  const r = 52, circ = 2 * Math.PI * r, dash = circ * Math.min(Math.max(progress ?? 0, 0), 100) / 100;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 20, fontFamily: 'var(--font-body)' }}>
      {ring && (
        <svg width="128" height="128" viewBox="0 0 128 128" style={{ flex: 'none' }}>
          <circle cx="64" cy="64" r={r} fill="none" stroke="var(--lhg-grey-200)" strokeWidth="6" />
          <circle cx="64" cy="64" r={r} fill="none" stroke={c} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`} transform="rotate(-90 64 64)" />
          <text x="64" y="72" textAnchor="middle" style={{ font: '300 30px var(--font-display)', fill: 'var(--lhg-core-blue)' }}>{value}</text>
        </svg>
      )}
      <div>
        {!ring && (
          <div style={{ font: '200 56px/1 var(--font-display)', letterSpacing: '-.02em', color: c }}>
            {value}{unit && <span style={{ fontSize: 20, color: 'var(--text-muted)', marginLeft: 6 }}>{unit}</span>}
          </div>
        )}
        {label && <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: ring ? 0 : 8 }}>{label}</div>}
      </div>
    </div>
  );
}
