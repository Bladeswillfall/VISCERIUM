import {
  cleanSlug,
  extractInternalRoutes,
  normaliseInternalRoute,
  slugToRoute,
} from './codex-paths.mjs';

function routeForEntry(entry) {
  const slug = entry.data?.slug || String(entry.id).replace(/\.(md|mdx)$/i, '').replace(/\/index$/i, '') || 'index';
  return slugToRoute(slug);
}

function tagKey(value) {
  return cleanSlug(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function generatedRoute(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(raw)) return null;
  return normaliseInternalRoute(raw.startsWith('/') ? raw : `/${raw}`);
}

export function buildSiteGraph(entries) {
  const pages = entries
    .filter((entry) => !entry.data?.draft)
    .map((entry) => ({
      entry,
      id: routeForEntry(entry),
      title: String(entry.data?.title || entry.id),
      tags: [...new Set((entry.data?.tags ?? []).map(String).filter(Boolean))],
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
  const pageIds = new Set(pages.map((page) => page.id));
  const tagNodes = new Map();
  const edges = new Map();

  const addEdge = (source, target, kind) => {
    if (source === target || !pageIds.has(source) || (kind === 'link' && !pageIds.has(target))) return;
    edges.set(`${source}\u001f${target}\u001f${kind}`, { source, target, kind });
  };

  for (const page of pages) {
    const content = page.entry.body ?? page.entry.rendered?.html ?? '';
    for (const target of extractInternalRoutes(content)) addEdge(page.id, target, 'link');
    for (const target of page.entry.data?.links ?? []) {
      const route = generatedRoute(target);
      if (route) addEdge(page.id, route, 'link');
    }
    for (const reference of page.entry.data?.referencedIn ?? []) {
      const route = generatedRoute(reference.href);
      if (route) addEdge(route, page.id, 'link');
    }

    for (const tag of page.tags) {
      const key = tagKey(tag);
      if (!key) continue;
      const id = `tag:${key}`;
      tagNodes.set(id, { id, title: `#${tag}`, href: `/tags/${key}/`, kind: 'tag' });
      edges.set(`${page.id}\u001f${id}\u001ftag`, { source: page.id, target: id, kind: 'tag' });
    }
  }

  return {
    nodes: [
      ...pages.map(({ id, title, tags }) => ({ id, title, href: id, tags, kind: 'page' })),
      ...[...tagNodes.values()].sort((left, right) => left.title.localeCompare(right.title)),
    ],
    edges: [...edges.values()],
  };
}
