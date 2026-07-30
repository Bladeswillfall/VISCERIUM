import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const runtimeUrl = new URL(
  '../../Vault/.obsidian/plugins/mysnippets-plugin/main.js',
  import.meta.url,
);
const manifestUrl = new URL(
  '../../Vault/.obsidian/plugins/mysnippets-plugin/manifest.json',
  import.meta.url,
);

test('vendored MySnippets runtime is valid JavaScript', async () => {
  const source = await readFile(runtimeUrl, 'utf8');
  assert.doesNotThrow(() => new vm.Script(source, { filename: 'mysnippets-plugin/main.js' }));
});

test('MySnippets runtime keeps modern and legacy CSS toggle paths', async () => {
  const source = await readFile(runtimeUrl, 'utf8');
  assert.match(source, /setSnippetEnabled/);
  assert.match(source, /setCssEnabledStatus/);
  assert.match(source, /enabledSnippets\.has/);
});

test('MySnippets manifest uses the compatibility baseline', async () => {
  const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
  assert.equal(manifest.id, 'mysnippets-plugin');
  assert.equal(manifest.version, '1.2.4');
  assert.equal(manifest.minAppVersion, '1.11.0');
});
