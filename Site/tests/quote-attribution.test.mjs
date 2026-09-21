import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { transformQuoteAttributions } from '../scripts/sync-public-notes.mjs';

test('quote author lines become semantic cite elements at any quote depth', () => {
  const input = [
    '> The body of the quote.',
    '>',
    '> — Tpr. Bailey Pittman',
    '',
    '> [!vc-indent]',
    '> marker',
    '>',
    '> > A nested quote.',
    '> >',
    '> > — Someone Else',
  ].join('\n');

  const output = transformQuoteAttributions(input);

  assert.match(output, /> <cite class="vc-quote-attribution">Tpr\. Bailey Pittman<\/cite>/);
  assert.match(output, /> > <cite class="vc-quote-attribution">Someone Else<\/cite>/);
  assert.doesNotMatch(output, /> — Tpr\. Bailey Pittman/);
});

test('quote attribution transform ignores fenced code', () => {
  const input = [
    '> ```text',
    '> — not an attribution',
    '> ```',
    '> — Actual Author',
  ].join('\n');

  const output = transformQuoteAttributions(input);

  assert.match(output, /> — not an attribution/);
  assert.match(output, /> <cite class="vc-quote-attribution">Actual Author<\/cite>/);
});

test('public typography loads and applies Nothing You Could Do to quote attributions', async () => {
  const [astro, css] = await Promise.all([
    fs.readFile(new URL('../astro.config.mjs', import.meta.url), 'utf8'),
    fs.readFile(new URL('../src/styles/typography.css', import.meta.url), 'utf8'),
  ]);

  assert.match(astro, /family=Nothing\+You\+Could\+Do/);
  assert.match(css, /--vc-font-signature:\s*'Nothing You Could Do'/);
  assert.match(css, /\.vc-quote-attribution[\s\S]*?font-family:\s*var\(--vc-font-signature\)/);
  assert.match(css, /\.vc-quote-attribution[\s\S]*?text-align:\s*end/);
});
