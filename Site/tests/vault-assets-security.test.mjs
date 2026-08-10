import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { validateVaultAssets } from '../scripts/validate-vault-assets.mjs';

const execFileAsync = promisify(execFile);
const forbiddenRasterExtension = /\.(?:avif|bmp|gif|heic|heif|jpe?g|png|tiff?)$/i;
const generatedDirectories = new Set([
  '.git',
  '.astro',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
  'timeline-browser-diagnostics',
]);

async function listSourceFiles(directory, root = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && !generatedDirectories.has(entry.name)) {
      files.push(...await listSourceFiles(path.join(directory, entry.name), root));
    } else if (entry.isFile()) {
      files.push(path.relative(root, path.join(directory, entry.name)));
    }
  }

  return files;
}

async function validateFixture(source, filename = 'fixture.svg') {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'viscerium-svg-security-'));
  const originalError = console.error;
  const originalLog = console.log;
  const errors = [];
  console.error = (...values) => errors.push(values.join(' '));
  console.log = () => {};

  try {
    await writeFile(path.join(rootDir, filename), source);
    const valid = await validateVaultAssets({ rootDir });
    return { valid, errors };
  } finally {
    console.error = originalError;
    console.log = originalLog;
    await rm(rootDir, { recursive: true, force: true });
  }
}

test('SVG validation accepts ordinary vector markup', async () => {
  const result = await validateFixture(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
      <path d="M0 0h10v10H0z" />
    </svg>
  `);

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('SVG detection accepts XML declarations, repeated comments, and an SVG doctype', async () => {
  const result = await validateFixture(`<?xml version="1.0" encoding="UTF-8"?>
<!-- first comment -->
<!-- second comment -->
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
  <path d="M0 0h10v10H0z" />
</svg>`);

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('SVG detection handles doctype internal subsets without ambiguous backtracking', async () => {
  const result = await validateFixture(`<!DOCTYPE svg [
  <!ENTITY safe "vector">
]>
<svg xmlns="http://www.w3.org/2000/svg"><text>&safe;</text></svg>`);

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('SVG detection rejects malformed unterminated preambles', async () => {
  const result = await validateFixture(`<?xml version="1.0" ${'x'.repeat(4000)}`);

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /does not match \.svg extension/);
});

test('SVG validation rejects scriptable constructs', async (t) => {
  const cases = [
    ['script', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
    ['foreignObject', '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div>HTML</div></foreignObject></svg>'],
    ['event handler', '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>'],
    ['javascript URL', '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"></a></svg>'],
    ['HTML data URL', '<svg xmlns="http://www.w3.org/2000/svg"><a href="data:text/html,test"></a></svg>'],
  ];

  for (const [name, source] of cases) {
    await t.test(name, async () => {
      const result = await validateFixture(source);
      assert.equal(result.valid, false);
      assert.ok(result.errors.length > 0);
    });
  }
});

test('asset validation rejects content that does not match its extension', async () => {
  const result = await validateFixture('<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'fixture.webp');

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /does not match \.webp extension/);
});

test('asset validation accepts a matching WebP signature', async () => {
  const result = await validateFixture(
    Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')]),
    'fixture.webp',
  );

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('asset validation rejects a valid PNG because raster artwork must be WebP', async () => {
  const result = await validateFixture(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    'fixture.png',
  );

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /Raster assets must be WebP/);
});

test('asset validation rejects JPEG even when its extension matches its signature', async () => {
  const result = await validateFixture(
    Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43]),
    'fixture.jpeg',
  );

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /Raster assets must be WebP/);
});

test('source tree does not include non-WebP raster files', async () => {
  const repoRoot = path.resolve(process.cwd(), '..');
  let files;

  try {
    const { stdout } = await execFileAsync('git', ['ls-files'], { cwd: repoRoot });
    files = stdout.split(/\r?\n/).filter(Boolean);
  } catch (error) {
    if (!String(error.stderr).includes('not a git repository')) throw error;
    files = await listSourceFiles(repoRoot);
  }

  const forbidden = files.filter((file) => forbiddenRasterExtension.test(file));

  assert.deepEqual(
    forbidden,
    [],
    `Included non-WebP raster files are forbidden. Convert them to .webp or use .svg for genuine vectors:\n${forbidden.join('\n')}`,
  );
});
