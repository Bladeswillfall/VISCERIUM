import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const siteRoot = fileURLToPath(new URL('../', import.meta.url));
const distRoot = path.join(siteRoot, 'dist');
const assetRoot = path.join(distRoot, '_astro');

function compressedSize(buffer, encoding) {
  if (encoding === 'gzip') return gzipSync(buffer, { level: 9 }).length;
  if (encoding === 'brotli') return brotliCompressSync(buffer).length;
  return buffer.length;
}

async function sizeFiles(files, encoding = 'raw') {
  const buffers = await Promise.all([...files].map((file) => fs.readFile(file)));
  return buffers.reduce((total, buffer) => total + compressedSize(buffer, encoding), 0);
}

async function printBreakdown(label, files) {
  if (!process.argv.includes('--details')) return;
  console.log(`${label}:`);
  for (const file of [...files].sort()) {
    console.log(`  ${path.relative(distRoot, file)} ${(await sizeFiles([file], 'gzip') / 1000).toFixed(1)} KB gzip`);
  }
}

async function findAsset(fragment, extension) {
  const assets = await Array.fromAsync(fs.glob(`*.${extension}`, { cwd: assetRoot }));
  for (const asset of assets) {
    const file = path.join(assetRoot, asset);
    if ((await fs.readFile(file, 'utf8')).includes(fragment)) return file;
  }
  throw new Error(`Could not find built .${extension} asset containing ${fragment}`);
}

async function javascriptClosure(entries) {
  const files = new Set();
  const pending = [...entries];
  while (pending.length) {
    const file = pending.pop();
    if (files.has(file)) continue;
    files.add(file);
    const source = await fs.readFile(file, 'utf8');
    for (const match of source.matchAll(/(?:from|import)\s*\(?\s*["'](\.\/[^"']+\.js)["']/g)) {
      const dependency = path.resolve(path.dirname(file), match[1]);
      try {
        await fs.access(dependency);
        pending.push(dependency);
      } catch {
        throw new Error(`Missing built dependency ${match[1]} imported by ${path.basename(file)}`);
      }
    }
  }
  return files;
}

async function routeFiles(route) {
  const htmlFile = path.join(distRoot, route.replace(/^\/+|\/+$/g, ''), 'index.html');
  const html = await fs.readFile(htmlFile, 'utf8');
  const files = new Set([htmlFile]);
  const scripts = [];
  for (const match of html.matchAll(/(?:src|href)="(\/_astro\/[^"?#]+\.(?:js|css))"/g)) {
    const file = path.join(distRoot, match[1].slice(1));
    files.add(file);
    if (file.endsWith('.js')) scripts.push(file);
  }
  for (const file of await javascriptClosure(scripts)) files.add(file);
  return files;
}

function check(label, actual, limit) {
  const actualKb = (actual / 1000).toFixed(1);
  const limitKb = (limit / 1000).toFixed(0);
  if (actual > limit) throw new Error(`${label}: ${actualKb} KB exceeds the ${limitKb} KB budget`);
  console.log(`${label}: ${actualKb} KB / ${limitKb} KB`);
}

const timelineRenderer = await findAsset('Timeline dataset is malformed.', 'js');
const graphEntry = await findAsset('Interactive graph ready.', 'js');
const graphJavascript = await javascriptClosure([graphEntry]);
const graphRoute = await routeFiles('/graph/');
graphRoute.add(path.join(distRoot, 'sitegraph', 'sitemap.json'));
const articleRoute = await routeFiles('/degel-system/errack/');
const articleAssets = new Set([...articleRoute].filter((file) => !file.endsWith('.html')));
const globalCss = (await Array.fromAsync(fs.glob('middleware.*.css', { cwd: assetRoot })))
  .map((asset) => path.join(assetRoot, asset));
const homepageHtml = await fs.readFile(path.join(distRoot, 'index.html'), 'utf8');
const articleHtml = await fs.readFile(path.join(distRoot, 'degel-system', 'errack', 'index.html'), 'utf8');
const categoryHtml = await fs.readFile(path.join(distRoot, 'eras', 'index.html'), 'utf8');
const homepageBlockingStylesheets = [...homepageHtml.matchAll(/<link\b[^>]*>/g)]
  .map(([tag]) => tag)
  .filter((tag) => /\brel="stylesheet"/.test(tag) && !/\bmedia="print"/.test(tag));

if (globalCss.length !== 1) throw new Error(`Expected one global CSS asset, found ${globalCss.length}`);
const globalCssSource = await fs.readFile(globalCss[0], 'utf8');
const articleCss = await findAsset('--vc-reading-text', 'css');
const categoryCss = await findAsset('.codex-alpha-index', 'css');

if (globalCssSource.includes('.telescope__spinner')) {
  throw new Error('Telescope modal CSS is still bundled into the global render-blocking stylesheet');
}
if (globalCssSource.includes('.codex-smart-tooltip')) {
  throw new Error('Smart tooltip CSS is still bundled into the global render-blocking stylesheet');
}
if (globalCssSource.includes('--vc-reading-text')) {
  throw new Error('Article presentation CSS is still bundled into the global render-blocking stylesheet');
}
if (globalCssSource.includes('.codex-alpha-index')) {
  throw new Error('Category index CSS is still bundled into the global render-blocking stylesheet');
}
if (homepageHtml.includes('.telescope__spinner')) {
  throw new Error('Homepage contains Telescope modal CSS before search is requested');
}
if (homepageHtml.includes(path.basename(articleCss)) || homepageHtml.includes(path.basename(categoryCss))) {
  throw new Error('Homepage links route-only article or category CSS');
}
if (!articleHtml.includes(path.basename(articleCss))) {
  throw new Error('Representative article does not link the split article stylesheet');
}
if (!categoryHtml.includes(path.basename(articleCss)) || !categoryHtml.includes(path.basename(categoryCss))) {
  throw new Error('Category route does not link its split article and category stylesheets');
}
if (homepageBlockingStylesheets.length > 1) {
  throw new Error(`Homepage has ${homepageBlockingStylesheets.length} render-blocking stylesheets; expected at most 1`);
}

await printBreakdown('Representative article linked assets', articleAssets);

check('Timeline renderer raw', await sizeFiles([timelineRenderer]), 650_000);
check('Timeline renderer Brotli', await sizeFiles([timelineRenderer], 'brotli'), 225_000);
check('World Graph route JavaScript raw', await sizeFiles(graphJavascript), 500_000);
check('World Graph linked resources gzip', await sizeFiles(graphRoute, 'gzip'), 250_000);
check('Global CSS gzip', await sizeFiles(globalCss, 'gzip'), 30_000);
check('Representative article linked resources gzip', await sizeFiles(articleAssets, 'gzip'), 65_000);
console.log(`Homepage render-blocking stylesheets: ${homepageBlockingStylesheets.length} / 1`);
console.log('Telescope, smart tooltip, article, and category CSS are absent from the homepage first-load stylesheet');
