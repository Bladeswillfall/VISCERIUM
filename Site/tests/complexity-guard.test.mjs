import test from 'node:test';
import assert from 'node:assert/strict';
import { compareComplexityFindings } from '../scripts/check-complexity.mjs';

test('complexity baseline accepts the same findings regardless of order', () => {
  const baseline = [
    { file: 'a.mjs', scores: [22, 30] },
    { file: 'b.js', scores: [25] },
  ];
  const findings = [
    { file: 'b.js', score: 25 },
    { file: 'a.mjs', score: 30 },
    { file: 'a.mjs', score: 22 },
  ];

  assert.deepEqual(compareComplexityFindings(findings, baseline), { added: [], resolved: [] });
});

test('complexity baseline reports new and resolved findings separately', () => {
  const baseline = [
    { file: 'a.mjs', scores: [22, 30] },
    { file: 'b.js', scores: [25] },
  ];
  const findings = [
    { file: 'a.mjs', score: 22 },
    { file: 'c.js', score: 21 },
  ];

  assert.deepEqual(compareComplexityFindings(findings, baseline), {
    added: [{ file: 'c.js', score: 21 }],
    resolved: [
      { file: 'a.mjs', score: 30 },
      { file: 'b.js', score: 25 },
    ],
  });
});
