import { getCollection } from 'astro:content';
import siteConfig from '../../site.config.mjs';

const FALLBACK_DATE = new Date('1970-01-01T00:00:00.000Z');

export type FeedEntry = {
  title: string;
  description: string;
  url: string;
  id: string;
  type?: string;
  tags: string[];
  date: Date | null;
  updated: Date;
};

export function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function absoluteUrl(pathname: string, base: URL | string = siteConfig.site): string {
  return new URL(pathname, base).href;
}

function asArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return [String(value)].filter(Boolean);
}

function readDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.valueOf()) ? null : date;
}

function routeFromEntry(entry: { id: string; data: { slug?: string } }): string {
  const slug = entry.data.slug || entry.id.replace(/\.(md|mdx)$/i, '');
  return slug === 'index' ? '/' : `/${String(slug).replace(/^\/+|\/+$/g, '')}/`;
}

function getEntryDate(data: Record<string, unknown>): Date | null {
  return readDate(data.updated) ?? readDate(data.date) ?? readDate(data.published);
}

export async function getFeedEntries(base: URL | string = siteConfig.site): Promise<FeedEntry[]> {
  const maxItems = siteConfig.feeds?.maxItems ?? 50;
  const docs = await getCollection('docs', ({ data }) => (
    data.status === 'published'
    && data.type !== 'category'
  ));

  return docs
    .map((entry) => {
      const date = getEntryDate(entry.data as Record<string, unknown>);
      return {
        title: entry.data.title,
        description: entry.data.description,
        url: absoluteUrl(routeFromEntry(entry), base),
        id: absoluteUrl(routeFromEntry(entry), base),
        type: entry.data.type,
        tags: [...asArray(entry.data.type), ...asArray(entry.data.tags), ...asArray(entry.data.era), ...asArray(entry.data.faction)],
        date,
        updated: date ?? FALLBACK_DATE,
      };
    })
    .sort((a, b) => {
      const timeDifference = b.updated.valueOf() - a.updated.valueOf();
      if (timeDifference !== 0) return timeDifference;
      return a.title.localeCompare(b.title);
    })
    .slice(0, maxItems);
}

export function getFeedUpdated(entries: FeedEntry[]): Date {
  return entries.find((entry) => entry.date)?.updated ?? new Date();
}
