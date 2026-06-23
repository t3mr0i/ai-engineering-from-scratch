import * as React from 'react';

/** Hero statistic — large thin number, optional progress arc. The LHG report look. */
export interface StatProps {
  value: string | number;
  unit?: string;
  label?: string;
  /** @default "blue" */
  tone?: 'blue' | 'core' | 'red' | 'teal' | 'purple' | 'sand';
  /** 0–100; when set, renders a thin arc ring around the value. */
  progress?: number | null;
}

export function Stat(props: StatProps): JSX.Element;
