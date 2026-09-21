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

function withoutManagedDependencyBlock(content) {
  const start = '<!-- DEPENDENCIES:DIRECT:START -->';
  const end = '<!-- DEPENDENCIES:DIRECT:END -->';
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end);

  assert.notEqual(startIndex, -1, 'THIRD_PARTY_NOTICES.md must contain the managed dependency block start marker');
  assert.notEqual(endIndex, -1, 'THIRD_PARTY_NOTICES.md must contain the managed dependency block end marker');
  assert.ok(endIndex > startIndex, 'managed dependency block markers must be in the correct order');

  return `${content.slice(0, startIndex)}${content.slice(endIndex + end.length)}`;
}

test('every direct Site dependency has human-authored third-party attribution', () => {
  const packageJson = readJson('Site/package.json');
  const notices = withoutManagedDependencyBlock(read('THIRD_PARTY_NOTICES.md'));
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
      `${dependency} must be named or covered explicitly outside the managed dependency block in THIRD_PARTY_NOTICES.md`,
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
