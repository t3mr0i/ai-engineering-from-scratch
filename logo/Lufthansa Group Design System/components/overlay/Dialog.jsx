import React from 'react';
import { Button } from '../core/Button.jsx';

/** Centered modal dialog with scrim. Controlled via `open`. */
export function Dialog({ open, onClose, title, children, primaryLabel = 'Confirm', onPrimary, secondaryLabel = 'Cancel', width = 460 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(5,22,77,0.42)', backdropFilter: 'blur(2px)', padding: 24, fontFamily: 'var(--font-body)',
    }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{
        width, maxWidth: '100%', background: '#fff', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)', padding: 32,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <h3 style={{ font: '300 24px/1.2 var(--font-display)', letterSpacing: '-.01em', color: 'var(--lhg-core-blue)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, color: 'var(--lhg-slate-500)', lineHeight: 1, marginTop: 2 }}>
            <i className="ph-light ph-x" />
          </button>
        </div>
        <div style={{ font: '300 16px/1.6 var(--font-body)', color: 'var(--text-secondary)', margin: '14px 0 28px' }}>{children}</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          {secondaryLabel && <Button variant="secondary" size="sm" onClick={onClose}>{secondaryLabel}</Button>}
          {primaryLabel && <Button variant="primary" size="sm" onClick={onPrimary || onClose}>{primaryLabel}</Button>}
        </div>
      </div>
    </div>
  );
}
