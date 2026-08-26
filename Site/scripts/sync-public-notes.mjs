import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import matter from 'gray-matter';
import { slugToRoute, toPosixPath, vaultSourceSlug } from '../src/lib/codex-paths.mjs';
import { pageEra, resolveContextualTarget, validEntityId } from '../src/lib/era-context.mjs';
import siteConfig from '../site.config.mjs';
import { requiresCodexMdx, transformCodexFormatting } from './codex-formatting.mjs';
import { parseObsidianImageEmbed, renderArticleImage } from './image-layout.mjs';
import { inferNoteType, sourceSegments } from './note-inference.mjs';
import { walk } from './lib/walk.mjs';
import { resolveGiscusForPage } from '../src/lib/page-kind.mjs';
import { stringifyGeneratedFrontmatter } from './sync-frontmatter.mjs';
import { isMainModule } from './script-entry.mjs';

const siteRoot = process.cwd();
const sourceDir = path.resolve(siteRoot, siteConfig.loreSourceDir);
const assetRoot = path.resolve(siteRoot, siteConfig.vaultAssetDir);
const outDir = path.resolve(siteRoot, 'src/content/docs');
const publicAssetDir = path.resolve(siteRoot, 'public/assets');
const missingImagePath = '/assets/images/missing-image.svg';
const missingImageFilename = 'missing-image.svg';
const imageExtensions = /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i;
const calendarComponentPath = path.resolve(siteRoot, 'src/components/calendar/CalendarYear.astro');
const requiredFields = ['title', 'description'];
const eraStyleByEra = new Map([
  ['citadel', 'e1'],
  ['smog', 'e2'],
  ['nearsight', 'e3'],
  ['entropy', 'e4'],
]);

function slugFromFile(file) {
  return vaultSourceSlug(path.relative(sourceDir, file));
}

function inferEra(file) {
  const segments = sourceSegments(file, sourceDir);
  const eraIndex = segments.findIndex((segment) => segment.toLowerCase() === 'eras');
  return eraIndex >= 0 && segments[eraIndex + 1] ? segments[eraIndex + 1] : undefined;
}

