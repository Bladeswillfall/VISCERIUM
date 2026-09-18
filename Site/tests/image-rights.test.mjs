import assert from 'node:assert/strict';
import test from 'node:test';
import { presentImageRights } from '../src/lib/image-rights.mjs';

const ccCases = [
  ['CC BY', 'CC BY', ['cc', 'by']],
  ['BY-SA', 'CC BY-SA', ['cc', 'by', 'sa']],
  ['CC BY-ND', 'CC BY-ND', ['cc', 'by', 'nd']],
  ['BY-NC', 'CC BY-NC', ['cc', 'by', 'nc']],
  ['CC BY NC SA', 'CC BY-NC-SA', ['cc', 'by', 'nc', 'sa']],
  ['by-nc-nd', 'CC BY-NC-ND', ['cc', 'by', 'nc', 'nd']],
];

for (const [input, label, icons] of ccCases) {
  test(`normalises ${input} into the matching Creative Commons icon sequence`, () => {
    const result = presentImageRights(input);

    assert.equal(result.kind, 'creative-commons');
    assert.equal(result.label, label);
    assert.deepEqual(result.icons.map((icon) => icon.name), icons);
    assert.ok(result.icons.every((icon) => icon.src.endsWith(`/${icon.name}.svg`)));
  });
}

test('keeps an optional Creative Commons version in the visible label', () => {
  const result = presentImageRights('CC BY-SA 4.0');
  assert.equal(result.label, 'CC BY-SA 4.0');
  assert.deepEqual(result.icons.map((icon) => icon.name), ['cc', 'by', 'sa']);
});

test('maps CC0 and Public Domain to their official icon sets', () => {
  assert.deepEqual(
    presentImageRights('CC0').icons.map((icon) => icon.name),
    ['cc', 'zero'],
  );
  assert.deepEqual(
    presentImageRights('Public Domain').icons.map((icon) => icon.name),
    ['pd'],
  );
});

test('keeps ordinary copyright as the borderless copyright symbol', () => {
  const result = presentImageRights('Copyright');
  assert.equal(result.kind, 'copyright');
  assert.equal(result.symbol, '©');
  assert.equal(result.icons.length, 0);
});

test('uses the supplied not-recorded label for blank metadata', () => {
  const result = presentImageRights('', 'Not recorded');
  assert.equal(result.kind, 'unknown');
  assert.equal(result.label, 'Not recorded');
  assert.equal(result.symbol, '?');
});
