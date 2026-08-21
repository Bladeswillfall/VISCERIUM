export const DEFAULT_LOCALE = 'en-GB';

const dictionaries = Object.freeze({
  'en-GB': Object.freeze({
    search: 'Search',
    timeline: 'Timeline',
    map: 'Map',
    related: 'Related',
    previous: 'Previous',
    next: 'Next',
  }),
});

export function normaliseLocale(locale = DEFAULT_LOCALE) {
  const requested = String(locale || '').trim();
  return Object.hasOwn(dictionaries, requested) ? requested : DEFAULT_LOCALE;
}

export function uiText(key, locale = DEFAULT_LOCALE) {
  const resolvedLocale = normaliseLocale(locale);
  const value = dictionaries[resolvedLocale][key];

  if (typeof value !== 'string') {
    throw new Error(`Unknown VISCERIUM UI string: ${key}`);
  }

  return value;
}

export function formatNumber(value, locale = DEFAULT_LOCALE, options = undefined) {
  return new Intl.NumberFormat(normaliseLocale(locale), options).format(value);
}

export function formatDate(value, locale = DEFAULT_LOCALE, options = undefined) {
  const isDateOnlyString = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError('formatDate requires a valid date');

  const resolvedOptions = isDateOnlyString && !options?.timeZone
    ? { ...options, timeZone: 'UTC' }
    : options;

  return new Intl.DateTimeFormat(normaliseLocale(locale), resolvedOptions).format(date);
}
