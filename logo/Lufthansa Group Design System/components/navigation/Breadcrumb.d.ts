import * as React from 'react';

export interface CrumbItem { label: string; href?: string; }

/** Breadcrumb trail with caret separators; last item is the current page. */
export interface BreadcrumbProps {
  items: Array<string | CrumbItem>;
}

export function Breadcrumb(props: BreadcrumbProps): JSX.Element;
