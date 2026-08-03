import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  normaliseWorldAnvilFilenames,
  planWorldAnvilFilenameNormalisation,
} from '../scripts/normalise-worldanvil-filenames.mjs';

async function fixtureVault() {
  const vaultRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'viscerium-worldanvil-filenames-'));
  await fs.mkdir(path.join(vaultRoot, 'Lore/Factions'), { recursive: true });
  await fs.mkdir(path.join(vaultRoot, 'Lore/Characters'), { recursive: true });
  return vaultRoot;
}

async function write(vaultRoot, relativePath, content) {
  const file = path.join(vaultRoot, relativePath);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, 'utf8');
  return file;
}

test('removes export prefixes and IDs while preserving import provenance and wikilinks', async (t) => {
  const vaultRoot = await fixtureVault();
  t.after(() => fs.rm(vaultRoot, { recursive: true, force: true }));

  const source = await write(
    vaultRoot,
    'Lore/Factions/Organization-Drai Dynasty-40e.md',
    '---\ntitle: Drai Dynasty\nimport_source_file: Organization-Drai Dynasty-40e.md\n---\n\nBody.\n',
  );
  const links = await write(
    vaultRoot,
    'Lore/Index.md',
    'See [[Organization-Drai Dynasty-40e]], [[Lore/Factions/Organization-Drai Dynasty-40e|the dynasty]], and [[Organization-Drai Dynasty-40e#History]].\n',
  );

  const audit = await planWorldAnvilFilenameNormalisation({ vaultRoot });
  assert.equal(audit.renames.length, 1);
  assert.equal(audit.collisions.length, 0);

  const report = await normaliseWorldAnvilFilenames({ vaultRoot, write: true });
  const target = path.join(vaultRoot, 'Lore/Factions/Drai Dynasty.md');

  await assert.rejects(fs.access(source));
  assert.equal(await fs.readFile(target, 'utf8'), '---\ntitle: Drai Dynasty\nimport_source_file: Organization-Drai Dynasty-40e.md\n---\n\nBody.\n');
  assert.equal(
    await fs.readFile(links, 'utf8'),
    'See [[Drai Dynasty]], [[Lore/Factions/Drai Dynasty|the dynasty]], and [[Drai Dynasty#History]].\n',
  );
  assert.equal(report.renamed.length, 1);
  assert.equal(report.linksUpdated, 3);
});

test('skips collisions without blocking safe renames', async (t) => {
  const vaultRoot = await fixtureVault();
  t.after(() => fs.rm(vaultRoot, { recursive: true, force: true }));

  await write(vaultRoot, 'Lore/Characters/Person-Existing Name-abc.md', 'imported\n');
  await write(vaultRoot, 'Lore/Characters/Existing Name.md', 'authoritative\n');
  await write(vaultRoot, 'Lore/Characters/Person-Steinnbendir-3ae.md', 'formation\n');

  const report = await normaliseWorldAnvilFilenames({ vaultRoot, write: true });

  assert.deepEqual(report.collisions, [{
    source: 'Lore/Characters/Person-Existing Name-abc.md',
    target: 'Lore/Characters/Existing Name.md',
    reason: 'target-exists',
  }]);
  assert.equal(await fs.readFile(path.join(vaultRoot, 'Lore/Characters/Existing Name.md'), 'utf8'), 'authoritative\n');
  assert.equal(await fs.readFile(path.join(vaultRoot, 'Lore/Characters/Person-Existing Name-abc.md'), 'utf8'), 'imported\n');
  assert.equal(await fs.readFile(path.join(vaultRoot, 'Lore/Characters/Steinnbendir.md'), 'utf8'), 'formation\n');
});

test('skips existing targets that differ only by case', async (t) => {
  const vaultRoot = await fixtureVault();
  t.after(() => fs.rm(vaultRoot, { recursive: true, force: true }));

  await write(vaultRoot, 'Lore/Characters/Person-FOO-abc.md', 'imported\n');
  await write(vaultRoot, 'Lore/Characters/foo.md', 'authoritative\n');

  const report = await normaliseWorldAnvilFilenames({ vaultRoot, write: true });

  assert.deepEqual(report.collisions, [{
    source: 'Lore/Characters/Person-FOO-abc.md',
    target: 'Lore/Characters/FOO.md',
    reason: 'target-exists-case-insensitive',
  }]);
  assert.equal(await fs.readFile(path.join(vaultRoot, 'Lore/Characters/foo.md'), 'utf8'), 'authoritative\n');
  assert.equal(await fs.readFile(path.join(vaultRoot, 'Lore/Characters/Person-FOO-abc.md'), 'utf8'), 'imported\n');
  await assert.rejects(fs.access(path.join(vaultRoot, 'Lore/Characters/FOO.md')));
});
