import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const testDir = path.dirname(fileURLToPath(import.meta.url));
const configUrl = pathToFileURL(path.resolve(testDir, '../site.config.mjs')).href;
const giscusEnvironmentKeys = [
  'PUBLIC_GISCUS_ENABLED',
  'PUBLIC_GISCUS_REPO',
  'PUBLIC_GISCUS_REPO_ID',
  'PUBLIC_GISCUS_CATEGORY',
  'PUBLIC_GISCUS_CATEGORY_ID',
];

async function readGiscusConfig(overrides = {}) {
  const environment = { ...process.env };
  for (const key of giscusEnvironmentKeys) delete environment[key];
  Object.assign(environment, overrides);

  const script = `
    import config from ${JSON.stringify(configUrl)};
    process.stdout.write(JSON.stringify(config.giscus));
  `;
  const { stdout } = await execFileAsync(
    process.execPath,
    ['--input-type=module', '--eval', script],
    { env: environment },
  );
  return JSON.parse(stdout);
}

test('Giscus uses the migrated public repository defaults without deploy variables', async () => {
  const config = await readGiscusConfig();

  assert.equal(config.enabled, true);
  assert.equal(config.repo, 'Bladeswillfall/VISCERIUM');
  assert.equal(config.repoId, 'R_kgDOTOiQ7g');
  assert.equal(config.category, 'Comments');
  assert.equal(config.categoryId, 'DIC_kwDOTOiQ7s4DCYjH');
});

test('Giscus retains an explicit deployment off switch', async () => {
  const config = await readGiscusConfig({ PUBLIC_GISCUS_ENABLED: '0' });
  assert.equal(config.enabled, false);
});
