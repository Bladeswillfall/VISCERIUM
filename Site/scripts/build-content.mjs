import fs from 'node:fs/promises';
import process from 'node:process';
import { loadGeneratedDocs, loadVaultContent } from './content-manifest.mjs';
import { validateRepositoryImages } from './validate-vault-assets.mjs';
import { validateVaultNotes } from './validate-vault-notes.mjs';
import { generateTimelineData, reportTimelineError } from './generate-timeline-data.mjs';
import { validateGeneratedContent } from './validate-content.mjs';
import { generateMapData } from './generate-map-data.mjs';
import { generateRelationshipData } from './generate-relationship-data.mjs';
import { generateStorytellerData } from './generate-storyteller-data.mjs';
import { generateReferencedIn } from './generate-referenced-in.mjs';

const modeArgument = process.argv.find((value) => value.startsWith('--mode='));
const mode = modeArgument?.slice('--mode='.length) || 'build';
const validModes = new Set(['sync', 'dev', 'build']);

const isWebP = (decoded) => decoded.subarray(0, 4).toString('ascii') === 'RIFF'
  && decoded.subarray(8, 12).toString('ascii') === 'WEBP';

async function decodeShellAsset({ source, target, validate, errorMessage }) {
  const encoded = (await fs.readFile(source, 'utf8')).trim();
  const decoded = Buffer.from(encoded, 'base64');
  if (!validate(decoded)) throw new Error(errorMessage);

  await fs.mkdir(new URL('./', target), { recursive: true });
  await fs.writeFile(target, decoded);
}

async function decodeMultipartShellAsset({ sources, target, validate, errorMessage }) {
  const encodedParts = await Promise.all(sources.map((source) => fs.readFile(source, 'utf8')));
  const encoded = encodedParts.join('').replace(/\s+/g, '');
  const decoded = Buffer.from(encoded, 'base64');
  if (!validate(decoded)) throw new Error(errorMessage);

  await fs.mkdir(new URL('./', target), { recursive: true });
  await fs.writeFile(target, decoded);
}

async function syncShellAssets() {
  await decodeShellAsset({
    source: new URL('../src/assets/images/codex-noise.webp.b64.txt', import.meta.url),
    target: new URL('../public/assets/images/codex-noise-v2.webp', import.meta.url),
    validate: isWebP,
    errorMessage: 'Codex noise source did not decode to a valid WebP asset.',
  });

  await decodeShellAsset({
    source: new URL('../src/assets/images/era-placeholder-sigil.webp.b64.txt', import.meta.url),
    target: new URL('../public/assets/images/era-placeholder-sigil.webp', import.meta.url),
    validate: isWebP,
    errorMessage: 'Era placeholder sigil source did not decode to a valid WebP asset.',
  });

  // Keep the supplied era artwork repository-owned while respecting the text-only
  // source transport used by this build step. Parts are concatenated in filename order.
  await decodeMultipartShellAsset({
    sources: [1, 2, 3, 4].map((part) => new URL(`../src/assets/images/citadel-era-map.webp.b64.part${part}.txt`, import.meta.url)),
    target: new URL('../public/assets/images/citadel-era-map.webp', import.meta.url),
    validate: (decoded) => isWebP(decoded) && decoded.length === 46844,
    errorMessage: 'CITADEL era map source did not decode to the expected WebP asset.',
  });
}

if (!validModes.has(mode)) {
  console.error(`Unknown content build mode "${mode}". Expected sync, dev, or build.`);
  process.exitCode = 1;
} else {
  try {
    await syncShellAssets();

    const vault = await loadVaultContent({ refresh: true });
    if (!validateVaultNotes(vault)) throw new Error('Vault source validation failed.');
    if (!(await validateRepositoryImages())) throw new Error('Repository image policy failed.');

    await generateTimelineData({
      manifest: vault,
      validateOnly: mode === 'sync',
    });

    await import('./sync-public-notes.mjs');
    await import('./strip-obsidian-plugin-blocks.mjs');
    await generateStorytellerData();
    await import('./transform-era-primer-shortcodes.mjs');
    await import('./transform-timeline-shortcodes.mjs');

    // Build the reverse reference index while generated docs still contain only
    // authored article content. Later category/tag/continuity passes may append
    // navigation links that must never count as narrative references.
    await generateReferencedIn();

    await import('./generate-continuity-pages.mjs');
    await import('./generate-era-tag-pages.mjs');
    await import('./generate-category-pages.mjs');

    const docs = await loadGeneratedDocs({ refresh: true });
    if (mode === 'build' && !validateGeneratedContent(docs)) {
      throw new Error('Generated content validation failed.');
    }

    if (mode !== 'sync') {
      await generateMapData({ manifest: docs });
      await generateRelationshipData({ manifest: docs });
    }

    console.log(`Completed shared content pipeline in ${mode} mode.`);
  } catch (error) {
    if (!reportTimelineError(error)) console.error(error.message ?? error);
    process.exitCode = 1;
  }
}
