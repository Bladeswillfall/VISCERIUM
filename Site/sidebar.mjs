import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { slugToRoute, toPosixPath } from './src/lib/codex-paths.mjs';
import { walk } from './scripts/lib/walk.mjs';
import { parseIconLabel, parseIconSpec } from './src/lib/icon-spec.mjs';
import {
  canonicalSidebarGroup,
  ERA_SIDEBAR_SECTIONS,
  historicalEraSection,
  inferEraSidebarSection,
  ROOT_SIDEBAR_SECTIONS,
  rootSidebarSection,
  sidebarFallbackLabel,
  sidebarGroupDefinition,
  sidebarGroupRank,
} from './src/config/sidebar-taxonomy.mjs';

const docsDir = new URL('./src/content/docs/', import.meta.url);
const historicalEraSlugs = new Set(['citadel', 'smog', 'nearsight', 'entropy']);

const fallbackGroupIcons = {
  calendar: 'event',
  characters: 'character',
  entities: 'spark',
  events: 'event',
  factions: 'faction',
  images: 'image',
  locations: 'location',
  maps: 'map',
};

function labelFromSegment(segment) {
  return sidebarFallbackLabel(segment);
}

function entryLabel(entry) {
  return parseIconLabel(entry.label).label;
}

function sortLinks(entries) {
  return [...entries].sort((a, b) => {
    const order = (a.order ?? 1_000) - (b.order ?? 1_000);
    return order || entryLabel(a).localeCompare(entryLabel(b));
  });
}

function cleanLink(entry) {
  const { order: _order, ...sidebarEntry } = entry;
  return sidebarEntry;
}

function iconAttrs(value) {
  const icon = parseIconSpec(value)?.name;
  return icon ? { 'data-sidebar-icon': icon } : undefined;
}

function groupPresentation(segment, context) {
  const definition = sidebarGroupDefinition(segment, context);
  const key = definition?.key ?? canonicalSidebarGroup(segment, context);
  return {
    key,
    label: definition?.label ?? labelFromSegment(segment),
    icon: definition?.icon ?? fallbackGroupIcons[key],
    order: definition?.order ?? sidebarGroupRank(segment, context),
  };
}

function ensureGroup(groups, segment, context = 'default') {
  const presentation = groupPresentation(segment, context);
  if (!groups.has(presentation.key)) {
    groups.set(presentation.key, {
      ...presentation,
      links: [],
      groups: new Map(),
      childContext: context === 'root' && presentation.key === 'eras'
        ? 'eras'
        : context === 'eras' && historicalEraSlugs.has(presentation.key)
          ? 'era'
          : 'default',
    });
  }
  return groups.get(presentation.key);
}

function addLink(group, entry) {
  if (!group.links.some((candidate) => candidate.link === entry.link)) group.links.push(entry);
}

function buildEntries(groups) {
  return [...groups.values()]
    .sort((a, b) => (a.order - b.order) || a.label.localeCompare(b.label))
    .map((group) => {
      const links = sortLinks(group.links);
      const pinnedLinks = group.childContext === 'era'
        ? links.filter((entry) => (entry.order ?? 1_000) < 100)
        : [];
      const ordinaryLinks = group.childContext === 'era'
        ? links.filter((entry) => (entry.order ?? 1_000) >= 100)
        : links;

      return {
        label: group.label,
        items: [
          ...pinnedLinks.map(cleanLink),
          ...buildEntries(group.groups),
          ...ordinaryLinks.map(cleanLink),
        ],
        collapsed: true,
      };
    });
}

function hideGeneratedDetailRoute(segments) {
  if (segments[0] === 'entities' && !(segments.length === 2 && segments[1] === 'index')) return true;
  if (segments[0] === 'eras' && historicalEraSlugs.has(segments[1]) && segments[2] === 'tags') return true;
  return false;
}

function articleEntry(data, title, link, label = title, order = undefined) {
  const attrs = iconAttrs(data.sidebarIcon ?? data.icon);
  return {
    label,
    link,
    order: data.navigation?.order ?? order,
    ...(attrs ? { attrs } : {}),
  };
}

