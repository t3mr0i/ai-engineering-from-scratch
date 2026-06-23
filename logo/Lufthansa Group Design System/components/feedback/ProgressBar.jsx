import React from 'react';

/** Thin linear progress bar. */
export function ProgressBar({ value = 0, tone = 'blue', label = '', showValue = false }) {
  const colors = { blue: 'var(--lhg-blue-500)', core: 'var(--lhg-core-blue)', teal: 'var(--lhg-teal)', success: 'var(--lhg-success)' };
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
          <span>{label}</span>{showValue && <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--lhg-core-blue)' }}>{pct}%</span>}
        </div>
      )}
      <div style={{ height: 6, borderRadius: 999, background: 'var(--lhg-grey-200)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: colors[tone] || colors.blue,
          transition: 'width var(--dur-slow) var(--ease-out)' }} />
      </div>
    </div>
  );
}
