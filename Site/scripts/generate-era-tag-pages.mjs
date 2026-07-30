import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';
import { HISTORICAL_ERAS, normaliseEra } from '../src/lib/era-context.mjs';
import { cleanSlug, escapeHtml, slugToRoute, toPosixPath } from '../src/lib/codex-paths.mjs';

const siteRoot = process.cwd();
const docsDir = process.env.VISCERIUM_DOCS_DIR
  ? path.resolve(process.env.VISCERIUM_DOCS_DIR)
  : path.resolve(siteRoot, 'src/content/docs');
const markdownExtensions = /\.(md|mdx)$/i;

function sourceSlug(file, data) {
  if (typeof data.slug === 'string' && data.slug.trim()) return cleanSlug(data.slug);
  return toPosixPath(path.relative(docsDir, file)).replace(markdownExtensions, '').replace(/\/index$/i, '');
}

function effectiveEra(data, slug) {
  const raw = Array.isArray(data.era) ? data.era[0] : data.era;
  const declared = normaliseEra(raw);
  if (declared) return declared;
  const match = slug.match(/(?:^|\/)eras\/(citadel|smog|nearsight|entropy)(?:\/|$)/i);
  return match ? normaliseEra(match[1]) : undefined;
}

function tagSlug(tag) {
  return cleanSlug(String(tag).replace(/^#/, ''));
}

function renderIndex(tag, era, entries) {
  const lines = [
    `Browse **#${tag}** within ${era}. Universal material is included because it is intentionally valid in every historical era.`,
    '',
    `<div class="codex-alpha-index" data-index-kind="era-tag" aria-label="${escapeHtml(tag)} pages in ${era}">`,
    '<ul class="codex-alpha-index__items">',
  ];
  for (const entry of entries.sort((a, b) => String(a.data.title).localeCompare(String(b.data.title), 'en', { sensitivity: 'base' }))) {
    const meta = entry.era === 'Universal' ? 'Universal' : entry.data.type && entry.data.type !== 'article' ? entry.data.type : '';
    lines.push(
      '<li class="codex-alpha-index__item">',
      `<div class="codex-alpha-index__line"><a class="codex-alpha-index__link" href="${escapeHtml(slugToRoute(entry.slug))}">${escapeHtml(entry.data.title)}</a>${meta ? `<span class="codex-alpha-index__meta">${escapeHtml(meta)}</span>` : ''}</div>`,
      entry.data.description ? `<p class="codex-alpha-index__description">${escapeHtml(entry.data.description)}</p>` : '',
      '</li>',
    );
  }
  lines.push('</ul>', '</div>');
  return lines.filter(Boolean).join('\n');
}

const files = (await Array.fromAsync(fs.glob('**/*.{md,mdx}', { cwd: docsDir })))
  .map((file) => path.resolve(docsDir, file))
  .sort();
const sourceEntries = [];

for (const file of files) {
  const parsed = matter(await fs.readFile(file, 'utf8'));
  if (parsed.data.status !== 'published') continue;
  if (['category', 'continuity'].includes(parsed.data.type)) continue;
  const tags = Array.isArray(parsed.data.tags) ? parsed.data.tags.map((tag) => String(tag).trim()).filter(Boolean) : [];
  if (!tags.length) continue;
  const slug = sourceSlug(file, parsed.data);
  const era = effectiveEra(parsed.data, slug);
  if (!era) continue;
  sourceEntries.push({ file, slug, era, data: parsed.data, tags });
}

let generated = 0;
for (const era of HISTORICAL_ERAS) {
  const byTag = new Map();
  for (const entry of sourceEntries) {
    if (entry.era !== era && entry.era !== 'Universal') continue;
    for (const tag of entry.tags) {
      const list = byTag.get(tag) ?? [];
      list.push(entry);
      byTag.set(tag, list);
    }
  }

  for (const [tag, entries] of byTag.entries()) {
    const normalizedTag = tagSlug(tag);
    if (!normalizedTag) continue;
    const slug = `eras/${era.toLowerCase()}/tags/${normalizedTag}`;
    const outFile = path.join(docsDir, slug, 'index.md');
    const frontmatter = {
      title: `#${tag} — ${era}`,
      description: `Pages tagged ${tag} that are relevant to ${era}, including Universal material.`,
      status: 'published',
      slug,
      type: 'category',
      era,
      searchable: false,
      tableOfContents: false,
    };
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, matter.stringify(renderIndex(tag, era, entries), frontmatter), 'utf8');
    generated += 1;
  }
}

console.log(`Generated ${generated} era-scoped tag page${generated === 1 ? '' : 's'}.`);
