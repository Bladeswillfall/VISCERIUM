import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCommentText } from '../src/unicode-policy.mjs';

const allowedSamples = [
  'A normal comment about VISCERIUM.',
  'Tiếng Việt có dấu vẫn phải hoạt động.',
  'العربية نص عادي للتعليقات',
  'हिन्दी में सामान्य टिप्पणी',
  '日本語の普通のコメントです。',
  'Māori, José, Łódź and naïve are ordinary text.',
  'Family emoji 👨‍👩‍👧‍👦 and flags 🇬🇧 are fine.',
];

for (const sample of allowedSamples) {
  test(`allows legitimate Unicode: ${sample.slice(0, 18)}`, () => {
    assert.equal(normalizeCommentText(sample), sample.normalize('NFC'));
  });
}

test('normalizes canonically equivalent accents to NFC', () => {
  assert.equal(normalizeCommentText('Cafe\u0301'), 'Café');
});

test('rejects excessive combining marks used for Zalgo text', () => {
  assert.throws(
    () => normalizeCommentText(`Z${'\u0301'.repeat(24)}`),
    (error) => error?.code === 'unicode_combining_stack',
  );
});

test('rejects NUL and bidi override controls', () => {
  assert.throws(() => normalizeCommentText('hello\u0000world'), (error) => error?.code === 'unicode_control');
  assert.throws(() => normalizeCommentText('hello\u202Eworld'), (error) => error?.code === 'unicode_bidi');
});

test('rejects comments made only from invisible characters', () => {
  assert.throws(() => normalizeCommentText('\u200B\u200C\u200D'), (error) => error?.code === 'unicode_no_visible_content');
});

test('rejects pathological invisible runs and grapheme complexity', () => {
  assert.throws(() => normalizeCommentText(`A${'\u200D'.repeat(9)}B`), (error) => error?.code === 'unicode_invisible_run');
  assert.throws(
    () => normalizeCommentText(`A${'\u200D🙂'.repeat(40)}`, { maxBytes: 4096 }),
    (error) => ['unicode_grapheme_complexity', 'unicode_invisible_density'].includes(error?.code),
  );
});

test('rejects extreme repetition and byte length', () => {
  assert.throws(() => normalizeCommentText('x'.repeat(257)), (error) => error?.code === 'unicode_repetition');
  assert.throws(() => normalizeCommentText('界'.repeat(800)), (error) => error?.code === 'comment_too_large');
});
