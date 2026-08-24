import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';
import {
  cleanSlug,
  extractInternalRoutes,
  slugToRoute,
  toPosixPath,
} from '../src/lib/codex-paths.mjs';

const defaultDocsDir = path.resolve(process.cwd(), 'src/content/docs');
const markdownExtensions = /\.(md|mdx)$/i;

function slugFromGeneratedFile(file, docsDir, data = {}) {
  if (typeof data.slug === 'string' && data.slug.trim()) return cleanSlug(data.slug);
  const relative = toPosixPath(path.relative(docsDir, file)).replace(markdownExtensions, '');
  return relative.replace(/\/index$/i, '') || 'index';
}

function referenceRecord(record) {
  const rawEra = Array.isArray(record.data.era) ? record.data.era[0] : record.data.era;
  return {
    title: String(record.data.title ?? record.slug),
    href: record.route,
    type: typeof record.data.type === 'string' && record.data.type.trim() ? record.data.type.trim() : 'article',
    ...(typeof rawEra === 'string' && rawEra.trim() ? { era: rawEra.trim() } : {}),
  };
}

export function buildReferencedInIndex(records) {
  const recordsByRoute = new Map(records.map((record) => [record.route, record]));
  const inbound = new Map();

  for (const source of records) {
    // Only authored Vault notes create "Referenced in" records. Generated category,
    // tag and continuity pages are navigation apparatus, not narrative references.
    if (!source.data.sourcePath) continue;

    for (const targetRoute of extractInternalRoutes(source.content)) {
      if (targetRoute === source.route || !recordsByRoute.has(targetRoute)) continue;
      const sources = inbound.get(targetRoute) ?? new Map();
      sources.set(source.route, referenceRecord(source));
      inbound.set(targetRoute, sources);
    }
  }

  return new Map([...inbound.entries()].map(([route, sources]) => [
    route,
    [...sources.values()].sort((left, right) => left.title.localeCompare(right.title)),
  ]));
}

export async function generateReferencedIn({ docsDir = defaultDocsDir } = {}) {
  const relativeFiles = await Array.fromAsync(fs.glob('**/*.{md,mdx}', { cwd: docsDir }));
  const records = [];

  for (const relativeFile of relativeFiles.sort()) {
    const file = path.resolve(docsDir, relativeFile);
    const raw = await fs.readFile(file, 'utf8');
    const parsed = matter(raw);
    const slug = slugFromGeneratedFile(file, docsDir, parsed.data);
    records.push({
      file,
      slug,
      route: slugToRoute(slug),
      data: parsed.data ?? {},
      content: parsed.content,
    });
  }

  const inbound = buildReferencedInIndex(records);
  let targetCount = 0;
  let referenceCount = 0;

  for (const record of records) {
    const references = inbound.get(record.route) ?? [];
    const data = { ...record.data };
    delete data.referencedIn;
    if (references.length > 0) {
      data.referencedIn = references;
      targetCount += 1;
      referenceCount += references.length;
    }
    await fs.writeFile(record.file, matter.stringify(record.content, data), 'utf8');
  }

  console.log(`Generated Referenced in index: ${referenceCount} source article references across ${targetCount} pages.`);
  return { targetCount, referenceCount };
}
