import assert from 'node:assert/strict';
import test from 'node:test';
import { iconLabel } from '../src/lib/icon-spec.mjs';

// The Demo category is intentionally disposable test content. Keep its generated
// group label plain so the category page never serializes raw [Icon:...] syntax.
test('Demo category group label is plain text', () => {
  assert.equal(iconLabel(undefined, 'Demo'), 'Demo');
  assert.equal(/\[Icon:/i.test(iconLabel(undefined, 'Demo')), false);
});
