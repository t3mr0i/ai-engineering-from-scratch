import * as React from 'react';

/** Single-line text field with label, optional leading icon, hint/error. */
export interface InputProps {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  /** @default "text" */
  type?: string;
  /** Phosphor light class for a leading icon. */
  icon?: string | null;
  error?: string;
  hint?: string;
  disabled?: boolean;
}

export function Input(props: InputProps): JSX.Element;
