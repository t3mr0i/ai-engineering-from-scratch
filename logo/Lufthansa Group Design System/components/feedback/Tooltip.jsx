import React from 'react';

/** Tooltip — wraps a trigger; shows a dark navy bubble on hover/focus. */
export function Tooltip({ label, children, placement = 'top' }) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: { bottom: '100%', left: '50%', transform: 'translate(-50%, -8px)' },
    bottom: { top: '100%', left: '50%', transform: 'translate(-50%, 8px)' },
    left: { right: '100%', top: '50%', transform: 'translate(-8px, -50%)' },
    right: { left: '100%', top: '50%', transform: 'translate(8px, -50%)' },
  };
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)} onBlur={() => setShow(false)}>
      {children}
      <span role="tooltip" style={{
        position: 'absolute', ...pos[placement], zIndex: 50,
        background: 'var(--lhg-core-blue)', color: '#fff',
        font: '300 13px/1.4 var(--font-body)', whiteSpace: 'nowrap',
        padding: '7px 11px', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)',
        opacity: show ? 1 : 0, pointerEvents: 'none',
        transition: 'opacity var(--dur-fast) var(--ease-standard)',
      }}>
        {label}
      </span>
    </span>
  );
}
