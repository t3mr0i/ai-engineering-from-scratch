import React from 'react';

/** Square/round icon-only button using a Phosphor light glyph class. */
export function IconButton({ icon, label, variant = 'ghost', size = 'md', onClick, ...rest }) {
  const dims = { sm: 32, md: 40, lg: 48 };
  const fs = { sm: 18, md: 22, lg: 26 };
  const [hover, setHover] = React.useState(false);
  const variants = {
    ghost: { background: hover ? 'var(--lhg-grey-200)' : 'transparent', color: 'var(--lhg-core-blue)' },
    solid: { background: hover ? 'var(--lhg-blue-600)' : 'var(--lhg-core-blue)', color: '#fff' },
    outline: { background: hover ? 'var(--lhg-grey-200)' : 'transparent', color: 'var(--lhg-core-blue)', boxShadow: 'inset 0 0 0 1px var(--border-subtle)' },
  };
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: dims[size], height: dims[size],
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
        fontSize: fs[size], transition: 'background var(--dur-fast) var(--ease-standard)',
        ...variants[variant],
      }}
      {...rest}
    >
      <i className={`ph-light ${icon}`} />
    </button>
  );
}
