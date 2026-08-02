import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  prepareImportMarkdown,
  prepareWorldAnvilFrontmatter,
} from '../scripts/prepare-worldanvil-import-frontmatter.mjs';

const sample = `---
title: "Krass Dominion"
status: draft
type: faction
import_source: worldanvil
---

The Krass Dominion is a land where the air itself conspires against life.

## History

Further detail.
`;

test('World Anvil preparation adds only safe mechanical frontmatter', () => {
  const prepared = prepareImportMarkdown(sample, 'Organization-Krass Dominion-AbC');

  assert.equal(prepared.changed, true);
  assert.match(prepared.markdown, /^description: "The Krass Dominion is a land where the air itself conspires against life\."$/m);
  assert.match(prepared.markdown, /^created:$/m);
  assert.match(prepared.markdown, /^updated:$/m);
  assert.match(prepared.markdown, /^type: faction$/m);
  assert.doesNotMatch(prepared.markdown, /^era:/m);
  assert.doesNotMatch(prepared.markdown, /^entity_id:/m);
});

test('World Anvil preparation fills a blank description without duplicating the property', () => {
  const blank = sample.replace('title: "Krass Dominion"', 'title: "Krass Dominion"\ndescription:');
  const prepared = prepareImportMarkdown(blank, 'Krass Dominion');

  assert.equal(prepared.changed, true);
  assert.equal((prepared.markdown.match(/^description:/gm) ?? []).length, 1);
  assert.match(prepared.markdown, /^description: "The Krass Dominion is a land where the air itself conspires against life\."$/m);
});

test('World Anvil preparation preserves existing descriptions and dates', () => {
  const existing = sample.replace(
    'title: "Krass Dominion"',
    'title: "Krass Dominion"\ndescription: "Existing description."\ncreated: 2024-01-02\nupdated: 2026-07-24',
  );
  const prepared = prepareImportMarkdown(existing, 'Krass Dominion');

  assert.equal(prepared.changed, false);
  assert.equal(prepared.markdown, existing);
});

test('World Anvil preparation is audit-first, writable and idempotent', async (t) => {
  const vault = await fs.mkdtemp(path.join(os.tmpdir(), 'viscerium-wa-prep-'));
  t.after(() => fs.rm(vault, { recursive: true, force: true }));

  const importDir = path.join(vault, 'Drafts/WorldAnvil Import');
  const note = path.join(importDir, 'Organization-Krass Dominion-AbC.md');
  await fs.mkdir(importDir, { recursive: true });
  await fs.writeFile(note, sample, 'utf8');

  const audit = await prepareWorldAnvilFrontmatter({ vault, write: false });
  assert.equal(audit.changed, 1);
  assert.equal(await fs.readFile(note, 'utf8'), sample);

  const written = await prepareWorldAnvilFrontmatter({ vault, write: true });
  assert.equal(written.changed, 1);
  assert.equal(written.descriptionsAdded, 1);
  assert.equal(written.createdKeysAdded, 1);
  assert.equal(written.updatedKeysAdded, 1);

  const rerun = await prepareWorldAnvilFrontmatter({ vault, write: true });
  assert.equal(rerun.changed, 0);
});
