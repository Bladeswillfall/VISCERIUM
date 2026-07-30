import { okseCalendar } from '../../data/calendars/okse.mjs';

export const calendars = [okseCalendar];
export const defaultCalendarId = okseCalendar.id;

const yearDayCache = new Map();

function mod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function padDay(day) {
  return String(day).padStart(2, '0');
}

function countCongruentYears(startInclusive, endExclusive, every, remainder) {
  if (endExclusive <= startInclusive) return 0;
  return Math.floor((endExclusive - 1 - remainder) / every) - Math.floor((startInclusive - 1 - remainder) / every);
}

export function getCalendar(calendarId = defaultCalendarId) {
  const calendar = calendars.find((item) => item.id === calendarId);
  if (!calendar) throw new Error(`Unknown calendar: ${calendarId}`);
  return calendar;
}

export function isRegisteredCalendar(calendarId) {
  return calendars.some((calendar) => calendar.id === calendarId);
}

export function formatCalendarYear(year) {
  return new Intl.NumberFormat('en-GB').format(year);
}

export function isLeapYear(calendar, year) {
  if (!calendar.leapRule) return false;
  return mod(year, calendar.leapRule.every) === (calendar.leapRule.remainder ?? 0);
}

export function getMonth(calendar, slug) {
  const month = calendar.months.find((item) => item.slug === slug);
  if (!month) throw new Error(`Unknown month '${slug}' in calendar '${calendar.id}'`);
  return month;
}

export function getIntercalaryDay(calendar, slug, year) {
  const day = calendar.intercalaryDays.find((item) => item.slug === slug);
  if (!day) throw new Error(`Unknown intercalary day '${slug}' in calendar '${calendar.id}'`);
  if (day.leapOnly && !isLeapYear(calendar, year)) {
    throw new Error(`${day.name} ${day.day} only exists in leap years for calendar '${calendar.id}'`);
  }
  return day;
}

export function getDaysInYear(calendar, year) {
  const key = `${calendar.id}:${year}`;
  const cached = yearDayCache.get(key);
  if (cached !== undefined) return cached;
  const monthDays = calendar.months.reduce((total, month) => total + month.days, 0);
  const intercalaryDays = calendar.intercalaryDays.filter((day) => !day.leapOnly || isLeapYear(calendar, year)).length;
  const total = monthDays + intercalaryDays;
  yearDayCache.set(key, total);
  return total;
}

export function getDaysBeforeYear(calendar, year) {
  const epochYear = calendar.epoch.year;
  if (year === epochYear) return 0;
  const monthDays = calendar.months.reduce((total, month) => total + month.days, 0);
  const regularIntercalaries = calendar.intercalaryDays.filter((day) => !day.leapOnly).length;
  const leapIntercalaries = calendar.intercalaryDays.filter((day) => day.leapOnly).length;
  const baseDays = monthDays + regularIntercalaries;
  const start = Math.min(epochYear, year);
  const end = Math.max(epochYear, year);
  const yearCount = end - start;
  let leapCount = 0;
  if (calendar.leapRule && leapIntercalaries > 0) {
    leapCount = countCongruentYears(start, end, calendar.leapRule.every, calendar.leapRule.remainder ?? 0);
  }
  const days = yearCount * baseDays + leapCount * leapIntercalaries;
  return year > epochYear ? days : -days;
}

export function getDayOfYear(calendar, input) {
  if (!Number.isInteger(input.year)) throw new Error(`Calendar date in '${calendar.id}' needs an integer year`);
  if (input.intercalaryDay) {
    const intercalaryDay = getIntercalaryDay(calendar, input.intercalaryDay, input.year);
    const monthDays = calendar.months.reduce((total, month) => total + month.days, 0);
    const visible = calendar.intercalaryDays.filter((day) => !day.leapOnly || isLeapYear(calendar, input.year));
    const index = visible.findIndex((day) => day.slug === intercalaryDay.slug);
    return monthDays + index + 1;
  }
  if (!input.month || !Number.isInteger(input.day)) {
    throw new Error(`Calendar date in '${calendar.id}' needs either month/day or intercalaryDay`);
  }
  const month = getMonth(calendar, input.month);
  if (input.day < 1 || input.day > month.days) throw new Error(`Invalid day '${input.day}' for ${month.name}`);
  const daysBeforeMonth = calendar.months
    .filter((item) => item.ordinal < month.ordinal)
    .reduce((total, item) => total + item.days, 0);
  return daysBeforeMonth + input.day;
}

export function toAbsoluteDay(input) {
  if (!input || typeof input !== 'object') throw new Error('Calendar date must be an object');
  const calendar = getCalendar(input.calendar);
  return calendar.epoch.absoluteDay + getDaysBeforeYear(calendar, input.year) + getDayOfYear(calendar, input) - 1;
}

function getSeasonForMonthDay(month, day) {
  return month.seasonSegments.find((item) => day >= item.start && day <= item.end)?.season ?? 'unknown';
}

function getObservances(calendar, input) {
  if (input.intercalaryDay) return calendar.observances.filter((item) => item.intercalaryDay === input.intercalaryDay);
  return calendar.observances.filter((item) => item.month === input.month && item.day === input.day);
}

function getAnchor(input) {
  if (input.intercalaryDay) return input.intercalaryDay;
  if (!input.month || !input.day) return 'unknown-date';
  return `${input.month}-${padDay(input.day)}`;
}

