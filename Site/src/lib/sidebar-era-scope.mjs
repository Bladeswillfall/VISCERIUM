import { slugToRoute } from './codex-paths.mjs';
import { normaliseEra } from './era-context.mjs';

function normaliseRoute(value) {
  const pathname = String(value ?? '').split(/[?#]/, 1)[0];
  return slugToRoute(pathname);
}

export function routeForDocEntry(entry) {
  const rawSlug = entry?.data?.slug ?? entry?.id ?? '';
  const slug = String(rawSlug)
    .replace(/\.(md|mdx)$/i, '')
    .replace(/\/index$/i, '');
  return normaliseRoute(slug);
}

export function universalRoutesFromDocs(entries) {
  return new Set((entries ?? [])
    .filter((entry) => {
      const declared = Array.isArray(entry?.data?.era) ? entry.data.era : [entry?.data?.era];
      return declared.some((value) => normaliseEra(value) === 'Universal');
    })
    .map(routeForDocEntry));
}

export function filterSidebarByRoutes(entries, allowedRoutes) {
  const allowed = allowedRoutes instanceof Set ? allowedRoutes : new Set(allowedRoutes ?? []);

  return (entries ?? []).flatMap((entry) => {
    if (entry?.type === 'link') {
      return allowed.has(normaliseRoute(entry.href)) ? [entry] : [];
    }

    if (entry?.type === 'group') {
      const children = filterSidebarByRoutes(entry.entries ?? [], allowed);
      return children.length > 0 ? [{ ...entry, entries: children }] : [];
    }

    return [];
  });
}
