import * as React from 'react';

export interface FarePerk { label: string; included: boolean; }

/** Fare / cabin option card with perk list and select state. */
export interface FareCardProps {
  name: string;
  price: string | number;
  /** @default "€" */
  currency?: string;
  /** Strings (all included) or {label,included} objects. */
  perks?: Array<string | FarePerk>;
  /** Highlight as the recommended option. @default false */
  featured?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export function FareCard(props: FareCardProps): JSX.Element;
