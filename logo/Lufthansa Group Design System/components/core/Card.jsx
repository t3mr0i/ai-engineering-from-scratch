import React from 'react';

/** White surface card — hairline border or soft shadow, soft radius, generous pad. */
export function Card({ children, elevated = false, pad = 'md', as = 'div', style = {}, ...rest }) {
  const pads = { sm: 16, md: 24, lg: 32 };
  const Tag = as;
  return (
    <Tag
      style={{
        background: 'var(--color-surface)',
        border: elevated ? 'none' : '1px solid var(--border-subtle)',
        boxShadow: elevated ? 'var(--shadow-md)' : 'none',
        borderRadius: 'var(--radius-lg)',
        padding: pads[pad],
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Optional structured sub-parts. */
Card.Eyebrow = function Eyebrow({ children }) {
  return <div style={{ font: '500 12px var(--font-body)', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--lhg-blue-500)', marginBottom: 10 }}>{children}</div>;
};
Card.Title = function Title({ children }) {
  return <h3 style={{ font: '300 22px/1.2 var(--font-display)', letterSpacing: '-.01em', color: 'var(--lhg-core-blue)', margin: '0 0 8px' }}>{children}</h3>;
};
Card.Body = function Body({ children }) {
  return <p style={{ font: '300 16px/1.5 var(--font-body)', color: 'var(--text-secondary)', margin: 0 }}>{children}</p>;
};
