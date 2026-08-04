import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { cleanSlug, toPosixPath } from '../src/lib/codex-paths.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(siteRoot, '..');
const loreRoot = path.resolve(repoRoot, 'Vault/Lore');
const shouldWrite = process.argv.includes('--write');

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else files.push(target);
  }
  return files;
}

function key(value) {
  return String(value ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/\.mdx?$/i, '')
    .replace(/^\.\//, '')
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();
}

function slugFromSourcePath(sourcePath) {
  return sourcePath
    .replace(/\.(md|mdx)$/i, '')
    .split('/')
    .map((segment) => cleanSlug(segment).replace(/\s+/g, '-'))
    .join('/');
}

function addIndex(index, rawKey, candidate) {
  const normalized = key(rawKey);
  if (!normalized) return;
  const candidates = index.get(normalized) ?? [];
  if (!candidates.some((entry) => entry.file === candidate.file)) candidates.push(candidate);
  index.set(normalized, candidates);
}

function wikilinkFor(candidate, titleIndex) {
  const sameTitle = titleIndex.get(key(candidate.title)) ?? [];
  if (sameTitle.length === 1) return `[[${candidate.title}]]`;
  return `[[Lore/${candidate.sourceNoExt}|${candidate.title}]]`;
}

function candidateForText(value, index) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes('[[')) return null;

  const exact = index.get(key(trimmed)) ?? [];
  if (exact.length === 1) return exact[0];

  const separators = [' — ', ' – ', ' - ', ': '];
  for (const separator of separators) {
    const separatorIndex = trimmed.indexOf(separator);
    if (separatorIndex <= 0) continue;
    const prefix = trimmed.slice(0, separatorIndex).trim();
    const candidates = index.get(key(prefix)) ?? [];
    if (candidates.length === 1) return candidates[0];
  }

  return null;
}

function candidateForHref(value, routeIndex) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('[[') || !trimmed.startsWith('/')) return null;
  const candidates = routeIndex.get(key(trimmed)) ?? [];
  return candidates.length === 1 ? candidates[0] : null;
}

function migrateField(field, context) {
  if (Array.isArray(field)) {
    const [label, value] = field;
    const candidate = candidateForText(value, context.linkIndex);
    if (!candidate || candidate.file === context.currentFile) return field;
    return { label, value, href: wikilinkFor(candidate, context.titleIndex) };
  }

  if (!field || typeof field !== 'object') return field;
  const migrated = { ...field };
  const hrefCandidate = candidateForHref(migrated.href, context.routeIndex);
  if (hrefCandidate && hrefCandidate.file !== context.currentFile) {
    migrated.href = wikilinkFor(hrefCandidate, context.titleIndex);
    return migrated;
  }
  if (typeof migrated.href === 'string' && migrated.href.trim()) return migrated;

  const value = migrated.value ?? migrated.text;
  const candidate = candidateForText(value, context.linkIndex);
  if (candidate && candidate.file !== context.currentFile) {
    migrated.href = wikilinkFor(candidate, context.titleIndex);
  }
  return migrated;
}

function migrateItem(item, context) {
  if (typeof item === 'string') {
    const candidate = candidateForText(item, context.linkIndex);
    if (!candidate || candidate.file === context.currentFile) return item;
    return { label: item, href: wikilinkFor(candidate, context.titleIndex) };
  }

  if (!item || typeof item !== 'object') return item;
  const migrated = { ...item };
  const hrefCandidate = candidateForHref(migrated.href, context.routeIndex);
  if (hrefCandidate && hrefCandidate.file !== context.currentFile) {
    migrated.href = wikilinkFor(hrefCandidate, context.titleIndex);
    return migrated;
  }
  if (typeof migrated.href === 'string' && migrated.href.trim()) return migrated;

  const label = migrated.label ?? migrated.title ?? migrated.name ?? migrated.value;
  const candidate = candidateForText(label, context.linkIndex);
  if (candidate && candidate.file !== context.currentFile) {
    migrated.href = wikilinkFor(candidate, context.titleIndex);
  }
  return migrated;
}

