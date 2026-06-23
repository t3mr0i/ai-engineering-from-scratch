import * as React from 'react';

/** Inline notice banner with tone tint and thin left rule. */
export interface AlertProps {
  /** @default "info" */
  tone?: 'info' | 'success' | 'warning' | 'error' | 'note';
  title?: string;
  children?: React.ReactNode;
  /** Override the default Phosphor light icon. */
  icon?: string;
}

export function Alert(props: AlertProps): JSX.Element;
