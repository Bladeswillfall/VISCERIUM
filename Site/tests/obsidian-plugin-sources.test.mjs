import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourcePaths = {
  'viscerium-timelines': 'Tools/obsidian-viscerium-timelines',
  'viscerium-creator-tools': 'Tools/obsidian-viscerium-creator-tools',
  'viscerium-layout-tools': 'Tools/obsidian-viscerium-layout-tools',
  'viscerium-image-tools': 'Tools/obsidian-viscerium-image-tools',
  'viscerium-journal-tools': 'Tools/obsidian-viscerium-journal-tools',
};

const plainPluginIds = Object.keys(sourcePaths).filter((id) => id !== 'viscerium-timelines');

test('plain first-party Obsidian source matches the checked-in Vault runtime', () => {
  const result = spawnSync(
    process.execPath,
    [path.join(repoRoot, 'Tools/scripts/sync-obsidian-plugins.mjs'), '--check'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('plain first-party Obsidian JavaScript parses from the maintained Tools source', async () => {
  for (const id of plainPluginIds) {
    const source = await readFile(path.join(repoRoot, sourcePaths[id], 'src/main.js'), 'utf8');
    assert.doesNotThrow(() => new Function(source), `${id} source should parse`);
  }
});

test('plugin profile records maintained source and Vault runtime paths', async () => {
  const profile = JSON.parse(await readFile(path.join(repoRoot, 'Vault/System/Obsidian Plugin Profile.json'), 'utf8'));

  for (const [id, sourcePath] of Object.entries(sourcePaths)) {
    const plugin = profile.plugins.find((candidate) => candidate.id === id);
    assert.equal(plugin?.source, 'first-party', `${id} should be first-party`);
    assert.equal(plugin?.sourcePath, sourcePath, `${id} should identify its maintained source`);
    assert.equal(plugin?.runtimePath, `Vault/.obsidian/plugins/${id}`, `${id} should identify its checked-in runtime`);
  }
});