function addHistoricalEraArticle(groups, segments, data, title, link) {
  const erasGroup = ensureGroup(groups, 'eras', 'root');
  const eraSegment = segments[1];
  const eraGroup = ensureGroup(erasGroup.groups, eraSegment, 'eras');
  const remainder = segments.slice(2);

  if (remainder.length === 0) {
    addLink(eraGroup, articleEntry(data, title, link, 'Overview', 0));
    return;
  }

  if (remainder.length === 1) {
    const section = inferEraSidebarSection(data);
    if (section) {
      const sectionGroup = ensureGroup(eraGroup.groups, section.key, 'era');
      addLink(sectionGroup, articleEntry(data, title, link));
    } else {
      addLink(eraGroup, articleEntry(data, title, link));
    }
    return;
  }

  const firstSection = sidebarGroupDefinition(remainder[0], 'era');
  let group = firstSection
    ? ensureGroup(eraGroup.groups, firstSection.key, 'era')
    : ensureGroup(eraGroup.groups, remainder[0], 'era');

  for (const segment of remainder.slice(1, -1)) {
    if (segment === 'index') continue;
    group = ensureGroup(group.groups, segment);
  }

  addLink(group, articleEntry(data, title, link, remainder.at(-1) === 'index' ? 'Overview' : title));
}

function addGeneralArticle(groups, rawSegments, data, title, link) {
  const segments = rawSegments[0] === 'universal' ? rawSegments.slice(1) : rawSegments;
  if (segments.length < 2) return false;

  const rootDefinition = rootSidebarSection(segments[0]);
  const rootSegment = rootDefinition?.key ?? segments[0];
  let group = ensureGroup(groups, rootSegment, 'root');

  for (const segment of segments.slice(1, -1)) {
    if (segment === 'index') continue;
    group = ensureGroup(group.groups, segment, group.childContext);
  }

  addLink(group, articleEntry(data, title, link, segments.at(-1) === 'index' ? 'Overview' : title));
  return true;
}

function seedCanonicalHierarchy(groups) {
  for (const section of ROOT_SIDEBAR_SECTIONS) ensureGroup(groups, section.key, 'root');

  const eras = ensureGroup(groups, 'eras', 'root');
  for (const eraSlug of historicalEraSlugs) {
    const eraGroup = ensureGroup(eras.groups, eraSlug, 'eras');
    for (const section of ERA_SIDEBAR_SECTIONS) {
      if (section.key !== 'relationships') ensureGroup(eraGroup.groups, section.key, 'era');
    }
  }
}

function addExplorationLinks(groups) {
  const degelSystem = ensureGroup(groups, 'degel-system', 'root');
  addLink(degelSystem, {
    label: 'Atlas',
    link: '/maps/',
    order: 5,
    attrs: { 'data-sidebar-icon': 'map' },
  });

  const eras = ensureGroup(groups, 'eras', 'root');
  for (const eraSlug of historicalEraSlugs) {
    const era = historicalEraSection(eraSlug);
    const eraGroup = ensureGroup(eras.groups, eraSlug, 'eras');
    addLink(eraGroup, {
      label: 'Relationships',
      link: `/eras/${eraSlug}/relationships/`,
      order: 10,
      attrs: { 'data-sidebar-icon': 'relationships' },
    });
    if (era) eraGroup.order = era.order;
  }
}

export async function buildSidebar() {
  try {
    const files = await walk(docsDir.pathname);
    const groups = new Map();
    const rootItems = [];

    seedCanonicalHierarchy(groups);

    for (const file of files) {
      const rel = toPosixPath(path.relative(docsDir.pathname, file));
      if (!rel.endsWith('.md') && !rel.endsWith('.mdx')) continue;
      const id = rel.replace(/\.(md|mdx)$/, '');
      const segments = id.split('/');
      if (hideGeneratedDetailRoute(segments)) continue;

      const raw = await fs.readFile(file, 'utf8');
      const data = matter(raw).data ?? {};
      if (data.navigation?.hidden === true) continue;

      const title = data.title ?? labelFromSegment(path.basename(id));
      const slug = data.slug ?? id;
      const link = slugToRoute(slug);

      if (id === 'index') {
        rootItems.unshift({
          label: title,
          link: '/',
          order: -1,
          attrs: { 'data-sidebar-icon': parseIconSpec(data.sidebarIcon ?? data.icon ?? 'home')?.name ?? 'home' },
          badge: { text: 'Canon', variant: 'note' },
        });
        continue;
      }

      if (segments[0] === 'eras' && segments[1] === 'index') {
        const erasGroup = ensureGroup(groups, 'eras', 'root');
        addLink(erasGroup, articleEntry(data, title, link, 'Overview', 0));
        continue;
      }

      if (segments[0] === 'eras' && historicalEraSlugs.has(segments[1])) {
        addHistoricalEraArticle(groups, segments, data, title, link);
        continue;
      }

      if (addGeneralArticle(groups, segments, data, title, link)) continue;
      rootItems.push(articleEntry(data, title, link));
    }

    addExplorationLinks(groups);

    return [
      ...buildEntries(groups),
      ...sortLinks(rootItems).map(cleanLink),
    ];
  } catch {
    return [{ label: 'Start Here', link: '/' }];
  }
}
