import * as React from 'react';

export interface RadioOption { value: string; label: string; }

/** Radio group with brand-blue selected dot. */
export interface RadioGroupProps {
  name: string;
  options: Array<string | RadioOption>;
  value?: string;
  onChange?: (value: string) => void;
  /** @default "column" */
  direction?: 'row' | 'column';
}

export function RadioGroup(props: RadioGroupProps): JSX.Element;
