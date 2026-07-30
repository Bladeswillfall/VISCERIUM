import * as runtime from './runtime.mjs';
import type {
  CalendarDateInput,
  CalendarDatePrecision,
  CalendarDefinition,
  CalendarIntercalaryDay,
  CalendarMonth,
  ResolvedCalendarDate,
} from './types';

export const formatCalendarYear: (year: number) => string = runtime.formatCalendarYear;
export const isLeapYear: (calendar: CalendarDefinition, year: number) => boolean = runtime.isLeapYear;
export const getMonth: (calendar: CalendarDefinition, slug: string) => CalendarMonth = runtime.getMonth;
export const getIntercalaryDay: (calendar: CalendarDefinition, slug: string, year: number) => CalendarIntercalaryDay = runtime.getIntercalaryDay;
export const getDaysInYear: (calendar: CalendarDefinition, year: number) => number = runtime.getDaysInYear;
export const getDaysBeforeYear: (calendar: CalendarDefinition, year: number) => number = runtime.getDaysBeforeYear;
export const getDayOfYear: (calendar: CalendarDefinition, input: CalendarDateInput) => number = runtime.getDayOfYear;
export const toAbsoluteDay: (input: CalendarDateInput) => number = runtime.toAbsoluteDay;
export const fromAbsoluteDay: (absoluteDay: number, calendarId?: string) => CalendarDateInput = runtime.fromAbsoluteDay;
export const formatCalendarDate: (
  input: CalendarDateInput,
  precision?: CalendarDatePrecision,
  options?: { includeWeekday?: boolean },
) => string = runtime.formatCalendarDate;
export const formatAbsoluteDay: (
  absoluteDay: number,
  calendarId?: string,
  precision?: CalendarDatePrecision,
  options?: { includeWeekday?: boolean },
) => string = runtime.formatAbsoluteDay;
export const resolveCalendarDate: (input: CalendarDateInput) => ResolvedCalendarDate = runtime.resolveCalendarDate;
export const resolveEquivalentDates: (input: CalendarDateInput, calendarIds?: string[]) => ResolvedCalendarDate[] = runtime.resolveEquivalentDates;
export const getCalendarYearDates: (calendarId: string, year: number) => ResolvedCalendarDate[] = runtime.getCalendarYearDates;
