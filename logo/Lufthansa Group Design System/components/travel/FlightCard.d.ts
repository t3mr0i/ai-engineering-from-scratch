import * as React from 'react';

/** Flight result row — departure/arrival, route, duration, stops, price + select. */
export interface FlightCardProps {
  depTime: string;
  arrTime: string;
  from: string;
  to: string;
  duration: string;
  /** e.g. "Direct" or "1 stop". @default "Direct" */
  stops?: string;
  /** @default "Lufthansa" */
  airline?: string;
  flightNo?: string;
  price: string | number;
  /** @default "€" */
  currency?: string;
  onSelect?: () => void;
  selected?: boolean;
}

export function FlightCard(props: FlightCardProps): JSX.Element;
