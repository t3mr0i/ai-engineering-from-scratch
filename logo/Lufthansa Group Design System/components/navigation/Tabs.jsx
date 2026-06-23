import React from 'react';

/** Underline tabs — active tab marked by a Blue 500 indicator. */
export function Tabs({ tabs = [], value, onChange }) {
  const active = value ?? (tabs[0] && (typeof tabs[0] === 'string' ? tabs[0] : tabs[0].value));
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-subtle)', fontFamily: 'var(--font-body)' }}>
      {tabs.map((t) => {
        const val = typeof t === 'string' ? t : t.value;
        const lab = typeof t === 'string' ? t : t.label;
        const on = val === active;
        return (
          <button key={val} onClick={() => onChange && onChange(val)}
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              padding: '12px 16px', fontSize: 16, fontWeight: 300,
              color: on ? 'var(--lhg-core-blue)' : 'var(--lhg-slate-500)',
              borderBottom: `2px solid ${on ? 'var(--lhg-blue-500)' : 'transparent'}`,
              marginBottom: -1, transition: 'color var(--dur-fast), border-color var(--dur-fast)',
            }}>
            {lab}
          </button>
        );
      })}
    </div>
  );
}
