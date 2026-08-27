import test from 'node:test';
import assert from 'node:assert/strict';
import { compareComplexityFindings } from '../scripts/check-complexity.mjs';

test('same-file replacement at a different score is not grandfathered', () => {
  const result = compareComplexityFindings(
    [{ file: 'legacy.mjs', score: 23 }],
    [{ file: 'legacy.mjs', scores: [22] }],
  );

  assert.deepEqual(result, {
    added: [{ file: 'legacy.mjs', score: 23 }],
    resolved: [{ file: 'legacy.mjs', score: 22 }],
  });
});
