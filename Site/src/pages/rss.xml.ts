import type { APIRoute } from 'astro';
import siteConfig from '../../site.config.mjs';
import { escapeXml, getFeedEntries, getFeedUpdated } from '../lib/feed';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL(siteConfig.site);
  const entries = await getFeedEntries(base);
  const updated = getFeedUpdated(entries);
  const feedUrl = new URL('/rss.xml', base).href;
  const siteUrl = new URL('/', base).href;

  const items = entries
    .map((entry) => {
      const categories = [...new Set(entry.tags)]
        .map((tag) => `      <category>${escapeXml(tag)}</category>`)
        .join('\n');
      const pubDate = entry.date ? `      <pubDate>${entry.date.toUTCString()}</pubDate>\n` : '';

      return `    <item>
      <title>${escapeXml(entry.title)}</title>
      <link>${escapeXml(entry.url)}</link>
      <guid isPermaLink="true">${escapeXml(entry.id)}</guid>
${pubDate}      <description>${escapeXml(entry.description)}</description>${categories ? `\n${categories}` : ''}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.feeds?.title ?? siteConfig.title)}</title>
    <description>${escapeXml(siteConfig.feeds?.description ?? siteConfig.description)}</description>
    <link>${escapeXml(siteUrl)}</link>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <language>${escapeXml(siteConfig.feeds?.language ?? 'en')}</language>
    <lastBuildDate>${updated.toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
};
