import type { CalendarDatePrecision } from '../calendar/types';

export type TimelineEventData = {
  id: string;
  absoluteStartDay: number;
  absoluteEndDay?: number;
  precision: CalendarDatePrecision;
  endPrecision?: CalendarDatePrecision;
  title: string;
  description?: string;
  href: string;
  [key: string]: unknown;
};

export type TimelineDataset = {
  title?: string;
  description?: string;
  defaultCalendar?: string;
  events: TimelineEventData[];
  [key: string]: unknown;
};
