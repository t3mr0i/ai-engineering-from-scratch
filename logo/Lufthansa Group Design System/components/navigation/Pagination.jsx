import React from 'react';

/** Pagination — prev/next arrows with numbered pages; active is Blue 500. */
export function Pagination({ page = 1, total = 1, onChange }) {
  const go = (p) => { if (p >= 1 && p <= total && onChange) onChange(p); };
  const pages = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  const btn = (content, opts = {}) => (
    <button key={opts.key} disabled={opts.disabled} onClick={opts.onClick}
      style={{
        minWidth: 40, height: 40, padding: '0 10px', border: 'none', cursor: opts.disabled ? 'default' : 'pointer',
        borderRadius: 'var(--radius-pill)', font: '300 15px var(--font-body)',
        background: opts.active ? 'var(--lhg-blue-500)' : 'transparent',
        color: opts.active ? '#fff' : opts.disabled ? 'var(--lhg-grey-400)' : 'var(--lhg-core-blue)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>{content}</button>
  );
  return (
    <nav aria-label="Pagination" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-body)' }}>
      {btn(<i className="ph-light ph-caret-left" />, { key: 'prev', disabled: page === 1, onClick: () => go(page - 1) })}
      {pages.map((p, i) => p === '…'
        ? <span key={`e${i}`} style={{ padding: '0 6px', color: 'var(--lhg-grey-400)' }}>…</span>
        : btn(p, { key: p, active: p === page, onClick: () => go(p) }))}
      {btn(<i className="ph-light ph-caret-right" />, { key: 'next', disabled: page === total, onClick: () => go(page + 1) })}
    </nav>
  );
}
