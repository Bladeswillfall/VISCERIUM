import { defaultCalendarId, isRegisteredCalendar, toAbsoluteDay } from '../calendar/runtime.mjs';
import {
  CERTAINTY_LEVELS,
  EDITORIAL_OVERRIDES,
  IMPORTANCE_LEVELS,
  TIMELINE_IDS,
  TIMELINE_KINDS,
  assertSyntheticDateRange,
  compareTimelineEvents,
  isSuperTimelineEvent,
  normalizeArray,
  normalizeEraId,
  normalizeId,
  resolveEraMembership,
  stableEventId,
} from './core.mjs';

const REQUIRED_ERA_IDS = TIMELINE_IDS.filter((id) => id !== 'super');

export class TimelineCompilationError extends Error {
  constructor(issues) {
    super(issues.map((issue) => `${issue.sourcePath} [${issue.field}] ${issue.message}`).join('\n'));
    this.name = 'TimelineCompilationError';
    this.issues = issues;
  }
}

function issue(issues, sourcePath, field, message, severity = 'error') {
  issues.push({ severity, sourcePath, field, message });
}

function asNumber(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function validateDateShape(value, sourcePath, field, issues) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    issue(issues, sourcePath, field, 'Missing structured calendar date. Use calendarDate/calendarEndDate.');
    return null;
  }
  if (typeof value.calendar !== 'string' || !value.calendar.trim()) {
    issue(issues, sourcePath, `${field}.calendar`, 'A source calendar ID is required.');
    return null;
  }
  if (!isRegisteredCalendar(value.calendar)) {
    issue(issues, sourcePath, `${field}.calendar`, `Unknown source calendar '${value.calendar}'.`);
    return null;
  }
  if (!Number.isInteger(value.year)) issue(issues, sourcePath, `${field}.year`, 'Year must be an integer.');
  const hasIntercalary = typeof value.intercalaryDay === 'string' && value.intercalaryDay.length > 0;
  const hasMonthDay = typeof value.month === 'string' && Number.isInteger(value.day);
  if (!hasIntercalary && !hasMonthDay) {
    issue(issues, sourcePath, field, 'Use either month/day or intercalaryDay.');
    return null;
  }
  if (value.precision !== undefined && !['day', 'month', 'year'].includes(value.precision)) {
    issue(issues, sourcePath, `${field}.precision`, `Invalid precision '${value.precision}'.`);
  }
  if (value.certainty !== undefined && !CERTAINTY_LEVELS.includes(value.certainty)) {
    issue(issues, sourcePath, `${field}.certainty`, `Invalid certainty '${value.certainty}'.`);
  }
  try {
    const absoluteDay = toAbsoluteDay(value);
    assertSyntheticDateRange(absoluteDay);
    return {
      source: value,
      absoluteDay,
      precision: value.precision ?? 'day',
      certainty: value.certainty ?? 'exact',
    };
  } catch (error) {
    issue(issues, sourcePath, field, error instanceof Error ? error.message : String(error));
    return null;
  }
}

function ensureNoLegacyTimelineFields(record, issues) {
  const timeline = record.data.timeline;
  if (!timeline || typeof timeline !== 'object') return;
  for (const field of ['id', 'year', 'date']) {
    if (timeline[field] !== undefined) {
      issue(
        issues,
        record.sourcePath,
        `timeline.${field}`,
        `Legacy timeline.${field} is not supported. Store chronology only in calendarDate/calendarEndDate; timeline IDs are generated.`,
      );
    }
  }
}

function compileEra(record, issues) {
  const { data, sourcePath, href } = record;
  const start = validateDateShape(data.calendarDate, sourcePath, 'calendarDate', issues);
  const end = validateDateShape(data.calendarEndDate, sourcePath, 'calendarEndDate', issues);
  const id = normalizeEraId(data.eraId ?? data.era ?? data.title);
  if (!id) issue(issues, sourcePath, 'eraId', 'Era records need a stable eraId.');
  if (!REQUIRED_ERA_IDS.includes(id)) issue(issues, sourcePath, 'eraId', `Unknown era '${id}'. Required IDs: ${REQUIRED_ERA_IDS.join(', ')}.`);
  const order = asNumber(data.timeline?.order);
  if (!Number.isInteger(order)) issue(issues, sourcePath, 'timeline.order', 'Era records require an integer order.');
  if (start && end && end.absoluteDay < start.absoluteDay) {
    issue(issues, sourcePath, 'calendarEndDate', 'Era end date is earlier than its start date.');
  }
  if (!start || !end || !id || !Number.isInteger(order)) return null;
  return {
    id,
    title: String(data.title ?? id),
    description: String(data.description ?? ''),
    href,
    sourcePath,
    absoluteStartDay: start.absoluteDay,
    absoluteEndDay: end.absoluteDay,
    order,
    visualToken: normalizeId(data.timeline?.visualToken ?? `era-${id}`),
    defaultViewport: data.timeline?.defaultViewport && typeof data.timeline.defaultViewport === 'object'
      ? {
          startDay: asNumber(data.timeline.defaultViewport.startDay),
          endDay: asNumber(data.timeline.defaultViewport.endDay),
          paddingDays: asNumber(data.timeline.defaultViewport.paddingDays),
        }
      : { paddingDays: 30 },
    allowGapAfter: data.timeline?.allowGapAfter === true,
  };
}

