import { calendars, defaultCalendarId, toAbsoluteDay } from '../calendar/runtime.mjs';

function normalizeToken(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[Þþ]/g, 'th')
    .replace(/[Ðð]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function asStringArray(value) {
  if (Array.isArray(value)) return value.map(String).map((entry) => entry.trim()).filter(Boolean);
  if (value === undefined || value === null || value === '') return [];
  return [String(value).trim()].filter(Boolean);
}

function asFiniteNumber(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function resolveCalendar(calendarId) {
  return calendars.find((calendar) => calendar.id === calendarId);
}

function resolveMonth(calendar, token) {
  const normalized = normalizeToken(token);
  return calendar.months.find((month) =>
    normalizeToken(month.slug) === normalized || normalizeToken(month.name) === normalized,
  );
}

function resolveIntercalary(calendar, token, day) {
  const normalized = normalizeToken(token);
  return calendar.intercalaryDays.find((entry) => {
    const nameMatches = normalizeToken(entry.slug) === normalized || normalizeToken(entry.name) === normalized;
    return nameMatches && (day === undefined || entry.day === day);
  });
}

/**
 * Parse StoryLine's single storyDate field into a registered VISCERIUM calendar date.
 * Accepted examples:
 *   16 Sólmanuthur, 9250
 *   9250-solmanuthur-16
 *   okse:16 Sólmanuthur, 9250
 *   1 Engimanutur, 9250
 *
 * storyDate remains the source of truth; no duplicate calendarDate field is required.
 */
export function parseStoryLineDate(value) {
  if (typeof value !== 'string' || !value.trim()) return null;

  let raw = value.trim();
  let calendarId = defaultCalendarId;
  const prefix = raw.match(/^([a-z][a-z0-9_-]*)\s*:\s*(.+)$/i);
  if (prefix && resolveCalendar(prefix[1])) {
    calendarId = prefix[1];
    raw = prefix[2].trim();
  }

  const calendar = resolveCalendar(calendarId);
  if (!calendar) return null;

  const compact = raw.match(/^(-?\d+)\s*[-/]\s*([\p{L}0-9_-]+)\s*[-/]\s*(\d{1,2})$/u);
  if (compact) {
    const year = Number(compact[1]);
    const day = Number(compact[3]);
    const month = resolveMonth(calendar, compact[2]);
    if (month) return { calendar: calendar.id, year, month: month.slug, day, precision: 'day', certainty: 'exact' };
  }

  const human = raw.match(/^(\d{1,2})\s+(.+?)[,\s]+(-?\d+)$/u);
  if (human) {
    const day = Number(human[1]);
    const year = Number(human[3]);
    const token = human[2].trim();
    const month = resolveMonth(calendar, token);
    if (month) return { calendar: calendar.id, year, month: month.slug, day, precision: 'day', certainty: 'exact' };
    const intercalary = resolveIntercalary(calendar, token, day);
    if (intercalary) return { calendar: calendar.id, year, intercalaryDay: intercalary.slug, precision: 'day', certainty: 'exact' };
  }

  return null;
}

export function inferStoryLineProjectBase(path) {
  const normalized = String(path ?? '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  if (!normalized.startsWith('Stories/')) return null;

  for (const marker of ['/Scenes/', '/Codex/', '/Notes/', '/SceneNotes/', '/Archive/', '/Research/', '/System/']) {
    const index = normalized.indexOf(marker);
    if (index > 0) return normalized.slice(0, index);
  }

  if (normalized.toLowerCase().endsWith('.md')) {
    const withoutExtension = normalized.slice(0, -3);
    const parts = withoutExtension.split('/');
    const basename = parts.at(-1) ?? '';
    const parent = parts.at(-2) ?? '';
    if (basename === parent) return parts.slice(0, -1).join('/');
    return withoutExtension;
  }

  return null;
}

export function buildStoryLineTimelineDataset(scenes, projectTitle) {
  const issues = [];
  const events = scenes
    .filter((scene) => scene.type === 'scene')
    .map((scene) => {
      const calendarDate = parseStoryLineDate(scene.storyDate);
      if (!calendarDate) {
        issues.push({
          filePath: scene.filePath,
          message: 'Missing or unsupported storyDate. Use e.g. "16 Sólmanuthur, 9250" or "9250-solmanuthur-16".',
        });
        return null;
      }

      let absoluteStartDay;
      try {
        absoluteStartDay = toAbsoluteDay(calendarDate);
      } catch (error) {
        issues.push({ filePath: scene.filePath, message: error instanceof Error ? error.message : String(error) });
        return null;
      }

      const editorialOrder = asFiniteNumber(scene.chronologicalOrder) ?? asFiniteNumber(scene.sequence);
      const lane = String(scene.timeline_strand ?? scene.pov ?? '').trim();
      const description = String(scene.synopsis ?? scene.description ?? '').trim();

      return {
        id: `storyline:${scene.filePath}`,
        title: String(scene.title ?? scene.filePath.split('/').at(-1)?.replace(/\.md$/i, '') ?? 'Scene'),
        description,
        href: '',
        sourcePath: scene.filePath,
        absoluteStartDay,
        precision: 'day',
        certainty: 'exact',
        kind: 'event',
        importance: 'standard',
        categories: asStringArray(scene.tags),
        lanes: lane ? [lane] : [],
        eras: [],
        factions: [],
        locations: asStringArray(scene.location),
        participants: asStringArray(scene.characters),
        status: typeof scene.status === 'string' ? scene.status : undefined,
        tags: asStringArray(scene.tags),
        editorialOrder,
        storyLineMode: typeof scene.timeline_mode === 'string' ? scene.timeline_mode : undefined,
        storyTime: typeof scene.storyTime === 'string' ? scene.storyTime : undefined,
      };
    })
    .filter(Boolean)
    .sort((left, right) =>
      left.absoluteStartDay - right.absoluteStartDay
      || (left.editorialOrder ?? Number.MAX_SAFE_INTEGER) - (right.editorialOrder ?? Number.MAX_SAFE_INTEGER)
      || left.title.localeCompare(right.title),
    );

  const starts = events.map((event) => event.absoluteStartDay);
  const start = starts.length ? Math.min(...starts) : 0;
  const end = starts.length ? Math.max(...starts) : start;

  return {
    dataset: {
      id: `storyline-${normalizeToken(projectTitle) || 'story'}`,
      title: `${projectTitle} — Story Timeline`,
      description: 'StoryLine scenes mapped onto the VISCERIUM calendar from each scene\'s storyDate field.',
      defaultCalendar: defaultCalendarId,
      absoluteStartDay: start,
      absoluteEndDay: end,
      events,
      eras: [],
      generatedAt: new Date(0).toISOString(),
    },
    issues,
  };
}
