import * as React from 'react';

/** Pill badge for status and category labels. */
export interface BadgeProps {
  children: React.ReactNode;
  /** @default "neutral" */
  tone?: 'neutral' | 'blue' | 'success' | 'warning' | 'error' | 'teal' | 'purple';
  /** Optional Phosphor light class. */
  icon?: string | null;
}

export function Badge(props: BadgeProps): JSX.Element;
