import React from 'react';

/** Breadcrumb trail with caret separators. */
export function Breadcrumb({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontFamily: 'var(--font-body)' }}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        const lab = typeof it === 'string' ? it : it.label;
        return (
          <React.Fragment key={i}>
            {last
              ? <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--lhg-core-blue)' }}>{lab}</span>
              : <a href={(it && it.href) || '#'} style={{ fontSize: 14, fontWeight: 300, color: 'var(--lhg-slate-500)', textDecoration: 'none' }}>{lab}</a>}
            {!last && <i className="ph-light ph-caret-right" style={{ fontSize: 13, color: 'var(--lhg-grey-400)' }} />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
