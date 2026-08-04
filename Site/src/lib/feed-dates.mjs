const FALLBACK_ISO = '1970-01-01T00:00:00.000Z';

export const FEED_FALLBACK_DATE = new Date(FALLBACK_ISO);

export function readFeedDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.valueOf()) ? null : date;
}

export function getAuthoredFeedDates(data = {}) {
  const created = readFeedDate(data.created)
    ?? readFeedDate(data.published)
    ?? readFeedDate(data.date);
  const explicitUpdated = readFeedDate(data.updated);

  // An update date without an authored creation/publication date is not enough
  // to establish trustworthy feed chronology. In particular, generated files
  // must never turn a checkout or build timestamp into article history.
  const updated = created
    ? explicitUpdated ?? created
    : FEED_FALLBACK_DATE;

  return { created, updated };
}

export function latestFeedDate(entries = []) {
  return entries.reduce((latest, entry) => (
    entry.updated.valueOf() > latest.valueOf() ? entry.updated : latest
  ), FEED_FALLBACK_DATE);
}
