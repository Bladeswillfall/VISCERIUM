import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { buildStorytellerProjection } from '../src/lib/storyteller.mjs';
import { generateStorytellerData } from '../scripts/generate-storyteller-data.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');

async function readRepo(relativePath) {
  return fs.readFile(path.join(repoRoot, relativePath), 'utf8');
}

test('Storyteller projection emits only populated type-appropriate sections', () => {
  const projection = buildStorytellerProjection({
    type: 'location',
    approach_signs: 'Smoke is visible above the ridge.',
    local_tension: 'Two households dispute access to the spring.',
    current_wants: 'This faction-only field must not leak into a location.',
  });

  assert.equal(projection.type, 'location');
  assert.deepEqual(projection.sections.map((section) => section.id), ['experience', 'story']);
  assert.deepEqual(
    projection.sections.flatMap((section) => section.items.map((item) => item.key)),
    ['approach_signs', 'local_tension'],
  );
});

test('Storyteller projection stays absent when a supported entity has no useful fields', () => {
  assert.equal(buildStorytellerProjection({ type: 'faction', title: 'Empty faction' }), undefined);
  assert.equal(buildStorytellerProjection({ type: 'event', story_complication: 'Not supported yet' }), undefined);
});

test('non-canon trade port provides a complete public location canary', async () => {
  const source = matter(await readRepo('Vault/Lore/Demo/Demo Trade Port.md'));
  const projection = buildStorytellerProjection(source.data);

  assert.ok(projection);
  assert.deepEqual(projection.sections.map((section) => section.id), ['experience', 'use', 'knowledge', 'story']);
  assert.match(
    projection.sections.find((section) => section.id === 'use').items.find((item) => item.key === 'why_people_come').value,
    /bulk cargo/i,
  );
});

test('Okse provides a canon-grounded faction Storyteller projection', async () => {
  const source = matter(await readRepo('Vault/Lore/Eras/CITADEL/Okse Dominion.md'));
  const projection = buildStorytellerProjection(source.data);

  assert.ok(projection);
  assert.equal(projection.type, 'faction');
  assert.deepEqual(projection.sections.map((section) => section.id), ['presence', 'agenda', 'reach', 'friction', 'story']);
  assert.match(
    projection.sections.find((section) => section.id === 'agenda').items.find((item) => item.key === 'current_wants').value,
    /oil|mineral|self-sufficiency/i,
  );
  assert.match(
    projection.sections.find((section) => section.id === 'friction').items.find((item) => item.key === 'internal_tensions').value,
    /Leysingi|enslaved|masters/i,
  );
});

test('generated public docs receive one compact Storyteller object', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'viscerium-storyteller-'));
  const file = path.join(root, 'test.md');
  await fs.writeFile(file, `---\ntitle: Test\ndescription: Test\ntype: faction\ncurrent_wants: Secure the pass.\n---\n\nLore body.\n`, 'utf8');

  try {
    const count = await generateStorytellerData({ root });
    const generated = matter(await fs.readFile(file, 'utf8'));
    assert.equal(count, 1);
    assert.equal(generated.data.storyteller.version, 1);
    assert.equal(generated.data.storyteller.type, 'faction');
    assert.equal(generated.data.storyteller.sections[0].items[0].key, 'current_wants');
    assert.equal(generated.content.trim(), 'Lore body.');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('public switcher keeps Lore default and supports accessible tab navigation', async () => {
  const component = await readRepo('Site/src/components/StorytellerSwitcher.astro');
  const pageTitle = await readRepo('Site/src/components/CodexPageTitle.astro');

  assert.match(pageTitle, /<StorytellerSwitcher\s*\/>/);
  assert.match(component, /role="tablist"/);
  assert.match(component, /aria-selected="true"/);
  assert.match(component, /data-codex-view-tab="storyteller"/);
  assert.match(component, /ArrowLeft/);
  assert.match(component, /ArrowRight/);
  assert.match(component, /activate\('lore'\)/);
  assert.match(component, /\.sl-markdown-content/);
});
