import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const creatorPlugin = readFileSync(new URL('../../Vault/.obsidian/plugins/viscerium-creator-tools/main.js', import.meta.url), 'utf8');
const creatorStyles = readFileSync(new URL('../../Vault/.obsidian/plugins/viscerium-creator-tools/styles.css', import.meta.url), 'utf8');
const loreTemplate = readFileSync(new URL('../../Vault/Templates/Lore/New Lore Entity.md', import.meta.url), 'utf8');
const storyTemplate = readFileSync(new URL('../../Vault/Templates/Databases/New Story Entity.md', import.meta.url), 'utf8');

test('first-party creator plugin is syntactically valid and exposes era/continuity commands', () => {
  assert.doesNotThrow(() => new Function(creatorPlugin));
  assert.match(creatorPlugin, /\['CITADEL', 'SMOG', 'NEARSIGHT', 'ENTROPY'\]/);
  assert.match(creatorPlugin, /\.\.\.HISTORICAL_ERAS, 'Universal'/);
  assert.match(creatorPlugin, /id: 'set-controlled-era'/);
  assert.match(creatorPlugin, /id: 'set-continuity-entity-id'/);
  assert.match(creatorPlugin, /id: 'create-era-edition'/);
  assert.match(creatorPlugin, /Drafts\/Inbox\/Era Editions/);
  assert.match(creatorPlugin, /data\.status = 'draft'/);
  assert.match(creatorPlugin, /delete data\.eras/);
  assert.match(creatorPlugin, /delete data\.publish/);
});

test('creator tools provide disposable World Anvil review context in the right sidebar', () => {
  assert.match(creatorPlugin, /const IMPORT_REVIEW_VIEW = 'viscerium-import-review'/);
  assert.match(creatorPlugin, /worldanvil-migration-review:start/);
  assert.match(creatorPlugin, /registerView\(IMPORT_REVIEW_VIEW/);
  assert.match(creatorPlugin, /getRightLeaf\(false\)/);
  assert.match(creatorPlugin, /workspace\.revealLeaf\(leaf\)/);
  assert.match(creatorPlugin, /workspace\.on\('file-open'/);
  assert.match(creatorPlugin, /vault\.on\('modify'/);
  assert.match(creatorPlugin, /open-worldanvil-import-review/);
  assert.match(creatorPlugin, /Review complete/);
  assert.match(creatorPlugin, /No file was moved, deleted, published or made canonical/);
});

test('World Anvil review tasks use the note checklist as source and keep generated issue mirrors aligned', () => {
  assert.match(creatorPlugin, /setImportReviewTask/);
  assert.match(creatorPlugin, /await this\.app\.vault\.modify\(file, after\)/);
  assert.match(creatorPlugin, /syncImportIssueMirror/);
  assert.match(creatorPlugin, /await this\.syncImportIssueMirror\(file\)/);
  assert.match(creatorPlugin, /processFrontMatter\(file/);
  assert.match(creatorPlugin, /if \(checked\) next\.delete\(issue\)/);
  assert.match(creatorPlugin, /else next\.add\(issue\)/);
});

test('World Anvil review context supports same-title comparison and priority queue navigation', () => {
  assert.match(creatorPlugin, /findCurrentCodexMatch/);
  assert.match(creatorPlugin, /getLeaf\('split', 'vertical'\)/);
  assert.match(creatorPlugin, /Open .* side-by-side/);
  assert.match(creatorPlugin, /records\.sort\(\(a, b\) => a\.rank - b\.rank \|\| b\.issueCount - a\.issueCount/);
  assert.match(creatorPlugin, /← Previous/);
  assert.match(creatorPlugin, /Next →/);
  assert.match(creatorPlugin, /WORLDANVIL_BASE_PATH/);
});

test('multi-era imports remain in contextual review until their structural split is resolved', () => {
  assert.match(creatorPlugin, /'multi-era-review'/);
  assert.match(creatorPlugin, /eraCount\(frontmatter\) > 1/);
  assert.match(creatorPlugin, /Resolve multi-era continuity into deliberate historical editions/);
  assert.match(creatorPlugin, /Open era-edition workflow guide/);
});

test('import review pane follows creator visual grammar', () => {
  assert.match(creatorStyles, /\.vc-import-review/);
  assert.match(creatorStyles, /border-radius: var\(--vc-radius-control, 4px\)/);
  assert.match(creatorStyles, /vc-review-danger/);
  assert.match(creatorStyles, /vc-review-warning/);
  assert.match(creatorStyles, /vc-review-reference/);
  assert.match(creatorStyles, /vc-review-success/);
});

test('creator templates use the controlled era vocabulary and continuity IDs', () => {
  assert.match(loreTemplate, /const ERA_OPTIONS = \[\.\.\.HISTORICAL_ERAS, "Universal"\]/);
  assert.match(loreTemplate, /entity_id/);
  assert.doesNotMatch(loreTemplate, /publish:\s*false/);

  assert.match(storyTemplate, /const ERA_OPTIONS = \["CITADEL", "SMOG", "NEARSIGHT", "ENTROPY", "Universal"\]/);
  assert.match(storyTemplate, /Continuity entity ID/);
  assert.match(storyTemplate, /replace\(\/\^publish:/);
});
