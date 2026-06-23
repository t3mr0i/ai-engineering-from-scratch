import * as React from 'react';

export interface TabItem { value: string; label: string; }

/** Underline tab bar with a Blue 500 active indicator. */
export interface TabsProps {
  /** Strings or {value,label} objects. */
  tabs: Array<string | TabItem>;
  value?: string;
  onChange?: (value: string) => void;
}

export function Tabs(props: TabsProps): JSX.Element;
