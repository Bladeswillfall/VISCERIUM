import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import siteConfig from '../site.config.mjs';
import { classifyCodexPage } from './lib/page-kind.mjs';
import { getPublicationDates, toIsoDate } from './lib/publication-dates.mjs';
import articlePagesStylesheet from './styles/article-pages.css?url';
import categoryIndexStylesheet from './styles/category-index.css?url';

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const data = route.entry.data as Record<string, unknown>;
  const pageKind = classifyCodexPage(data, route.entry.id);
  const pageType = String(data.type ?? '').trim().toLowerCase();

  if (!pageKind.isHomepage) {
    route.head.push({
      tag: 'link',
      attrs: { rel: 'stylesheet', href: articlePagesStylesheet },
    });
  }

  if (pageType === 'category') {
    route.head.push({
      tag: 'link',
      attrs: { rel: 'stylesheet', href: categoryIndexStylesheet },
    });
  }

  if (data.status !== 'published' || pageType === 'category') return;

  const { published, updated } = getPublicationDates(data);
  const publishedIso = toIsoDate(published);
  const updatedIso = toIsoDate(updated);

  if (updated) route.lastUpdated = updated;
  if (!publishedIso && !updatedIso) return;

  const canonicalUrl = new URL(context.url.pathname, siteConfig.site).href;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: String(data.title ?? route.entry.id),
    ...(data.description ? { description: String(data.description) } : {}),
    mainEntityOfPage: canonicalUrl,
    ...(publishedIso ? { datePublished: publishedIso } : {}),
    ...(updatedIso ? { dateModified: updatedIso } : {}),
  };

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
