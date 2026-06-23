import * as React from 'react';

/** Icon-only button. Pass a Phosphor light class to `icon`. */
export interface IconButtonProps {
  /** Phosphor class, e.g. "ph-magnifying-glass". */
  icon: string;
  /** Accessible label (also the tooltip). */
  label: string;
  /** @default "ghost" */
  variant?: 'ghost' | 'solid' | 'outline';
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  onClick?: (e: React.MouseEvent) => void;
}

export function IconButton(props: IconButtonProps): JSX.Element;
