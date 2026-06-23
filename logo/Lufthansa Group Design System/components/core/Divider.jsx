import React from 'react';

/** Hairline divider; optional centered label. */
export function Divider({ label = null, spacing = 24 }) {
  if (!label) {
    return <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: `${spacing}px 0` }} />;
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: `${spacing}px 0`, fontFamily: 'var(--font-body)' }}>
      <span style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
      <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
    </div>
  );
}
