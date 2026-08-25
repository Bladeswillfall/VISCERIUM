import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs/promises';
import matter from 'gray-matter';
import { cleanSlug, escapeHtml, slugToRoute, toPosixPath } from '../src/lib/codex-paths.mjs';

const siteRoot = process.cwd();
const docsDir = process.env.VISCERIUM_DOCS_DIR
  ? path.resolve(process.env.VISCERIUM_DOCS_DIR)
  : path.resolve(siteRoot, 'src/content/docs');
const markdownExtensions = /\.(md|mdx)$/i;
const leadingArticlePattern = /^(?:the|an|a)\s+/i;

function titleFromSegment(segment) {
  const known = new Map([
    ['citadel', 'CITADEL'],
    ['smog', 'SMOG'],
    ['nearsight', 'NEARSIGHT'],
    ['entropy', 'ENTROPY'],
    ['astu', 'ASTU'],
    ['tcsc', 'TCSC'],
  ]);
  const key = cleanSlug(segment);
  if (known.has(key)) return known.get(key);
  return key.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function sourceRouteFromFile(file, data) {
  const relative = toPosixPath(path.relative(docsDir, file)).replace(markdownExtensions, '');
  return cleanSlug(data.slug || relative);
}

function sortableTitle(value) {
  const title = String(value ?? '').trim();
  const withoutArticle = title.replace(leadingArticlePattern, '').trim();
  return withoutArticle || title;
}

function compareIndexTitles(left, right) {
  const leftTitle = sortableTitle(left.title);
  const rightTitle = sortableTitle(right.title);
  const primary = leftTitle.localeCompare(rightTitle, 'en', { sensitivity: 'base' });
  if (primary !== 0) return primary;
  return String(left.title ?? '').localeCompare(String(right.title ?? ''), 'en', { sensitivity: 'base' });
}

function alphaKey(value) {
  const normalized = sortableTitle(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
  const match = normalized.match(/[a-z0-9]/i);
  if (!match || /\d/.test(match[0])) return '#';
  return match[0].toUpperCase();
}

function alphaId(value) {
  return value === '#' ? 'other' : value.toLowerCase();
}

function groupedAlphabetically(items) {
  return [...Map.groupBy(items, (item) => alphaKey(item.title))]
    .sort(([left], [right]) => {
      if (left === '#') return 1;
      if (right === '#') return -1;
      return left.localeCompare(right, 'en', { sensitivity: 'base' });
    })
    .map(([letter, groupItems]) => ({
      letter,
      items: groupItems.sort(compareIndexTitles),
    }));
}

function renderAlphabeticalIndex(items, { idPrefix, kind, renderMeta, renderDescription }) {
  const groups = groupedAlphabetically(items);
  if (groups.length === 0) return '';

  const lines = [
    `<div class="codex-alpha-index" data-index-kind="${escapeHtml(kind)}" aria-label="Alphabetical ${escapeHtml(kind)} index">`,
  ];

  for (const group of groups) {
    const headingId = `${idPrefix}-${alphaId(group.letter)}`;
    lines.push(
      `<section class="codex-alpha-index__group" aria-labelledby="${headingId}">`,
      `<h3 id="${headingId}" class="codex-alpha-index__letter">${escapeHtml(group.letter)}</h3>`,
      '<ul class="codex-alpha-index__items">',
    );

    for (const item of group.items) {
      const meta = renderMeta?.(item);
      const description = renderDescription?.(item);
      lines.push(
        '<li class="codex-alpha-index__item">',
        `<div class="codex-alpha-index__line"><a class="codex-alpha-index__link" href="${escapeHtml(slugToRoute(item.slug))}">${escapeHtml(item.title)}</a>${meta ? `<span class="codex-alpha-index__meta">${escapeHtml(meta)}</span>` : ''}</div>`,
        description ? `<p class="codex-alpha-index__description">${escapeHtml(description)}</p>` : '',
        '</li>',
      );
    }

    lines.push('</ul>', '</section>');
  }

  lines.push('</div>');
  return lines.filter(Boolean).join('\n');
}

function generatedCategorySection(descendants, childCategories) {
  const lines = [];

  if (childCategories.length > 0) {
    lines.push(
      '## Subcategories',
      '',
      renderAlphabeticalIndex(childCategories, {
        idPrefix: 'subcategories',
        kind: 'subcategories',
        renderMeta: (child) => `${child.count} ${child.count === 1 ? 'page' : 'pages'}`,
      }),
      '',
    );
  }

  lines.push('## Pages in this category', '');
  if (descendants.length > 0) {
    lines.push(
      renderAlphabeticalIndex(descendants.map((entry) => ({
        slug: entry.slug,
        title: entry.data.title,
        type: entry.data.type,
        description: entry.data.description,
      })), {
        idPrefix: 'pages',
        kind: 'pages',
        renderMeta: (entry) => entry.type && entry.type !== 'article' ? entry.type : '',
        renderDescription: (entry) => entry.description,
      }),
    );
  } else {
    lines.push('_No public pages are currently available in this category._');
  }

  lines.push('');
  return lines.join('\n');
}

const generatedFiles = (await Array.fromAsync(fs.glob('**/*.{md,mdx}', { cwd: docsDir })))
  .map((file) => path.resolve(docsDir, file))
  .sort();
const entries = [];

for (const file of generatedFiles) {
  const raw = await fs.readFile(file, 'utf8');
  const parsed = matter(raw);
  if (parsed.data.status !== 'published' || parsed.data.type === 'category') continue;

  const slug = sourceRouteFromFile(file, parsed.data);
  if (!slug || slug === 'index') continue;
  entries.push({ file, slug, data: parsed.data });
}

const categories = new Map();
for (const entry of entries) {
  const segments = entry.slug.split('/').filter(Boolean);
  for (let depth = 1; depth < segments.length; depth += 1) {
    const slug = segments.slice(0, depth).join('/');
    if (!categories.has(slug)) {
      categories.set(slug, {
        slug,
        title: titleFromSegment(segments[depth - 1]),
      });
    }
  }
}

const entryBySlug = new Map(entries.map((entry) => [entry.slug, entry]));
const categoryList = [...categories.values()].sort((a, b) => a.slug.localeCompare(b.slug));

for (const category of categoryList) {
  const existingEntry = entryBySlug.get(category.slug);
  const existingType = String(existingEntry?.data.type ?? '').trim().toLowerCase();

  // Regular authored articles may own routes that also have descendants. Those
  // articles are not category pages and must not gain generated navigation.
  // Era landing pages are structural category hosts, so retain their established
  // Subcategories / Pages in this category index.
  if (existingEntry && existingType !== 'era') {
    console.log(`Skipped generated category index for ${category.slug}; route belongs to ${existingEntry.data.type ?? 'article'} article ${path.relative(docsDir, existingEntry.file)}.`);
    continue;
  }

  const prefix = `${category.slug}/`;
  const descendants = entries
    .filter((entry) => entry.slug.startsWith(prefix));
  const childDepth = category.slug.split('/').length + 1;
  const childCategories = categoryList
    .filter((candidate) => candidate.slug.startsWith(prefix) && candidate.slug.split('/').length === childDepth)
    .map((candidate) => ({
      ...candidate,
      count: descendants.filter((entry) => entry.slug.startsWith(`${candidate.slug}/`)).length,
    }));
  const section = generatedCategorySection(descendants, childCategories);

  if (existingEntry) {
    const raw = await fs.readFile(existingEntry.file, 'utf8');
    const parsed = matter(raw);
    const content = parsed.content.trimEnd();
    await fs.writeFile(existingEntry.file, matter.stringify(`${content}\n\n${section}`, parsed.data), 'utf8');
    console.log(`Extended ${path.relative(docsDir, existingEntry.file)} with a generated category index.`);
    continue;
  }

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
