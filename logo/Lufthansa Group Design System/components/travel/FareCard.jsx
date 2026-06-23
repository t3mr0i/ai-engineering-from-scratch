import React from 'react';

/** Fare/cabin option card — name, price, included perks, select state. */
export function FareCard({ name, price, currency = '€', perks = [], featured = false, selected = false, onSelect }) {
  return (
    <div style={{
      position: 'relative', background: '#fff', borderRadius: 'var(--radius-lg)',
      border: `1px solid ${selected ? 'var(--lhg-blue-500)' : featured ? 'var(--lhg-core-blue)' : 'var(--border-subtle)'}`,
      boxShadow: selected ? 'var(--shadow-focus)' : featured ? 'var(--shadow-md)' : 'var(--shadow-xs)',
      padding: 24, fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', gap: 16, minWidth: 220,
    }}>
      {featured && <span style={{ position: 'absolute', top: -11, left: 24, background: 'var(--lhg-core-blue)', color: '#fff', fontSize: 11, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 'var(--radius-pill)' }}>Most flexible</span>}
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--lhg-blue-500)' }}>{name}</div>
        <div style={{ marginTop: 8 }}><span style={{ font: '200 38px var(--font-display)', color: 'var(--lhg-core-blue)' }}>{currency}{price}</span></div>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
        {perks.map((p, i) => {
          const inc = typeof p === 'string' ? true : p.included;
          const lab = typeof p === 'string' ? p : p.label;
          return (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, fontWeight: 300, color: inc ? 'var(--text-secondary)' : 'var(--lhg-grey-400)' }}>
              <i className={`ph-light ${inc ? 'ph-check' : 'ph-x'}`} style={{ fontSize: 17, color: inc ? 'var(--lhg-success)' : 'var(--lhg-grey-400)', flex: 'none' }} />
              {lab}
            </li>
          );
        })}
      </ul>
      <button onClick={onSelect} style={{
        border: selected ? 'none' : '1px solid var(--lhg-core-blue)', cursor: 'pointer',
        borderRadius: 'var(--radius-pill)', padding: '11px 20px', width: '100%',
        background: selected ? 'var(--lhg-blue-500)' : featured ? 'var(--lhg-core-blue)' : 'transparent',
        color: selected || featured ? '#fff' : 'var(--lhg-core-blue)', font: '300 15px var(--font-body)',
      }}>{selected ? 'Selected' : 'Choose'}</button>
    </div>
  );
}
