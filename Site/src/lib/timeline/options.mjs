import { LANE_MODES, TIMELINE_IDS } from './core.mjs';

const inlineAliases = {
  timeline: 'timeline',
  calendar: 'defaultCalendar',
  lane: 'laneMode',
  lanemode: 'laneMode',
  filters: 'showFilters',
  showfilters: 'showFilters',
  minimap: 'showMinimap',
  showminimap: 'showMinimap',
  legend: 'showLegend',
  showlegend: 'showLegend',
  compact: 'compact',
};

const booleanOptions = new Set(['showFilters', 'showMinimap', 'showLegend', 'compact']);

export function parseTimelineBoolean(value, fallback) {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return fallback;
}

export function parseTimelineInlineOptions(id, specification = '') {
  const block = { timeline: id };
  const pairs = String(specification).matchAll(/([a-z][\w-]*)=(?:"([^"]*)"|'([^']*)'|([^\s]+))/gi);
  for (const pair of pairs) {
    const option = inlineAliases[pair[1].toLowerCase()];
    if (!option) continue;
    const value = pair[2] ?? pair[3] ?? pair[4] ?? '';
    block[option] = booleanOptions.has(option)
      ? parseTimelineBoolean(value, option !== 'compact')
      : value;
  }
  return block;
}

export function normalizeTimelineOptions(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (typeof value.timeline !== 'string' || !TIMELINE_IDS.includes(value.timeline)) return null;
  return {
    timeline: value.timeline,
    defaultCalendar: typeof value.defaultCalendar === 'string' ? value.defaultCalendar : undefined,
    laneMode: typeof value.laneMode === 'string' && LANE_MODES.includes(value.laneMode)
      ? value.laneMode
      : 'unified',
    showFilters: parseTimelineBoolean(value.showFilters, true),
    showMinimap: parseTimelineBoolean(value.showMinimap, true),
    showLegend: parseTimelineBoolean(value.showLegend, true),
    compact: parseTimelineBoolean(value.compact, false),
  };
}

export function resolveTimelineOptions(id, specification, configuredBlock) {
  return normalizeTimelineOptions(configuredBlock)
    ?? normalizeTimelineOptions(parseTimelineInlineOptions(id, specification));
}
