import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs/promises';
import siteConfig from '../site.config.mjs';
import { walk } from './lib/walk.mjs';
import { isMainModule } from './script-entry.mjs';

const siteRoot = process.cwd();
const defaultAssetRoot = path.resolve(siteRoot, siteConfig.vaultAssetDir);
const defaultSiteImageRoots = [
  path.resolve(siteRoot, 'src'),
  path.resolve(siteRoot, 'public'),
];
const imageExtensions = new Set([
  'avif', 'bmp', 'gif', 'heic', 'heif', 'jpeg', 'jpg', 'png', 'svg', 'tif', 'tiff', 'webp',
]);
const detectableImageExtensions = new Set(['avif', 'bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp']);
const allowedImageExtensions = new Set(['svg', 'webp']);
const unsafeSvgPatterns = [
  { label: 'script element', pattern: /<\s*script\b/i },
  { label: 'foreignObject element', pattern: /<\s*foreignObject\b/i },
  { label: 'inline event handler', pattern: /<[^>]*\son[a-z][\w:-]*\s*=/i },
  { label: 'javascript URL', pattern: /(?:href|xlink:href)\s*=\s*["']\s*javascript:/i },
  { label: 'HTML data URL', pattern: /(?:href|xlink:href)\s*=\s*["']\s*data\s*:\s*text\/html/i },
];

function relative(file) {
  return path.relative(siteRoot, file).replace(/\\/g, '/');
}

function extensionOf(file) {
  return path.extname(file).slice(1).toLowerCase();
}

function detectedImageType(source) {
  if (source.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (source[0] === 0xff && source[1] === 0xd8 && source[2] === 0xff) return 'jpeg';
  if (['GIF87a', 'GIF89a'].includes(source.subarray(0, 6).toString('ascii'))) return 'gif';
  if (source.subarray(0, 4).toString('ascii') === 'RIFF' && source.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  if (source.subarray(0, 2).toString('ascii') === 'BM') return 'bmp';
  if (source.subarray(4, 8).toString('ascii') === 'ftyp') {
    for (let offset = 8; offset + 4 <= Math.min(source.length, 40); offset += 4) {
      if (['avif', 'avis'].includes(source.subarray(offset, offset + 4).toString('ascii'))) return 'avif';
    }
  }

  const text = source.subarray(0, 4096).toString('utf8').replace(/^\uFEFF/, '');
  if (/^\s*(?:<\?xml[\s\S]*?\?>\s*)?(?:<!--[\s\S]*?-->\s*)*(?:<!DOCTYPE\s+svg[\s\S]*?>\s*)?<svg\b/i.test(text)) return 'svg';
  return undefined;
}

function expectedImageType(file) {
  const extension = extensionOf(file);
  return extension === 'jpg' ? 'jpeg' : extension;
}

async function walkIfPresent(rootDir) {
  try {
    return await walk(rootDir);
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function validateImageRoots(roots, { verifyContents = true, checkSvgSafety = true } = {}) {
  const files = (await Promise.all(roots.map((rootDir) => walkIfPresent(rootDir))))
    .flat()
    .filter((file) => imageExtensions.has(extensionOf(file)))
    .sort();
  let failed = false;

  for (const file of files) {
    const extension = extensionOf(file);
    if (!allowedImageExtensions.has(extension)) {
      console.error(`Raster assets must be WebP; SVG is allowed for vector assets: ${relative(file)}`);
      failed = true;
    }

    if (!verifyContents) continue;

    const source = await fs.readFile(file);
    const detected = detectedImageType(source);
    const expected = expectedImageType(file);
    if (detectableImageExtensions.has(extension) && detected !== expected) {
      console.error(`Asset content does not match .${extension} extension: ${relative(file)}`);
      failed = true;
    }
    if (!checkSvgSafety || detected !== 'svg') continue;

    const text = source.toString('utf8');
    for (const { label, pattern } of unsafeSvgPatterns) {
      if (!pattern.test(text)) continue;
      console.error(`SVG asset contains a forbidden ${label}: ${relative(file)}`);
      failed = true;
    }
  }

  if (!failed) console.log(`Validated ${files.length} image asset${files.length === 1 ? '' : 's'}: WebP-only raster policy satisfied.`);
  return !failed;
}

export async function validateVaultAssets({ rootDir = defaultAssetRoot } = {}) {
  return validateImageRoots([rootDir]);
}

export async function validateRepositoryImages({ siteRoots = defaultSiteImageRoots } = {}) {
  const vaultValid = await validateImageRoots([defaultAssetRoot]);
  const siteFormatValid = await validateImageRoots(siteRoots, {
    verifyContents: false,
    checkSvgSafety: false,
  });
  return vaultValid && siteFormatValid;
}

if (isMainModule(import.meta.url)) {
  const valid = await validateRepositoryImages();
  if (!valid) process.exitCode = 1;
}
