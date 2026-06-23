import React from 'react';

/** Segmented control — track of options, active segment lifts to a white pill. */
export function SegmentedControl({ options = [], value, onChange, size = 'md' }) {
  const active = value ?? (options[0] && (typeof options[0] === 'string' ? options[0] : options[0].value));
  const pad = size === 'sm' ? '7px 14px' : '10px 20px';
  const fs = size === 'sm' ? 14 : 15.5;
  return (
    <div style={{
      display: 'inline-flex', gap: 4, padding: 4, background: 'var(--lhg-grey-200)',
      borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-body)',
    }}>
      {options.map((o) => {
        const val = typeof o === 'string' ? o : o.value;
        const lab = typeof o === 'string' ? o : o.label;
        const on = val === active;
        return (
          <button key={val} onClick={() => onChange && onChange(val)}
            style={{
              border: 'none', cursor: 'pointer', padding: pad, fontSize: fs, fontWeight: on ? 400 : 300,
              borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap',
              background: on ? '#fff' : 'transparent',
              color: on ? 'var(--lhg-core-blue)' : 'var(--lhg-slate-500)',
              boxShadow: on ? 'var(--shadow-xs)' : 'none',
              transition: 'background var(--dur-fast), color var(--dur-fast)',
            }}>
            {lab}
          </button>
        );
      })}
    </div>
  );
}
