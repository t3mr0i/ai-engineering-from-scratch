import React from 'react';

/** Text input with floating-style label, hairline border, blue focus ring. */
export function Input({ label, value, onChange, placeholder = '', type = 'text', icon = null, error = '', hint = '', disabled = false, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const borderColor = error ? 'var(--lhg-error)' : focus ? 'var(--lhg-blue-500)' : 'var(--border-subtle)';
  return (
    <label style={{ display: 'block', fontFamily: 'var(--font-body)' }}>
      {label && <span style={{ display: 'block', fontSize: 13, fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', marginBottom: 7 }}>{label}</span>}
      <span style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: disabled ? 'var(--lhg-grey-200)' : '#fff',
        border: `1px solid ${borderColor}`, borderRadius: 'var(--radius-sm)',
        padding: '0 14px', height: 48,
        boxShadow: focus && !error ? 'var(--shadow-focus)' : 'none',
        transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
      }}>
        {icon && <i className={`ph-light ${icon}`} style={{ fontSize: 20, color: 'var(--lhg-slate-500)' }} />}
        <input
          type={type} value={value} placeholder={placeholder} disabled={disabled}
          onChange={onChange} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent',
            font: '300 16px var(--font-body)', color: 'var(--lhg-core-blue)', minWidth: 0 }}
          {...rest}
        />
      </span>
      {(error || hint) && <span style={{ display: 'block', fontSize: 12.5, marginTop: 6, color: error ? 'var(--lhg-error)' : 'var(--text-muted)' }}>{error || hint}</span>}
    </label>
  );
}
