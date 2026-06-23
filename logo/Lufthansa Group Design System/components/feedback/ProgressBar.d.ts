import * as React from 'react';

/** Thin linear progress bar (0–100). */
export interface ProgressBarProps {
  /** 0–100 */
  value?: number;
  /** @default "blue" */
  tone?: 'blue' | 'core' | 'teal' | 'success';
  label?: string;
  showValue?: boolean;
}

export function ProgressBar(props: ProgressBarProps): JSX.Element;
