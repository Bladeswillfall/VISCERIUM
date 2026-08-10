import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { getLastModifiedDate } from './publication-dates.mjs';

function normalisePathname(value) {
  const pathname = String(value || '/').replace(/\/+/g, '/');
  if (pathname === '/') return '/';
  return `/${pathname.replace(/^\/+|\/+$/g, '')}/`;
}

async function walkMarkdown(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walkMarkdown(target));
    else if (/\.(md|mdx)$/i.test(entry.name)) files.push(target);
  }

  return files;
}

export async function buildSitemapLastmodMap(contentDir) {
  try {
    await fs.access(contentDir);
  } catch {
    return new Map();
  }

  const lastmodByPathname = new Map();
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

export function sitemapPathname(url) {
  return normalisePathname(decodeURI(new URL(url).pathname));
}
