import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { walk } from './lib/walk.mjs';

export const MAP_TILE_SIZE = 512;
export const MAP_TILE_MANIFEST_VERSION = 1;
export const MAP_TILE_FORMAT = 'webp';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const defaultSiteRoot = path.resolve(moduleDir, '..');

function positiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
}

function safeMapId(value) {
  const id = String(value ?? '').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(id)) return undefined;
  return id;
}

function publicMapFile(siteRoot, imageUrl) {
  const value = String(imageUrl ?? '').trim();
  if (!value.startsWith('/assets/maps/') || value.includes('..') || !/\.webp$/i.test(value)) return undefined;
  const relative = value.replace(/^\/+/, '');
  const target = path.resolve(siteRoot, 'public', relative);
  const publicRoot = path.resolve(siteRoot, 'public', 'assets', 'maps');
  const relation = path.relative(publicRoot, target);
  if (relation.startsWith('..') || path.isAbsolute(relation)) return undefined;
  return target;
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function loadSharp() {
  try {
    const sharpModule = await import('sharp');
    return sharpModule.default;
  } catch (error) {
    throw new Error(
      `Atlas map tile generation requires Sharp. Run npm ci with optional dependencies enabled. (${error.message})`,
    );
  }
}

export function mapTileMaxLevel(width, height, tileSize = MAP_TILE_SIZE) {
  const w = positiveInteger(width);
  const h = positiveInteger(height);
  const size = positiveInteger(tileSize);
  if (!w || !h || !size) return undefined;
  return Math.max(0, Math.ceil(Math.log2(Math.max(w, h) / size)));
}

export function mapTileDescriptor({ mapId, width, height, tileSize = MAP_TILE_SIZE, tileCount } = {}) {
  const id = safeMapId(mapId);
  const w = positiveInteger(width);
  const h = positiveInteger(height);
  const size = positiveInteger(tileSize);
  if (!id || !w || !h || !size) return undefined;

  const maxLevel = mapTileMaxLevel(w, h, size);
  return {
    format: MAP_TILE_FORMAT,
    tileSize: size,
    width: w,
    height: h,
    maxLevel,
    minNativeZoom: -maxLevel,
    maxNativeZoom: 0,
    zoomOffset: maxLevel,
    urlTemplate: `/assets/map-tiles/${id}/{z}/{y}/{x}.webp`,
    tileCount: positiveInteger(tileCount) ?? 0,
  };
}

function generatedPaths(siteRoot) {
  return [
    path.join(siteRoot, 'public', 'assets', 'map-tiles'),
    path.join(siteRoot, 'src', 'data', 'map-tiles.json'),
  ];
}

export async function cleanMapTilePyramids({ siteRoot = defaultSiteRoot } = {}) {
  await Promise.all(
    generatedPaths(siteRoot).map((target) => fs.rm(target, { recursive: true, force: true })),
  );
}

export async function generateMapTilePyramids({ maps = {}, siteRoot = defaultSiteRoot } = {}) {
  await cleanMapTilePyramids({ siteRoot });
  const sharp = await loadSharp();
  const outputRoot = path.join(siteRoot, 'public', 'assets', 'map-tiles');
  const manifestPath = path.join(siteRoot, 'src', 'data', 'map-tiles.json');
  const manifest = {
    version: MAP_TILE_MANIFEST_VERSION,
    format: MAP_TILE_FORMAT,
    lossless: true,
    tileSize: MAP_TILE_SIZE,
    maps: {},
  };

  await fs.mkdir(outputRoot, { recursive: true });

  for (const [mapId, map] of Object.entries(maps)) {
    const id = safeMapId(mapId);
    const source = publicMapFile(siteRoot, map?.image);
    if (!id || !source || !(await pathExists(source))) {
      console.warn(`Atlas map ${mapId} has no tileable public map image; keeping full-image fallback.`);
      continue;
    }

    const metadata = await sharp(source).metadata();
    const width = positiveInteger(metadata.width);
    const height = positiveInteger(metadata.height);
    if (!width || !height) {
      console.warn(`Atlas map ${mapId} has unreadable raster dimensions; keeping full-image fallback.`);
      continue;
    }

    const outputDir = path.join(outputRoot, id);
    await sharp(source)
      .rotate()
      .ensureAlpha()
      .webp({ lossless: true, effort: 4 })
      .tile({
        size: MAP_TILE_SIZE,
        overlap: 0,
        layout: 'google',
        container: 'fs',
        depth: 'onetile',
        skipBlanks: -1,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toFile(outputDir);

    // libvips' Google layout emits helper files that Leaflet does not need.
    await Promise.all([
      fs.rm(path.join(outputDir, 'blank.png'), { force: true }),
      fs.rm(path.join(outputRoot, 'vips-properties.xml'), { force: true }),
    ]);

    const tileFiles = (await walk(outputDir)).filter((file) => /\.webp$/i.test(file));
    const descriptor = mapTileDescriptor({
      mapId: id,
      width,
      height,
      tileCount: tileFiles.length,
    });

    manifest.maps[mapId] = descriptor;
    map.tiles = descriptor;
  }

  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const tileCount = Object.values(manifest.maps)
    .reduce((total, entry) => total + (entry?.tileCount ?? 0), 0);
  console.log(
    `Generated Atlas tile pyramids for ${Object.keys(manifest.maps).length} map(s) (${tileCount} lossless WebP tile(s)).`,
  );

  return manifest;
}
