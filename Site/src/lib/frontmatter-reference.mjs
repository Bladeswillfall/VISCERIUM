import { parseSidebarWikilink } from './sidebar-links.mjs';

const navigationFields = new Set(['href', 'sourceurl', 'imagepage', 'eventshref', 'nexterahref']);
const assetFields = new Set(['src', 'image', 'headerimage', 'asset', 'sigil']);
const unsafeCharacters = /[\u0000-\u001f\u007f\\]/;
const scheme = /^([a-z][a-z0-9+.-]*):/i;

function safeInternalReference(value) {
  if (unsafeCharacters.test(value) || value.startsWith('//')) return false;
  return value.startsWith('/') || value.startsWith('#');
}

function safeNavigationUrl(value) {
  const match = value.match(scheme);
  if (!match || !['http', 'https', 'mailto'].includes(match[1].toLowerCase())) return undefined;
  const protocol = match[1].toLowerCase();
  if (/\s/.test(value)) return undefined;
  if ((protocol === 'http' || protocol === 'https') && (!/^https?:\/\//i.test(value) || /^https?:\/\/\//i.test(value))) {
    return undefined;
  }

  try {
    const url = new URL(value);
    if (url.protocol === 'mailto:') return url.pathname && !url.pathname.startsWith('//') ? value : undefined;
    return url.hostname ? value : undefined;
  } catch {
    return undefined;
  }
}

function managedAssetPath(value, category) {
  if (unsafeCharacters.test(value) || value.startsWith('//') || /[?#:]/.test(value)) return undefined;
  const pathOnly = value.replace(/^\/+/, '');
  const segments = pathOnly.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) return undefined;

  const filename = segments.at(-1);
  if (!filename || !/\.[a-z0-9]{2,8}$/i.test(filename)) return undefined;
  if (value.startsWith('/')) return value;

  const lowerSegments = segments.map((segment) => segment.toLowerCase());
  const managedCategory = lowerSegments[0] === 'assets' && lowerSegments[1] === 'maps'
    ? 'maps'
    : lowerSegments[0] === 'assets' && lowerSegments[1] === 'images'
      ? 'images'
      : category;
  return `/assets/${managedCategory}/${filename}`;
}

export function frontmatterReferenceKind(field) {
  const key = String(field ?? '').toLowerCase();
  if (navigationFields.has(key)) return 'navigation';
  if (assetFields.has(key)) return 'asset';
  return undefined;
}

export function resolveFrontmatterReference(value, options = {}) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || unsafeCharacters.test(trimmed)) return undefined;

  const kind = options.kind ?? 'navigation';
  if (kind === 'asset') {
    if (scheme.test(trimmed)) return undefined;
    return managedAssetPath(trimmed, options.assetCategory ?? 'images');
  }

  const wikilink = parseSidebarWikilink(trimmed);
  if (wikilink) {
    if (!wikilink.target) return undefined;
    if (!options.resolveWikilink) return trimmed;
    const route = options.resolveWikilink(wikilink.target);
    if (typeof route !== 'string' || !safeInternalReference(route)) return undefined;
    return `${route}${wikilink.fragment}`;
  }

  if (safeInternalReference(trimmed)) return trimmed;
  return safeNavigationUrl(trimmed);
}

export function isExternalNavigationReference(value) {
  const resolved = resolveFrontmatterReference(value);
  return typeof resolved === 'string' && /^https?:/i.test(resolved);
}

export function findInvalidFrontmatterReferences(frontmatter) {
  const invalid = [];
  const seen = new WeakSet();

  function visit(value, path = '') {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);

    for (const [field, fieldValue] of Object.entries(value)) {
      const fieldPath = path ? `${path}.${field}` : field;
      const kind = frontmatterReferenceKind(field);
      if (kind) {
        const absent = fieldValue === undefined
          || fieldValue === null
          || (typeof fieldValue === 'string' && !fieldValue.trim());
        if (!absent && !resolveFrontmatterReference(fieldValue, { kind })) {
          invalid.push({ field: fieldPath, kind, value: fieldValue });
        }
        continue;
      }

      if (fieldValue && typeof fieldValue === 'object') visit(fieldValue, fieldPath);
    }
  }

  visit(frontmatter);
  return invalid;
}
