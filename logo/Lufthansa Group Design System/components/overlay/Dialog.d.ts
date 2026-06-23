import * as React from 'react';

/** Centered modal dialog with navy scrim. Controlled via `open`. */
export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  title: string;
  children?: React.ReactNode;
  /** @default "Confirm" */
  primaryLabel?: string;
  onPrimary?: () => void;
  /** @default "Cancel"; pass "" to hide. */
  secondaryLabel?: string;
  /** Px width. @default 460 */
  width?: number;
}

export function Dialog(props: DialogProps): JSX.Element | null;
