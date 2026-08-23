import test from 'node:test';
import assert from 'node:assert/strict';
import { toGiscusLanguage } from '../src/lib/giscus-locale.mjs';

test('Giscus receives its supported generic English locale from British English pages', () => {
  assert.equal(toGiscusLanguage('en-GB'), 'en');
  assert.equal(toGiscusLanguage('en-US'), 'en');
});

test('Giscus locale normalization preserves supported locale routes', () => {
  assert.equal(toGiscusLanguage('fr'), 'fr');
  assert.equal(toGiscusLanguage('zh-TW'), 'zh-TW');
});

test('Giscus locale normalization treats BCP-47 casing as case-insensitive', () => {
  assert.equal(toGiscusLanguage('zh-tw'), 'zh-TW');
  assert.equal(toGiscusLanguage('FR-CA'), 'fr');
});

test('Giscus locale normalization falls back safely for unsupported or missing locales', () => {
  assert.equal(toGiscusLanguage('xx-YY'), 'en');
  assert.equal(toGiscusLanguage('not_a_locale'), 'en');
  assert.equal(toGiscusLanguage(''), 'en');
});
