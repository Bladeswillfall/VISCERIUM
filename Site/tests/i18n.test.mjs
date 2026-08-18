import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LOCALE,
  formatDate,
  formatNumber,
  normaliseLocale,
  uiText,
} from '../src/lib/i18n.mjs';

test('i18n defaults to British English without enabling translated routes', () => {
  assert.equal(DEFAULT_LOCALE, 'en-GB');
  assert.equal(normaliseLocale(), 'en-GB');
  assert.equal(normaliseLocale('fr-FR'), 'en-GB');
  assert.equal(uiText('search'), 'Search');
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