function compileEvent(record, eras, issues) {
  const { data, sourcePath, href } = record;
  const start = validateDateShape(data.calendarDate, sourcePath, 'calendarDate', issues);
  const end = data.calendarEndDate ? validateDateShape(data.calendarEndDate, sourcePath, 'calendarEndDate', issues) : null;
  if (!start) return null;
  if (end && end.absoluteDay < start.absoluteDay) issue(issues, sourcePath, 'calendarEndDate', 'Event end date is earlier than its start date.');

  const timeline = data.timeline && typeof data.timeline === 'object' ? data.timeline : {};
  const explicitKind = timeline.kind;
  const kind = explicitKind ?? (end ? 'period' : 'event');
  if (!TIMELINE_KINDS.includes(kind)) issue(issues, sourcePath, 'timeline.kind', `Invalid kind '${kind}'.`);
  if (kind === 'period' && !end) issue(issues, sourcePath, 'calendarEndDate', 'A period requires calendarEndDate.');

  const importance = timeline.importance ?? 'standard';
  if (!IMPORTANCE_LEVELS.includes(importance)) issue(issues, sourcePath, 'timeline.importance', `Invalid importance '${importance}'.`);
  const global = timeline.global ?? 'auto';
  if (!EDITORIAL_OVERRIDES.includes(global)) issue(issues, sourcePath, 'timeline.global', `Invalid global override '${global}'.`);
  const eraOverride = timeline.era ?? 'auto';
  if (eraOverride !== 'auto') issue(issues, sourcePath, 'timeline.era', "Era membership is chronological. Use 'auto'; deliberate cross-era events declare multiple values in the top-level era field.");

  const calculatedEras = resolveEraMembership(start.absoluteDay, end?.absoluteDay, eras);
  const declaredEras = normalizeArray(data.era).map(normalizeEraId);
  for (const declared of declaredEras) {
    if (!eras.some((era) => era.id === declared)) issue(issues, sourcePath, 'era', `Unknown era '${declared}'.`);
  }
  if (declaredEras.length) {
    const declared = [...declaredEras].sort().join(',');
    const calculated = [...calculatedEras].sort().join(',');
    if (declared !== calculated) {
      issue(issues, sourcePath, 'era', `Declared era membership [${declaredEras.join(', ')}] conflicts with chronology [${calculatedEras.join(', ')}].`);
    }
  }

  if (issues.some((entry) => entry.sourcePath === sourcePath && entry.severity === 'error')) return null;
  const id = stableEventId(sourcePath, data.title);
  return {
    id,
    title: String(data.title ?? id),
    description: String(data.description ?? ''),
    href,
    sourcePath,
    absoluteStartDay: start.absoluteDay,
    absoluteEndDay: end?.absoluteDay,
    precision: start.precision,
    endPrecision: end?.precision,
    certainty: start.certainty,
    kind,
    importance,
    categories: normalizeArray(timeline.categories, { ids: true }),
    lanes: normalizeArray(timeline.lanes, { ids: true }),
    eras: calculatedEras,
    factions: normalizeArray(data.faction),
    locations: normalizeArray(data.location),
    participants: normalizeArray(data.participants ?? data.character),
    status: typeof data.status === 'string' ? data.status : undefined,
    tags: normalizeArray(data.tags, { ids: true }),
    editorialOrder: asNumber(timeline.order),
    _global: global,
  };
}