function getWeekday(calendar, absoluteDay) {
  const epochWeekday = calendar.weekdays.indexOf(calendar.epoch.weekday);
  const weekdayIndex = mod(epochWeekday + absoluteDay - calendar.epoch.absoluteDay, calendar.weekdays.length);
  return calendar.weekdays[weekdayIndex] ?? calendar.weekdays[0];
}

export function fromAbsoluteDay(absoluteDay, calendarId = defaultCalendarId) {
  if (!Number.isSafeInteger(absoluteDay)) throw new Error(`Absolute day must be a safe integer: ${absoluteDay}`);
  const calendar = getCalendar(calendarId);
  const delta = absoluteDay - calendar.epoch.absoluteDay;
  const baseDays = calendar.months.reduce((total, month) => total + month.days, 0)
    + calendar.intercalaryDays.filter((day) => !day.leapOnly).length;
  let year = calendar.epoch.year + Math.floor(delta / Math.max(1, baseDays));
  while (calendar.epoch.absoluteDay + getDaysBeforeYear(calendar, year) > absoluteDay) year -= 1;
  while (calendar.epoch.absoluteDay + getDaysBeforeYear(calendar, year + 1) <= absoluteDay) year += 1;
  let dayOfYear = absoluteDay - (calendar.epoch.absoluteDay + getDaysBeforeYear(calendar, year)) + 1;
  for (const month of calendar.months) {
    if (dayOfYear <= month.days) return { calendar: calendar.id, year, month: month.slug, day: dayOfYear };
    dayOfYear -= month.days;
  }
  const visibleIntercalaryDays = calendar.intercalaryDays.filter((day) => !day.leapOnly || isLeapYear(calendar, year));
  const intercalaryDay = visibleIntercalaryDays[dayOfYear - 1];
  if (!intercalaryDay) throw new Error(`Could not resolve absolute day ${absoluteDay} in calendar '${calendar.id}'`);
  return { calendar: calendar.id, year, intercalaryDay: intercalaryDay.slug };
}

export function formatCalendarDate(input, precision = input.precision ?? 'day', options = {}) {
  const calendar = getCalendar(input.calendar);
  const year = formatCalendarYear(input.year);
  if (precision === 'year') return year;
  if (input.intercalaryDay) {
    const intercalary = getIntercalaryDay(calendar, input.intercalaryDay, input.year);
    const short = precision === 'month' ? `${intercalary.name}, ${year}` : `${intercalary.name} ${padDay(intercalary.day)}, ${year}`;
    if (!options.includeWeekday || precision !== 'day') return short;
    return `${getWeekday(calendar, toAbsoluteDay(input))}, ${short}`;
  }
  const month = getMonth(calendar, input.month);
  if (precision === 'month') return `${month.name}, ${year}`;
  const short = `${input.day} ${month.name}, ${year}`;
  if (!options.includeWeekday) return short;
  return `${getWeekday(calendar, toAbsoluteDay(input))}, ${short}`;
}

export function formatAbsoluteDay(absoluteDay, calendarId = defaultCalendarId, precision = 'day', options = {}) {
  return formatCalendarDate(fromAbsoluteDay(absoluteDay, calendarId), precision, options);
}

export function resolveCalendarDate(input) {
  const calendar = getCalendar(input.calendar);
  const absoluteDay = toAbsoluteDay(input);
  const dayOfYear = getDayOfYear(calendar, input);
  const weekday = getWeekday(calendar, absoluteDay);
  const month = input.month ? getMonth(calendar, input.month) : undefined;
  const intercalaryDay = input.intercalaryDay ? getIntercalaryDay(calendar, input.intercalaryDay, input.year) : undefined;
  const anchor = getAnchor(input);
  const precision = input.precision ?? 'day';
  return {
    calendar,
    source: input,
    absoluteDay,
    year: input.year,
    weekday,
    dayOfYear,
    season: intercalaryDay?.season ?? (month && input.day ? getSeasonForMonthDay(month, input.day) : 'unknown'),
    observances: getObservances(calendar, input),
    month,
    day: input.day,
    intercalaryDay,
    anchor,
    href: `/calendar/${calendar.id}/#${anchor}`,
    label: formatCalendarDate(input, precision, { includeWeekday: precision === 'day' }),
    shortLabel: formatCalendarDate(input, precision),
  };
}

export function resolveEquivalentDates(input, calendarIds) {
  const absoluteDay = toAbsoluteDay(input);
  const requested = calendarIds?.length ? calendarIds : input.displayCalendars;
  const ids = requested?.length ? requested : [input.calendar];
  return ids.map((calendarId) => resolveCalendarDate({ ...fromAbsoluteDay(absoluteDay, calendarId), precision: input.precision }));
}

export function getCalendarYearDates(calendarId, year) {
  const calendar = getCalendar(calendarId);
  const dates = [];
  for (const month of calendar.months) {
    for (let day = 1; day <= month.days; day += 1) dates.push({ calendar: calendar.id, year, month: month.slug, day });
  }
  for (const day of calendar.intercalaryDays) {
    if (!day.leapOnly || isLeapYear(calendar, year)) dates.push({ calendar: calendar.id, year, intercalaryDay: day.slug });
  }
  return dates.map(resolveCalendarDate);
}
