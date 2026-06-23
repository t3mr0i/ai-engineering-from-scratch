import * as React from 'react';

/**
 * Quiet white surface card. Border by default, or soft shadow when `elevated`.
 * Compose with Card.Eyebrow / Card.Title / Card.Body.
 */
export interface CardProps {
  children: React.ReactNode;
  /** Use soft shadow instead of border. @default false */
  elevated?: boolean;
  /** @default "md" */
  pad?: 'sm' | 'md' | 'lg';
  as?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
}

export function Card(props: CardProps): JSX.Element;
