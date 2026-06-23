import React from 'react';

/** Pill search field with leading icon and optional submit affordance. */
export function SearchBar({ value, onChange, onSubmit, placeholder = 'Search', width = 360 }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit && onSubmit(value); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width, maxWidth: '100%',
        background: '#fff', border: `1px solid ${focus ? 'var(--lhg-blue-500)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-pill)', padding: '0 8px 0 18px', height: 48,
        boxShadow: focus ? 'var(--shadow-focus)' : 'none', fontFamily: 'var(--font-body)',
        transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
      }}>
      <i className="ph-light ph-magnifying-glass" style={{ fontSize: 20, color: 'var(--lhg-slate-500)' }} />
      <input value={value} placeholder={placeholder} onChange={onChange}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', font: '300 16px var(--font-body)', color: 'var(--lhg-core-blue)', minWidth: 0 }} />
      <button type="submit" aria-label="Search" style={{
        width: 36, height: 36, flex: 'none', border: 'none', borderRadius: '50%', cursor: 'pointer',
        background: 'var(--lhg-blue-500)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className="ph-light ph-arrow-right" style={{ fontSize: 18 }} />
      </button>
    </form>
  );
}
