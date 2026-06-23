import React from 'react';

/**
 * Lufthansa Group primary control. Pill-shaped, calm, sentence-case label.
 * Variants: primary (Core Blue), accent (Blue 500), secondary (outline),
 * ghost (tinted), tertiary (inline text link with optional arrow).
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft = null,
  iconRight = null,
  full = false,
  disabled = false,
  onClick,
  type = 'button',
  style: styleProp = {},
  ...rest
}) {
  const pads = {
    sm: '8px 18px',
    md: '12px 26px',
    lg: '16px 34px',
  };
  const fontSizes = { sm: 14, md: 16, lg: 18 };

  const base = {
    display: full ? 'flex' : 'inline-flex',
    width: full ? '100%' : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    fontFamily: 'var(--font-body)',
    fontWeight: 'var(--weight-light)',
    fontSize: fontSizes[size],
    lineHeight: 1.2,
    padding: variant === 'tertiary' ? 0 : pads[size],
    borderRadius: 'var(--radius-pill)',
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };

  const variants = {
    primary: { background: 'var(--lhg-core-blue)', color: '#fff', borderColor: 'var(--lhg-core-blue)' },
    accent: { background: 'var(--lhg-blue-500)', color: '#fff', borderColor: 'var(--lhg-blue-500)' },
    secondary: { background: 'transparent', color: 'var(--lhg-core-blue)', borderColor: 'var(--lhg-core-blue)' },
    ghost: { background: 'var(--lhg-blue-100)', color: 'var(--lhg-blue-600)', borderColor: 'transparent' },
    tertiary: { background: 'transparent', color: 'var(--lhg-blue-500)', borderColor: 'transparent', borderRadius: 0 },
    'on-dark': { background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,0.65)' },
  };

  const hovers = {
    primary: { background: 'var(--lhg-blue-600)', borderColor: 'var(--lhg-blue-600)' },
    accent: { background: 'var(--lhg-blue-600)', borderColor: 'var(--lhg-blue-600)' },
    secondary: { background: 'var(--lhg-core-blue)', color: '#fff' },
    ghost: { background: '#d6e4ff' },
    tertiary: { color: 'var(--lhg-blue-600)' },
    'on-dark': { background: 'rgba(255,255,255,0.12)', borderColor: '#fff' },
  };

  const [hover, setHover] = React.useState(false);
  const style = { ...base, ...variants[variant], ...(hover && !disabled ? hovers[variant] : {}), ...styleProp };

  return (
    <button
      type={type}
      style={style}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...rest}
    >
      {iconLeft}
      <span>{children}</span>
      {iconRight}
    </button>
  );
}
