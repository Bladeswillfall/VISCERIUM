// Provides shared path and HTML escaping functions. Build scripts and browser code can use this file without extra packages.
export function cleanSlug(value) {
  return String(value ?? '').trim().replace(/^\/+|\/+$/g, '').toLowerCase();
}

export function slugToRoute(slug) {
  const cleaned = cleanSlug(slug);
  return cleaned === 'index' ? '/' : `/${cleaned}/`;
}

export function toPosixPath(value) {
  return String(value ?? '').replace(/\\/g, '/');
}

export function vaultSourceSlug(value) {
  const segments = toPosixPath(value)
    .replace(/\.(md|mdx)$/i, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => cleanSlug(segment).replace(/\s+/g, '-'));

  const nationsIndex = segments.indexOf('nations');
  const leaf = segments.at(-1);
  const parent = segments.at(-2);
  const isDirectSelfNamedNationArticle =
    nationsIndex >= 0
    && segments.length === nationsIndex + 3
    && leaf
    && parent
    && leaf === parent;
  if (isDirectSelfNamedNationArticle) segments.pop();

  return segments.join('/');
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function normaliseInternalRoute(value) {
  let raw = String(value ?? '').trim();
  if (!raw || raw.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(raw)) return null;
  if (raw.startsWith('<') && raw.endsWith('>')) raw = raw.slice(1, -1).trim();
  if (!raw.startsWith('/')) return null;
  const pathname = raw.split(/[?#]/, 1)[0];
  const cleaned = cleanSlug(pathname);
  return cleaned ? `/${cleaned}/` : '/';
}

export function extractInternalRoutes(content) {
  const source = String(content ?? '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
    .replace(/`[^`\n]*`/g, '');
  const routes = new Set();

  for (const match of source.matchAll(/(!?)\[[^\]]*\]\((<[^>]+>|[^)\s]+)(?:\s+["'][^)]*["'])?\)/g)) {
    if (match[1] === '!') continue;
    const route = normaliseInternalRoute(match[2]);
    if (route) routes.add(route);
  }
  for (const match of source.matchAll(/<a\b[^>]*\bhref=["'](\/[^"']+)["'][^>]*>/gi)) {
    const route = normaliseInternalRoute(match[1]);
    if (route) routes.add(route);
  }
  return [...routes];
}
