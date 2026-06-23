import * as React from 'react';

/** Numbered pagination with prev/next; active page is Blue 500. */
export interface PaginationProps {
  page?: number;
  total?: number;
  onChange?: (page: number) => void;
}

export function Pagination(props: PaginationProps): JSX.Element;
