import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { slugToRoute, toPosixPath } from './src/lib/codex-paths.mjs';
import { walk } from './scripts/lib/walk.mjs';
import { iconLabel, parseIconLabel } from './src/lib/icon-spec.mjs';

const docsDir = new URL('./src/content/docs/', import.meta.url);
const historicalEraSlugs = new Set(['citadel', 'smog', 'nearsight', 'entropy']);

const groupIcons = {
  calendar: 'event',
  characters: 'character',
  citadel: 'faction',
  'degel-system': 'spark',
  entropy: 'spark',
  entities: 'spark',
  eras: 'event',
  events: 'event',
  factions: 'faction',
  images: 'image',
  locations: 'location',
  maps: 'map',
  nearsight: 'spark',
  smog: 'status',
  universal: 'spark',
};

function labelFromSegment(segment) {
  return segment.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function sortSidebarEntries(entries) {
  return entries.sort((a, b) => parseIconLabel(a.label).label.localeCompare(parseIconLabel(b.label).label));
}

function ensureGroup(groups, segment) {
  if (!groups.has(segment)) {
    groups.set(segment, { links: [], groups: new Map() });
  }
  return groups.get(segment);
}

function buildEntries(groups) {
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([segment, group]) => ({
    label: iconLabel(groupIcons[segment], labelFromSegment(segment)),
    items: [
      ...buildEntries(group.groups),
      ...sortSidebarEntries(group.links),
    ],
    collapsed: true,
  }));
}

function hideGeneratedDetailRoute(segments) {
  if (segments[0] === 'entities' && !(segments.length === 2 && segments[1] === 'index')) return true;
  if (segments[0] === 'eras' && historicalEraSlugs.has(segments[1]) && segments[2] === 'tags') return true;
  return false;
}

export async function buildSidebar() {
  try {
    const files = await walk(docsDir.pathname);
    const groups = new Map();
    const rootItems = [];

    for (const file of files) {
      const rel = toPosixPath(path.relative(docsDir.pathname, file));
      if (!rel.endsWith('.md') && !rel.endsWith('.mdx')) continue;
      const id = rel.replace(/\.(md|mdx)$/, '');
      const segments = id.split('/');
      if (hideGeneratedDetailRoute(segments)) continue;

      const raw = await fs.readFile(file, 'utf8');
      const data = matter(raw).data ?? {};
      const title = data.title ?? labelFromSegment(path.basename(id));
      const slug = data.slug ?? id;
      const articleIcon = data.sidebarIcon ?? data.icon;
      const link = slugToRoute(slug);
      if (id === 'index') {
        rootItems.unshift({
          label: iconLabel(articleIcon ?? 'home', title),
          link: '/',
          badge: { text: 'Canon', variant: 'note' },
        });
        continue;
      }

      if (segments.length === 1) {
        rootItems.push({ label: iconLabel(articleIcon, title), link });
        continue;
      }

      let group = ensureGroup(groups, segments[0]);
      for (const segment of segments.slice(1, -1)) {
        group = ensureGroup(group.groups, segment);
      }
      const sidebarIcon = segments[0] === 'demo' ? undefined : articleIcon;
      group.links.push({
        label: iconLabel(sidebarIcon, segments.at(-1) === 'index' ? 'Overview' : title),
        link,
      });
    }

    return [
      ...buildEntries(groups),
      ...sortSidebarEntries(rootItems),
    ];
  } catch {
    return [{ label: 'Start Here', link: '/' }];
  }
}
