import {
  extractInternalRoutes,
  normaliseInternalRoute,
  slugToRoute,
} from './codex-paths.mjs';

function routeForEntry(entry) {
  const slug = entry.data?.slug || String(entry.id).replace(/\.(md|mdx)$/i, '').replace(/\/index$/i, '') || 'index';
  return slugToRoute(slug);
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
  const edges = new Map();

  const addEdge = (source, target) => {
    if (source === target || !pageIds.has(source) || !pageIds.has(target)) return;
    edges.set(`${source}\u001f${target}`, { source, target, kind: 'link' });
  };

  for (const page of pages) {
    const content = page.entry.body ?? page.entry.rendered?.html ?? '';
    for (const target of extractInternalRoutes(content)) addEdge(page.id, target);
    for (const target of page.entry.data?.links ?? []) {
      const route = generatedRoute(target);
      if (route) addEdge(page.id, route);
    }
    for (const reference of page.entry.data?.referencedIn ?? []) {
      const route = generatedRoute(reference.href);
      if (route) addEdge(route, page.id);
    }
  }

  return {
    nodes: pages.map(({ id, title, tags }) => ({ id, title, href: id, tags, kind: 'page' })),
    edges: [...edges.values()],
  };
}
