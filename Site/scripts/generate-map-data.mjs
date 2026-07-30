import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs/promises';
import { loadGeneratedDocs } from './content-manifest.mjs';
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

export function compileMapData(records) {
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

  for (const record of records) {
    const id = record.relativePath.replace(/\.(md|mdx)$/i, '');
    const { data } = record;
    if (!data.map?.id) continue;

    maps[data.map.id] ??= {
      id: data.map.id,
      title: data.map.id,
      description: '',
      markers: [],
    };

    const markerLayers = asStringList(data.map.layer, ['locations']);
    maps[data.map.id].markers.push({
      title: data.title,
      description: data.description,
      x: asFiniteNumber(data.map.x),
      y: asFiniteNumber(data.map.y),
      marker: data.map.marker || data.type || 'location',
      layers: markerLayers,
      layer: markerLayers[0],
      minZoom: asFiniteNumber(data.map.minZoom),
      maxZoom: asFiniteNumber(data.map.maxZoom),
      type: data.type,
      era: data.era,
      faction: data.faction,
      region: data.region,
      page: pageForRecord(record, id),
      childMapId: data.type === 'map' && data.mapId ? data.mapId : undefined,
    });
  }

  for (const map of Object.values(maps)) {
    map.markers.sort((a, b) => String(a.title ?? '').localeCompare(String(b.title ?? '')));
  }

  return maps;
}

export async function generateMapData({ manifest } = {}) {
  const docs = manifest ?? await loadGeneratedDocs();
  const maps = compileMapData(docs.records);

  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, `${JSON.stringify(maps, null, 2)}\n`, 'utf8');
  console.log(`Generated ${Object.keys(maps).length} map data set(s).`);
  return maps;
}

if (isMainModule(import.meta.url)) await generateMapData();
