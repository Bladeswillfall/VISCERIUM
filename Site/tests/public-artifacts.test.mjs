import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { validatePublicArtifacts } from '../scripts/check-public-artifacts.mjs';

test('public artifact validation scans hidden files and requires a build directory', async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'viscerium-public-artifacts-'));
  const originalError = console.error;
  const originalLog = console.log;
  const errors = [];
  console.error = (...values) => errors.push(values.join(' '));
  console.log = () => {};

  try {
    await mkdir(path.join(rootDir, 'nested'));
    await writeFile(path.join(rootDir, '.env'), 'SECRET=public');
    await writeFile(path.join(rootDir, 'nested', '.dev.vars.production'), 'TOKEN=public');

    assert.equal(await validatePublicArtifacts({ rootDir }), false);
    assert.match(errors.join('\n'), /\.env: forbidden public artifact/);
    assert.match(errors.join('\n'), /nested\/\.dev\.vars\.production: forbidden public artifact/);

    errors.length = 0;
    await rm(rootDir, { recursive: true });
    assert.equal(await validatePublicArtifacts({ rootDir }), false);
    assert.match(errors.join('\n'), /requires Site\/dist/);
  } finally {
    console.error = originalError;
    console.log = originalLog;
    await rm(rootDir, { recursive: true, force: true });
  }
});
