import { attachChronosStyles, parseChronos } from 'chronos-timeline-md';
import { escapeHtml } from '../codex-paths.mjs';
import { absoluteDayToSyntheticDate, capTimelineGroups, KNOWN_CATEGORY_TOKENS } from './core.mjs';

const CATEGORY_COLORS = {
  technology: 'cyan',
  military: 'orange',
  political: 'yellow',
  cultural: 'purple',
  religious: 'purple',
  economic: 'green',
  scientific: 'blue',
  disaster: 'red',
  resonance: 'purple',
  myrkild: 'green',
  naranor: 'pink',
  exploration: 'cyan',
  social: 'pink',
  environmental: 'green',
  unknown: 'orange',
};

const ERA_COLORS = {
  citadel: 'orange',
  smog: 'green',
  nearsight: 'cyan',
  entropy: 'purple',
};
function cleanChronosText(value) {
  const normalized = String(value ?? '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\|/g, ' — ')
    .replace(/\s+/g, ' ')
    .trim();
  return escapeHtml(normalized);
}

function cssToken(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
}

function titleCase(value) {
  return String(value ?? '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function chronosDate(absoluteDay, syntheticOriginDay) {
  const date = absoluteDayToSyntheticDate(absoluteDay, syntheticOriginDay);
  const yearValue = date.getUTCFullYear();
  if (yearValue < 0 || yearValue > 9999) {
    throw new Error(`Chronos requires a four-digit synthetic year; received ${yearValue} for world-day ${absoluteDay}`);
  }
  const year = String(yearValue).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildGroups(events, laneMode) {
  if (laneMode === 'unified') {
    const chronology = { key: 'chronology', label: 'Chronology' };
    return {
      groups: [chronology],
      groupFor: () => chronology,
    };
  }

  const values = events.map((event) => laneMode === 'category' ? event.categories : event.lanes);
  const cap = capTimelineGroups(values.map((entry) => entry.length ? entry : ['other']), 12);
  const visible = [...cap.visible].filter((value) => value !== 'other');
  if (cap.hasOther || cap.visible.has('other')) visible.push('other');

  const groups = [...new Set(visible)].map((value) => ({
    key: value,
    label: value === 'other' ? 'Other / unassigned' : titleCase(value),
  }));

  if (!groups.length) {
    const chronology = { key: 'chronology', label: 'Chronology' };
    return { groups: [chronology], groupFor: () => chronology };
  }

  const byKey = new Map(groups.map((group) => [group.key, group]));
  return {
    groups,
    groupFor: (entry) => byKey.get(cap.groupFor(entry)) ?? byKey.get('other') ?? groups[0],
  };
}

function eventColor(event) {
  const category = event.categories.find((value) => KNOWN_CATEGORY_TOKENS[value]) ?? 'unknown';
  return {
    category,
    color: CATEGORY_COLORS[category] ?? CATEGORY_COLORS.unknown,
  };
}

function eventLine(event, laneMode, groupFor, syntheticOriginDay) {
  const values = laneMode === 'category' ? event.categories : event.lanes;
  const group = groupFor(values[0] ?? 'other');
  const { color } = eventColor(event);
  const start = chronosDate(event.absoluteStartDay, syntheticOriginDay);
  const end = event.absoluteEndDay === undefined ? undefined : chronosDate(event.absoluteEndDay + 1, syntheticOriginDay);
  const prefix = event.kind === 'milestone' ? '*' : '-';
  const range = end ? `${start}~${end}` : start;
  const title = cleanChronosText(event.title) || 'Untitled event';
  const description = cleanChronosText(event.description);
  return {
    line: `${prefix} [${range}] #${color} {${cleanChronosText(group.label).replace(/}/g, '')}} ${title}${description ? ` | ${description}` : ''}`,
    metadata: { kind: 'event', event, group },
  };
}

function eraLines(dataset, groups, syntheticOriginDay) {
  return dataset.eras.flatMap((era) => groups.map((group, index) => ({
    line: `@ [${chronosDate(era.absoluteStartDay, syntheticOriginDay)}~${chronosDate(era.absoluteEndDay + 1, syntheticOriginDay)}] #${ERA_COLORS[era.id] ?? 'blue'} {${cleanChronosText(group.label).replace(/}/g, '')}} ${index === 0 ? cleanChronosText(era.title) : '&nbsp;'}`,
    metadata: { kind: 'era', era, group, showLabel: index === 0 },
  })));
}

function enrichParsedItem(item, metadata, formatEventDate) {
  if (metadata.kind === 'era') {
    const { era, group, showLabel } = metadata;
    item.id = `era:${era.id}:${cssToken(group.key)}`;
    item.content = showLabel ? era.title : '';
    item.className = [item.className, 'vc-era-band', `era-${cssToken(era.id)}`, cssToken(era.visualToken)]
      .filter(Boolean)
      .join(' ');
    item.title = `${escapeHtml(era.title)} — use the era control to zoom`;
    item.data = { eraId: era.id };
    return item;
  }

  const event = metadata.event;
  const { category } = eventColor(event);
  item.id = event.id;
  item.cDescription = event.description;
  item.cLink = event.href;
  item.title = `${escapeHtml(formatEventDate(event))} — ${escapeHtml(event.description)}`;
  item.className = [
    item.className,
    'vc-timeline-item',
    'is-link',
    `importance-${event.importance}`,
    `certainty-${event.certainty}`,
    `category-${cssToken(category)}`,
  ].filter(Boolean).join(' ');
  item.data = event;
  return item;
}

export function createChronosTimelineModel({
  dataset,
  events = dataset?.events ?? [],
  laneMode = 'unified',
  formatEventDate,
  visibleStartDay,
  visibleEndDay,
}) {
  if (!dataset?.id || !Array.isArray(dataset.events) || !Array.isArray(dataset.eras)) {
    throw new Error('Timeline dataset is malformed.');
  }
  if (typeof formatEventDate !== 'function') {
    throw new Error('Chronos timeline adapter requires a date formatter.');
  }

  if (typeof document !== 'undefined') attachChronosStyles(document);

  const syntheticOriginDay = dataset.absoluteStartDay;
  const { groups, groupFor } = buildGroups(events, laneMode);
  const startDay = Number.isSafeInteger(visibleStartDay) ? visibleStartDay : dataset.absoluteStartDay;
  const endDay = Number.isSafeInteger(visibleEndDay) ? visibleEndDay : dataset.absoluteEndDay;
  const records = [
    ...eraLines(dataset, groups, syntheticOriginDay),
    ...events.map((event) => eventLine(event, laneMode, groupFor, syntheticOriginDay)),
  ];
  const source = [
    '> NOTODAY',
    '> ORDERBY start',
    `> DEFAULTVIEW ${chronosDate(startDay, syntheticOriginDay)}|${chronosDate(Math.max(startDay + 1, endDay), syntheticOriginDay)}`,
    '',
    ...records.map((record) => record.line),
  ].join('\n');

  const parsed = parseChronos(source, {
    selectedLocale: 'en',
    roundRanges: true,
  });

  if (parsed.items.length !== records.length) {
    throw new Error(`Chronos parsed ${parsed.items.length} items from ${records.length} canonical records.`);
  }

  parsed.items = parsed.items.map((item, index) => enrichParsedItem(item, records[index].metadata, formatEventDate));
  // vis-timeline's fitItems mode deliberately ignores label height whenever a
  // row contains visible items. That is correct for dense resource charts, but
  // it lets background-only VISCERIUM lanes collapse to almost zero height and
  // makes their labels paint over adjacent rows. Keep Chronos's native layout,
  // but ask each generated group to include its label in the measured height.
  parsed.groups = parsed.groups.map((group) => ({ ...group, heightMode: 'auto' }));

  return {
    source,
    parsed,
    items: parsed.items,
    groups: parsed.groups,
    syntheticOriginDay,
  };
}
