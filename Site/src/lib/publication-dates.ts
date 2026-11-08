type AuthoredDateFields = {
  created?: unknown;
  published?: unknown;
  date?: unknown;
  updated?: unknown;
};

export function readAuthoredDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;

  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.valueOf()) ? null : date;
}

export function getPublicationDates(data: AuthoredDateFields = {}) {
  const created = readAuthoredDate(data.created);
  const published = readAuthoredDate(data.published)
    ?? readAuthoredDate(data.date);
  const explicitUpdated = readAuthoredDate(data.updated);
  const updated = published && explicitUpdated && explicitUpdated.valueOf() < published.valueOf()
    ? published
    : explicitUpdated ?? published;

  return { created, published, updated };
}

export function getLastModifiedDate(data: AuthoredDateFields = {}) {
  const { published, updated } = getPublicationDates(data);
  return updated ?? published;
}

export function toIsoDate(date: Date | null | undefined): string | undefined {
  return date ? date.toISOString() : undefined;
}
