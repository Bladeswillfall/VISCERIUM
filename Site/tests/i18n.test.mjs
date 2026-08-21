import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import i18next from 'i18next';
import siteConfig, { DEFAULT_LOCALE } from '../site.config.mjs';
import defaultTranslations from '../src/content/i18n/en-GB.json' with { type: 'json' };
import { formatDate, formatList, formatNumber } from '../src/lib/i18n.mjs';
import { timelineMessage, timelinePlural } from '../src/lib/timeline/i18n.mjs';

const astroConfigUrl = new URL('../astro.config.mjs', import.meta.url);
const sourceRoot = new URL('../src/', import.meta.url);

async function sourceFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const url = new URL(entry.name, directory.href.endsWith('/') ? directory : new URL(`${directory.href}/`));
    return entry.isDirectory() ? sourceFiles(url) : [url];
  }));
  return files.flat();
}

test('i18n defaults to British English without enabling translated routes', async () => {
  assert.equal(DEFAULT_LOCALE, 'en-GB');
  assert.equal(siteConfig.i18n.defaultLocale, DEFAULT_LOCALE);

  const config = await fs.readFile(astroConfigUrl, 'utf8');
  assert.match(
    config,
    /locales:\s*{\s*root:\s*{\s*label:\s*['"]English['"],\s*lang:\s*siteConfig\.i18n\.defaultLocale/s,
  );
  assert.doesNotMatch(config, /locales:\s*{\s*(?!root:)[a-z]{2}/i);
});

test('the default Starlight catalog contains non-empty VISCERIUM UI strings', () => {
  const customEntries = Object.entries(defaultTranslations)
    .filter(([key]) => key.startsWith('viscerium.'));

  assert.ok(customEntries.length > 100);
  assert.ok(customEntries.every(([, value]) => typeof value === 'string' && value.trim()));
  for (const key of [
    'viscerium.article.readingTime_one',
    'viscerium.footer.destinationsLabel',
    'viscerium.timeline.controls',
    'viscerium.map.controls',
    'viscerium.relationship.controls',
    'viscerium.webmentions.responses.other',
  ]) assert.ok(defaultTranslations[key], `missing ${key}`);
});

test('the native i18next layer falls back to the default catalog', async () => {
  const i18n = i18next.createInstance();
  await i18n.init({
    lng: 'fr-FR',
    fallbackLng: DEFAULT_LOCALE,
    resources: {
      [DEFAULT_LOCALE]: { translation: defaultTranslations },
      'fr-FR': { translation: { 'viscerium.common.search': 'Rechercher' } },
    },
  });

  assert.equal(i18n.t('viscerium.common.search'), 'Rechercher');
  assert.equal(i18n.t('viscerium.timeline.controls'), 'VISCERIUM timeline controls');
});

test('locale helpers delegate dates, numbers, and lists to Intl', () => {
  assert.equal(formatNumber(1234.5), new Intl.NumberFormat('en-GB').format(1234.5));
  assert.equal(
    formatDate(new Date('2026-08-18T12:00:00Z'), 'en-GB', { year: 'numeric', month: 'long', timeZone: 'UTC' }),
    'August 2026',
  );
  assert.equal(formatList(['A', 'B', 'C']), new Intl.ListFormat('en-GB').format(['A', 'B', 'C']));
  assert.equal(formatNumber(1234.5, 'de-DE'), '1.234,5');
});

test('date-only authored values do not shift across host time zones', () => {
  const previousTimeZone = process.env.TZ;

  try {
    process.env.TZ = 'America/Los_Angeles';
    assert.equal(formatDate('2026-08-18', 'en-GB', { dateStyle: 'long' }), '18 August 2026');
  } finally {
    if (previousTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimeZone;
  }
});

test('client timeline messages interpolate, pluralise, and fail loudly', () => {
  const messages = {
    greeting: 'Hello {name}',
    'records.one': '{count} record',
    'records.other': '{count} records',
  };

  assert.equal(timelineMessage(messages, 'greeting', { name: 'Errack' }), 'Hello Errack');
  assert.equal(timelinePlural(messages, 'records', 2, 'en-GB'), '2 records');
  assert.throws(() => timelineMessage(messages, 'missing'), /Missing timeline UI message/);
});

test('production source has no parallel dictionary or fixed browser locale', async () => {
  const files = (await sourceFiles(sourceRoot)).filter((url) => /\.(astro|css|[cm]?[jt]s)$/.test(url.pathname));
  const source = (await Promise.all(files.map((url) => fs.readFile(url, 'utf8')))).join('\n');

  assert.doesNotMatch(source, /\b(?:normaliseLocale|uiText)\b/);
  assert.doesNotMatch(source, /selectedLocale:\s*['"]en(?:-GB)?['"]/);
  assert.doesNotMatch(source, /new Intl\.(?:NumberFormat|DateTimeFormat)\(\s*['"]en-GB['"]/);
  assert.doesNotMatch(source, /\.toLocaleDateString\(\s*\)/);
  assert.doesNotMatch(source, /content:\s*['"](?:Reference|Inspector|Notes)['"]/);
  assert.doesNotMatch(source, /button\.setAttribute\('aria-label', collapsed \? 'Show sidebar'/);
  assert.doesNotMatch(source, /`Exit \$\{active\} · All eras`/);
});
