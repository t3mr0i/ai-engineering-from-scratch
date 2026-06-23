import React from 'react';

/** Small status / category label. Subtle tints; sentence case. */
export function Badge({ children, tone = 'neutral', icon = null }) {
  const tones = {
    neutral: { bg: 'var(--lhg-grey-200)', fg: 'var(--lhg-slate-700)' },
    blue: { bg: 'var(--lhg-blue-100)', fg: 'var(--lhg-blue-600)' },
    success: { bg: '#e2f3ea', fg: 'var(--lhg-success)' },
    warning: { bg: '#fbeede', fg: '#9a5a14' },
    error: { bg: '#fbe1e5', fg: 'var(--lhg-red)' },
    teal: { bg: '#dcecee', fg: 'var(--lhg-teal)' },
    purple: { bg: '#f3e1ea', fg: 'var(--lhg-purple)' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: t.bg, color: t.fg,
      fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-medium)',
      fontSize: 12.5, lineHeight: 1, letterSpacing: '.01em',
      padding: '6px 12px', borderRadius: 'var(--radius-pill)',
    }}>
      {icon && <i className={`ph-light ${icon}`} style={{ fontSize: 14 }} />}
      {children}
    </span>
  );
}
