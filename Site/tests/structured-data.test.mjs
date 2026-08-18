import test from 'node:test';
import assert from 'node:assert/strict';
import { buildArticleStructuredData, canonicalUrlForPath } from '../src/lib/structured-data.mjs';

test('canonical URL construction uses the configured site origin', () => {
  assert.equal(
    canonicalUrlForPath('/lore/okse-dominion/', 'https://www.viscerium.co.uk'),
    'https://www.viscerium.co.uk/lore/okse-dominion/',
  );
});

test('article JSON-LD uses the canonical URL as both URL and main entity', () => {
  const canonicalUrl = 'https://www.viscerium.co.uk/lore/okse-dominion/';
  const data = buildArticleStructuredData({
    title: 'Okse Dominion',
    description: 'A VISCERIUM faction.',
    canonicalUrl,
    publishedIso: '2026-08-01',
    updatedIso: '2026-08-18',
    keywords: ['CITADEL', 'faction'],
  });

  assert.equal(data['@context'], 'https://schema.org');
  assert.equal(data['@type'], 'Article');
  assert.equal(data.url, canonicalUrl);
  assert.equal(data.mainEntityOfPage, canonicalUrl);
  assert.equal(data.datePublished, '2026-08-01');
  assert.equal(data.dateModified, '2026-08-18');
  assert.deepEqual(data.keywords, ['CITADEL', 'faction']);
});

test('structured data does not invent optional fields', () => {
  const data = buildArticleStructuredData({ title: 'Untitled lore', canonicalUrl: 'https://example.test/lore/' });

  assert.equal('description' in data, false);
  assert.equal('datePublished' in data, false);
  assert.equal('dateModified' in data, false);
  assert.equal('image' in data, false);
  assert.equal('keywords' in data, false);
});
