import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import siteConfig from '../site.config.mjs';
import {
  DEFAULT_LOCALE,
  formatDate,
  formatNumber,
  normaliseLocale,
  uiText,
} from '../src/lib/i18n.mjs';

const astroConfigUrl = new URL('../astro.config.mjs', import.meta.url);

test('i18n defaults to British English without enabling translated routes', () => {
  assert.equal(DEFAULT_LOCALE, 'en-GB');
  assert.equal(siteConfig.i18n.defaultLocale, DEFAULT_LOCALE);
  assert.equal(normaliseLocale(), 'en-GB');
  assert.equal(normaliseLocale('fr-FR'), 'en-GB');
  assert.equal(uiText('search'), 'Search');
});

test('Starlight uses the default locale as an unprefixed root locale', async () => {
  const config = await fs.readFile(astroConfigUrl, 'utf8');

  assert.match(
    config,
    /locales:\s*{\s*root:\s*{\s*label:\s*['"]English['"],\s*lang:\s*siteConfig\.i18n\.defaultLocale/s,
  );
});

test('unknown UI keys fail loudly instead of leaking undefined copy', () => {
  assert.throws(() => uiText('not-a-real-key'), /Unknown VISCERIUM UI string/);
});

test('locale helpers delegate dates and numbers to Intl', () => {
  assert.equal(formatNumber(1234.5), new Intl.NumberFormat('en-GB').format(1234.5));
  assert.equal(
    formatDate(new Date('2026-08-18T12:00:00Z'), 'en-GB', { year: 'numeric', month: 'long', timeZone: 'UTC' }),
    'August 2026',
  );
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
