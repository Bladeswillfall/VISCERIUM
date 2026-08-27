import { Buffer } from 'node:buffer';
import { unprocessable } from './errors.mjs';

const forbiddenControls = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u;
const bidiFormatting = /[\u202a-\u202e\u2066-\u2069]/u;
const mark = /\p{M}/u;
const whitespace = /\s/u;
const graphemeSegmenter = new Intl.Segmenter('und', { granularity: 'grapheme' });

function isNonCharacter(codePoint) {
  return (codePoint >= 0xfdd0 && codePoint <= 0xfdef) || (codePoint & 0xffff) === 0xfffe || (codePoint & 0xffff) === 0xffff;
}

function isInvisibleCodePoint(codePoint) {
  return (
    codePoint === 0x200b ||
    codePoint === 0x200c ||
    codePoint === 0x200d ||
    codePoint === 0x200e ||
    codePoint === 0x200f ||
    codePoint === 0x2060 ||
    codePoint === 0xfeff ||
    (codePoint >= 0xfe00 && codePoint <= 0xfe0f) ||
    (codePoint >= 0xe0100 && codePoint <= 0xe01ef) ||
    (codePoint >= 0xe0000 && codePoint <= 0xe007f)
  );
}

function fail(code, message = 'Comment contains unsupported or disruptive Unicode formatting.') {
  throw unprocessable(code, message);
}

// eslint-disable-next-line complexity
export function normalizeCommentText(input, { maxBytes = 2048 } = {}) {
  if (typeof input !== 'string') fail('comment_text_type', 'Comment text must be a string.');

  const text = input.normalize('NFC');
  const bytes = Buffer.byteLength(text, 'utf8');
  if (bytes === 0) fail('comment_empty', 'Comment cannot be empty.');
  if (bytes > maxBytes) fail('comment_too_large', `Comment must be ${maxBytes} bytes or fewer.`);
  if (forbiddenControls.test(text)) fail('unicode_control');
  if (bidiFormatting.test(text)) fail('unicode_bidi');

  let combiningStack = 0;
  let invisibleRun = 0;
  let invisibleTotal = 0;
  let visibleTotal = 0;
  let repeatedRun = 0;
  let previous = null;

  for (const character of text) {
    const codePoint = character.codePointAt(0);
    if (isNonCharacter(codePoint)) fail('unicode_noncharacter');

    const isMark = mark.test(character);
    if (isMark) {
      combiningStack += 1;
      if (combiningStack > 8) fail('unicode_combining_stack');
    } else {
      combiningStack = 0;
    }

    if (isInvisibleCodePoint(codePoint)) {
      invisibleRun += 1;
      invisibleTotal += 1;
      if (invisibleRun > 8) fail('unicode_invisible_run');
    } else {
      invisibleRun = 0;
      if (!whitespace.test(character) && !isMark) visibleTotal += 1;
    }

    if (character === previous) repeatedRun += 1;
    else repeatedRun = 1;
    previous = character;
    if (repeatedRun > 256) fail('unicode_repetition', 'Comment contains an excessively repeated character sequence.');
  }

  if (visibleTotal === 0) fail('unicode_no_visible_content', 'Comment must contain visible content.');
  if (invisibleTotal > 32 && invisibleTotal > visibleTotal * 2 + 8) fail('unicode_invisible_density');

  for (const { segment } of graphemeSegmenter.segment(text)) {
    if ([...segment].length > 32) fail('unicode_grapheme_complexity');
  }

  return text;
}
