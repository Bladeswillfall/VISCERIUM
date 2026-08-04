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

test('every direct Site dependency is represented in third-party notices', () => {
  const packageJson = readJson('Site/package.json');
  const notices = read('THIRD_PARTY_NOTICES.md');
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  const aliases = new Map([
    ['@playwright/test', 'Playwright'],
  ]);

  for (const dependency of Object.keys(dependencies)) {
    if (dependency.startsWith('@astrojs/')) {
      assert.match(notices, /official `@astrojs\/\*` integrations/);
      continue;
    }

    const expected = aliases.get(dependency) ?? dependency;
    assert.ok(
      notices.includes(expected),
      `${dependency} must be named or covered explicitly in THIRD_PARTY_NOTICES.md`,
    );
  }
});

test('every enabled Obsidian community plugin is represented in third-party notices', () => {
  const profile = readJson('Vault/System/Obsidian Plugin Profile.json');
  const notices = read('THIRD_PARTY_NOTICES.md');

  for (const plugin of profile.plugins) {
    if (plugin.source === 'first-party') continue;
    assert.ok(
      notices.includes(plugin.name),
      `${plugin.name} must be represented in THIRD_PARTY_NOTICES.md`,
    );
  }
});

test('the vendored MySnippets exception carries MPL source and modification notices', () => {
  const runtime = read('Vault/.obsidian/plugins/mysnippets-plugin/main.js');
  const notice = read('LICENSES/MySnippets-NOTICE.md');
  const licence = read('LICENSES/MPL-2.0.txt');
  const thirdParty = read('THIRD_PARTY_NOTICES.md');

  assert.match(runtime, /Mozilla Public License, v\. 2\.0/);
  assert.match(runtime, /Additional compatibility work in this repository/);
  assert.match(notice, /Recorded VISCERIUM modifications/);
  assert.match(notice, /Source Code Form/);
  assert.match(licence, /^Mozilla Public License Version 2\.0/m);
  assert.match(licence, /Exhibit A - Source Code Form License Notice/);
  assert.match(thirdParty, /LICENSES\/MPL-2\.0\.txt/);
  assert.match(thirdParty, /LICENSES\/MySnippets-NOTICE\.md/);
});
