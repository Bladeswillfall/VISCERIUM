import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import {
  STORYTELLER_END,
  STORYTELLER_START,
  transformStorytellerMarkers,
} from '../scripts/prepare-storyteller-markers.mjs';
import { findVaultNote } from './helpers/vault-note.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');

async function readRepo(relativePath) {
  return fs.readFile(path.join(repoRoot, relativePath), 'utf8');
}

test('Storyteller markers become stable block-level public boundaries without flattening Markdown', () => {
  const source = `${STORYTELLER_START}\n\n## Storyteller View\n\n| Sign | Meaning |\n| --- | --- |\n| Smoke | Occupied |\n\n${STORYTELLER_END}`;
  const transformed = transformStorytellerMarkers(source, 'test.md');

  assert.match(transformed, /<div data-codex-storyteller-boundary="start" hidden><\/div>/);
  assert.match(transformed, /<div data-codex-storyteller-boundary="end" hidden><\/div>/);
  assert.doesNotMatch(transformed, /<span data-codex-storyteller-boundary/);
  assert.match(transformed, /## Storyteller View/);
  assert.match(transformed, /\| Smoke \| Occupied \|/);
  assert.doesNotMatch(transformed, /viscerium:storyteller:start/);
});

test('malformed Storyteller boundaries fail instead of publishing an ambiguous view', () => {
  assert.throws(
    () => transformStorytellerMarkers(`${STORYTELLER_START}\nOnly one marker.`, 'missing-end.md'),
    /exactly one Storyteller start marker and one end marker/,
  );
  assert.throws(
    () => transformStorytellerMarkers(`${STORYTELLER_END}\n${STORYTELLER_START}`, 'reversed.md'),
    /end marker before the start marker/,
  );
  assert.throws(
    () => transformStorytellerMarkers(`${STORYTELLER_START}\n${STORYTELLER_START}\n${STORYTELLER_END}`, 'duplicate.md'),
    /exactly one Storyteller start marker and one end marker/,
  );
});

test('Okse stores Storyteller guidance in the article footer rather than frontmatter', async () => {
  const note = await findVaultNote({
    title: 'Okse Dominion',
    type: 'faction',
    era: 'CITADEL',
  });

  for (const retired of [
    'recognisable_presence',
    'encounter_context',
    'current_wants',
    'current_pressures',
    'preferred_methods',
    'resources_and_reach',
    'operational_limits',
    'internal_tensions',
    'story_complication',
  ]) {
    assert.equal(note.data[retired], undefined, `${retired} should no longer occupy Okse frontmatter`);
  }

  assert.match(note.content, /<!-- viscerium:storyteller:start -->/);
  assert.match(note.content, /^## Storyteller View$/m);
  assert.match(note.content, /^### Current agenda$/m);
  assert.match(note.content, /oil and mineral extraction/i);
  assert.match(note.content, /<!-- viscerium:storyteller:end -->/);
});

test('non-canon trade port remains a complete location canary in Markdown', async () => {
  const source = matter(await readRepo('Vault/Lore/Demo/Demo Trade Port.md'));

  assert.equal(source.data.approach_signs, undefined);
  assert.equal(source.data.story_complication, undefined);
  assert.match(source.content, /^### Approach and first impression$/m);
  assert.match(source.content, /bulk cargo between coastal shipping and inland routes/i);
  assert.match(source.content, /missing or misdirected shipment/i);
});

test('public switcher keeps Lore default and moves rendered Markdown between the boundaries', async () => {
  const component = await readRepo('Site/src/components/StorytellerSwitcher.astro');
  const pageTitle = await readRepo('Site/src/components/CodexPageTitle.astro');

  assert.match(pageTitle, /<StorytellerSwitcher\s*\/>/);
  assert.match(component, /role="tablist"/);
  assert.match(component, /aria-selected="true"/);
  assert.match(component, /data-codex-view-tab="storyteller"/);
  assert.match(component, /data-codex-storyteller-boundary/);
  assert.match(component, /storytellerContent\.append\(node\)/);
  assert.match(component, /isMeaningfulStorytellerNode/);
  assert.match(component, /\.sl-heading-wrapper/);
  assert.match(component, /querySelector\(':scope > h1, :scope > h2/);
  assert.match(component, /ArrowLeft/);
  assert.match(component, /ArrowRight/);
  assert.match(component, /activate\('lore'\)/);
  assert.match(component, /\.sl-markdown-content/);
});

test('shared content pipeline prepares marker sections and no longer generates Storyteller frontmatter', async () => {
  const build = await readRepo('Site/scripts/build-content.mjs');

  assert.match(build, /prepareStorytellerMarkers/);
  assert.doesNotMatch(build, /generateStorytellerData/);
});
