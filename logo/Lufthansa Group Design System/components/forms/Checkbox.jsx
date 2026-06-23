import React from 'react';

/** Checkbox with brand-blue checked fill. */
export function Checkbox({ label, checked = false, onChange, disabled = false }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', opacity: disabled ? 0.5 : 1 }}>
      <span style={{
        width: 20, height: 20, flex: 'none', borderRadius: 'var(--radius-xs)',
        border: `1.5px solid ${checked ? 'var(--lhg-blue-500)' : 'var(--border-strong)'}`,
        background: checked ? 'var(--lhg-blue-500)' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all var(--dur-fast) var(--ease-standard)',
      }}>
        {checked && <i className="ph-bold ph-check" style={{ color: '#fff', fontSize: 13 }} />}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
      {label && <span style={{ fontSize: 15, fontWeight: 300, color: 'var(--lhg-core-blue)' }}>{label}</span>}
    </label>
  );
}