function validateEraSequence(eras, issues) {
  const seen = new Set();
  for (const era of eras) {
    if (seen.has(era.id)) issue(issues, era.sourcePath ?? era.id, 'eraId', `Duplicate era ID '${era.id}'.`);
    seen.add(era.id);
  }
  for (const required of REQUIRED_ERA_IDS) {
    if (!seen.has(required)) issue(issues, 'Vault/Lore/Eras', 'eraId', `Missing required era record '${required}'.`);
  }
  const ordered = [...eras].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    if (current.absoluteStartDay <= previous.absoluteEndDay) {
      issue(issues, current.sourcePath ?? current.id, 'calendarDate', `Era '${current.id}' overlaps '${previous.id}'.`);
    } else if (current.absoluteStartDay > previous.absoluteEndDay + 1 && !previous.allowGapAfter) {
      issue(issues, current.sourcePath ?? current.id, 'calendarDate', `Gap follows era '${previous.id}'. Set timeline.allowGapAfter: true on that era when intentional.`);
    }
  }
  return ordered;
}

function datasetRange(events, eras) {
  const starts = [...events.map((event) => event.absoluteStartDay), ...eras.map((era) => era.absoluteStartDay)];
  const ends = [...events.map((event) => event.absoluteEndDay ?? event.absoluteStartDay), ...eras.map((era) => era.absoluteEndDay)];
  return {
    start: starts.length ? Math.min(...starts) : 0,
    end: ends.length ? Math.max(...ends) : 0,
  };
}

function deterministicGeneratedAt() {
  const epoch = Number(process.env.SOURCE_DATE_EPOCH ?? 0);
  return new Date(Number.isFinite(epoch) ? epoch * 1000 : 0).toISOString();
}

export function compileTimelineRecords(records, options = {}) {
  const issues = [];
  for (const record of records) ensureNoLegacyTimelineFields(record, issues);

  const eraRecords = records.filter((record) => record.data?.type === 'era' || record.data?.timeline?.kind === 'era');
  let eras = eraRecords.map((record) => compileEra(record, issues)).filter(Boolean);
  eras = validateEraSequence(eras, issues);

  const eventRecords = records.filter((record) => record.data?.type === 'event' || TIMELINE_KINDS.includes(record.data?.timeline?.kind));
  const events = eventRecords.map((record) => compileEvent(record, eras, issues)).filter(Boolean);
  const eventIds = new Set();
  for (const event of events) {
    if (eventIds.has(event.id)) issue(issues, event.sourcePath ?? event.id, 'id', `Duplicate compiled event ID '${event.id}'.`);
    eventIds.add(event.id);
  }

  if (issues.some((entry) => entry.severity === 'error') && options.throwOnError !== false) throw new TimelineCompilationError(issues);

  events.sort(compareTimelineEvents);
  const generatedAt = deterministicGeneratedAt();
  const datasets = {};

  const superEvents = events.filter((event) => isSuperTimelineEvent(event.importance, event._global));
  const superRange = datasetRange(superEvents, eras);
  datasets.super = {
    id: 'super',
    title: 'The VISCERIUM Timeline',
    description: 'Major and landmark events across CITADEL, SMOG, NEARSIGHT and ENTROPY.',
    defaultCalendar: defaultCalendarId,
    absoluteStartDay: superRange.start,
    absoluteEndDay: superRange.end,
    events: superEvents.map(({ _global, ...event }) => event),
    eras,
    generatedAt,
  };

  for (const era of eras) {
    const eraEvents = events.filter((event) => event.eras.includes(era.id));
    datasets[era.id] = {
      id: era.id,
      title: `${era.title} Timeline`,
      description: era.description,
      defaultCalendar: defaultCalendarId,
      absoluteStartDay: era.absoluteStartDay,
      absoluteEndDay: era.absoluteEndDay,
      events: eraEvents.map(({ _global, ...event }) => event),
      eras: [era],
      generatedAt,
    };
  }

  const timelines = TIMELINE_IDS.map((id) => {
    const dataset = datasets[id];
    const era = id === 'super' ? undefined : eras.find((item) => item.id === id);
    return {
      id,
      title: dataset.title,
      description: dataset.description,
      href: `/timelines/${id}/`,
      eventCount: dataset.events.length,
      absoluteStartDay: dataset.absoluteStartDay,
      absoluteEndDay: dataset.absoluteEndDay,
      defaultCalendar: dataset.defaultCalendar,
      eraArticle: era?.href,
    };
  });

  return {
    issues,
    eras,
    events: events.map(({ _global, ...event }) => event),
    datasets,
    manifest: { generatedAt, timelines },
  };
}
