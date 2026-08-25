import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import siteConfig from '../site.config.mjs';
import { walk } from './lib/walk.mjs';

export const RESPONSIVE_IMAGE_WIDTHS = Object.freeze([480, 960, 1600]);
export const RESPONSIVE_WEBP_QUALITY = 75;
export const RESPONSIVE_JPEG_QUALITY = 82;
export const RESPONSIVE_IMAGE_MANIFEST_VERSION = 1;

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const defaultSiteRoot = path.resolve(moduleDir, '..');
const assetCategories = Object.freeze([
  { source: 'Images', public: 'images' },
  { source: 'Maps', public: 'maps' },
]);

function positiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
}

async function pathExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function publicAssetUrl(category, filename) {
  return `/assets/${category}/${filename}`;
}

export function responsiveCandidateWidths(sourceWidth) {
  const width = positiveInteger(sourceWidth);
  if (!width) return [];

  const candidates = RESPONSIVE_IMAGE_WIDTHS.filter((candidate) => candidate <= width);
  const largestTarget = RESPONSIVE_IMAGE_WIDTHS[RESPONSIVE_IMAGE_WIDTHS.length - 1];

  // Never upscale. If the source is smaller than the largest standard tier,
  // preserve its native width as the final candidate instead.
  if (width < largestTarget && !candidates.includes(width)) candidates.push(width);
  if (candidates.length === 0) candidates.push(width);

  return candidates;
}

export function responsiveVariantFilename(filename, width, format) {
  const source = path.basename(String(filename));
  const extension = path.extname(source);
  const stem = source.slice(0, source.length - extension.length);
  const outputExtension = format === 'jpeg' ? 'jpg' : 'webp';
  return `${stem}-${width}.${outputExtension}`;
}

export function responsiveVariantUrl(category, filename, width, format) {
  return publicAssetUrl(
    category,
    `variants/${responsiveVariantFilename(filename, width, format)}`,
  );
}

async function loadSharp() {
  try {
    const sharpModule = await import('sharp');
    return sharpModule.default;
  } catch (error) {
    throw new Error(
      `Responsive image generation requires Sharp. Run npm ci with optional dependencies enabled. (${error.message})`,
    );
  }
}

async function encodeVariant(sharp, source, width, format) {
  const image = sharp(source)
    .rotate()
    .resize({
      width,
      fit: 'inside',
      withoutEnlargement: true,
    });

  if (format === 'jpeg') {
    return image
      .jpeg({ quality: RESPONSIVE_JPEG_QUALITY, progressive: true })
      .toBuffer();
  }

  return image
    .webp({ quality: RESPONSIVE_WEBP_QUALITY, effort: 4 })
    .toBuffer();
}

async function generateAssetVariants({
  sharp,
  source,
  publicOriginal,
  publicCategory,
  filename,
  variantsDir,
}) {
  const metadata = await sharp(source).metadata();
  const width = positiveInteger(metadata.width);
  const height = positiveInteger(metadata.height);
  if (!width || !height) {
    throw new Error(`Could not determine raster dimensions for ${source}`);
  }

  const widths = responsiveCandidateWidths(width);
  const originalUrl = publicAssetUrl(publicCategory, filename);
  const originalStat = await fs.stat(publicOriginal);
  const webp = [];
  const jpeg = [];

  await fs.mkdir(variantsDir, { recursive: true });

  for (const candidateWidth of widths) {
    // Reuse the canonical source WebP at native size instead of applying an
    // unnecessary second lossy encode when the native width is itself a tier.
    if (candidateWidth === width) {
      webp.push({ width: candidateWidth, url: originalUrl, bytes: originalStat.size });
    } else {
      const webpFilename = responsiveVariantFilename(filename, candidateWidth, 'webp');
      const webpTarget = path.join(variantsDir, webpFilename);
      const webpBuffer = await encodeVariant(sharp, source, candidateWidth, 'webp');
      await fs.writeFile(webpTarget, webpBuffer);
      webp.push({
        width: candidateWidth,
        url: responsiveVariantUrl(publicCategory, filename, candidateWidth, 'webp'),
        bytes: webpBuffer.length,
      });
    }

    const jpegFilename = responsiveVariantFilename(filename, candidateWidth, 'jpeg');
    const jpegTarget = path.join(variantsDir, jpegFilename);
    const jpegBuffer = await encodeVariant(sharp, source, candidateWidth, 'jpeg');
    await fs.writeFile(jpegTarget, jpegBuffer);
    jpeg.push({
      width: candidateWidth,
      url: responsiveVariantUrl(publicCategory, filename, candidateWidth, 'jpeg'),
      bytes: jpegBuffer.length,
    });
  }

  return {
    original: {
      url: originalUrl,
      format: 'webp',
      width,
      height,
      bytes: originalStat.size,
    },
    webp,
    jpeg,
  };
}

export async function generateResponsiveImageVariants({ siteRoot = defaultSiteRoot } = {}) {
  const sharp = await loadSharp();
  const assetRoot = path.resolve(siteRoot, siteConfig.vaultAssetDir);
  const publicAssetRoot = path.join(siteRoot, 'public', 'assets');
  const sourceManifestPath = path.join(siteRoot, 'src', 'data', 'image-variants.json');
  const publicManifestPath = path.join(publicAssetRoot, 'image-variants.json');
  const images = {};
  let generatedAssetCount = 0;
  let generatedFileCount = 0;

  for (const category of assetCategories) {
    const sourceDir = path.join(assetRoot, category.source);
    const publicDir = path.join(publicAssetRoot, category.public);
    const variantsDir = path.join(publicDir, 'variants');

    await fs.rm(variantsDir, { recursive: true, force: true });
    if (!(await pathExists(sourceDir)) || !(await pathExists(publicDir))) continue;

    const sourceFiles = (await walk(sourceDir))
      .filter((file) => /\.webp$/i.test(file))
      .sort();

    for (const source of sourceFiles) {
      const filename = path.basename(source);
      const publicOriginal = path.join(publicDir, filename);

      // sync-public-notes copies only public/referenced Vault assets. Treat that
      // copied original as the allow-list so private/unpublished Vault artwork is
      // never pulled into the public build merely because variants are enabled.
      if (!(await pathExists(publicOriginal))) continue;

      const entry = await generateAssetVariants({
        sharp,
        source,
        publicOriginal,
        publicCategory: category.public,
        filename,
        variantsDir,
      });

      images[entry.original.url] = entry;
      generatedAssetCount += 1;
      generatedFileCount += entry.webp.filter((candidate) => candidate.url !== entry.original.url).length;
      generatedFileCount += entry.jpeg.length;
    }
  }

  const manifest = {
    version: RESPONSIVE_IMAGE_MANIFEST_VERSION,
    preferredFormat: 'webp',
    fallbackFormat: 'jpeg',
    targetWidths: [...RESPONSIVE_IMAGE_WIDTHS],
    images,
  };
  const serialised = `${JSON.stringify(manifest, null, 2)}\n`;

  await fs.mkdir(path.dirname(sourceManifestPath), { recursive: true });
  await fs.mkdir(path.dirname(publicManifestPath), { recursive: true });
  await Promise.all([
    fs.writeFile(sourceManifestPath, serialised, 'utf8'),
    fs.writeFile(publicManifestPath, serialised, 'utf8'),
  ]);

  console.log(
    `Generated responsive variants for ${generatedAssetCount} public image(s) (${generatedFileCount} derivative file(s)).`,
  );

  return manifest;
}
