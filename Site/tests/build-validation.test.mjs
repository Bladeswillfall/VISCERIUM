import test from 'node:test';
import assert from 'node:assert/strict';
import { validationCommands } from '../scripts/run-build-validation.mjs';

test('build validation stays enabled outside Cloudflare Pages', () => {
  assert.deepEqual(validationCommands('pre', {}), [
    ['npm', ['run', 'check:astro']],
  ]);
  assert.deepEqual(validationCommands('post', {}), [
    ['npm', ['run', 'validate:icons']],
    ['node', ['--test', 'tests/i18n-output.postbuild.mjs']],
    ['npm', ['run', 'security:artifacts']],
    ['npm', ['run', 'performance:check']],
  ]);
});

test('Cloudflare Pages skips validation already owned by PR checks', () => {
  assert.deepEqual(validationCommands('pre', { CF_PAGES: '1' }), []);
  assert.deepEqual(validationCommands('post', { CF_PAGES: '1' }), []);
});

test('unknown validation phases fail instead of silently skipping checks', () => {
  assert.throws(() => validationCommands('unknown', {}), /Unknown build validation phase/);
});
