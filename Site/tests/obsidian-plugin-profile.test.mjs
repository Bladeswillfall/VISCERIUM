import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repo, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

test('Obsidian plugin profile matches the enabled plugin list', () => {
  const enabled = readJson('Vault/.obsidian/community-plugins.json');
  const profile = readJson('Vault/System/Obsidian Plugin Profile.json');
  const profiledIds = profile.plugins.map((plugin) => plugin.id);

  assert.equal(profile.schemaVersion, 1);
  assert.equal(new Set(enabled).size, enabled.length, 'enabled plugin IDs must be unique');
  assert.equal(new Set(profiledIds).size, profiledIds.length, 'profile plugin IDs must be unique');
  assert.deepEqual(profiledIds, enabled, 'profile order and IDs must match community-plugins.json');
});

test('shared plugin settings exist and do not contain known device-local state', () => {
  const profile = readJson('Vault/System/Obsidian Plugin Profile.json');

  for (const plugin of profile.plugins) {
    if (!plugin.sharedSettings) continue;
    assert.ok(
      fs.existsSync(path.join(repo, plugin.sharedSettings)),
      `${plugin.id} shared settings must exist at ${plugin.sharedSettings}`,
    );
  }

  const storyline = readJson('Vault/.obsidian/plugins/storyline/data.json');
  assert.equal(storyline.activeProjectFile, '', 'StoryLine active project must remain device-local');

  const chronos = readJson('Vault/.obsidian/plugins/chronos/data.json');
  assert.equal(chronos.useAI, false, 'Chronos AI must remain disabled in the shared profile');
});

test('ordinary third-party plugin directories contain only approved shared settings', () => {
  const profile = readJson('Vault/System/Obsidian Plugin Profile.json');

  for (const plugin of profile.plugins) {
    if (plugin.source !== 'obsidian-community') continue;

    const pluginDir = path.join(repo, 'Vault/.obsidian/plugins', plugin.id);
    if (!fs.existsSync(pluginDir)) {
      assert.equal(plugin.sharedSettings, null, `${plugin.id} is absent but declares shared settings`);
      continue;
    }

    const entries = fs.readdirSync(pluginDir).sort();
    const expected = plugin.sharedSettings ? ['data.json'] : [];
    assert.deepEqual(
      entries,
      expected,
      `${plugin.id} must not vendor third-party runtime or manifest files`,
    );
  }
});

test('gitignore protects plugin payload boundaries', () => {
  const gitignore = read('.gitignore');

  assert.match(gitignore, /Vault\/\.obsidian\/plugins\/\*\/\*/);
  assert.match(gitignore, /!Vault\/\.obsidian\/plugins\/templater-obsidian\/data\.json/);
  assert.match(gitignore, /!Vault\/\.obsidian\/plugins\/mysnippets-plugin\/\*\*/);
  assert.match(gitignore, /!Vault\/\.obsidian\/plugins\/viscerium-timelines\/\*\*/);
});
