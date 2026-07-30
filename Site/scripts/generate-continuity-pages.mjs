import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';
import { HISTORICAL_ERAS, continuityHubRoute, normaliseEra, validEntityId } from '../src/lib/era-context.mjs';
import { cleanSlug, slugToRoute, toPosixPath } from '../src/lib/codex-paths.mjs';

const siteRoot = process.cwd();
const docsDir = process.env.VISCERIUM_DOCS_DIR
  ? path.resolve(process.env.VISCERIUM_DOCS_DIR)
  : path.resolve(siteRoot, 'src/content/docs');
const markdownExtensions = /\.(md|mdx)$/i;
const eraRank = new Map([...HISTORICAL_ERAS, 'Universal'].map((era, index) => [era, index]));

function slugFromFile(file, data) {
  if (typeof data.slug === 'string' && data.slug.trim()) return cleanSlug(data.slug);
  return toPosixPath(path.relative(docsDir, file)).replace(markdownExtensions, '').replace(/\/index$/i, '');
}

function editionEra(data, slug) {
  const declared = normaliseEra(Array.isArray(data.era) ? data.era[0] : data.era);
  if (declared) return declared;
  const match = slug.match(/(?:^|\/)eras\/(citadel|smog|nearsight|entropy)(?:\/|$)/i);
  return match ? normaliseEra(match[1]) : undefined;
}

function compareEditions(left, right) {
  const era = (eraRank.get(left.era) ?? 99) - (eraRank.get(right.era) ?? 99);
  if (era !== 0) return era;
  return left.slug.localeCompare(right.slug);
}

function displayTitle(editions) {
  const latest = [...editions]
    .filter((edition) => edition.era !== 'Universal')
    .sort((a, b) => (eraRank.get(b.era) ?? -1) - (eraRank.get(a.era) ?? -1))[0];
  return latest?.data.title ?? editions[0]?.data.title ?? editions[0]?.entityId;
}

function continuityData(entityId, editions) {
  const routes = Object.fromEntries(editions.map((edition) => [edition.era, slugToRoute(edition.slug)]));
  return {
    entityId,
    hub: continuityHubRoute(entityId),
    editions: routes,
  };
}

function renderHubBody(title, editions) {
  const lines = [
    'This entry follows the same subject across VISCERIUM’s eras. Choose an era to read only the facts relevant to that period.',
    '',
    '## Available editions',
    '',
  ];
  for (const edition of editions) {
    lines.push(`### ${edition.era}`, '', `[Open ${edition.data.title ?? title} in ${edition.era}](${slugToRoute(edition.slug)})`, '');
    if (edition.data.description) lines.push(String(edition.data.description).trim(), '');
  }
  return lines.join('\n').trimEnd() + '\n';
}

const files = (await Array.fromAsync(fs.glob('**/*.{md,mdx}', { cwd: docsDir })))
  .map((file) => path.resolve(docsDir, file))
  .sort();
const families = new Map();

for (const file of files) {
  const raw = await fs.readFile(file, 'utf8');
  const parsed = matter(raw);
  if (parsed.data.status !== 'published' || parsed.data.type === 'continuity') continue;
  const entityId = String(parsed.data.entity_id ?? '').trim();
  if (!validEntityId(entityId)) continue;
  const slug = slugFromFile(file, parsed.data);
  const era = editionEra(parsed.data, slug);
  if (!era) continue;
  const edition = { file, raw, parsed, data: parsed.data, slug, era, entityId };
  const entries = families.get(entityId) ?? [];
  entries.push(edition);
  families.set(entityId, entries);
}

for (const [entityId, rawEditions] of families.entries()) {
  const editions = rawEditions.sort(compareEditions);
  const continuity = continuityData(entityId, editions);

  for (const edition of editions) {
    edition.parsed.data.continuity = continuity;
    await fs.writeFile(edition.file, matter.stringify(edition.parsed.content, edition.parsed.data), 'utf8');
  }

  const title = displayTitle(editions);
  const hubSlug = `entities/${entityId}`;
  const outFile = path.join(docsDir, hubSlug, 'index.md');
  const tags = [...new Set(editions.flatMap((edition) => Array.isArray(edition.data.tags) ? edition.data.tags : []).map(String).filter(Boolean))];
  const frontmatter = {
    title,
    description: `Cross-era Codex view of ${title}. Available editions: ${editions.map((edition) => edition.era).join(', ')}.`,
    status: 'published',
    slug: hubSlug,
    type: 'continuity',
    entity_id: entityId,
    continuity,
    links: editions.map((edition) => `${edition.slug}/`),
    ...(tags.length ? { tags } : {}),
    tableOfContents: false,
  };
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, matter.stringify(renderHubBody(title, editions), frontmatter), 'utf8');
}

console.log(`Generated ${families.size} continuity hub${families.size === 1 ? '' : 's'}.`);
