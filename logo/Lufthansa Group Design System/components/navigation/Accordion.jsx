import React from 'react';

/** Accordion — hairline-divided rows, caret rotates, single or multi open. */
export function Accordion({ items = [], multi = false, defaultOpen = [] }) {
  const [open, setOpen] = React.useState(new Set(defaultOpen));
  const toggle = (i) => setOpen((prev) => {
    const next = new Set(multi ? prev : []);
    if (prev.has(i)) next.delete(i); else next.add(i);
    return next;
  });
  return (
    <div style={{ fontFamily: 'var(--font-body)', borderTop: '1px solid var(--border-subtle)' }}>
      {items.map((it, i) => {
        const isOpen = open.has(i);
        return (
          <div key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <button onClick={() => toggle(i)} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              background: 'transparent', border: 'none', cursor: 'pointer', padding: '20px 4px', textAlign: 'left',
            }}>
              <span style={{ font: '300 18px var(--font-display)', color: 'var(--lhg-core-blue)' }}>{it.title}</span>
              <i className="ph-light ph-caret-down" style={{ fontSize: 18, color: 'var(--lhg-blue-500)', transition: 'transform var(--dur-base) var(--ease-standard)', transform: isOpen ? 'rotate(180deg)' : 'none', flex: 'none' }} />
            </button>
            <div style={{ overflow: 'hidden', maxHeight: isOpen ? 400 : 0, transition: 'max-height var(--dur-base) var(--ease-standard)' }}>
              <div style={{ padding: '0 4px 22px', font: '300 15.5px/1.6 var(--font-body)', color: 'var(--text-secondary)' }}>{it.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
