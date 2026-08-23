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

test('reader settings popover keeps the approved compact visual hierarchy', () => {
  const component = read('../src/components/ReaderSettings.astro');
  const styles = read('../src/styles/reader-settings.css');

  assert.doesNotMatch(component, /viscerium\.settings\.appearanceDescription/);
  assert.match(component, /reader-settings-section-icon/);
  assert.match(component, /Blurs marked artwork until you reveal it\./);
  assert.match(component, /This setting only changes how marked images are shown\./);
  assert.match(styles, /\.reader-theme-options::before/);
  assert.match(styles, /transform 180ms cubic-bezier\(\.2, \.8, \.2, 1\)/);
  assert.match(styles, /border-radius: 999px/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
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
  assert.match(component, /doc\.data\.type !== 'image'/);
  assert.match(component, /doc\.data\.sensitiveMedia === true/);
  assert.match(component, /<template data-sensitive-media-manifest>/);
  assert.match(script, /readSensitiveManifest/);
  assert.match(script, /HTMLTemplateElement/);
  assert.match(script, /document\.querySelectorAll\('img\[src\]'\)/);
  assert.match(script, /data-sensitive-media/);

  assert.match(schema, /contentWarnings:\s*contentWarningsSchema\.optional\(\)/);
  assert.match(schema, /sensitiveMedia:\s*z\.boolean\(\)\.optional\(\)/);
  assert.match(template, /sensitiveMedia:\s*false/);
  assert.match(template, /contentWarnings:\s*\[\]/);
});

test('content notes stay compact and include image-sidecar warnings before JavaScript runs', () => {
  const readingTime = read('../src/components/ArticleReadingTime.astro');
  const notes = read('../src/components/ContentNotes.astro');
  const script = read('../src/scripts/reader-settings.js');

  assert.match(readingTime, /import ContentNotes from '\.\/ContentNotes\.astro'/);
  assert.match(readingTime, /<ContentNotes \/>/);
  assert.match(notes, /getCollection\('docs'\)/);
  assert.match(notes, /sourceEntry\?\.body/);
  assert.match(notes, /doc\.data\.type !== 'image'/);
  assert.match(notes, /referenceCorpus\.includes\(filename\)/);
  assert.match(notes, /data-authored-warnings=\{warnings\.join\(','\)\}/);
  assert.match(notes, /data-content-notes-list/);
  assert.match(notes, /Content notes/);
  assert.match(script, /data-image-content-warnings/);
  assert.match(script, /syncContentNotes/);
});

test('Escape closes reader settings even after focus leaves the settings element', () => {
  const script = read('../src/scripts/reader-settings.js');

  assert.match(script, /document\.addEventListener\('keydown'/);
  assert.match(script, /event\.key === 'Escape' && !panel\.hidden/);
  assert.doesNotMatch(script, /this\.addEventListener\('keydown'/);
});

test('reader settings translations remain valid JSON', () => {
  const translations = JSON.parse(read('../src/content/i18n/en-GB.json'));

  assert.equal(translations['viscerium.settings.title'], 'Reader settings');
  assert.equal(translations['viscerium.settings.concealSensitive'], 'Conceal sensitive imagery');
});
