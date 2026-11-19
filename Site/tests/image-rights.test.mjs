import assert from 'node:assert/strict';
import test from 'node:test';
import { presentImageRights } from '../src/lib/image-rights.ts';

test('missing image rights use the supplied fallback', () => {
  assert.deepEqual(presentImageRights(null, 'Not recorded'), {
    kind: 'unknown', label: 'Not recorded', symbol: '?', icons: [],
  });
});

test('copyright and public domain have distinct presentation', () => {
  assert.equal(presentImageRights('©').label, 'Copyright');
  assert.equal(presentImageRights('©').kind, 'copyright');
  assert.deepEqual(presentImageRights('PDM').icons.map(({ name }) => name), ['pd']);
  assert.deepEqual(presentImageRights('CC0').icons.map(({ name }) => name), ['cc', 'zero']);
});

test('Creative Commons variants retain licence code, version and icon order', () => {
  const rights = presentImageRights('CC BY-NC-SA 4.0');
  assert.equal(rights.kind, 'creative-commons');
  assert.equal(rights.label, 'CC BY-NC-SA 4.0');
  assert.deepEqual(rights.icons.map(({ name }) => name), ['cc', 'by', 'nc', 'sa']);
  assert.ok(rights.icons.every(({ src }) => src.startsWith('https://mirrors.creativecommons.org/presskit/icons/')));
});

test('unknown rights stay visible instead of being misclassified', () => {
  assert.deepEqual(presentImageRights('Custom licence'), {
    kind: 'unknown', label: 'Custom licence', symbol: '?', icons: [],
  });
});
