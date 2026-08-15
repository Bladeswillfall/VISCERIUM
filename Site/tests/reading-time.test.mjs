import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countReadableWords,
  estimateReadingTime,
  isReadingTimeArticle,
  readableMarkdownText,
} from '../src/lib/reading-time.mjs';

test('reading time is limited to standard reader-facing articles', () => {
  assert.equal(isReadingTimeArticle({ type: 'faction', slug: 'eras/citadel/factions/okse' }), true);
  assert.equal(isReadingTimeArticle({ type: 'character', slug: 'characters/frode' }), true);
  assert.equal(isReadingTimeArticle({ type: 'article', slug: 'professions/bal-seidr' }), true);

  assert.equal(isReadingTimeArticle({ type: 'category', slug: 'eras/citadel/factions' }), false);
  assert.equal(isReadingTimeArticle({ type: 'calendar', slug: 'calendar' }), false);
  assert.equal(isReadingTimeArticle({ type: 'timeline', slug: 'eras/citadel/timeline' }), false);
  assert.equal(isReadingTimeArticle({ type: 'article', slug: 'start-here' }), false);
  assert.equal(isReadingTimeArticle({ type: 'article', slug: 'explore', explorationPage: true }), false);
  assert.equal(isReadingTimeArticle({ type: 'image', slug: 'images/example' }), false);
  assert.equal(isReadingTimeArticle({ type: 'map', slug: 'maps/example' }), false);
});

test('reading-time text keeps visible prose while removing non-reading syntax', () => {
  const markdown = `
# The Hollowed

A visible paragraph with a [reader-facing link](https://example.com) and [[Lore/Errack|Errack]].

![Decorative image](image.webp)

%% creator-only instruction words should not count %%

\`inline code words should vanish\`

\`\`\`js
const hidden = 'code block words should vanish';
\`\`\`

<!-- viscerium:storyteller:start -->
## Storyteller View
These storyteller-only words should not affect the default lore estimate.
<!-- viscerium:storyteller:end -->
`;

  const readable = readableMarkdownText(markdown);
  assert.match(readable, /The Hollowed/);
  assert.match(readable, /reader-facing link/);
  assert.match(readable, /Errack/);
  assert.doesNotMatch(readable, /creator-only/);
  assert.doesNotMatch(readable, /inline code/);
  assert.doesNotMatch(readable, /code block/);
  assert.doesNotMatch(readable, /storyteller-only/);
  assert.doesNotMatch(readable, /Decorative image/);
});

test('reading time uses 225 WPM, rounds up, and never displays zero minutes', () => {
  assert.deepEqual(estimateReadingTime(''), {
    words: 0,
    wordsPerMinute: 225,
    minutes: 1,
  });

  const twoHundredTwentySixWords = Array.from({ length: 226 }, (_, index) => `word${index}`).join(' ');
  assert.equal(countReadableWords(twoHundredTwentySixWords), 226);
  assert.equal(estimateReadingTime(twoHundredTwentySixWords).minutes, 2);
});
