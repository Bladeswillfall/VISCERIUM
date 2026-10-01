import { classifyCodexPage } from './page-kind.mjs';
import { getPublicationDates, getLastModifiedDate } from './publication-dates.mjs';

const EXCLUDED_TYPES = new Set(['system', 'map', 'image', 'policy', 'statement', 'release']);
const NON_LORE_PATH = /^(?:policies|statements|releases|support|contact|about|privacy|terms)(?:\/|$)/i;
const ERA_NAMES = { e1: 'CITADEL', e2: 'SMOG', e3: 'NEARSIGHT', e4: 'ENTROPY' };

export function getRecentArticles(entries, limit = 6) {
  return entries.flatMap((entry) => {
    const data = entry.data;
    const { slug, isStandardArticle } = classifyCodexPage(data, entry.id);
    const type = String(data.type ?? '').toLowerCase();
    const source = String(data.sourcePath ?? '').replaceAll('\\', '/');
    const date = getLastModifiedDate(data);

    if (data.status !== 'published' || !isStandardArticle || EXCLUDED_TYPES.has(type)
      || NON_LORE_PATH.test(slug) || NON_LORE_PATH.test(source) || !date) return [];

    const { published } = getPublicationDates(data);
    const eraValue = Array.isArray(data.era) ? data.era[0] : data.era;
    const era = ERA_NAMES[data.eraStyle] ?? (['CITADEL', 'SMOG', 'NEARSIGHT', 'ENTROPY']
      .includes(String(eraValue).toUpperCase()) ? String(eraValue).toUpperCase() : 'Universal');

    return [{
      title: data.title,
      description: data.description,
      href: `/${slug}/`,
      type: data.type || 'Article',
      date,
      kind: published && date.valueOf() === published.valueOf() ? 'Published' : 'Updated',
      era,
      headerImage: typeof data.headerImage === 'string' && data.headerImage.trim()
        ? data.headerImage.trim() : null,
    }];
  }).sort((a, b) => b.date.valueOf() - a.date.valueOf()
    || a.title.localeCompare(b.title) || a.href.localeCompare(b.href)).slice(0, limit);
}
