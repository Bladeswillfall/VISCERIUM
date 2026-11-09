import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { getLastModifiedDate } from './publication-dates.ts';

function normalisePathname(value: unknown): string {
  const pathname = String(value || '/').replace(/\/+/g, '/');
  if (pathname === '/') return '/';
  return `/${pathname.replace(/^\/+|\/+$/g, '')}/`;
}

async function walkMarkdown(dir: string): Promise<string[]> {
  return (await Array.fromAsync(fs.glob('**/*.{md,mdx}', { cwd: dir })))
    .map((file) => path.join(dir, file));
}

export async function buildSitemapLastmodMap(contentDir: string): Promise<Map<string, string>> {
  try {
    await fs.access(contentDir);
  } catch {
    return new Map();
  }

  const lastmodByPathname = new Map<string, string>();
  const files = await walkMarkdown(contentDir);

  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const { data } = matter(raw);
    const lastModified = getLastModifiedDate(data);
    if (!lastModified) continue;

    const relative = path.relative(contentDir, file).replace(/\\/g, '/').replace(/\.(md|mdx)$/i, '');
    const slug = String(data.slug || relative).replace(/^\/+|\/+$/g, '');
    const pathname = slug === 'index' ? '/' : normalisePathname(slug);
    lastmodByPathname.set(pathname, lastModified.toISOString());
  }

  return lastmodByPathname;
}

export function sitemapPathname(url: string | URL): string {
  return normalisePathname(decodeURI(new URL(url).pathname));
}
