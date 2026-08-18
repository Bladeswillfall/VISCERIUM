import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import siteConfig from '../site.config.mjs';
import { getPublicationDates, toIsoDate } from './lib/publication-dates.mjs';
import { buildArticleStructuredData, canonicalUrlForPath } from './lib/structured-data.mjs';

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const data = route.entry.data as Record<string, unknown>;

  if (data.status !== 'published' || data.type === 'category') return;

  const { published, updated } = getPublicationDates(data);
  const publishedIso = toIsoDate(published);
  const updatedIso = toIsoDate(updated);

  if (updated) route.lastUpdated = updated;

  const canonicalUrl = canonicalUrlForPath(context.url.pathname, siteConfig.site);
  const structuredData = buildArticleStructuredData({
    title: data.title ?? route.entry.id,
    description: data.description,
    canonicalUrl,
    publishedIso,
    updatedIso,
    keywords: Array.isArray(data.tags) ? data.tags : undefined,
  });

  if (publishedIso) {
    route.head.push({
      tag: 'meta',
      attrs: {
        property: 'article:published_time',
        content: publishedIso,
      },
    });
  }

  if (updatedIso) {
    route.head.push({
      tag: 'meta',
      attrs: {
        property: 'article:modified_time',
        content: updatedIso,
      },
    });
  }

  route.head.push({
    tag: 'script',
    attrs: { type: 'application/ld+json' },
    content: JSON.stringify(structuredData),
  });
});
