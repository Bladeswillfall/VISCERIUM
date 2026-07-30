import {
  fromAbsoluteDay,
  getCalendar,
  getDaysBeforeYear,
} from '../calendar/runtime.mjs';

const YEAR_TICK_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1_000, 2_000, 5_000, 10_000];
const PRIMARY_MINIMUM_PX = 96;
const PRIMARY_HYSTERESIS_MINIMUM_PX = 78;
const PRIMARY_HYSTERESIS_MAXIMUM_PX = 212;
const SECONDARY_MINIMUM_PX = 20;
const MAX_YEAR_SCALE_EXPONENT = 13;

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function averageYearDays(calendar) {
  const monthDays = calendar.months.reduce((total, month) => total + month.days, 0);
  const regularIntercalaries = calendar.intercalaryDays.filter((day) => !day.leapOnly).length;
  const leapIntercalaries = calendar.intercalaryDays.filter((day) => day.leapOnly).length;
  const leapContribution = calendar.leapRule
    ? leapIntercalaries / Math.max(1, calendar.leapRule.every)
    : 0;
  return monthDays + regularIntercalaries + leapContribution;
}

function scaleKey(unit, interval = 1) {
  return `${unit}:${interval}`;
}

function makeScale(unit, interval, durationDays) {
  return {
    key: scaleKey(unit, interval),
    unit,
    interval,
    durationDays,
    labelPrecision: unit === 'year' ? 'year' : unit === 'month' ? 'month' : 'day',
  };
}

function buildScaleCandidates(calendar) {
  const yearDays = averageYearDays(calendar);
  const weekDays = Math.max(1, calendar.weekdays.length);
  const monthDays = yearDays / Math.max(1, calendar.months.length);
  const candidates = [
    makeScale('day', 1, 1),
    makeScale('week', 1, weekDays),
    makeScale('month', 1, monthDays),
  ];

  for (let exponent = 0; exponent <= MAX_YEAR_SCALE_EXPONENT; exponent += 1) {
    const magnitude = 10 ** exponent;
    for (const leading of [1, 2, 5]) {
      const interval = leading * magnitude;
      candidates.push(makeScale('year', interval, interval * yearDays));
    }
  }

  return candidates.sort((left, right) => left.durationDays - right.durationDays);
}

function secondaryScaleFor(primary, calendar) {
  if (!primary || primary.unit === 'day') return undefined;
  if (primary.unit === 'week') return makeScale('day', 1, 1);
  if (primary.unit === 'month') {
    return makeScale('week', 1, Math.max(1, calendar.weekdays.length));
  }
  if (primary.interval === 1) {
    return makeScale(
      'month',
      1,
      averageYearDays(calendar) / Math.max(1, calendar.months.length),
    );
  }

  const magnitude = 10 ** Math.floor(Math.log10(primary.interval));
  const leading = Math.round(primary.interval / magnitude);
  const interval = leading === 1
    ? magnitude / 2
    : leading === 2
      ? magnitude / 2
      : magnitude;
  return makeScale('year', Math.max(1, interval), Math.max(1, interval) * averageYearDays(calendar));
}

export function calendarYearBoundaries(startDay, endDay, calendarId, interval = 1) {
  if (!Number.isFinite(startDay) || !Number.isFinite(endDay) || startDay > endDay) return [];

  const calendar = getCalendar(calendarId);
  const step = Math.max(1, Math.floor(Number(interval) || 1));
  const firstYear = fromAbsoluteDay(Math.floor(startDay), calendarId).year;
  const lastYear = fromAbsoluteDay(Math.ceil(endDay), calendarId).year;
  const firstAlignedYear = Math.ceil(firstYear / step) * step;
  const boundaries = [];

  for (let year = firstAlignedYear; year <= lastYear; year += step) {
    const absoluteDay = calendar.epoch.absoluteDay + getDaysBeforeYear(calendar, year);
    if (absoluteDay < startDay || absoluteDay > endDay) continue;
    boundaries.push({ year, absoluteDay, unit: 'year', interval: step });
  }

  return boundaries;
}

export function calendarMonthBoundaries(startDay, endDay, calendarId) {
  if (!Number.isFinite(startDay) || !Number.isFinite(endDay) || startDay > endDay) return [];

  const calendar = getCalendar(calendarId);
  const firstYear = fromAbsoluteDay(Math.floor(startDay), calendarId).year;
  const lastYear = fromAbsoluteDay(Math.ceil(endDay), calendarId).year;
  const boundaries = [];

  for (let year = firstYear; year <= lastYear; year += 1) {
    const yearStart = calendar.epoch.absoluteDay + getDaysBeforeYear(calendar, year);
    let daysBeforeMonth = 0;
    for (const month of calendar.months) {
      const absoluteDay = yearStart + daysBeforeMonth;
      if (absoluteDay >= startDay && absoluteDay <= endDay) {
        boundaries.push({
          year,
          month: month.slug,
          monthOrdinal: month.ordinal,
          absoluteDay,
          unit: 'month',
          interval: 1,
        });
      }
      daysBeforeMonth += month.days;
    }
  }

  return boundaries;
}

export function calendarWeekBoundaries(startDay, endDay, calendarId) {
  if (!Number.isFinite(startDay) || !Number.isFinite(endDay) || startDay > endDay) return [];

  const calendar = getCalendar(calendarId);
  const weekDays = Math.max(1, calendar.weekdays.length);
  const first = calendar.epoch.absoluteDay
    + Math.ceil((startDay - calendar.epoch.absoluteDay) / weekDays) * weekDays;
  const boundaries = [];

  for (let absoluteDay = first; absoluteDay <= endDay; absoluteDay += weekDays) {
    boundaries.push({ absoluteDay, unit: 'week', interval: 1 });
  }

  return boundaries;
}

