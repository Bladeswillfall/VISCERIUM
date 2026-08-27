import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs/promises';
import siteConfig from '../site.config.mjs';
import { loadGeneratedDocs } from './content-manifest.mjs';
import { generateMapTilePyramids } from './generate-map-tiles.mjs';
import { isMainModule } from './script-entry.mjs';

const outFile = path.resolve(process.cwd(), 'src/data/maps.json');
const compactMapSpan = 384;
const zoomOutBreathingRoom = 1;

function asFiniteNumber(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function asStringList(value, fallback = []) {
  if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return fallback;
}

function compactViewportMinZoom(width, height) {
  const dimensions = [asFiniteNumber(width), asFiniteNumber(height)].filter((value) => value > 0);
  if (!dimensions.length) return undefined;

  const largestDimension = Math.max(...dimensions);
  return Math.floor(Math.log2(compactMapSpan / largestDimension)) - zoomOutBreathingRoom;
}

function resolveMapMinZoom(data) {
  const authoredMinZoom = asFiniteNumber(data.minZoom);
  const compactMinZoom = compactViewportMinZoom(data.width, data.height);

  if (compactMinZoom === undefined) return authoredMinZoom;
  if (authoredMinZoom === undefined) return compactMinZoom;
  return Math.min(authoredMinZoom, compactMinZoom);
}

function pageForRecord(record, id) {
  if (record.data.type === 'map' && record.data.mapId) return `/maps/${encodeURIComponent(record.data.mapId)}/`;
  return `/${id}/`;
}

function normaliseLinkKey(value) {
  let target = String(value ?? '').trim();
  if (!target) return '';
  target = target.replace(/^\[\[/, '').replace(/\]\]$/, '');
  target = target.split('|', 1)[0].split('#', 1)[0].trim();
  try {
    target = decodeURIComponent(target);
  } catch {
    // Keep the original target when it is not URI encoded.
  }
  return target
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\.(md|mdx)$/i, '')
    .replace(/^Vault\//i, '')
    .replace(/^Lore\//i, '')
    .toLowerCase();
}

function recordLinkKeys(record) {
  const sourcePath = record.data.sourcePath || record.relativePath;
  const keys = [sourcePath, record.relativePath, record.data.title];
  if (sourcePath) keys.push(path.posix.basename(String(sourcePath).replace(/\\/g, '/')));
  return [...new Set(keys.map(normaliseLinkKey).filter(Boolean))];
}

function buildRecordIndex(records) {
  const index = new Map();
  for (const record of records) {
    for (const key of recordLinkKeys(record)) {
      const matches = index.get(key) ?? [];
      if (!matches.includes(record)) matches.push(record);
      index.set(key, matches);
    }
  }
  return index;
}

function pluginLayerName(source, marker) {
  const layers = Array.isArray(source?.layers) ? source.layers : [];
  const layer = layers.find((entry) => entry?.id === marker?.layer);
  return String(layer?.name ?? marker?.layer ?? 'locations').trim() || 'locations';
}

function coordinateToPercent(value) {
  const number = asFiniteNumber(value);
  if (number === undefined || number < 0) return undefined;
  if (number <= 1) return number * 100;
  if (number <= 100) return number;
  return undefined;
}

function markerForRecord(record, mapId, pluginMarker, pluginSource) {
  const id = record.relativePath.replace(/\.(md|mdx)$/i, '');
  const { data } = record;
  const authoredMap = data.map?.id === mapId ? data.map : {};
  const authoredLayers = asStringList(authoredMap.layer, []);
  const primaryLayer = pluginMarker ? pluginLayerName(pluginSource, pluginMarker) : undefined;
  const markerLayers = primaryLayer
    ? [primaryLayer, ...authoredLayers.filter((layer) => layer !== primaryLayer)]
    : authoredLayers.length > 0 ? authoredLayers : ['locations'];

  return {
    title: data.title,
    description: data.description,
    x: pluginMarker ? coordinateToPercent(pluginMarker.x) : asFiniteNumber(authoredMap.x),
    y: pluginMarker ? coordinateToPercent(pluginMarker.y) : asFiniteNumber(authoredMap.y),
    marker: authoredMap.marker || data.type || 'location',
    layers: markerLayers,
    layer: markerLayers[0],
    // Plugin zoom values use a different scale model. Public zoom visibility remains note-owned.
    minZoom: asFiniteNumber(authoredMap.minZoom),
    maxZoom: asFiniteNumber(authoredMap.maxZoom),
    type: data.type,
    era: data.era,
    faction: data.faction,
    region: data.region,
    page: pageForRecord(record, id),
    childMapId: data.type === 'map' && data.mapId ? data.mapId : undefined,
  };
}

function resolvePluginRecord(recordIndex, link) {
  const key = normaliseLinkKey(link);
  const matches = key ? recordIndex.get(key) ?? [] : [];
  return { key, matches };
}

// eslint-disable-next-line complexity
export function compileMapData(records, { pluginSources = {}, warnings = [] } = {}) {
  const maps = {};

  for (const record of records) {
    const id = record.relativePath.replace(/\.(md|mdx)$/i, '');
    const { data } = record;
    if (data.type === 'map' && data.mapId) {
      maps[data.mapId] = {
        id: data.mapId,
        title: data.title,
        description: data.description,
        image: data.image,
        width: asFiniteNumber(data.width),
        height: asFiniteNumber(data.height),
        defaultZoom: asFiniteNumber(data.defaultZoom),
        minZoom: resolveMapMinZoom(data),
        maxZoom: asFiniteNumber(data.maxZoom),
        page: `/${id}/`,
        markers: [],
      };
    }
  }

  const pluginMapIds = new Set(Object.keys(pluginSources));

  // Preserve the original Markdown/YAML workflow for maps without a plugin sidecar.
  for (const record of records) {
    const { data } = record;
    if (!data.map?.id || pluginMapIds.has(data.map.id)) continue;

    maps[data.map.id] ??= {
      id: data.map.id,
      title: data.map.id,
      description: '',
      markers: [],
    };

    maps[data.map.id].markers.push(markerForRecord(record, data.map.id));
  }

  const recordIndex = buildRecordIndex(records);
  for (const [mapId, source] of Object.entries(pluginSources)) {
    maps[mapId] ??= {
      id: mapId,
      title: mapId,
      description: '',
      markers: [],
    };

    const seenRecords = new Set();
    const markers = Array.isArray(source?.markers) ? source.markers : [];
    for (const pluginMarker of markers) {
      if (pluginMarker?.anchorSpace === 'viewport') continue;
      if (!pluginMarker?.link) {
        warnings.push(`TTRPG map ${mapId} skipped unlinked marker ${pluginMarker?.id ?? '(unknown id)'}.`);
        continue;
      }

      const { key, matches } = resolvePluginRecord(recordIndex, pluginMarker.link);
      if (matches.length !== 1) {
        const reason = matches.length === 0 ? 'does not resolve to a published note' : 'is ambiguous';
        warnings.push(`TTRPG map ${mapId} marker link "${pluginMarker.link}" ${reason}.`);
        continue;
      }

      const record = matches[0];
      const recordKey = normaliseLinkKey(record.data.sourcePath || record.relativePath);
      if (seenRecords.has(recordKey)) {
        warnings.push(`TTRPG map ${mapId} contains more than one marker for ${record.data.title ?? key}.`);
        continue;
      }

      const marker = markerForRecord(record, mapId, pluginMarker, source);
      if (!Number.isFinite(marker.x) || !Number.isFinite(marker.y)) {
        warnings.push(`TTRPG map ${mapId} marker for ${record.data.title ?? key} has invalid coordinates.`);
        continue;
      }

      seenRecords.add(recordKey);
      maps[mapId].markers.push(marker);
    }
  }

  for (const map of Object.values(maps)) {
    map.markers.sort((a, b) => String(a.title ?? '').localeCompare(String(b.title ?? '')));
  }

  return maps;
}

function safeVaultPath(vaultRoot, relativeFile) {
  const trimmed = String(relativeFile ?? '').trim().replace(/^[/\\]+/, '');
  if (!trimmed) return null;
  const resolved = path.resolve(vaultRoot, trimmed);
  const relative = path.relative(vaultRoot, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return resolved;
}

export async function loadPluginMarkerSources(records, { vaultRoot } = {}) {
  const root = vaultRoot ?? path.dirname(path.resolve(process.cwd(), siteConfig.vaultAssetDir));
  const pluginSources = {};
  const warnings = [];

  for (const record of records) {
    const { data } = record;
    if (data.type !== 'map' || !data.mapId || !data.mapMarkers) continue;

    const sourceFile = safeVaultPath(root, data.mapMarkers);
    if (!sourceFile) {
      warnings.push(`Map ${data.mapId} has an unsafe mapMarkers path.`);
      continue;
    }

    try {
      const parsed = JSON.parse(await fs.readFile(sourceFile, 'utf8'));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        warnings.push(`Map ${data.mapId} marker source is not a JSON object.`);
        continue;
      }
      pluginSources[data.mapId] = parsed;
    } catch (error) {
      warnings.push(`Map ${data.mapId} could not read ${data.mapMarkers}: ${error.message ?? error}`);
    }
  }

  return { pluginSources, warnings };
}

export async function generateMapData({ manifest } = {}) {
  const docs = manifest ?? await loadGeneratedDocs();
  const loaded = await loadPluginMarkerSources(docs.records);
  const warnings = [...loaded.warnings];
  const maps = compileMapData(docs.records, {
    pluginSources: loaded.pluginSources,
    warnings,
  });

  // Build the WebP tile pyramids before serialising map data so each Atlas
  // receives its delivery descriptor alongside the existing full-image fallback.
  await generateMapTilePyramids({ maps });

  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, `${JSON.stringify(maps, null, 2)}\n`, 'utf8');
  console.log(`Generated ${Object.keys(maps).length} map data set(s).`);
  if (warnings.length > 0) {
    console.warn('\nMap generation warnings:');
    for (const warning of warnings) console.warn(`- ${warning}`);
  }
  return maps;
}

if (isMainModule(import.meta.url)) await generateMapData();
