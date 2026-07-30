export type CalendarSeason = 'winter' | 'spring' | 'summer' | 'autumn' | string;

export type CalendarDatePrecision = 'day' | 'month' | 'year';
export type CalendarDateCertainty = 'exact' | 'approximate' | 'disputed' | 'legendary';

export type CalendarLeapRule = {
  every: number;
  remainder?: number;
  label?: string;
};

export type CalendarEpoch = {
  absoluteDay: number;
  year: number;
  month: string;
  day: number;
  weekday: string;
};

export type CalendarMonth = {
  slug: string;
  name: string;
  ordinal: number;
  days: number;
  seasonSegments: Array<{
    season: CalendarSeason;
    start: number;
    end: number;
  }>;
};

export type CalendarIntercalaryDay = {
  slug: string;
  name: string;
  day: number;
  leapOnly?: boolean;
  season: CalendarSeason;
  description?: string;
};

export type CalendarObservanceType = 'solstice' | 'equinox' | 'holiday' | 'season-marker' | string;

export type CalendarObservance = {
  slug: string;
  name: string;
  type: CalendarObservanceType;
  month?: string;
  day?: number;
  intercalaryDay?: string;
  description?: string;
  href?: string;
  article?: string;
};

export type CalendarEventLink = string | {
  href?: string;
  article?: string;
  label?: string;
};

export type CalendarEventLinks = Record<string, CalendarEventLink>;

export type CalendarDefinition = {
  id: string;
  name: string;
  shortName?: string;
  description?: string;
  defaultYear: number;
  epoch: CalendarEpoch;
  weekdays: string[];
  leapRule?: CalendarLeapRule;
  months: CalendarMonth[];
  intercalaryDays: CalendarIntercalaryDay[];
  observances: CalendarObservance[];
};

export type CalendarDateInput = {
  calendar: string;
  year: number;
  month?: string;
  day?: number;
  intercalaryDay?: string;
  precision?: CalendarDatePrecision;
  certainty?: CalendarDateCertainty;
  displayCalendars?: string[];
};

export type ResolvedCalendarDate = {
  calendar: CalendarDefinition;
  source: CalendarDateInput;
  absoluteDay: number;
  year: number;
  weekday: string;
  dayOfYear: number;
  season: CalendarSeason;
  observances: CalendarObservance[];
  month?: CalendarMonth;
  day?: number;
  intercalaryDay?: CalendarIntercalaryDay;
  anchor: string;
  href: string;
  label: string;
  shortLabel: string;
};
