import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const errackUrl = new URL('../../Vault/Lore/Degel System/Errack.md', import.meta.url);
const titleComponentUrl = new URL('../src/components/CodexPageTitle.astro', import.meta.url);
const contentConfigUrl = new URL('../src/content.config.ts', import.meta.url);

test('Errack demonstrates rich Codex authoring without legacy World Anvil links', async () => {
  const errack = await readFile(errackUrl, 'utf8');

  assert.match(errack, /^pronunciation: \/ˈɛræk\/$/m);
  assert.match(errack, /^titleIcon: location$/m);
  assert.match(errack, /^headerImage: errack-header\.webp$/m);
  assert.match(errack, /^image: errack\.webp$/m);
  assert.match(errack, /^imageTitle: Errack$/m);
  assert.match(errack, /^artist: shinyman$/m);
  assert.doesNotMatch(errack, /^sidebarIcon:\s+/m);
  assert.doesNotMatch(errack, /^icon:\s+/m);
  assert.match(errack, /^  replaceMeta: true$/m);
  assert.doesNotMatch(errack, /!\[\[errack\.webp\]\]/);
  assert.match(errack, /!\[\[errack-rings\.webp\]\]/);
  assert.match(errack, /^## \[Icon:event\] Orbital period$/m);
  assert.match(errack, /^## \[Icon:location\] Planetary composition$/m);
  assert.match(errack, /^- \*\*Year:\*\*/m);
  assert.doesNotMatch(errack, /\/w\/viscerium\//);
});

test('Errack Planetary Rings demonstrates the responsive text-and-image authoring pattern', async () => {
  const errack = await readFile(errackUrl, 'utf8');
  const section = errack.slice(errack.indexOf('## [Icon:spark] Planetary rings'), errack.indexOf('## [Icon:location] The Shards'));

  assert.match(section, /\[cols:7-3 gap=lg align=start\]/);
  assert.equal((section.match(/\[col(?:\]|:|\s)/g) ?? []).length, 2);
  assert.equal((section.match(/\[\/col\]/g) ?? []).length, 2);
  assert.match(section, /In addition to its twin moons, Errack boasts a wide but faint ring system/);
  assert.match(section, /!\[\[errack-rings\.webp\]\]/);
  assert.match(section, /artwork by \[Fall\]\(https:\/\/github\.com\/Bladeswillfall\)/);
  assert.match(section, /\[\/cols\]/);
});

test('pronunciation metadata is accepted and rendered beside Codex titles', async () => {
  const config = await readFile(contentConfigUrl, 'utf8');
  const title = await readFile(titleComponentUrl, 'utf8');

  assert.match(config, /pronunciation: optionalString/);
  assert.match(title, /entry\.pronunciation/);
  assert.match(title, /codex-title-pronunciation/);
});

test('Errack artwork is committed to the managed Vault image store', async () => {
  for (const filename of ['errack.webp', 'errack-header.webp', 'errack-rings.webp']) {
    const asset = await readFile(new URL(`../../Vault/Assets/Images/${filename}`, import.meta.url));
    assert.ok(asset.length > 12, `${filename} should not be empty`);
    assert.equal(asset.subarray(0, 4).toString('ascii'), 'RIFF');
    assert.equal(asset.subarray(8, 12).toString('ascii'), 'WEBP');
  }
});
