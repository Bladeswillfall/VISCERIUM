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

function trackedFilesFromIndex() {
  const index = fs.readFileSync(path.join(repo, '.git/index'));
  assert.equal(index.subarray(0, 4).toString(), 'DIRC', 'Git index signature must be readable');
  const version = index.readUInt32BE(4);
  assert.ok(version === 2 || version === 3, `Unsupported Git index version ${version}`);

  const files = [];
  let offset = 12;
  for (let entry = 0; entry < index.readUInt32BE(8); entry += 1) {
    const start = offset;
    const flags = index.readUInt16BE(start + 60);
    const nameStart = start + 62 + (version === 3 && (flags & 0x4000) ? 2 : 0);
    const nameEnd = index.indexOf(0, nameStart);
    files.push(index.subarray(nameStart, nameEnd).toString());
    offset = start + Math.ceil((nameEnd + 1 - start) / 8) * 8;
  }
  return files;
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

test('shared plugin settings exist and exclude device-local StoryLine state', () => {
  const profile = readJson('Vault/System/Obsidian Plugin Profile.json');

  for (const plugin of profile.plugins) {
    if (!plugin.sharedSettings) continue;
    assert.ok(
      fs.existsSync(path.join(repo, plugin.sharedSettings)),
      `${plugin.id} shared settings must exist at ${plugin.sharedSettings}`,
    );
  }

  const storyline = profile.plugins.find((plugin) => plugin.id === 'storyline');
  assert.equal(storyline.sharedSettings, null, 'StoryLine settings must remain device-local');

  const chronos = readJson('Vault/.obsidian/plugins/chronos/data.json');
  assert.equal(chronos.useAI, false, 'Chronos AI must remain disabled in the shared profile');
});

test('ordinary third-party plugins track only approved shared settings', () => {
  const profile = readJson('Vault/System/Obsidian Plugin Profile.json');
  const trackedFiles = trackedFilesFromIndex();

  for (const plugin of profile.plugins) {
    if (plugin.source !== 'obsidian-community') continue;

    const pluginDir = `Vault/.obsidian/plugins/${plugin.id}`;
    const tracked = trackedFiles.filter((file) => file.startsWith(`${pluginDir}/`));
    const expected = plugin.sharedSettings ? [plugin.sharedSettings] : [];
    assert.deepEqual(
      tracked,
      expected,
      `${plugin.id} must not vendor third-party runtime or manifest files`,
    );
  }
});

test('gitignore protects plugin payload boundaries', () => {
  const gitignore = read('.gitignore');

  assert.match(gitignore, /Vault\/\.obsidian\/plugins\/\*\/\*/);
  assert.match(gitignore, /!Vault\/\.obsidian\/plugins\/templater-obsidian\/data\.json/);
  assert.doesNotMatch(gitignore, /!Vault\/\.obsidian\/plugins\/storyline\/data\.json/);
  assert.match(gitignore, /!Vault\/\.obsidian\/plugins\/mysnippets-plugin\/\*\*/);
  assert.match(gitignore, /!Vault\/\.obsidian\/plugins\/viscerium-timelines\/\*\*/);
});
