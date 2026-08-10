import { getPublicationDates } from './publication-dates.mjs';

const FALLBACK_ISO = '1970-01-01T00:00:00.000Z';

export const FEED_FALLBACK_DATE = new Date(FALLBACK_ISO);

export function getAuthoredFeedDates(data = {}) {
  const { published, updated } = getPublicationDates(data);

  return {
    published,
    updated: updated ?? FEED_FALLBACK_DATE,
  };
}

export function latestFeedDate(entries = []) {
  return entries.reduce((latest, entry) => (
    entry.updated.valueOf() > latest.valueOf() ? entry.updated : latest
  ), FEED_FALLBACK_DATE);
}
