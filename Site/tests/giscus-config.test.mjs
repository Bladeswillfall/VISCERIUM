import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const configUrl = pathToFileURL(path.resolve(testDir, '../site.config.mjs')).href;
let importSequence = 0;
const giscusEnvironmentKeys = [
  'PUBLIC_GISCUS_ENABLED',
  'PUBLIC_GISCUS_REPO',
  'PUBLIC_GISCUS_REPO_ID',
  'PUBLIC_GISCUS_CATEGORY',
  'PUBLIC_GISCUS_CATEGORY_ID',
];

async function readGiscusConfig(overrides = {}) {
  const saved = new Map(giscusEnvironmentKeys.map((key) => [key, process.env[key]]));
  try {
    for (const key of giscusEnvironmentKeys) delete process.env[key];
    Object.assign(process.env, overrides);
    const { default: config } = await import(`${configUrl}?test=${importSequence++}`);
    return config.giscus;
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('Giscus uses the verified public repository identity without deploy variables', async () => {
  const config = await readGiscusConfig();

  assert.equal(config.enabled, true);
  assert.equal(config.repo, 'Bladeswillfall/VISCERIUM');
  assert.equal(config.repoId, 'R_kgDOTolQ7g');
  assert.equal(config.category, 'Comments');
  assert.equal(config.categoryId, 'DIC_kwDOTolQ7s4DCYjH');
  assert.equal(config.theme.dark, 'noborder_dark');
  assert.equal(config.theme.light, 'noborder_light');
  assert.equal(config.theme.auto, 'preferred_color_scheme');
});

test('stale migration identity variables cannot override the pinned Giscus identity', async () => {
  const config = await readGiscusConfig({
    PUBLIC_GISCUS_REPO: 'Bladeswillfall/VISCERIUM',
    PUBLIC_GISCUS_REPO_ID: 'R_kgDOTOiQ7g',
    PUBLIC_GISCUS_CATEGORY: 'Comments',
    PUBLIC_GISCUS_CATEGORY_ID: 'DIC_kwDOTOiQ7s4DCYjH',
  });

  assert.equal(config.repo, 'Bladeswillfall/VISCERIUM');
  assert.equal(config.repoId, 'R_kgDOTolQ7g');
  assert.equal(config.category, 'Comments');
  assert.equal(config.categoryId, 'DIC_kwDOTolQ7s4DCYjH');
});

test('Giscus retains an explicit deployment off switch', async () => {
  const config = await readGiscusConfig({ PUBLIC_GISCUS_ENABLED: '0' });
  assert.equal(config.enabled, false);
});
