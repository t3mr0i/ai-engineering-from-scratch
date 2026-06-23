import * as React from 'react';

/** Hairline divider, optionally with a centered tracked label. */
export interface DividerProps {
  label?: string | null;
  /** Vertical margin in px. @default 24 */
  spacing?: number;
}

export function Divider(props: DividerProps): JSX.Element;
