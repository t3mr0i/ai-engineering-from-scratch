import * as React from 'react';

/** Multi-line text field matching Input. */
export interface TextareaProps {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  /** @default 4 */
  rows?: number;
  hint?: string;
  disabled?: boolean;
}

export function Textarea(props: TextareaProps): JSX.Element;
