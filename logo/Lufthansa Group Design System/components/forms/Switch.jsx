import React from 'react';

/** Pill switch — off grey, on Blue 500. */
export function Switch({ checked = false, onChange, label = '', disabled = false }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 12, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', opacity: disabled ? 0.5 : 1 }}>
      <span
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          width: 44, height: 26, flex: 'none', borderRadius: 999,
          background: checked ? 'var(--lhg-blue-500)' : 'var(--lhg-grey-400)',
          position: 'relative', transition: 'background var(--dur-base) var(--ease-standard)',
        }}>
        <span style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3, width: 20, height: 20,
          borderRadius: '50%', background: '#fff', boxShadow: 'var(--shadow-xs)',
          transition: 'left var(--dur-base) var(--ease-out)',
        }} />
      </span>
      {label && <span style={{ fontSize: 15, fontWeight: 300, color: 'var(--lhg-core-blue)' }}>{label}</span>}
    </label>
  );
}
