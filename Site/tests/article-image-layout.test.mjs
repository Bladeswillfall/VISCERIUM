import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseObsidianImageEmbed, renderArticleImage } from '../scripts/image-layout.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, '..');
const repoRoot = path.resolve(siteRoot, '..');
const vaultRoot = path.join(repoRoot, 'Vault');

async function readSite(relativePath) {
  return fs.readFile(path.join(siteRoot, relativePath), 'utf8');
}

async function readVault(relativePath) {
  return fs.readFile(path.join(vaultRoot, relativePath), 'utf8');
}

test('Obsidian image flags parse in any order without polluting alt text', () => {
  const spec = parseObsidianImageEmbed(
    'Assets/Images/abberath.webp|gap=16|alt=A dehumanised Abberath silhouette|shape|320|right',
  );

  assert.equal(spec.target, 'Assets/Images/abberath.webp');
  assert.equal(spec.alignment, 'right');
  assert.equal(spec.width, 320);
  assert.equal(spec.gap, 16);
  assert.equal(spec.shape, true);
  assert.equal(spec.alt, 'A dehumanised Abberath silhouette');
  assert.equal(spec.hasLayout, true);
  assert.deepEqual(spec.issues, []);
});

test('numeric-only image sizing remains a centred Obsidian-compatible layout', () => {
  const spec = parseObsidianImageEmbed('image.webp|480');
  assert.equal(spec.alignment, 'center');
  assert.equal(spec.width, 480);
  assert.equal(spec.shape, false);
});

test('shape wrapping is rejected when an image is not floated', () => {
  const spec = parseObsidianImageEmbed('image.webp|center|shape|480');
  assert.equal(spec.alignment, 'center');
  assert.equal(spec.shape, false);
  assert.match(spec.issues.join(' '), /requires left or right/i);
});

test('public image markup carries layout data while keeping accessible alt text clean', () => {
  const spec = parseObsidianImageEmbed(
    'abberath.webp|right|320|shape|gap=16|alt=An Abberath emerging from vapour',
  );
  const markup = renderArticleImage({
    spec,
    filename: 'abberath.webp',
    url: '/assets/images/abberath.webp',
    href: '/images/abberath/',
  });

  assert.match(markup, /class="vc-image-embed vc-image-right vc-image-shape"/);
  assert.match(markup, /--vc-image-width:320px/);
  assert.match(markup, /--vc-image-gap:16px/);
  assert.match(markup, /--vc-image-shape:url\(&quot;\/assets\/images\/abberath\.webp&quot;\)/);
  assert.match(markup, /alt="An Abberath emerging from vapour"/);
  assert.match(markup, /href="\/images\/abberath\/"/);
  assert.doesNotMatch(markup, /alt="[^"]*(?:right|shape|gap=16)/i);
});

test('MDX image markup remains valid inside authored columns', () => {
  const spec = parseObsidianImageEmbed('abberath.webp|left|220|shape|gap=12');
  const markup = renderArticleImage({
    spec,
    filename: 'abberath.webp',
    url: '/assets/images/abberath.webp',
    jsx: true,
  });

  assert.match(markup, /<figure className="vc-image-embed vc-image-left vc-image-shape"/);
  assert.match(markup, /style=\{\{"--vc-image-width":"220px","--vc-image-gap":"12px","--vc-image-shape":"url\(\\"\/assets\/images\/abberath\.webp\\"\)"\}\}/);
  assert.match(markup, /<img[^>]+\/>/);
  assert.doesNotMatch(markup, / style="/);
});

test('image layout CSS contains floats without overriding hidden Storyteller panels', async () => {
  const css = await readSite('src/styles/image-layout.css');
  const entrypoint = await readSite('src/styles/ion-layers.css');

  assert.match(entrypoint, /@import '\.\/image-layout\.css';/);
  assert.match(css, /\.sl-markdown-content:not\(\[hidden\]\)\s*\{[\s\S]*?display:\s*flow-root/);
  assert.match(css, /\.sl-markdown-content\[hidden\]\s*\{[\s\S]*?display:\s*none\s*!important/);
  assert.doesNotMatch(css, /\.sl-markdown-content\s*\{\s*display:\s*flow-root/);
  assert.match(css, /\.vc-image-left[\s\S]*?float:\s*left/);
  assert.match(css, /\.vc-image-right[\s\S]*?float:\s*right/);
  assert.match(css, /\.vc-image-shape[\s\S]*?shape-outside:\s*var\(--vc-image-shape\)/);
  assert.match(css, /\.cx-col\s*\{[\s\S]*?display:\s*flow-root/);
  assert.match(css, /\.cx-col \.vc-image-full[\s\S]*?width:\s*100%/);
  assert.match(css, /@media \(max-width:\s*42rem\)[\s\S]*?shape-outside:\s*none/);
});

test('Obsidian loads the first-party image renderer and matching snippet rules', async () => {
  const plugins = JSON.parse(await readVault('.obsidian/community-plugins.json'));
  const manifest = JSON.parse(await readVault('.obsidian/plugins/viscerium-image-tools/manifest.json'));
  const runtime = await readVault('.obsidian/plugins/viscerium-image-tools/main.js');
  const css = await readVault('.obsidian/snippets/Image styling.css');

  assert.ok(plugins.includes('viscerium-image-tools'));
  assert.equal(manifest.id, 'viscerium-image-tools');
  assert.doesNotThrow(() => new Function(runtime));
  assert.match(runtime, /registerMarkdownPostProcessor/);
  assert.match(runtime, /currentSrc/);
  assert.match(runtime, /--vc-image-shape/);
  assert.match(css, /\.vc-layout-col-rendered[\s\S]*?display:\s*flow-root/);
  assert.match(css, /\.vc-image-shape[\s\S]*?shape-image-threshold/);
  assert.match(css, /@media \(max-width:\s*700px\)[\s\S]*?shape-outside:\s*none/);
});

test('public sync preserves pipe flags and selects MDX-safe output for columns', async () => {
  const sync = await readSite('scripts/sync-public-notes.mjs');

  assert.match(sync, /parseObsidianImageEmbed\(match\[1\]\)/);
  assert.match(sync, /renderArticleImage/);
  assert.match(sync, /jsx:\s*outputRequiresMdx/);
  assert.doesNotMatch(sync, /match\[1\]\.split\('\|'\)\[0\]/);
});
