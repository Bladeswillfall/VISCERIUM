import type { APIRoute } from 'astro';
import siteConfig from '../../site.config.mjs';
import { escapeXml, getFeedEntries, getFeedUpdated } from '../lib/feed';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL(siteConfig.site);
  const entries = await getFeedEntries(base);
  const updated = getFeedUpdated(entries);
  const feedUrl = new URL('/atom.xml', base).href;
  const siteUrl = new URL('/', base).href;

  const items = entries
    .map((entry) => {
      const categories = [...new Set(entry.tags)]
        .map((tag) => `    <category term="${escapeXml(tag)}" />`)
        .join('\n');

      return `  <entry>
    <title>${escapeXml(entry.title)}</title>
    <link href="${escapeXml(entry.url)}" />
    <id>${escapeXml(entry.id)}</id>
    <updated>${entry.updated.toISOString()}</updated>
    <summary>${escapeXml(entry.description)}</summary>${categories ? `\n${categories}` : ''}
  </entry>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(siteConfig.feeds?.title ?? siteConfig.title)}</title>
  <subtitle>${escapeXml(siteConfig.feeds?.description ?? siteConfig.description)}</subtitle>
  <link href="${escapeXml(siteUrl)}" />
  <link href="${escapeXml(feedUrl)}" rel="self" type="application/atom+xml" />
  <id>${escapeXml(siteUrl)}</id>
  <updated>${updated.toISOString()}</updated>
${items}
</feed>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
    },
  });
};
