import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const vaultRoot = path.join(repoRoot, 'Vault');

async function readText(relativePath) {
  return fs.readFile(path.join(repoRoot, relativePath), 'utf8');
}

async function readVaultText(relativePath) {
  return fs.readFile(path.join(vaultRoot, relativePath), 'utf8');
}

async function readVaultJson(relativePath) {
  return JSON.parse(await readVaultText(relativePath));
}

test('daily notes use a private dated journal and the shared daily template', async () => {
  const config = await readVaultJson('.obsidian/daily-notes.json');
  const template = await readVaultText('Templates/Journal/Daily Note.md');

  assert.equal(config.folder, 'Private/Journal/Daily');
  assert.equal(config.format, 'YYYY/YYYY-MM-DD');
  assert.equal(config.template, 'Templates/Journal/Daily Note');
  assert.match(template, /^type: journal$/m);
  assert.match(template, /^## Today$/m);
  assert.match(template, /^## Vault Activity$/m);
  assert.match(template, /Seal Today's Activity/);
  assert.match(template, /assigned hotkey/);
});

test('Daily Activity is configured as a quiet local event ledger', async () => {
  const enabled = await readVaultJson('.obsidian/community-plugins.json');
  const settings = await readVaultJson('.obsidian/plugins/daily-activity/data.json');
  const profile = await readVaultJson('System/Obsidian Plugin Profile.json');
  const gitignore = await readText('.gitignore');

  assert.ok(enabled.includes('daily-activity'));
  assert.ok(enabled.includes('viscerium-journal-tools'));
  assert.equal(settings.insertLocation, 'cursor');
  assert.equal(settings.showFilterDialog, false);
  assert.equal(settings.enableActivityTracking, true);
  assert.equal(settings.modifyBatchingEnabled, true);
  assert.equal(settings.trackFileCreation, true);
  assert.equal(settings.trackFileModification, true);
  assert.equal(settings.trackFileDeletion, true);
  assert.equal(settings.trackFileRename, true);
  assert.ok(settings.activityTrackingExcludePaths.includes('Private/Journal/'));
  assert.equal(settings.enableDashboard, false);

  const dailyActivity = profile.plugins.find((plugin) => plugin.id === 'daily-activity');
  assert.equal(dailyActivity?.testedVersion, '1.0.0');
  assert.equal(dailyActivity?.sharedSettings, 'Vault/.obsidian/plugins/daily-activity/data.json');

  const journalTools = profile.plugins.find((plugin) => plugin.id === 'viscerium-journal-tools');
  assert.equal(journalTools?.source, 'first-party');
  assert.equal(journalTools?.runtimePath, 'Vault/.obsidian/plugins/viscerium-journal-tools');

  assert.match(gitignore, /!Vault\/\.obsidian\/plugins\/daily-activity\/data\.json/);
  assert.match(gitignore, /!Vault\/\.obsidian\/plugins\/viscerium-journal-tools\/\*\*/);
});

test("Seal Today's Activity opens today's journal and delegates safely", async () => {
  const plugin = await readVaultText('.obsidian/plugins/viscerium-journal-tools/main.js');
  const manifest = await readVaultJson('.obsidian/plugins/viscerium-journal-tools/manifest.json');
  const workflow = await readVaultText('System/SOPs/015 - Daily Journal Workflow SOP.md');

  assert.equal(manifest.id, 'viscerium-journal-tools');
  assert.equal(manifest.version, '0.1.0');
  assert.match(plugin, /name: "Seal Today's Activity"/);
  assert.match(plugin, /daily-activity:db-activity-timeline/);
  assert.match(plugin, /daily-notes/);
  assert.match(plugin, /Private\/Journal\/Daily/);
  assert.match(plugin, /Today's activity is already sealed/);
  assert.match(plugin, /ACTIVITY_HEADING/);
  assert.match(workflow, /Snapshot, not live feed/);
  assert.match(workflow, /Private\/Journal\/Daily\/<YEAR>/);
});

test('plugin notices cover Daily Activity and the journal bridge', async () => {
  const notices = await readText('THIRD_PARTY_NOTICES.md');
  assert.match(notices, /Daily Activity/);
  assert.match(notices, /No licence file published upstream/);
  assert.match(notices, /VISCERIUM Journal Tools/);
});
