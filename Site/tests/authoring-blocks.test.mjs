import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  AUTHORING_END,
  AUTHORING_START,
  stripObsidianOnlyContent,
} from '../scripts/strip-obsidian-plugin-blocks.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const vaultRoot = path.join(repoRoot, 'Vault');
const require = createRequire(import.meta.url);

const redesignedTemplates = [
  'Templates/Lore/Article Template.md',
  'Templates/Lore/Character Template.md',
  'Templates/Lore/Faction Template.md',
  'Templates/Lore/Location Template.md',
  'Templates/Lore/Event Template.md',
  'Templates/Lore/Species Template.md',
  'Templates/Lore/Item Template.md',
  'Templates/Lore/Era Template.md',
  'Templates/Lore/Culture Template.md',
  'Templates/Lore/Belief and Religion Template.md',
  'Templates/Lore/Naming Language Template.md',
  'Templates/Lore/Resonance Practice Template.md',
];

async function readRepo(relativePath) {
  return fs.readFile(path.join(repoRoot, relativePath), 'utf8');
}

async function readVault(relativePath) {
  return fs.readFile(path.join(vaultRoot, relativePath), 'utf8');
}

test('authoring drawers are removed from public content without touching lore or Storyteller material', () => {
  const source = [
    '# Lore',
    '',
    AUTHORING_START,
    '> [!authoring]- Need a hand?',
    '> Creator-only prompt.',
    AUTHORING_END,
    '',
    'Reader-facing lore survives.',
    '',
    '<!-- viscerium:storyteller:start -->',
    '## Storyteller View',
    'Scene-facing guidance survives.',
    '<!-- viscerium:storyteller:end -->',
  ].join('\n');

  const stripped = stripObsidianOnlyContent(source, 'test.md');
  assert.doesNotMatch(stripped, /authoring|Creator-only prompt/);
  assert.match(stripped, /Reader-facing lore survives/);
  assert.match(stripped, /viscerium:storyteller:start/);
  assert.match(stripped, /Scene-facing guidance survives/);
});

test('malformed authoring boundaries fail closed so creator guidance cannot leak into Codex', () => {
  assert.throws(
    () => stripObsidianOnlyContent(`${AUTHORING_START}\nOnly one marker.`, 'missing-end.md'),
    /exactly one authoring start marker and one end marker/,
  );
  assert.throws(
    () => stripObsidianOnlyContent(`${AUTHORING_END}\n${AUTHORING_START}`, 'reversed.md'),
    /authoring end marker before the start marker/,
  );
  assert.throws(
    () => stripObsidianOnlyContent(`${AUTHORING_START}\n${AUTHORING_START}\n${AUTHORING_END}`, 'duplicate.md'),
    /exactly one authoring start marker and one end marker/,
  );
});

test('all redesigned Lore templates expose one collapsed creator drawer and one Storyteller footer', async () => {
  for (const relativePath of redesignedTemplates) {
    const source = await readVault(relativePath);
    assert.equal(source.split(AUTHORING_START).length - 1, 1, `${relativePath} authoring start`);
    assert.equal(source.split(AUTHORING_END).length - 1, 1, `${relativePath} authoring end`);
    assert.ok(source.indexOf(AUTHORING_START) < source.indexOf(AUTHORING_END), `${relativePath} authoring order`);
    assert.match(source.slice(source.indexOf(AUTHORING_START), source.indexOf(AUTHORING_END)), /> \[!authoring\]- Need a hand\?/);
    assert.equal(source.split('<!-- viscerium:storyteller:start -->').length - 1, 1, `${relativePath} Storyteller start`);
    assert.equal(source.split('<!-- viscerium:storyteller:end -->').length - 1, 1, `${relativePath} Storyteller end`);
    assert.match(source, /Use wikilinks as depth valves/);
    assert.match(source, /do not polish away the people/i);
  }
});

test('Obsidian styles the authoring drawer as quiet creator UI', async () => {
  const css = await readVault('.obsidian/snippets/Callout styling.css');
  assert.match(css, /\.callout\[data-callout="authoring"\]/);
  assert.match(css, /columns:\s*2 22rem/);
  assert.match(css, /@media \(max-width: 760px\)/);
});

test('folder routing recognises the four specialist article templates', () => {
  const routerPath = path.join(vaultRoot, 'Templates/_Scripts/folder_entity_router.js');
  delete require.cache[require.resolve(routerPath)];
  const router = require(routerPath);

  assert.equal(router.classifyFolder('Lore/Eras/CITADEL/Cultures').type, 'culture');
  assert.equal(router.classifyFolder('Lore/Eras/CITADEL/Religions').type, 'belief');
  assert.equal(router.classifyFolder('Lore/Eras/CITADEL/Naming Languages').type, 'naming_language');
  assert.equal(router.classifyFolder('Lore/Eras/CITADEL/Resonance Practices').type, 'resonance_practice');
  assert.equal(router.ROUTES.culture.template, 'Templates/Lore/Culture Template.md');
  assert.equal(router.ROUTES.belief.template, 'Templates/Lore/Belief and Religion Template.md');
  assert.equal(router.ROUTES.naming_language.template, 'Templates/Lore/Naming Language Template.md');
  assert.equal(router.ROUTES.resonance_practice.template, 'Templates/Lore/Resonance Practice Template.md');
});

test('shared build strips creator drawers before preparing Storyteller boundaries', async () => {
  const build = await readRepo('Site/scripts/build-content.mjs');
  const stripIndex = build.indexOf('await stripObsidianPluginBlocks()');
  const storytellerIndex = build.indexOf('await prepareStorytellerMarkers()');
  assert.ok(stripIndex >= 0, 'build pipeline should strip Obsidian creator content');
  assert.ok(storytellerIndex > stripIndex, 'creator-only content must be removed before Storyteller transformation');
});
