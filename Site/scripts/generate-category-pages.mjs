import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';
import { cleanSlug, toPosixPath } from '../src/lib/codex-paths.mjs';

const docsDir = process.env.VISCERIUM_DOCS_DIR
  ? path.resolve(process.env.VISCERIUM_DOCS_DIR)
  : path.resolve(process.cwd(), 'src/content/docs');
const generatedTagPagePattern = /^#.+?\s+—\s+.+$/;
const categoryTypeTitles = {
  calendar: 'Calendars',
  character: 'Characters',
  event: 'Events',
  faction: 'Factions',
  fauna: 'Fauna',
  flora: 'Flora',
  fungi: 'Fungi',
  image: 'Images',
  item: 'Items',
  location: 'Locations',
  map: 'Maps',
  organisation: 'Organisations',
  organization: 'Organisations',
  person: 'People',
  species: 'Species',
  timeline: 'Timelines',
};

function categoryTitle(slug) {
  return slug
    .split('/')
    .at(-1)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function routeSlug(relativeFile, data) {
  if (typeof data.slug === 'string' && data.slug.trim()) return cleanSlug(data.slug);
  return cleanSlug(toPosixPath(relativeFile).replace(/\.(?:md|mdx)$/i, '').replace(/\/index$/i, ''));
}

function categoryRecord(slug, title = categoryTitle(slug)) {
  return { slug, title };
}

function typeCategory(type) {
  const title = categoryTypeTitles[type];
  return title ? categoryRecord(`categories/${cleanSlug(title)}`, title) : null;
}

function explicitCategories(data) {
  const values = Array.isArray(data.category) ? data.category : data.category ? [data.category] : [];
  return values
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => {
      const slug = cleanSlug(value);
      const namespaced = slug.includes('/') ? slug : `categories/${slug}`;
      return categoryRecord(namespaced, categoryTitle(namespaced));
    });
}

function categoryTrail(slug) {
  const parts = slug.split('/');
  return parts.map((_, index) => parts.slice(0, index + 1).join('/'));
}

function alphaGroup(title) {
  const first = String(title ?? '').trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(first) ? first : '#';
}

function pageLink(entry) {
  return `- [${entry.data.title}](/${entry.slug}/)`;
}

function generatedCategorySection(descendants, childCategories) {
  const childCategorySlugs = new Set(childCategories.map((category) => category.slug));
  const directPages = descendants.filter((entry) => {
    const parent = entry.slug.split('/').slice(0, -1).join('/');
    return !childCategorySlugs.has(parent);
  });
  const pageGroups = Map.groupBy(directPages, (entry) => alphaGroup(entry.data.title));
  const lines = [];

  if (childCategories.length > 0) {
    lines.push('## Subcategories', '');
    for (const category of childCategories) {
      lines.push(`- [${category.title}](/${category.slug}/) — ${category.count}`);
    }
    lines.push('');
  }

  if (directPages.length > 0) {
    lines.push('## Pages in this category', '', '<div class="category-alpha-index">', '');
    for (const [letter, entries] of [...pageGroups.entries()].sort(([left], [right]) => left.localeCompare(right))) {
      lines.push(`### ${letter}`, '');
      for (const entry of entries.sort((left, right) => left.data.title.localeCompare(right.data.title))) {
        lines.push(pageLink(entry));
      }
      lines.push('');
    }
    lines.push('</div>', '');
  }

  return lines.join('\n').trim();
}

const relativeFiles = await Array.fromAsync(fs.glob('**/*.{md,mdx}', { cwd: docsDir }));
const entries = [];
const categories = new Map();

for (const relativeFile of relativeFiles.sort()) {
  const file = path.resolve(docsDir, relativeFile);
  const raw = await fs.readFile(file, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data ?? {};
  const slug = routeSlug(relativeFile, data);
  if (!slug || data.status !== 'published' || data.type === 'category' || generatedTagPagePattern.test(data.title ?? '')) continue;

  const entry = { file, slug, data };
  entries.push(entry);

  const categoryCandidates = [
    typeCategory(data.type),
    ...explicitCategories(data),
  ].filter(Boolean);

  for (const category of categoryCandidates) {
    for (const trailSlug of categoryTrail(category.slug)) {
      if (!categories.has(trailSlug)) {
        categories.set(trailSlug, categoryRecord(trailSlug, trailSlug === category.slug ? category.title : categoryTitle(trailSlug)));
      }
    }
  }
}

const entryBySlug = new Map(entries.map((entry) => [entry.slug, entry]));
const categoryList = [...categories.values()].sort((a, b) => a.slug.localeCompare(b.slug));

for (const category of categoryList) {
  const existingEntry = entryBySlug.get(category.slug);

  // An authored article may own a route that would otherwise be a category page.
  // Leave its content untouched instead of appending structural navigation.
  if (existingEntry) {
    console.log(`Skipped generated category index for ${category.slug}; route belongs to ${existingEntry.data.type ?? 'article'} article ${path.relative(docsDir, existingEntry.file)}.`);
    continue;
  }

  const prefix = `${category.slug}/`;
  const descendants = entries.filter((entry) => entry.slug.startsWith(prefix));
  const childDepth = category.slug.split('/').length + 1;
  const childCategories = categoryList
    .filter((candidate) => candidate.slug.startsWith(prefix) && candidate.slug.split('/').length === childDepth)
    .map((candidate) => ({
      ...candidate,
      count: descendants.filter((entry) => entry.slug.startsWith(`${candidate.slug}/`)).length,
    }));
  const section = generatedCategorySection(descendants, childCategories);
  const outFile = path.join(docsDir, category.slug, 'index.md');
  const frontmatter = {
    title: category.title,
    description: `Index of public VISCERIUM pages in the ${category.title} category.`,
    status: 'published',
    slug: category.slug,
    type: 'category',
    pagefind: true,
    tableOfContents: false,
  };
  const intro = `Browse every public Codex page filed beneath **${category.title}**.`;
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, matter.stringify(`${intro}\n\n${section}`, frontmatter), 'utf8');
  console.log(`Generated category index ${path.relative(docsDir, outFile)}.`);
}

console.log(`Generated ${categoryList.length} category index page${categoryList.length === 1 ? '' : 's'}.`);
