import * as React from 'react';

export interface SegmentOption { value: string; label: string; }

/** Pill segmented control; active option lifts to a white pill. */
export interface SegmentedControlProps {
  options: Array<string | SegmentOption>;
  value?: string;
  onChange?: (value: string) => void;
  /** @default "md" */
  size?: 'sm' | 'md';
}

export function SegmentedControl(props: SegmentedControlProps): JSX.Element;