export function migrateSidebar(sidebar, context) {
  if (!sidebar || typeof sidebar !== 'object' || Array.isArray(sidebar)) return sidebar;
  const migrated = { ...sidebar };

  if (Array.isArray(sidebar.meta)) {
    migrated.meta = sidebar.meta.map((field) => migrateField(field, context));
  }

  if (Array.isArray(sidebar.sections)) {
    migrated.sections = sidebar.sections.map((section) => {
      if (!section || typeof section !== 'object' || Array.isArray(section)) return section;
      const next = { ...section };
      if (Array.isArray(section.fields)) next.fields = section.fields.map((field) => migrateField(field, context));
      if (Array.isArray(section.items)) next.items = section.items.map((item) => migrateItem(item, context));
      return next;
    });
  }

  return migrated;
}

function serializeField(keyName, value) {
  return matter.stringify('', { [keyName]: value })
    .replace(/\r\n/g, '\n')
    .replace(/^---\n/, '')
    .replace(/\n---\n?$/, '')
    .trimEnd();
}

function replaceTopLevelField(frontmatter, keyName, value) {
  const lines = frontmatter.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((line) => line === `${keyName}:` || line.startsWith(`${keyName}: `));
  if (start === -1) return frontmatter;

  let end = start + 1;
  while (end < lines.length && (lines[end].startsWith(' ') || lines[end].startsWith('\t') || lines[end].trim() === '')) end += 1;

  lines.splice(start, end - start, ...serializeField(keyName, value).split('\n'));
  return lines.join('\n');
}

function replaceSidebarInRaw(raw, sidebar) {
  if (!raw.startsWith('---\n')) return raw;
  const close = raw.indexOf('\n---', 4);
  if (close === -1) return raw;
  const frontmatter = raw.slice(4, close);
  const replaced = replaceTopLevelField(frontmatter, 'sidebar', sidebar);
  return `---\n${replaced.trimEnd()}\n---${raw.slice(close + 4)}`;
}

const files = (await walk(loreRoot))
  .filter((file) => /\.(md|mdx)$/i.test(file))
  .sort();

const notes = [];
const titleIndex = new Map();
const linkIndex = new Map();
const routeIndex = new Map();

for (const file of files) {
  const raw = await fs.readFile(file, 'utf8');
  let parsed;
  try {
    parsed = matter(raw);
  } catch (error) {
    console.warn(`Skipping invalid frontmatter in ${path.relative(repoRoot, file)}: ${error.message}`);
    continue;
  }

  const title = typeof parsed.data.title === 'string' ? parsed.data.title.trim() : '';
  if (!title) continue;
  const sourcePath = toPosixPath(path.relative(loreRoot, file));
  const sourceNoExt = sourcePath.replace(/\.(md|mdx)$/i, '');
  const basename = path.basename(file, path.extname(file));
  const slug = slugFromSourcePath(sourcePath);
  const candidate = { file, title, sourcePath, sourceNoExt, basename, slug, raw, data: parsed.data };
  notes.push(candidate);

  addIndex(titleIndex, title, candidate);
  for (const entry of [title, basename, sourceNoExt, `Lore/${sourceNoExt}`]) addIndex(linkIndex, entry, candidate);
  for (const route of [slug, `/${slug}`, `/${slug}/`]) addIndex(routeIndex, route, candidate);
}

const changed = [];
for (const note of notes) {
  if (!note.data.sidebar || typeof note.data.sidebar !== 'object' || Array.isArray(note.data.sidebar)) continue;
  const sidebar = migrateSidebar(note.data.sidebar, {
    currentFile: note.file,
    titleIndex,
    linkIndex,
    routeIndex,
  });
  if (JSON.stringify(sidebar) === JSON.stringify(note.data.sidebar)) continue;

  const nextRaw = replaceSidebarInRaw(note.raw, sidebar);
  if (nextRaw === note.raw) continue;
  changed.push(path.relative(repoRoot, note.file));
  if (shouldWrite) await fs.writeFile(note.file, nextRaw, 'utf8');
}

if (changed.length === 0) {
  console.log('No sidebar article references require migration.');
} else {
  console.log(`${shouldWrite ? 'Updated' : 'Would update'} ${changed.length} sidebar file(s):`);
  for (const file of changed) console.log(`- ${file}`);
  if (!shouldWrite) console.log('\nRun with --write to apply these changes.');
}
