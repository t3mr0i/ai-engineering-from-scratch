import * as React from 'react';

export interface AccordionItem { title: string; content: React.ReactNode; }

/** Hairline-divided accordion; caret rotates on open. */
export interface AccordionProps {
  items: AccordionItem[];
  /** Allow multiple panels open. @default false */
  multi?: boolean;
  /** Indices open initially. */
  defaultOpen?: number[];
}

export function Accordion(props: AccordionProps): JSX.Element;
