import * as React from 'react';

/**
 * Pill-shaped Lufthansa Group button. Sentence-case labels, calm hover (darken).
 */
export interface ButtonProps {
  children: React.ReactNode;
  /** Visual style. @default "primary" */
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'tertiary' | 'on-dark';
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  /** Stretch to container width. @default false */
  full?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
}

export function Button(props: ButtonProps): JSX.Element;
