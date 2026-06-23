import * as React from 'react';

export interface SelectOption { value: string; label: string; }

/** Styled native select matching Input. */
export interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Strings or {value,label} objects. */
  options: Array<string | SelectOption>;
  disabled?: boolean;
  hint?: string;
}

export function Select(props: SelectProps): JSX.Element;
