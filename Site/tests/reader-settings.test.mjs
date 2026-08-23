import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('reader settings preserve Starlight theme semantics behind a three-way segmented control', () => {
  const component = read('../src/components/ReaderSettings.astro');
  const script = read('../src/scripts/reader-settings.js');

  assert.match(component, /import ThemeSelect from 'virtual:starlight\/components\/ThemeSelect'/);
  assert.match(component, /value="auto" data-reader-theme-option/);
  assert.match(component, /value="light" data-reader-theme-option/);
  assert.match(component, /value="dark" data-reader-theme-option/);
  assert.match(component, /<ThemeSelect \/>/);
  assert.match(script, /const themeStorageKey = 'starlight-theme'/);
  assert.match(script, /nativeThemeSelect\.dispatchEvent\(new Event\('change'/);
});

test('sensitive imagery is opt-in concealment and persists as a reader preference', () => {
  const component = read('../src/components/ReaderSettings.astro');
  const script = read('../src/scripts/reader-settings.js');
  const styles = read('../src/styles/reader-settings.css');
  const config = read('../astro.config.mjs');

  assert.match(component, /role="switch"/);
  assert.match(component, /data-reader-sensitive-toggle/);
  assert.match(script, /const sensitiveStorageKey = 'viscerium-conceal-sensitive-media'/);
  assert.match(script, /document\.documentElement\.toggleAttribute\('data-conceal-sensitive-media', conceal\)/);
  assert.match(config, /localStorage\.getItem\('viscerium-conceal-sensitive-media'\) === 'true'/);

  assert.doesNotMatch(styles, /^\s*img\s*\{[^}]*filter:\s*blur/m);
  assert.match(styles, /html\[data-conceal-sensitive-media\][\s\S]*filter:\s*blur\(30px\)/);
  assert.match(styles, /\[data-sensitive-media-revealed\]/);
});

test('published image sidecars are the source of truth for sensitive media', () => {
  const component = read('../src/components/ReaderSettings.astro');
  const script = read('../src/scripts/reader-settings.js');
  const schema = read('../src/content.config.ts');
  const template = read('../../Vault/Templates/Publishing/Image Metadata Template.md');

  assert.match(component, /getCollection\('docs'\)/);
  assert.match(component, /doc\.data\.type === 'image'/);
  assert.match(component, /doc\.data\.sensitiveMedia === true/);
  assert.match(component, /data-sensitive-media-manifest/);
  assert.match(script, /readSensitiveManifest/);
  assert.match(script, /document\.querySelectorAll\('img\[src\]'\)/);
  assert.match(script, /data-sensitive-media/);

  assert.match(schema, /contentWarnings:\s*contentWarningsSchema\.optional\(\)/);
  assert.match(schema, /sensitiveMedia:\s*z\.boolean\(\)\.optional\(\)/);
  assert.match(template, /sensitiveMedia:\s*false/);
  assert.match(template, /contentWarnings:\s*\[\]/);
});

test('reader settings translations remain valid JSON', () => {
  const translations = JSON.parse(read('../src/content/i18n/en-GB.json'));

  assert.equal(translations['viscerium.settings.title'], 'Reader settings');
  assert.equal(translations['viscerium.settings.concealSensitive'], 'Conceal sensitive imagery');
});
