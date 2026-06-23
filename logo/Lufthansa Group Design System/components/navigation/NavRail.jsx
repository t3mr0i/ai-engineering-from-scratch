import React from 'react';

/** Slim left navigation rail — the LHG brand-portal pattern. Icon + label. */
export function NavRail({ items = [], active, onChange, brand = true }) {
  return (
    <nav style={{
      width: 'var(--nav-rail-width)', minHeight: '100%', boxSizing: 'border-box',
      background: 'var(--lhg-grey-100)', borderRight: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 8,
      fontFamily: 'var(--font-body)',
    }}>
      {brand && <img src="" alt="" aria-hidden style={{ display: 'none' }} />}
      {items.map((it) => {
        const on = it.value === active;
        return (
          <button key={it.value} onClick={() => onChange && onChange(it.value)} title={it.label}
            style={{
              width: 72, padding: '12px 0', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)',
              background: on ? '#fff' : 'transparent', boxShadow: on ? 'var(--shadow-xs)' : 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              color: on ? 'var(--lhg-blue-500)' : 'var(--lhg-slate-500)',
              transition: 'background var(--dur-fast), color var(--dur-fast)',
            }}>
            <i className={`ph-light ${it.icon}`} style={{ fontSize: 24 }} />
            <span style={{ fontSize: 11, fontWeight: on ? 400 : 300 }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
