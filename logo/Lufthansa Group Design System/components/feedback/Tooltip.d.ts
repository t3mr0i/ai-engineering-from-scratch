import * as React from 'react';

/** Hover/focus tooltip — dark navy bubble. Wrap a single trigger. */
export interface TooltipProps {
  label: string;
  children: React.ReactNode;
  /** @default "top" */
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip(props: TooltipProps): JSX.Element;
