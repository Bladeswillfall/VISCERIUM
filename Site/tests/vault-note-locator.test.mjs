import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { findVaultNote } from './helpers/vault-note.mjs';

async function writeNote(root, relativePath, frontmatter, body = 'Body.') {
  const file = path.join(root, relativePath);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const yaml = Object.entries(frontmatter)
    .map(([key, value]) => Array.isArray(value)
      ? `${key}:\n${value.map((item) => `  - ${item}`).join('\n')}`
      : `${key}: ${value}`)
    .join('\n');
  await fs.writeFile(file, `---\n${yaml}\n---\n\n${body}\n`, 'utf8');
}

test('vault note locator follows moves by matching stable frontmatter', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'viscerium-vault-note-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));

  await writeNote(root, 'Eras/CITADEL/Nations/Okse Dominion.md', {
    title: 'Okse Dominion',
    type: 'faction',
    era: 'CITADEL',
  }, 'The Dominion endures.');

  const found = await findVaultNote({
    title: 'Okse Dominion',
    type: 'faction',
    era: 'CITADEL',
  }, { root });

  assert.equal(found.relativePath, 'Eras/CITADEL/Nations/Okse Dominion.md');
  assert.match(found.content, /Dominion endures/);
});

test('vault note locator matches scalar criteria inside list properties', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'viscerium-vault-note-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));

  await writeNote(root, 'Universal/Example.md', {
    title: 'Example',
    type: 'article',
    eras: ['CITADEL', 'SMOG'],
  });

  const found = await findVaultNote({ title: 'Example', eras: 'SMOG' }, { root });
  assert.equal(found.relativePath, 'Universal/Example.md');
});

test('vault note locator fails clearly when identity is missing or ambiguous', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'viscerium-vault-note-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));

  await assert.rejects(
    findVaultNote({ title: 'Missing' }, { root }),
    /No Vault\/Lore note matched title="Missing"/,
  );

  await writeNote(root, 'One.md', { title: 'Duplicate', type: 'article' });
  await writeNote(root, 'Nested/Two.md', { title: 'Duplicate', type: 'article' });

  await assert.rejects(
    findVaultNote({ title: 'Duplicate', type: 'article' }, { root }),
    /Multiple Vault\/Lore notes matched title="Duplicate", type="article": Nested\/Two\.md, One\.md/,
  );
});
