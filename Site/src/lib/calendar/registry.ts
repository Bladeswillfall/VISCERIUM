import * as runtime from './runtime.mjs';
import type { CalendarDefinition } from './types';

export const calendars = runtime.calendars as CalendarDefinition[];
export const defaultCalendarId: string = runtime.defaultCalendarId;
export const getCalendar: (calendarId?: string) => CalendarDefinition = runtime.getCalendar;
export const isRegisteredCalendar: (calendarId: string) => boolean = runtime.isRegisteredCalendar;
