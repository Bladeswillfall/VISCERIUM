import {
  formatCalendarYear,
  fromAbsoluteDay,
  getCalendar,
  getIntercalaryDay,
  getMonth,
} from '../calendar/runtime.mjs';
import { createAdaptiveTimelineTicks } from './year-grid.mjs';

const DAY_MS = 86_400_000;

function abbreviate(value, maximum = 7) {
  const text = String(value ?? '');
  return text.length <= maximum ? text : `${text.slice(0, maximum - 1)}.`;
}

function resolveAxisDate(absoluteDay, calendarId) {
  const input = fromAbsoluteDay(absoluteDay, calendarId);
  const calendar = getCalendar(calendarId);
  const year = formatCalendarYear(input.year);

  if (input.intercalaryDay) {
    const intercalary = getIntercalaryDay(calendar, input.intercalaryDay, input.year);
    return {
      input,
      year,
      monthName: intercalary.name,
      monthShort: abbreviate(intercalary.name),
      day: intercalary.day,
      intercalary: true,
    };
  }

  const month = getMonth(calendar, input.month);
  return {
    input,
    year,
    monthName: month.name,
    monthShort: abbreviate(month.name),
    day: input.day,
    intercalary: false,
  };
}

export function formatCalendarAxisLabel({
  absoluteDay,
  calendarId,
  scale,
  major = false,
}) {
  const resolved = resolveAxisDate(absoluteDay, calendarId);

  if (major) {
    if (scale === 'year') return '';
    if (scale === 'month') return resolved.year;
    if (scale === 'week' || scale === 'day' || scale === 'weekday') {
      return `${resolved.monthName}, ${resolved.year}`;
    }
    return `${resolved.day} ${resolved.monthName}, ${resolved.year}`;
  }

  if (scale === 'year') return resolved.year;
  if (scale === 'month') return resolved.monthShort;
  if (scale === 'week') return `${resolved.day} ${resolved.monthShort}`;
  if (scale === 'day' || scale === 'weekday') return String(resolved.day);
  return `${resolved.day} ${resolved.monthShort}`;
}

export function formatCalendarBoundaryLabel({ absoluteDay, calendarId, unit }) {
  const resolved = resolveAxisDate(absoluteDay, calendarId);
  if (unit === 'year') return resolved.year;
  if (unit === 'month') return `${resolved.monthShort} ${resolved.year}`;
  if (unit === 'week') return `${resolved.day} ${resolved.monthShort}`;
  return `${resolved.day} ${resolved.monthShort}`;
}

export function createCalendarAxisFormatter({
  getCalendarId,
  fromSyntheticDate,
  toSyntheticDate,
}) {
  let previousScaleKey;

  const format = (date, scale, major) => formatCalendarAxisLabel({
    absoluteDay: fromSyntheticDate(date),
    calendarId: getCalendarId(),
    scale,
    major,
  });

  return {
    formatMinorLabel: (date, scale) => format(date, scale, false),
    formatMajorLabel: (date, scale) => format(date, scale, true),
    resetScale() {
      previousScaleKey = undefined;
    },
    getTicks({ start, end, width }) {
      const calendarId = getCalendarId();
      const startDay = fromSyntheticDate(start);
      const endDay = fromSyntheticDate(end);
      const ticks = createAdaptiveTimelineTicks({
        startDay,
        endDay,
        calendarId,
        width,
        previousScaleKey,
      });
      previousScaleKey = ticks.primaryScale.key;

      const syntheticDateFor = (absoluteDay) => (
        typeof toSyntheticDate === 'function'
          ? toSyntheticDate(absoluteDay)
          : new Date(start.valueOf() + (absoluteDay - startDay) * DAY_MS)
      );
      const mapTick = (boundary, scale, kind) => ({
        absoluteDay: boundary.absoluteDay,
        date: syntheticDateFor(boundary.absoluteDay),
        unit: scale.unit,
        interval: scale.interval,
        kind,
        label: kind === 'primary'
          ? formatCalendarBoundaryLabel({
            absoluteDay: boundary.absoluteDay,
            calendarId,
            unit: scale.unit,
          })
          : '',
      });

      return {
        scaleKey: ticks.primaryScale.key,
        primary: ticks.primary.map((boundary) => mapTick(boundary, ticks.primaryScale, 'primary')),
        secondary: ticks.secondaryScale
          ? ticks.secondary.map((boundary) => mapTick(boundary, ticks.secondaryScale, 'secondary'))
          : [],
      };
    },
  };
}
