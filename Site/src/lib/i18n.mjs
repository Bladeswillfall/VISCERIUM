import { DEFAULT_LOCALE } from '../../site.config.mjs';

export { DEFAULT_LOCALE };

/**
 * @param {string | null | undefined} locale
 */
function localeOrDefault(locale) {
  return String(locale ?? '').trim() || DEFAULT_LOCALE;
}

/**
 * @param {number} value
 * @param {string | null | undefined} [locale]
 * @param {Intl.NumberFormatOptions} [options]
 */
export function formatNumber(value, locale = DEFAULT_LOCALE, options = undefined) {
  return new Intl.NumberFormat(localeOrDefault(locale), options).format(value);
}

/**
 * @param {Date | string | number} value
 * @param {string | null | undefined} [locale]
 * @param {Intl.DateTimeFormatOptions} [options]
 */
export function formatDate(value, locale = DEFAULT_LOCALE, options = undefined) {
  const isDateOnlyString = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError('formatDate requires a valid date');

  const resolvedOptions = isDateOnlyString && !options?.timeZone
    ? { ...options, timeZone: 'UTC' }
    : options;

  return new Intl.DateTimeFormat(localeOrDefault(locale), resolvedOptions).format(date);
}

/**
 * @param {string[]} values
 * @param {string | null | undefined} [locale]
 * @param {Intl.ListFormatOptions} [options]
 */
export function formatList(values, locale = DEFAULT_LOCALE, options = undefined) {
  return new Intl.ListFormat(localeOrDefault(locale), options).format(values);
}
