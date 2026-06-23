import React from 'react';

/** Multi-line text field matching Input. */
export function Textarea({ label, value, onChange, placeholder = '', rows = 4, hint = '', disabled = false }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <label style={{ display: 'block', fontFamily: 'var(--font-body)' }}>
      {label && <span style={{ display: 'block', fontSize: 13, fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', marginBottom: 7 }}>{label}</span>}
      <textarea
        value={value} placeholder={placeholder} rows={rows} disabled={disabled} onChange={onChange}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width: '100%', boxSizing: 'border-box', resize: 'vertical',
          background: disabled ? 'var(--lhg-grey-200)' : '#fff',
          border: `1px solid ${focus ? 'var(--lhg-blue-500)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-sm)', padding: '12px 14px',
          font: '300 16px/1.5 var(--font-body)', color: 'var(--lhg-core-blue)', outline: 'none',
          boxShadow: focus ? 'var(--shadow-focus)' : 'none',
          transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
        }}
      />
      {hint && <span style={{ display: 'block', fontSize: 12.5, marginTop: 6, color: 'var(--text-muted)' }}>{hint}</span>}
    </label>
  );
}
