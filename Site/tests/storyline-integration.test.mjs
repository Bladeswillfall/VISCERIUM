import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseStoryLineDate } from '../src/lib/timeline/storyline-adapter.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');

function read(rel) {
  return fs.readFileSync(path.join(repo, rel), 'utf8');
}

test('StoryLine is rooted in the private Stories workspace', () => {
  const config = JSON.parse(read('Vault/.obsidian/plugins/storyline/data.json'));
  assert.equal(config.storyLineRoot, 'Stories');

  const plugins = JSON.parse(read('Vault/.obsidian/community-plugins.json'));
  assert.ok(plugins.includes('storyline'));
});

test('VISCERIUM Timelines is installed and enabled beside StoryLine', () => {
  const plugins = JSON.parse(read('Vault/.obsidian/community-plugins.json'));
  assert.ok(plugins.includes('viscerium-timelines'));

  const sourceManifest = JSON.parse(read('Tools/obsidian-viscerium-timelines/manifest.json'));
  const installedManifest = JSON.parse(read('Vault/.obsidian/plugins/viscerium-timelines/manifest.json'));
  assert.equal(installedManifest.id, 'viscerium-timelines');
  assert.equal(installedManifest.version, sourceManifest.version);
});

test('Codex source remains hard-gated to Lore', () => {
  const siteConfig = read('Site/site.config.mjs');
  assert.match(siteConfig, /loreSourceDir:\s*env\.LORE_SOURCE_DIR\s*\?\?\s*'\.\.\/Vault\/Lore'/);

  const plugin = read('Tools/obsidian-viscerium-timelines/main.ts');
  assert.match(plugin, /if \(!file\.path\.startsWith\('Lore\/'\)\) continue;/);
  assert.doesNotMatch(plugin, /compileVault[\s\S]*file\.path\.startsWith\('Stories\/'\)/);
});

test('StoryLine timeline uses an in-memory adapter instead of duplicate source fields', () => {
  const plugin = read('Tools/obsidian-viscerium-timelines/main.ts');
  const adapter = read('Site/src/lib/timeline/storyline-adapter.mjs');

  assert.match(plugin, /open-storyline-project-timeline/);
  assert.match(plugin, /buildStoryLineTimelineDataset/);
  assert.match(adapter, /parseStoryLineDate\(scene\.storyDate\)/);
  assert.doesNotMatch(adapter, /scene\.calendarDate/);
});

test('real StoryLine test scene is placeable on the VISCERIUM calendar', () => {
  const scene = read('Vault/Stories/My Trilogy/My Novel/Scenes/Act 1/01-01 Test scene.md');
  const storyDate = scene.match(/^storyDate:\s*["']?(.+?)["']?\s*$/m)?.[1];

  assert.ok(storyDate, 'test scene should contain storyDate');
  assert.doesNotMatch(scene, /^calendarDate:/m);

  const parsed = parseStoryLineDate(storyDate);
  assert.ok(parsed, `storyDate should parse: ${storyDate}`);
  assert.equal(parsed.year, 9250);
  assert.equal(parsed.day, 16);
  assert.equal(parsed.precision, 'day');
  assert.equal(parsed.certainty, 'exact');
});

test('StoryLine bridge resolves the active project outside Markdown views', () => {
  const plugin = read('Tools/obsidian-viscerium-timelines/main.ts');
  assert.match(plugin, /settings\.runtime\.activeProjectFile/);
  assert.match(plugin, /settings\.disk\.activeProjectFile/);
  assert.match(plugin, /source:\s*'storyline-runtime'/);
  assert.match(plugin, /source:\s*'storyline-config'/);
  assert.match(plugin, /source:\s*'single-project'/);
});

test('StoryLine bridge exposes a self-diagnostic command', () => {
  const plugin = read('Tools/obsidian-viscerium-timelines/main.ts');
  assert.match(plugin, /diagnose-storyline-integration/);
  assert.match(plugin, /StoryLine loaded:/);
  assert.match(plugin, /VISCERIUM-placeable scenes:/);
});