function normaliseEraKey(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return undefined;
  return raw.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function inferEraStyle(file, data = {}) {
  const segments = sourceSegments(file, sourceDir).map((segment) => segment.toLowerCase());
  const eraIndex = segments.findIndex((segment) => segment === 'eras');
  const eraFromFolder = eraIndex >= 0 ? normaliseEraKey(segments[eraIndex + 1]) : undefined;
  return eraStyleByEra.get(eraFromFolder) ?? eraStyleByEra.get(normaliseEraKey(data.era));
}

function noteKey(input) {
  return String(input).trim().toLowerCase();
}

function linkKey(input) {
  return String(input ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/\.md$/i, '')
    .replace(/^\.\//, '')
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();
}

function assetKey(input) {
  return path.basename(String(input).trim()).toLowerCase();
}

function isExternalUrl(value) {
  return typeof value === 'string' && /^[a-z][a-z0-9+.-]*:/i.test(value);
}

function stripUrlSuffix(value) {
  return String(value).split(/[?#]/, 1)[0];
}

function isPlainAssetFilename(value) {
  return typeof value === 'string' && value.trim() && !value.startsWith('/') && !isExternalUrl(value);
}

function managedAssetReference(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || isExternalUrl(trimmed)) return null;
  const pathOnly = stripUrlSuffix(trimmed);
  const filename = path.basename(pathOnly);

  if (trimmed.startsWith('/assets/images/')) return { category: 'Images', filename };
  if (trimmed.startsWith('/assets/maps/')) return { category: 'Maps', filename };
  if (isPlainAssetFilename(trimmed) && imageExtensions.test(filename)) return { category: 'Images', filename };
  return null;
}

function parseFrontmatter(raw, file) {
  if (!raw.startsWith('---\n')) throw new Error(`Missing frontmatter: ${path.relative(siteRoot, file)}`);
  const end = raw.indexOf('\n---', 4);
  if (end === -1) throw new Error(`Unclosed frontmatter: ${path.relative(siteRoot, file)}`);
  const frontmatter = raw.slice(4, end).trimEnd();
  const parsed = matter(raw);
  return {
    data: parsed.data ?? {},
    frontmatter,
    content: parsed.content.replace(/^\r?\n/, ''),
  };
}

async function pathExists(file) {
  try {
    await fs.access(file, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function emptyDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

export async function syncPublicNotes() {
const files = (await walk(sourceDir)).filter((file) => /\.(md|mdx)$/i.test(file)).sort();
const publicNotes = [];
const targetIndex = new Map();
const imageSlugByAsset = new Map();
const warnings = [];

function addTarget(key, candidate) {
  const normalized = linkKey(key);
  if (!normalized) return;
  const entries = targetIndex.get(normalized) ?? [];
  if (!entries.some((entry) => entry.slug === candidate.slug)) entries.push(candidate);
  targetIndex.set(normalized, entries);
}

for (const file of files) {
  const raw = await fs.readFile(file, 'utf8');
  const parsed = parseFrontmatter(raw, file);
  if (parsed.data.status !== 'published') continue;
  const slug = slugFromFile(file);
  parsed.data.slug = slug;
  parsed.data.type ||= inferNoteType(file, sourceDir);
  parsed.data.era ||= inferEra(file);
  parsed.data.eraStyle ||= inferEraStyle(file, parsed.data);
  for (const field of requiredFields) {
    if (!parsed.data[field]) throw new Error(`Public note is missing required frontmatter "${field}": ${path.relative(siteRoot, file)}`);
  }
  if (publicNotes.some((note) => note.slug === slug)) throw new Error(`Duplicate published route "${slug}" in ${path.relative(siteRoot, file)}`);
  const sourcePath = toPosixPath(path.relative(sourceDir, file));
  const candidate = {
    slug,
    title: parsed.data.title,
    era: pageEra(parsed.data, sourcePath),
    entity_id: validEntityId(parsed.data.entity_id) ? parsed.data.entity_id : undefined,
    sourcePath,
  };
  const note = { file, parsed, slug, sourcePath, candidate };
  publicNotes.push(note);

  const basename = path.basename(file, path.extname(file));
  const sourceNoExt = sourcePath.replace(/\.(md|mdx)$/i, '');
  addTarget(basename, candidate);
  addTarget(parsed.data.title, candidate);
  addTarget(sourceNoExt, candidate);
  addTarget(`Lore/${sourceNoExt}`, candidate);
  addTarget(slug, candidate);
}

for (const note of publicNotes) {
  const asset = note.parsed.data.asset;
  if (note.parsed.data.type === 'image' && typeof asset === 'string' && asset.trim()) {
    imageSlugByAsset.set(assetKey(asset), note.slug);
  }
}

function contextualResolution(rawTarget, currentFile, parsed) {
  const target = String(rawTarget ?? '').trim();
  if (!target) return null;
  const candidates = targetIndex.get(linkKey(target)) ?? [];
  if (candidates.length === 0) return null;

  // An explicit vault/path-qualified wikilink is an authorial choice and may cross
  // eras deliberately. A bare conceptual title is era-scoped instead.
  if (target.includes('/') && candidates.length === 1) {
    return { kind: 'page', candidate: candidates[0] };
  }

  const sourcePath = toPosixPath(path.relative(sourceDir, currentFile));
  return resolveContextualTarget(candidates, pageEra(parsed.data, sourcePath));
}

function resolvedRoute(rawTarget, currentFile, parsed) {
  const resolved = contextualResolution(rawTarget, currentFile, parsed);
  if (resolved?.kind === 'page') return slugToRoute(resolved.candidate.slug);
  if (resolved?.kind === 'continuity') return resolved.route;
  return null;
}

function graphLinks(data, sourceSlug, currentFile, parsed) {
  const references = [
    ...Object.values(data.relationships ?? {}),
    data.related,
  ].flatMap((value) => Array.isArray(value) ? value : [value]);

  return [...new Set(references
    .filter((value) => typeof value === 'string')
    .map((value) => resolvedRoute(value.replace(/^\[\[|\]\]$/g, ''), currentFile, parsed))
    .filter((route) => route && route !== slugToRoute(sourceSlug))
    .map((route) => route.replace(/^\/+/, '')))];
}

await emptyDir(outDir);
await fs.mkdir(publicAssetDir, { recursive: true });

async function ensureMissingImagePlaceholder() {
  const target = path.join(publicAssetDir, 'images', missingImageFilename);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
  <title id="title">Missing image</title>
  <desc id="desc">A placeholder generated during codex sync when a referenced vault image is missing.</desc>
  <rect width="1200" height="675" fill="#151515"/>
  <path d="M0 0h1200v675H0z" fill="none" stroke="#4a4a4a" stroke-width="24"/>
  <path d="M330 420 475 285l105 105 70-70 220 230H300z" fill="#2f2f2f" stroke="#777" stroke-width="10"/>
  <circle cx="800" cy="215" r="55" fill="#3b3b3b" stroke="#777" stroke-width="10"/>
  <text x="600" y="590" fill="#d8d8d8" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="52" font-weight="700" text-anchor="middle">Missing image</text>
</svg>
`, 'utf8');
  return missingImagePath;
}

await ensureMissingImagePlaceholder();

async function copyAsset(category, filename) {
  const source = path.join(assetRoot, category, filename);
  if (!(await pathExists(source))) return null;
  const target = path.join(publicAssetDir, category.toLowerCase(), filename);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(source, target);
  return `/assets/${category.toLowerCase()}/${filename}`;
}

async function resolveReferencedAsset(value, currentFile, label) {
  const reference = managedAssetReference(value);
  if (!reference) return { managed: false, url: value };

  const url = await copyAsset(reference.category, reference.filename);
  if (url) return { managed: true, url, filename: reference.filename };

  warnings.push(`Missing ${label} asset "${reference.filename}" in ${path.relative(sourceDir, currentFile)}; using ${missingImagePath}`);
  return { managed: true, url: missingImagePath, filename: reference.filename };
}

function renderMarkdownImage(alt, filename, url, title = '') {
  const suffix = title ? ` ${title}` : '';
  const image = `![${alt || filename}](${url}${suffix})`;
  const imageSlug = imageSlugByAsset.get(assetKey(filename));
  return imageSlug ? `[${image}](${slugToRoute(imageSlug)})` : image;
}

function markdownImage(filename, url) {
  return renderMarkdownImage(filename, filename, url);
}

function parseMarkdownImageDestination(destination) {
  const trimmed = String(destination ?? '').trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('<')) {
    const closeIndex = trimmed.indexOf('>');
    if (closeIndex !== -1) {
      return {
        url: trimmed.slice(1, closeIndex).trim(),
        title: trimmed.slice(closeIndex + 1).trim(),
      };
    }
  }
  const match = trimmed.match(/^(\S+)(?:\s+(.+))?$/);
  if (!match) return { url: trimmed, title: '' };
  return { url: match[1], title: match[2]?.trim() ?? '' };
}

async function rewriteMarkdownImages(content, currentFile) {
  let converted = content;
  const images = [...converted.matchAll(/!\[([^\]]*)\]\(([^)\n]+)\)/g)];
  for (const match of images) {
    const [original, alt, destination] = match;
    const parsed = parseMarkdownImageDestination(destination);
    if (!parsed) continue;
    const reference = managedAssetReference(parsed.url);
    if (!reference) continue;

    const resolved = await resolveReferencedAsset(parsed.url, currentFile, 'markdown image');
    converted = converted.replace(original, renderMarkdownImage(alt, reference.filename, resolved.url, parsed.title));
  }
  return converted;
}

function hasCalendarShortcodes(content) {
  return /^\s*\[Calendar:[^\]]+\]\s*$/im.test(content);
}

function stripDataviewBlocks(content) {
  return String(content).replace(/```dataviewjs[\s\S]*?```\s*/gi, '');
}

function normaliseEventLinks(links) {
  if (!links || typeof links !== 'object' || Array.isArray(links)) return undefined;
  const normalised = {};
  for (const [slug, value] of Object.entries(links)) {
    if (typeof value === 'string' && value.trim()) {
      normalised[slug] = value.trim();
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const href = typeof value.href === 'string' && value.href.trim() ? value.href.trim() : undefined;
      const article = typeof value.article === 'string' && value.article.trim() ? value.article.trim() : undefined;
      const label = typeof value.label === 'string' && value.label.trim() ? value.label.trim() : undefined;
      if (href || article) normalised[slug] = { href, article, label };
    }
  }
  return Object.keys(normalised).length > 0 ? normalised : undefined;
}

function normaliseCalendarBlock(block) {
  if (!block || typeof block !== 'object' || Array.isArray(block)) return null;
  const calendar = typeof block.calendar === 'string' ? block.calendar : undefined;
  const year = block.year === undefined ? undefined : Number(block.year);
  if (!calendar) return null;
  if (year !== undefined && (!Number.isInteger(year) || year < 1)) return null;
  const eventLinks = normaliseEventLinks(block.eventLinks ?? block.observanceLinks ?? block.links);
  return eventLinks ? { calendar, year, eventLinks } : { calendar, year };
}

function parseInlineCalendarSpec(id, spec) {
  const block = { calendar: id };
  const pairs = [...String(spec ?? '').matchAll(/([a-z][\w-]*)=(?:"([^"]*)"|'([^']*)'|([^\s]+))/gi)];
  for (const pair of pairs) {
    const key = pair[1].toLowerCase();
    const value = pair[2] ?? pair[3] ?? pair[4] ?? '';
    if (key === 'calendar') block.calendar = value;
    if (key === 'year') block.year = Number(value);
  }
  return normaliseCalendarBlock(block);
}

function mdxImportPath(outFile) {
  let relative = path.relative(path.dirname(outFile), calendarComponentPath).replace(/\\/g, '/');
  if (!relative.startsWith('.')) relative = `./${relative}`;
  return relative;
}

function calendarShortcodeWarning(message) {
  return `:::caution[Calendar shortcode warning]\n${message}\n:::`;
}

function transformCalendarShortcodes(content, parsed, currentFile, outFile) {
  const calendarBlocks = parsed.data.calendarBlocks && typeof parsed.data.calendarBlocks === 'object'
    ? parsed.data.calendarBlocks
    : {};
  let used = false;
  let fence = null;

  const lines = String(content).split(/\r?\n/).map((line) => {
    const fenceStart = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      const endPattern = fence.marker === '`' ? /^\s*`{3,}/ : /^\s*~{3,}/;
      const end = line.match(endPattern);
      if (end && end[0].trim().length >= fence.length) fence = null;
      return line;
    }
    if (fenceStart) {
      fence = { marker: fenceStart[1][0], length: fenceStart[1].length };
      return line;
    }

    const match = line.match(/^\s*\[Calendar:([^\]\s]+)(?:\s+([^\]]+))?\]\s*$/i);
    if (!match) return line;

    const id = match[1];
    const inlineSpec = match[2] ?? '';
    const block = normaliseCalendarBlock(calendarBlocks[id]) ?? parseInlineCalendarSpec(id, inlineSpec);
    if (!block) {
      warnings.push(`Unknown or invalid calendar shortcode "${id}" in ${path.relative(sourceDir, currentFile)}`);
      return calendarShortcodeWarning(`No valid calendar block found for ${id}. Add a calendarBlocks entry or use [Calendar:okse year=4].`);
    }

    used = true;
    const calendarId = JSON.stringify(block.calendar);
    const yearProp = block.year === undefined ? '' : ` year={${block.year}}`;
    const eventLinksProp = block.eventLinks ? ` eventLinks={${JSON.stringify(block.eventLinks)}}` : '';
    return `<CalendarYear calendarId={${calendarId}}${yearProp}${eventLinksProp} />`;
  });

  const output = lines.join('\n');
  if (!used) return { content: output, used: false };

  return {
    content: `import CalendarYear from '${mdxImportPath(outFile)}';\n\n${output}`,
    used: true,
  };
}

async function convertContent(content, currentFile, parsed, outFile, outputRequiresMdx) {
  let converted = stripDataviewBlocks(content).replace(/^%%[\s\S]*?%%\s*/gm, '');
  const embeds = [...converted.matchAll(/!\[\[([^\]]+)\]\]/g)];
  for (const match of embeds) {
    const imageSpec = parseObsidianImageEmbed(match[1]);
    const rawTarget = imageSpec.target.trim();
    const filename = path.basename(rawTarget);
    let url = await copyAsset('Images', filename) ?? await copyAsset('Maps', filename) ?? await copyAsset('Documents', filename);
    if (!url) {
      warnings.push(`Missing embedded asset "${filename}" in ${path.relative(sourceDir, currentFile)}; using ${missingImagePath}`);
      url = missingImagePath;
    }

    for (const issue of imageSpec.issues) {
      warnings.push(`Image layout "${match[1]}" in ${path.relative(sourceDir, currentFile)}: ${issue}`);
    }

    const imageSlug = imageSlugByAsset.get(assetKey(filename));
    const href = imageSlug ? slugToRoute(imageSlug) : undefined;
    const rendered = imageSpec.hasLayout
      ? renderArticleImage({ spec: imageSpec, filename, url, href, jsx: outputRequiresMdx })
      : renderMarkdownImage(imageSpec.alt || filename, filename, url);
    converted = converted.replace(match[0], rendered);
  }

  converted = await rewriteMarkdownImages(converted, currentFile);

  converted = converted.replace(new RegExp(`^#\\s+${RegExp.escape(String(parsed.data.title))}\\s*$`, 'im'), '').trimStart();
  converted = converted.replace(/^#\s+\{\{title\}\}\s*$/im, '').trimStart();

  converted = converted.replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (match, target, alias) => {
    const label = alias?.trim() || target.trim();
    const route = resolvedRoute(target, currentFile, parsed);
    if (!route) {
      warnings.push(`Unpublished, missing or era-ambiguous wikilink "${target.trim()}" in ${path.relative(sourceDir, currentFile)}`);
      return label;
    }
    return `[${label}](${route})`;
  });

  converted = transformCodexFormatting(converted, {
    jsx: outputRequiresMdx,
  });

  return transformCalendarShortcodes(converted, parsed, currentFile, outFile);
}

for (const { file, parsed, slug, sourcePath } of publicNotes) {
  const sourceIsMdx = path.extname(file).toLowerCase() === '.mdx';
  const shortcodeRequiresMdx = hasCalendarShortcodes(parsed.content);
  const extension = sourceIsMdx || shortcodeRequiresMdx || requiresCodexMdx(parsed.content) ? '.mdx' : '.md';
  const outFile = path.join(outDir, `${slug}${extension}`);
  const frontmatterAssets = {};
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  for (const field of ['image', 'headerImage']) {
    const resolved = await resolveReferencedAsset(parsed.data[field], file, `frontmatter ${field}`);
    if (resolved.managed) frontmatterAssets[field] = resolved.url;
  }
  if (parsed.data.asset && parsed.data.type === 'image') await copyAsset('Images', parsed.data.asset);
  const result = await convertContent(parsed.content, file, parsed, outFile, extension === '.mdx');
  await fs.writeFile(outFile, `${stringifyGeneratedFrontmatter(parsed.frontmatter, {
    slug,
    type: parsed.data.type,
    era: parsed.data.era,
    eraStyle: parsed.data.eraStyle,
    giscus: resolveGiscusForPage(parsed.data, slug),
    links: graphLinks(parsed.data, slug, file, parsed),
    sourcePath,
    assets: frontmatterAssets,
  })}${result.content}`);
  console.log(`Published ${path.relative(sourceDir, file)} -> ${path.relative(outDir, outFile)}`);
}

if (warnings.length > 0) {
  console.warn('\nSync warnings:');
  for (const warning of warnings) console.warn(`- ${warning}`);
}
}

if (isMainModule(import.meta.url)) await syncPublicNotes();
