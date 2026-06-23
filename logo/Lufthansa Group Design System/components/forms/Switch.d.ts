import * as React from 'react';

/** Pill toggle switch — Blue 500 when on. */
export interface SwitchProps {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch(props: SwitchProps): JSX.Element;
