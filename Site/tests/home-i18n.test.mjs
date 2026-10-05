import test from 'node:test';
import assert from 'node:assert/strict';
import { HOME_LANGUAGES, HOME_TRANSLATIONS, getHomeTranslation, homepageHref } from '../src/lib/home-i18n.mjs';
import { I18N_ROADMAP } from '../src/lib/i18n-roadmap.mjs';

function stringPaths(value, prefix = '') {
  if (typeof value === 'string') return [[prefix, value]];
  if (Array.isArray(value)) return value.flatMap((item, index) => stringPaths(item, `${prefix}[${index}]`));
  return Object.entries(value).flatMap(([key, item]) => stringPaths(item, prefix ? `${prefix}.${key}` : key));
}

test('homepage translation test-bed covers every language listed in the roadmap', () => {
  const roadmapLocales = [
    ...I18N_ROADMAP.published,
    ...I18N_ROADMAP.placeholders,
    ...I18N_ROADMAP.nextPriorities,
  ].map(({ locale }) => locale);

  assert.deepEqual(HOME_LANGUAGES.map(({ locale }) => locale), roadmapLocales);
  assert.deepEqual(HOME_LANGUAGES.map(({ route }) => route), ['', 'fr', 'de', 'es', 'zh', 'ru', 'ja']);
  assert.deepEqual(HOME_LANGUAGES.map(({ route }) => homepageHref(route)), ['/', '/fr/', '/de/', '/es/', '/zh/', '/ru/', '/ja/']);
});

test('each homepage translation matches the English copy shape and contains no empty strings', () => {
  const englishPaths = stringPaths(HOME_TRANSLATIONS['en-GB']).map(([path]) => path);

  for (const { locale } of HOME_LANGUAGES) {
    const entries = stringPaths(getHomeTranslation(locale));
    assert.deepEqual(entries.map(([path]) => path), englishPaths, `${locale} copy shape differs from en-GB`);
    assert.ok(entries.every(([, value]) => value.trim()), `${locale} contains an empty translation`);
  }
});
