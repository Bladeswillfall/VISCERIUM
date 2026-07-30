import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs/promises';
import { slugToRoute } from '../src/lib/codex-paths.mjs';
import { pageEra, resolveContextualTarget, validEntityId } from '../src/lib/era-context.mjs';
import { loadGeneratedDocs } from './content-manifest.mjs';
import { isMainModule } from './script-entry.mjs';

const outFile = path.resolve(process.cwd(), 'src/data/relationships.json');
const directedRelationNames = new Set([
  'belongs-to',
  'capital-of',
  'child-of',
  'commands',
  'contains',
  'founded-by',
  'leader-of',
  'located-in',
  'member-of',
  'owned-by',
  'parent-of',
  'predecessor-of',
  'reports-to',
  'subordinate-to',
  'successor-of',
]);

function relationKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

function relationLabel(value) {
  return relationKey(value)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function noteKey(value) {
  return String(value ?? '').trim().replace(/\\/g, '/').replace(/\.mdx?$/i, '').replace(/^\/+|\/+$/g, '').toLowerCase();
}

function stripWikilink(value) {
  let text = String(value ?? '').trim();
  const wikilink = text.match(/^\[\[([^\]]+)\]\]$/);
  if (wikilink) text = wikilink[1];
  text = text.split('|', 1)[0].split('#', 1)[0].trim();
  return text;
}

function asRelationEntries(value) {
  if (Array.isArray(value)) return value.flatMap(asRelationEntries);
  if (typeof value === 'string') return value.trim() ? [{ target: value.trim() }] : [];
  if (!value || typeof value !== 'object') return [];

  const target = value.target ?? value.to ?? value.ref ?? value.article ?? value.title;
  if (typeof target !== 'string' || !target.trim()) return [];
  return [{ ...value, target: target.trim() }];
}

function nodeFromRecord(record) {
  const id = record.relativePath.replace(/\.(md|mdx)$/i, '');
  const slug = record.data.slug || id;
  return {
    id: slug,
    title: record.data.title || path.basename(id),
    description: record.data.description || '',
    type: record.data.type || 'article',
    era: pageEra(record.data, record.relativePath),
    entity_id: validEntityId(record.data.entity_id) ? record.data.entity_id : undefined,
    icon: record.data.icon,
    page: slugToRoute(slug),
  };
}

function addLookup(lookup, key, candidate) {
  const normalized = noteKey(key);
  if (!normalized) return;
  const entries = lookup.get(normalized) ?? [];
  if (!entries.some((entry) => entry.nodeId === candidate.nodeId)) entries.push(candidate);
  lookup.set(normalized, entries);
}

function buildLookup(nodes, recordsByNodeId) {
  const lookup = new Map();
  for (const node of nodes) {
    const candidate = {
      nodeId: node.id,
      slug: node.id,
      title: node.title,
      era: node.era,
      entity_id: node.entity_id,
    };
    addLookup(lookup, node.id, candidate);
    addLookup(lookup, node.title, candidate);
    addLookup(lookup, path.basename(node.id), candidate);

    const record = recordsByNodeId.get(node.id);
    const sourcePath = record?.data?.sourcePath;
    if (typeof sourcePath === 'string') {
      const sourceNoExt = sourcePath.replace(/\.(md|mdx)$/i, '');
      addLookup(lookup, sourceNoExt, candidate);
      addLookup(lookup, `Lore/${sourceNoExt}`, candidate);
      addLookup(lookup, path.basename(sourcePath, path.extname(sourcePath)), candidate);
    }
  }
  return lookup;
}

function resolveTarget(rawTarget, sourceNode, lookup, nodeByPage) {
  const target = stripWikilink(rawTarget);
  if (!target) return undefined;

  const exact = lookup.get(noteKey(target)) ?? [];
  let candidates = exact;
  if (candidates.length === 0) candidates = lookup.get(noteKey(path.basename(target))) ?? [];
  if (target.includes('/') && exact.length === 1) return exact[0].nodeId;

  const resolved = resolveContextualTarget(candidates, sourceNode.era);
  if (resolved?.kind === 'page') return resolved.candidate.nodeId;
  if (resolved?.kind === 'continuity') return nodeByPage.get(resolved.route)?.id;
  return undefined;
}

function inferDirected(type, entry) {
  if (typeof entry.directed === 'boolean') return entry.directed;
  return directedRelationNames.has(type);
}

export function compileRelationshipData(records) {
  const allNodes = records.map(nodeFromRecord);
  const nodeById = new Map(allNodes.map((node) => [node.id, node]));
  const nodeByPage = new Map(allNodes.map((node) => [node.page, node]));
  const recordsByNodeId = new Map(records.map((record, index) => [allNodes[index].id, record]));
  const lookup = buildLookup(allNodes, recordsByNodeId);
  const participating = new Set();
  const edges = [];
  const seenEdges = new Set();
  const warnings = [];

  for (const record of records) {
    const sourceNode = nodeFromRecord(record);
    const relationships = record.data.relationships;
    if (!relationships || typeof relationships !== 'object' || Array.isArray(relationships)) continue;

    for (const [rawType, value] of Object.entries(relationships)) {
      const type = relationKey(rawType);
      if (!type) continue;

      for (const entry of asRelationEntries(value)) {
        const targetId = resolveTarget(entry.target, sourceNode, lookup, nodeByPage);
        if (!targetId) {
          warnings.push(`${sourceNode.title}: unresolved or era-ambiguous ${type} relationship target "${stripWikilink(entry.target)}"`);
          continue;
        }
        if (targetId === sourceNode.id) continue;

        const directed = inferDirected(type, entry);
        const dedupeKey = directed
          ? `${sourceNode.id}::${type}::${targetId}`
          : `${[sourceNode.id, targetId].sort().join('::')}::${type}`;
        if (seenEdges.has(dedupeKey)) continue;
        seenEdges.add(dedupeKey);

        participating.add(sourceNode.id);
        participating.add(targetId);
        edges.push({
          id: `rel-${edges.length + 1}`,
          source: sourceNode.id,
          target: targetId,
          type,
          label: entry.label || relationLabel(type),
          directed,
          since: entry.since,
          until: entry.until,
          era: entry.era,
          description: entry.description || entry.note || '',
        });
      }
    }
  }

  const nodes = [...participating]
    .map((id) => nodeById.get(id))
    .filter(Boolean)
    .sort((a, b) => a.title.localeCompare(b.title));
  edges.sort((a, b) => a.label.localeCompare(b.label) || a.source.localeCompare(b.source));

  const relationCounts = new Map();
  for (const edge of edges) relationCounts.set(edge.type, (relationCounts.get(edge.type) ?? 0) + 1);
  const relationTypes = [...relationCounts.entries()]
    .map(([id, count]) => ({ id, label: relationLabel(id), count }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    graph: { nodes, edges, relationTypes },
    warnings,
  };
}

export async function generateRelationshipData({ manifest } = {}) {
  const docs = manifest ?? await loadGeneratedDocs();
  const { graph, warnings } = compileRelationshipData(docs.records);

  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, `${JSON.stringify(graph, null, 2)}\n`, 'utf8');

  console.log(`Generated relationship graph with ${graph.nodes.length} node(s) and ${graph.edges.length} edge(s).`);
  if (warnings.length) {
    console.warn('Relationship graph warnings:');
    for (const warning of warnings) console.warn(`- ${warning}`);
  }
  return graph;
}

if (isMainModule(import.meta.url)) await generateRelationshipData();
