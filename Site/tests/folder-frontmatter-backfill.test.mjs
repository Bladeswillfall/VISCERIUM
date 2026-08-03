import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import matter from 'gray-matter';
import {
  backfillFolderFrontmatter,
  planFolderFrontmatter,
} from '../scripts/backfill-folder-frontmatter.mjs';

async function fixtureVault() {
  const vaultRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'viscerium-folder-frontmatter-'));
  await fs.mkdir(path.join(vaultRoot, 'Lore'), { recursive: true });
  return vaultRoot;
}

async function writeNote(vaultRoot, relativePath, source) {
  const file = path.join(vaultRoot, 'Lore', relativePath);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, source, 'utf8');
  return file;
}

const skeleton = (extra = '') => `---\ntitle: Test\ndescription: Test article.\nstatus: draft\n${extra}---\n\nBody.\n`;

test('plans missing item fields from weapon folders without rewriting prose', async (t) => {
  const vaultRoot = await fixtureVault();
  t.after(() => fs.rm(vaultRoot, { recursive: true, force: true }));
  const loreRoot = path.join(vaultRoot, 'Lore');
  const file = path.join(loreRoot, 'Eras/CITADEL/Weapons & Armour/Weaponry/Glaive.md');
  const source = skeleton();

  const plan = planFolderFrontmatter(source, file, loreRoot);
  const parsed = matter(plan.output);

  assert.deepEqual(plan.changes, {
    type: 'item',
    era: 'CITADEL',
    item_type: 'weapon',
  });
  assert.equal(parsed.data.type, 'item');
  assert.equal(parsed.data.era, 'CITADEL');
  assert.equal(parsed.data.item_type, 'weapon');
  assert.equal(parsed.content, '\nBody.\n');
  assert.deepEqual(plan.conflicts, []);
});

test('fills species kind and a blank era while preserving existing authored fields', async (t) => {
  const vaultRoot = await fixtureVault();
  t.after(() => fs.rm(vaultRoot, { recursive: true, force: true }));
  const loreRoot = path.join(vaultRoot, 'Lore');
  const file = path.join(loreRoot, 'Universal/Fauna/Reptile/Naranor.md');
  const source = skeleton('type: species\nera:\ntags: [species]\n');

  const plan = planFolderFrontmatter(source, file, loreRoot);
  const parsed = matter(plan.output).data;

  assert.deepEqual(plan.changes, { era: 'Universal', species_kind: 'reptile' });
  assert.equal(parsed.type, 'species');
  assert.equal(parsed.era, 'Universal');
  assert.equal(parsed.species_kind, 'reptile');
  assert.deepEqual(parsed.tags, ['species']);
});

test('reports contradictory authored values and never overwrites them', async (t) => {
  const vaultRoot = await fixtureVault();
  t.after(() => fs.rm(vaultRoot, { recursive: true, force: true }));
  const loreRoot = path.join(vaultRoot, 'Lore');
  const file = path.join(loreRoot, 'Eras/CITADEL/Armour/Bastion Plate.md');
  const source = skeleton('type: location\nera: SMOG\n');

  const plan = planFolderFrontmatter(source, file, loreRoot);

  assert.deepEqual(plan.changes, {});
  assert.deepEqual(plan.conflicts, [
    { key: 'type', current: 'location', expected: 'item' },
    { key: 'era', current: 'SMOG', expected: 'CITADEL' },
  ]);
  assert.equal(plan.output, source);
});

test('ambiguous folders are reported instead of silently becoming articles', async (t) => {
  const vaultRoot = await fixtureVault();
  t.after(() => fs.rm(vaultRoot, { recursive: true, force: true }));
  const loreRoot = path.join(vaultRoot, 'Lore');
  const file = path.join(loreRoot, 'Eras/CITADEL/Unsorted/Mystery.md');
  const source = skeleton();

  const plan = planFolderFrontmatter(source, file, loreRoot);
  const parsed = matter(plan.output).data;

  assert.deepEqual(plan.changes, { era: 'CITADEL' });
  assert.equal(parsed.type, undefined);
  assert.equal(parsed.era, 'CITADEL');
  assert.deepEqual(plan.notices, ['ambiguous-type']);
});

test('audit mode is non-destructive; write mode is idempotent', async (t) => {
  const vaultRoot = await fixtureVault();
  t.after(() => fs.rm(vaultRoot, { recursive: true, force: true }));
  const file = await writeNote(
    vaultRoot,
    'Eras/CITADEL/Nations/Example Dominion.md',
    skeleton(),
  );
  const before = await fs.readFile(file, 'utf8');

  const audit = await backfillFolderFrontmatter({ vaultRoot });
  assert.equal(audit.scanned, 1);
  assert.deepEqual(audit.changed, [{
    path: 'Lore/Eras/CITADEL/Nations/Example Dominion.md',
    fields: { type: 'faction', era: 'CITADEL' },
  }]);
  assert.equal(await fs.readFile(file, 'utf8'), before);

  const written = await backfillFolderFrontmatter({ vaultRoot, write: true });
  assert.equal(written.changed.length, 1);
  const parsed = matter(await fs.readFile(file, 'utf8')).data;
  assert.equal(parsed.type, 'faction');
  assert.equal(parsed.era, 'CITADEL');

  const second = await backfillFolderFrontmatter({ vaultRoot, write: true });
  assert.equal(second.changed.length, 0);
  assert.equal(second.conflicts.length, 0);
});

test('notes without valid frontmatter are review-only', async (t) => {
  const vaultRoot = await fixtureVault();
  t.after(() => fs.rm(vaultRoot, { recursive: true, force: true }));
  const file = await writeNote(vaultRoot, 'Items/Loose.md', 'Loose prose only.\n');

  const report = await backfillFolderFrontmatter({ vaultRoot, write: true });

  assert.equal(report.changed.length, 0);
  assert.deepEqual(report.notices, [{ path: 'Lore/Items/Loose.md', notice: 'missing-frontmatter' }]);
  assert.equal(await fs.readFile(file, 'utf8'), 'Loose prose only.\n');
});
