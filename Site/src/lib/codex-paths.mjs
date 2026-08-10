// Shared, dependency-free path and escaping helpers for build scripts and browser bundles.
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
