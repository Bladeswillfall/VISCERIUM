import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { DEFAULT_LOCALE } from '../site.config.mjs';

const dist = new URL('../dist/', import.meta.url);

test('built pages expose the configured language and translated shared UI', async () => {
  const article = await fs.readFile(new URL('eras/citadel/events/the-breaking-of-lorndale/index.html', dist), 'utf8');

  assert.match(article, new RegExp(`<html lang="${DEFAULT_LOCALE}" dir="ltr"`));
  assert.match(article, new RegExp(`<main[^>]+lang="${DEFAULT_LOCALE}" dir="ltr"`));
  assert.match(article, new RegExp(`<meta property="og:locale" content="${DEFAULT_LOCALE}"`));
  assert.match(article, /aria-label="Reading time: 1 minute">1 min read</);
  assert.match(article, /aria-label="Breadcrumbs"/);
  assert.match(article, /aria-label="Codex destinations"/);
  assert.doesNotMatch(article, /(?:>|=")viscerium\.[a-z]/);
});

test('built client islands receive locale and translated message payloads', async () => {
  const timeline = await fs.readFile(new URL('timelines/super/index.html', dist), 'utf8');
  const optionsMatch = timeline.match(/<script type="application\/json" data-vc-timeline-options>(.*?)<\/script>/);
  assert.ok(optionsMatch);
  const options = JSON.parse(optionsMatch[1]);

  assert.equal(options.locale, DEFAULT_LOCALE);
  assert.equal(options.direction, 'ltr');
  assert.equal(options.messages.searchEvents, 'Search events');
  assert.equal(options.messages['records.other'], '{count} records');

  const map = await fs.readFile(new URL('maps/errack-citadel/index.html', dist), 'utf8');
  assert.match(map, /"_locale":"en-GB"/);
  assert.match(map, /"noMatches":"No matching markers\."/);
});

test('feeds expose the configured language', async () => {
  const [rss, atom] = await Promise.all([
    fs.readFile(new URL('rss.xml', dist), 'utf8'),
    fs.readFile(new URL('atom.xml', dist), 'utf8'),
  ]);

  assert.match(rss, new RegExp(`<language>${DEFAULT_LOCALE}</language>`));
  assert.match(atom, new RegExp(`<feed[^>]+xml:lang="${DEFAULT_LOCALE}"`));
});
