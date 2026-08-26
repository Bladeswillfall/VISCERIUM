import process from 'node:process';
import { loadGeneratedDocs, loadVaultContent } from './content-manifest.mjs';
import { validateRepositoryImages } from './validate-vault-assets.mjs';
import { validateVaultNotes } from './validate-vault-notes.mjs';
import { generateTimelineData, reportTimelineError } from './generate-timeline-data.mjs';
import { validateGeneratedContent } from './validate-content.mjs';
import { generateMapData } from './generate-map-data.mjs';
import { cleanMapTilePyramids } from './generate-map-tiles.mjs';
import { generateRelationshipData } from './generate-relationship-data.mjs';
import {
  cleanResponsiveImageVariants,
  generateResponsiveImageVariants,
} from './generate-image-variants.mjs';
import { stripObsidianPluginBlocks } from './strip-obsidian-plugin-blocks.mjs';
import { prepareStorytellerMarkers } from './prepare-storyteller-markers.mjs';
import { generateReferencedIn } from './generate-referenced-in.mjs';
import { applyGiscusPolicy } from './apply-giscus-policy.mjs';
import { syncPublicNotes } from './sync-public-notes.mjs';
import { transformEraPrimerShortcodes } from './transform-era-primer-shortcodes.mjs';
import { transformTimelineShortcodes } from './transform-timeline-shortcodes.mjs';
import { generateContinuityPages } from './generate-continuity-pages.mjs';
import { generateEraTagPages } from './generate-era-tag-pages.mjs';
import { generateCategoryPages } from './generate-category-pages.mjs';

const modeArgument = process.argv.find((value) => value.startsWith('--mode='));
const mode = modeArgument?.slice('--mode='.length) || 'build';
const validModes = new Set(['sync', 'dev', 'build']);

if (!validModes.has(mode)) {
  console.error(`Unknown content build mode "${mode}". Expected sync, dev, or build.`);
  process.exitCode = 1;
} else {
  try {
    // Responsive WebP/JPEG files are generated delivery artifacts, not source
    // artwork. Remove leftovers from a prior invocation before the repository
    // image policy inspects Site/public and Site/src.
    await cleanResponsiveImageVariants();

    const vault = await loadVaultContent();
    if (!validateVaultNotes(vault)) throw new Error('Vault source validation failed.');
    if (!(await validateRepositoryImages())) throw new Error('Repository image policy failed.');

    await generateTimelineData({
      manifest: vault,
      validateOnly: mode === 'sync',
    });

    await syncPublicNotes();
    await generateResponsiveImageVariants();
    await stripObsidianPluginBlocks();
    await prepareStorytellerMarkers();
    await transformEraPrimerShortcodes();
    await transformTimelineShortcodes();

    // Build inbound and outbound reference indexes while generated docs still
    // contain only authored article content. Later category/tag/continuity passes
    // may append navigation links that must never count as narrative references.
    await generateReferencedIn();

    await generateContinuityPages();
    await generateEraTagPages();
    await generateCategoryPages();
    await applyGiscusPolicy();

    const docs = await loadGeneratedDocs();
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
