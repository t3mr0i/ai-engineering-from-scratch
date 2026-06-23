import * as React from 'react';

/** Pill search field with leading icon and submit button. */
export interface SearchBarProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (value?: string) => void;
  placeholder?: string;
  /** Px width. @default 360 */
  width?: number;
}

export function SearchBar(props: SearchBarProps): JSX.Element;
