import * as React from 'react';

export interface StepItem { label: string; }

/** Horizontal step indicator for booking / check-in flows. */
export interface StepperProps {
  steps: Array<string | StepItem>;
  /** Zero-based index of the active step. @default 0 */
  current?: number;
}

export function Stepper(props: StepperProps): JSX.Element;
