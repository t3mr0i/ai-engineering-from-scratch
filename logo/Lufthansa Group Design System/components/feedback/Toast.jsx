import React from 'react';

/** Toast — white card, soft shadow, tone icon, close affordance. Static (no timer). */
export function Toast({ tone = 'info', title, children, onClose }) {
  const map = {
    info: { ic: 'ph-info', fg: 'var(--lhg-blue-500)' },
    success: { ic: 'ph-check-circle', fg: 'var(--lhg-success)' },
    warning: { ic: 'ph-warning', fg: 'var(--lhg-warning)' },
    error: { ic: 'ph-warning-circle', fg: 'var(--lhg-error)' },
  };
  const t = map[tone] || map.info;
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 300, maxWidth: 420,
      background: '#fff', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
      border: '1px solid var(--border-subtle)', padding: '14px 16px', fontFamily: 'var(--font-body)',
    }}>
      <i className={`ph-light ${t.ic}`} style={{ fontSize: 22, color: t.fg, marginTop: 1, flex: 'none' }} />
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontSize: 15, fontWeight: 'var(--weight-medium)', color: 'var(--lhg-core-blue)', marginBottom: children ? 3 : 0 }}>{title}</div>}
        {children && <div style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.5, color: 'var(--text-secondary)' }}>{children}</div>}
      </div>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--lhg-slate-500)', fontSize: 18, padding: 2, lineHeight: 1 }}>
          <i className="ph-light ph-x" />
        </button>
      )}
    </div>
  );
}
