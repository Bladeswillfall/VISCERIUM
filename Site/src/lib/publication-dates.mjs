export function readAuthoredDate(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;

  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.valueOf()) ? null : date;
}

export function getPublicationDates(data = {}) {
  const created = readAuthoredDate(data.created);
  const published = readAuthoredDate(data.published)
    ?? readAuthoredDate(data.date);
  const updated = readAuthoredDate(data.updated)
    ?? published;

  return { created, published, updated };
}

export function getLastModifiedDate(data = {}) {
  const { published, updated } = getPublicationDates(data);
  return updated ?? published;
}

export function toIsoDate(date) {
  return date ? date.toISOString() : undefined;
}
