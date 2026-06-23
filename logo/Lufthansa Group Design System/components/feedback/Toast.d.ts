import * as React from 'react';

/** Toast notification card — white surface, soft shadow, tone icon, optional close. */
export interface ToastProps {
  /** @default "info" */
  tone?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children?: React.ReactNode;
  onClose?: () => void;
}

export function Toast(props: ToastProps): JSX.Element;
