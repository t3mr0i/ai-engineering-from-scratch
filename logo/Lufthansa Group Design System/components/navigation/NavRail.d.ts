import * as React from 'react';

export interface NavRailItem { value: string; label: string; icon: string; }

/** Slim vertical navigation rail (LHG brand-portal pattern); active item is a white pill. */
export interface NavRailProps {
  items: NavRailItem[];
  active?: string;
  onChange?: (value: string) => void;
  brand?: boolean;
}

export function NavRail(props: NavRailProps): JSX.Element;