export function calendarDayBoundaries(startDay, endDay) {
  if (!Number.isFinite(startDay) || !Number.isFinite(endDay) || startDay > endDay) return [];
  const boundaries = [];
  for (let absoluteDay = Math.ceil(startDay); absoluteDay <= endDay; absoluteDay += 1) {
    boundaries.push({ absoluteDay, unit: 'day', interval: 1 });
  }
  return boundaries;
}

export function calendarTickBoundaries(startDay, endDay, calendarId, scale) {
  if (!scale) return [];
  if (scale.unit === 'year') {
    return calendarYearBoundaries(startDay, endDay, calendarId, scale.interval);
  }
  if (scale.unit === 'month') return calendarMonthBoundaries(startDay, endDay, calendarId);
  if (scale.unit === 'week') return calendarWeekBoundaries(startDay, endDay, calendarId);
  return calendarDayBoundaries(startDay, endDay);
}

export function selectAdaptiveTimelineScale({
  startDay,
  endDay,
  calendarId,
  width,
  previousScaleKey,
}) {
  const calendar = getCalendar(calendarId);
  const span = Math.max(1, endDay - startDay);
  const usableWidth = Math.max(1, Number(width) || 1);
  const candidates = buildScaleCandidates(calendar);
  const previous = previousScaleKey
    ? candidates.find((candidate) => candidate.key === previousScaleKey)
    : undefined;

  if (previous) {
    const previousSpacing = (previous.durationDays / span) * usableWidth;
    if (
      previousSpacing >= PRIMARY_HYSTERESIS_MINIMUM_PX
      && previousSpacing <= PRIMARY_HYSTERESIS_MAXIMUM_PX
    ) {
      const secondary = secondaryScaleFor(previous, calendar);
      return {
        primary: previous,
        secondary: secondary && (secondary.durationDays / span) * usableWidth >= SECONDARY_MINIMUM_PX
          ? secondary
          : undefined,
      };
    }
  }

  const minimumDuration = (span * PRIMARY_MINIMUM_PX) / usableWidth;
  const primary = candidates.find((candidate) => candidate.durationDays >= minimumDuration)
    ?? candidates.at(-1);
  const secondary = secondaryScaleFor(primary, calendar);
  return {
    primary,
    secondary: secondary && (secondary.durationDays / span) * usableWidth >= SECONDARY_MINIMUM_PX
      ? secondary
      : undefined,
  };
}

export function createAdaptiveTimelineTicks({
  startDay,
  endDay,
  calendarId,
  width,
  previousScaleKey,
}) {
  const scale = selectAdaptiveTimelineScale({
    startDay,
    endDay,
    calendarId,
    width,
    previousScaleKey,
  });
  const primary = calendarTickBoundaries(startDay, endDay, calendarId, scale.primary);
  const primaryDays = new Set(primary.map(({ absoluteDay }) => absoluteDay));
  const secondary = calendarTickBoundaries(startDay, endDay, calendarId, scale.secondary)
    .filter(({ absoluteDay }) => !primaryDays.has(absoluteDay));

  return {
    primaryScale: scale.primary,
    secondaryScale: scale.secondary,
    primary,
    secondary,
    labelPrecision: scale.primary.labelPrecision,
  };
}

export function selectCalendarYearTicks(startDay, endDay, calendarId, maximumCount = 6) {
  const boundaries = calendarYearBoundaries(startDay, endDay, calendarId);
  const count = Math.max(2, Math.floor(Number(maximumCount) || 6));
  if (boundaries.length <= count) return boundaries;

  const firstYear = boundaries[0].year;
  const lastYear = boundaries.at(-1).year;
  const rawStep = Math.max(1, (lastYear - firstYear) / Math.max(1, count - 1));
  const step = YEAR_TICK_STEPS.find((candidate) => candidate >= rawStep)
    ?? Math.max(1, Math.ceil(rawStep / 10_000) * 10_000);
  const selected = boundaries.filter(({ year }) => positiveModulo(year, step) === 0);

  if (selected.length >= 2) return selected;
  return [boundaries[0], boundaries.at(-1)].filter((boundary, index, values) => (
    index === 0 || boundary.absoluteDay !== values[index - 1].absoluteDay
  ));
}

export function createTimelineYearGridItems({
  startDay,
  endDay,
  calendarId,
  toSyntheticDate,
}) {
  if (typeof toSyntheticDate !== 'function') {
    throw new TypeError('Timeline year grid requires a synthetic date converter.');
  }

  return calendarYearBoundaries(startDay, endDay, calendarId).map(({ year, absoluteDay }) => {
    const classNames = ['vc-year-grid-line'];
    if (year % 100 === 0) classNames.push('is-century');
    else if (year % 10 === 0) classNames.push('is-decade');

    return {
      id: `year-grid:${calendarId}:${year}`,
      start: toSyntheticDate(absoluteDay),
      end: toSyntheticDate(absoluteDay + 1),
      type: 'background',
      content: '',
      selectable: false,
      editable: false,
      className: classNames.join(' '),
      data: {
        kind: 'year-grid',
        year,
        absoluteDay,
      },
    };
  });
}
