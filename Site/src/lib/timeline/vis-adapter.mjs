import { escapeHtml } from '../codex-paths.mjs';
import { absoluteDayToSyntheticDate, capTimelineGroups, KNOWN_CATEGORY_TOKENS } from './core.mjs';
import { timelineMessage } from './i18n.mjs';

function cssToken(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
}

function titleCase(value) {
  return String(value ?? '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function buildGroups(events, laneMode, messages) {
  if (laneMode === 'unified') {
    const group = { id: 'group:0', content: escapeHtml(timelineMessage(messages, 'chronology')), heightMode: 'auto' };
    return { groups: [group], groupFor: () => group };
  }

  const values = events.map((event) => laneMode === 'category' ? event.categories : event.lanes);
  const cap = capTimelineGroups(values.map((entry) => entry.length ? entry : ['other']), 12);
  const keys = [...cap.visible].filter((value) => value !== 'other');
  if (cap.hasOther || cap.visible.has('other')) keys.push('other');
  const groups = [...new Set(keys)].map((key, order) => ({
    id: `group:${order}`,
    key,
    order,
    heightMode: 'auto',
    content: escapeHtml(key === 'other' ? timelineMessage(messages, 'otherGroup') : titleCase(key)),
  }));

  if (!groups.length) return buildGroups(events, 'unified', messages);
  const byKey = new Map(groups.map((group) => [group.key, group]));
  return {
    groups,
    groupFor: (value) => byKey.get(cap.groupFor(value)) ?? byKey.get('other') ?? groups[0],
  };
}

function eventItem(event, group, syntheticOriginDay, formatEventDate, messages) {
  const category = event.categories.find((value) => KNOWN_CATEGORY_TOKENS[value]) ?? 'unknown';
  const ranged = event.absoluteEndDay !== undefined;
  return {
    id: event.id,
    group: group.id,
    start: absoluteDayToSyntheticDate(event.absoluteStartDay, syntheticOriginDay),
    ...(ranged ? { end: absoluteDayToSyntheticDate(event.absoluteEndDay + 1, syntheticOriginDay) } : {}),
    type: event.kind === 'milestone' ? 'point' : ranged ? 'range' : 'box',
    content: escapeHtml(event.title || timelineMessage(messages, 'untitledEvent')),
    title: `${escapeHtml(formatEventDate(event))} – ${escapeHtml(event.description)}`,
    className: [
      'vc-timeline-item',
      'is-link',
      `importance-${cssToken(event.importance)}`,
      `certainty-${cssToken(event.certainty)}`,
      `category-${cssToken(category)}`,
    ].join(' '),
    cDescription: event.description,
    cLink: event.href,
    data: event,
  };
}

export function createTimelineModel({
  dataset,
  events = dataset?.events ?? [],
  laneMode = 'unified',
  formatEventDate,
  messages,
}) {
  if (!dataset?.id || !Array.isArray(dataset.events) || !Array.isArray(dataset.eras)) {
    throw new Error('Timeline dataset is malformed.');
  }
  if (typeof formatEventDate !== 'function') throw new Error('Timeline conversion requires a date formatter.');

  const syntheticOriginDay = dataset.absoluteStartDay;
  const { groups, groupFor } = buildGroups(events, laneMode, messages);
  const items = [
    ...dataset.eras.flatMap((era) => groups.map((group, index) => ({
      id: `era:${era.id}:${group.id}`,
      group: group.id,
      start: absoluteDayToSyntheticDate(era.absoluteStartDay, syntheticOriginDay),
      end: absoluteDayToSyntheticDate(era.absoluteEndDay + 1, syntheticOriginDay),
      type: 'background',
      content: index === 0 ? escapeHtml(era.title) : '',
      className: ['vc-era-band', `era-${cssToken(era.id)}`, cssToken(era.visualToken)].filter(Boolean).join(' '),
      title: escapeHtml(timelineMessage(messages, 'zoomEra', { era: era.title })),
      selectable: false,
      data: { eraId: era.id },
    }))),
    ...events.map((event) => {
      const values = laneMode === 'category' ? event.categories : event.lanes;
      return eventItem(event, groupFor(values[0] ?? 'other'), syntheticOriginDay, formatEventDate, messages);
    }),
  ];

  return { items, groups, syntheticOriginDay };
}
