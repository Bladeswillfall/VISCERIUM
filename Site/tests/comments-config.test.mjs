import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const configUrl = pathToFileURL(path.resolve(testDir, '../site.config.mjs')).href;
let importSequence = 0;
const commentEnvironmentKeys = [
  'PUBLIC_COMMENTS_ENABLED',
  'PUBLIC_COMMENTS_HOST',
  'PUBLIC_COMMENTS_SITE_ID',
];

async function readCommentsConfig(overrides = {}) {
  const saved = new Map(commentEnvironmentKeys.map((key) => [key, process.env[key]]));
  try {
    for (const key of commentEnvironmentKeys) delete process.env[key];
    Object.assign(process.env, overrides);
    const { default: config } = await import(`${configUrl}?test=${importSequence++}`);
    return config.comments;
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('Remark42 uses the production comment service by default', async () => {
  const config = await readCommentsConfig();

  assert.equal(config.enabled, true);
  assert.equal(config.host, 'https://comments.viscerium.co.uk');
  assert.equal(config.siteId, 'viscerium');
});

test('Remark42 public host and site ID can be overridden', async () => {
  const config = await readCommentsConfig({
    PUBLIC_COMMENTS_HOST: 'https://comments.example.com/',
    PUBLIC_COMMENTS_SITE_ID: 'example',
  });

  assert.equal(config.enabled, true);
  assert.equal(config.host, 'https://comments.example.com');
  assert.equal(config.siteId, 'example');
});

test('comments retain an explicit deployment off switch', async () => {
  const config = await readCommentsConfig({ PUBLIC_COMMENTS_ENABLED: '0' });
  assert.equal(config.enabled, false);
});

test('comments do not enable for a non-HTTPS host', async () => {
  const config = await readCommentsConfig({ PUBLIC_COMMENTS_HOST: 'http://comments.example.com' });
  assert.equal(config.enabled, false);
});
