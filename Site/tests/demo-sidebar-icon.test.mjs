import assert from 'node:assert/strict';
import test from 'node:test';
import { iconLabel } from '../src/lib/icon-spec.mjs';

test('demo sidebar group stays plain text to avoid raw icon syntax in generated category output', () => {
  assert.equal(iconLabel(undefined, 'Demo'), 'Demo');
});
