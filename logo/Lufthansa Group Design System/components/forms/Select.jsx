import React from 'react';

/** Native select styled to match Input — hairline, soft radius, chevron. */
export function Select({ label, value, onChange, options = [], disabled = false, hint = '' }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <label style={{ display: 'block', fontFamily: 'var(--font-body)' }}>
      {label && <span style={{ display: 'block', fontSize: 13, fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', marginBottom: 7 }}>{label}</span>}
      <span style={{ position: 'relative', display: 'block' }}>
        <select
          value={value} onChange={onChange} disabled={disabled}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            width: '100%', height: 48, padding: '0 42px 0 14px', appearance: 'none',
            background: disabled ? 'var(--lhg-grey-200)' : '#fff',
            border: `1px solid ${focus ? 'var(--lhg-blue-500)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-sm)', font: '300 16px var(--font-body)',
            color: 'var(--lhg-core-blue)', outline: 'none', cursor: 'pointer',
            boxShadow: focus ? 'var(--shadow-focus)' : 'none',
          }}>
          {options.map((o) => {
            const val = typeof o === 'string' ? o : o.value;
            const lab = typeof o === 'string' ? o : o.label;
            return <option key={val} value={val}>{lab}</option>;
          })}
        </select>
        <i className="ph-light ph-caret-down" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--lhg-slate-500)', fontSize: 18 }} />
      </span>
      {hint && <span style={{ display: 'block', fontSize: 12.5, marginTop: 6, color: 'var(--text-muted)' }}>{hint}</span>}
    </label>
  );
}
