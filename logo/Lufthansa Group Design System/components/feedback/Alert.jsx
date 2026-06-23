import React from 'react';

/**
 * Inline notice in the Lufthansa accent style: clean white surface, a solid
 * colour bar on the LEFT edge, a matching icon and dark text. No tinted fill,
 * no rounded pill — calm and editorial.
 */
export function Alert({ tone = 'info', title, children, icon }) {
  const map = {
    info: { bar: 'var(--lhg-blue-500)', ic: 'ph-info', fg: 'var(--lhg-blue-600)' },
    success: { bar: 'var(--lhg-success)', ic: 'ph-check-circle', fg: 'var(--lhg-success)' },
    warning: { bar: 'var(--lhg-warning)', ic: 'ph-warning', fg: '#9a5a14' },
    error: { bar: 'var(--lhg-error)', ic: 'ph-warning-circle', fg: 'var(--lhg-error)' },
    note: { bar: 'var(--lhg-sand)', ic: 'ph-note', fg: 'var(--lhg-sand)' },
  };
  const t = map[tone] || map.info;
  return (
    <div style={{
      display: 'flex', gap: 14, alignItems: 'flex-start',
      background: 'var(--color-surface)',
      borderLeft: `3px solid ${t.bar}`,
      boxShadow: 'var(--shadow-xs)',
      padding: '16px 20px 16px 18px',
      fontFamily: 'var(--font-body)',
    }}>
      <i className={`ph-light ${icon || t.ic}`} style={{ fontSize: 22, color: t.fg, marginTop: 1, flex: 'none' }} />
      <div>
        {title && <div style={{ fontSize: 15.5, fontWeight: 'var(--weight-medium)', color: 'var(--lhg-core-blue)', marginBottom: children ? 4 : 0 }}>{title}</div>}
        {children && <div style={{ fontSize: 14.5, fontWeight: 300, lineHeight: 1.55, color: 'var(--text-secondary)' }}>{children}</div>}
      </div>
    </div>
  );
}
