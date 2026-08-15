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

test('daily notes use the private Chronicle source layer and shared core template', async () => {
  const config = await readVaultJson('.obsidian/daily-notes.json');
  const template = await readVaultText('Templates/Journal/Daily Note.md');

  assert.equal(config.folder, 'Private/Journal/Daily');
  assert.equal(config.format, 'YYYY/YYYY-MM-DD');
  assert.equal(config.template, 'Templates/Journal/Daily Note');
  assert.match(template, /^type: journal$/m);
  assert.match(template, /^period: daily$/m);
  assert.match(template, /^date: "\{\{date:YYYY-MM-DD\}\}"$/m);
  assert.match(template, /^## Today's Focus$/m);
  assert.match(template, /^## Upcoming$/m);
  assert.match(template, /^## Decisions, Milestones & Developments$/m);
  assert.match(template, /^## Vault Activity$/m);
  assert.doesNotMatch(template, /^## Today$/m);
  assert.doesNotMatch(template, /^## Planned$/m);
  assert.match(template, /Seal Today's Activity/);
});

test('Journal Bases owns Chronicle period navigation without Periodic Notes overlap', async () => {
  const enabled = await readVaultJson('.obsidian/community-plugins.json');
  const settings = await readVaultJson('.obsidian/plugins/journal-bases/data.json');
  const profile = await readVaultJson('System/Obsidian Plugin Profile.json');
  const gitignore = await readText('.gitignore');
  const dailyTemplater = await readVaultText('Templates/Journal/Daily Chronicle Note.md');

  assert.ok(enabled.includes('journal-bases'));
  assert.ok(!enabled.includes('periodic-notes'));

  assert.deepEqual(settings.daily, {
    enabled: true,
    folder: 'Private/Journal/Daily',
    format: 'YYYY/YYYY-MM-DD',
    template: 'Templates/Journal/Daily Chronicle Note.md',
  });
  assert.deepEqual(settings.weekly, {
    enabled: true,
    folder: 'Private/Journal/Weekly',
    format: 'gggg/gggg-[W]ww',
    template: 'Templates/Journal/Weekly Review.md',
  });
  assert.deepEqual(settings.monthly, {
    enabled: true,
    folder: 'Private/Journal/Monthly',
    format: 'YYYY/YYYY-MM',
    template: 'Templates/Journal/Monthly Review.md',
  });
  assert.deepEqual(settings.quarterly, {
    enabled: true,
    folder: 'Private/Journal/Quarterly',
    format: 'YYYY/YYYY-[Q]Q',
    template: 'Templates/Journal/Quarterly Review.md',
  });
  assert.deepEqual(settings.yearly, {
    enabled: true,
    folder: 'Private/Journal/Yearly',
    format: 'YYYY',
    template: 'Templates/Journal/Yearly Review.md',
  });
  assert.match(dailyTemplater, /type: journal/);
  assert.match(dailyTemplater, /period: daily/);
  assert.match(dailyTemplater, /moment\(source, "YYYY-MM-DD", true\)/);
  assert.equal(settings.collapseFrontmatter, true);
  assert.equal(settings.rememberColumnState, true);
  assert.equal(settings.debugModeEnabled, false);

  const journalBases = profile.plugins.find((plugin) => plugin.id === 'journal-bases');
  assert.equal(journalBases?.testedVersion, '1.16.0');
  assert.equal(journalBases?.sharedSettings, 'Vault/.obsidian/plugins/journal-bases/data.json');
  assert.match(gitignore, /!Vault\/\.obsidian\/plugins\/journal-bases\/data\.json/);
});

test('Chronicle templates keep semantic metadata lean and avoid review completion state', async () => {
  const templates = {
    weekly: await readVaultText('Templates/Journal/Weekly Review.md'),
    monthly: await readVaultText('Templates/Journal/Monthly Review.md'),
    quarterly: await readVaultText('Templates/Journal/Quarterly Review.md'),
    yearly: await readVaultText('Templates/Journal/Yearly Review.md'),
  };

  for (const [period, template] of Object.entries(templates)) {
    assert.match(template, /type: journal/);
    assert.match(template, new RegExp(`period: ${period}`));
    assert.doesNotMatch(template, /reviewed:/);
    assert.doesNotMatch(template, /complete:/);
    assert.doesNotMatch(template, /periodic_review_completed:/);
    assert.match(template, /System\/Views\/Chronicle\/Evidence/);
  }

  assert.match(templates.weekly, /^## Weekly Direction$/m);
  assert.match(templates.weekly, /^## Week in Review$/m);
  assert.match(templates.weekly, /^## Next Week$/m);

  assert.match(templates.monthly, /^## Monthly Direction$/m);
  assert.match(templates.monthly, /^## Project Changes$/m);
  assert.match(templates.monthly, /^## Next Month$/m);

  assert.match(templates.quarterly, /^## Strategic Review$/m);
  assert.match(templates.quarterly, /needs of the project currently align/);
  assert.doesNotMatch(templates.quarterly, /difficult for another project to reproduce/i);

  assert.match(templates.yearly, /^## Year at a Glance$/m);
  assert.match(templates.yearly, /^## What Strengthened VISCERIUM$/m);
  assert.match(templates.yearly, /strengths became difficult to reproduce/i);
  assert.match(templates.yearly, /You do not need to answer every question/);
});

test('Chronicle hub and Base stay compact, on-demand, and period-aware', async () => {
  const hub = await readVaultText('System/Chronicle.md');
  const hubView = await readVaultText('System/Views/Chronicle/Hub/view.js');
  const hubCss = await readVaultText('System/Views/Chronicle/Hub/view.css');
  const base = await readVaultText('System/Bases/Chronicle.base');
  const home = await readVaultText('Home.md');

  assert.match(hub, /Daily captures\. Weekly interprets\. Monthly assesses\. Quarterly steers\. Yearly records\./);
  assert.match(hub, /System\/Views\/Chronicle\/Hub/);
  for (const period of ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']) {
    assert.match(hubView, new RegExp(`journal-bases:open-current-\\$\\{period\\.type\\}|journal-bases:open-current-${period}`));
  }
  assert.match(hubView, /exists \? "Open" : "Create"/);
  assert.match(hubCss, /@media \(max-width: 620px\)/);
  assert.match(hubCss, /grid-template-columns: 1fr/);

  assert.match(base, /type: periodic-review/);
  assert.equal((base.match(/type: periodic-notes/g) ?? []).length, 5);
  assert.equal((base.match(/futurePeriods: 0/g) ?? []).length, 5);
  assert.match(home, /\["Chronicle", "System\/Chronicle"\]/);
});

test('Chronicle evidence derives tasks, developments, and descriptive activity views', async () => {
  const evidence = await readVaultText('System/Views/Chronicle/Evidence/view.js');
  const evidenceCss = await readVaultText('System/Views/Chronicle/Evidence/view.css');

  assert.match(evidence, /task\.scheduled/);
  assert.match(evidence, /task\.due/);
  assert.match(evidence, /Previously scheduled/);
  assert.match(evidence, /Decisions, Milestones & Developments/);
  assert.match(evidence, /Vault activity is derived from sealed Daily Activity snapshots/);
  assert.match(evidence, /Active days by area/);
  assert.match(evidence, /Activity across the year/);
  assert.match(evidence, /Lore.*Stories.*Drafts.*System.*Other/s);
  assert.doesNotMatch(evidence, /productivity score/i);
  assert.doesNotMatch(evidence, /streak/i);
  assert.match(evidenceCss, /--chronicle-month-count/);
  assert.match(evidenceCss, /@media \(max-width: 620px\)/);
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

test("Seal Today's Activity keeps the established Daily path and Vault Activity target", async () => {
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
  assert.match(workflow, /Decisions, Milestones & Developments/);
});

test('plugin notices cover Daily Activity, Journal Bases, and the journal bridge', async () => {
  const notices = await readText('THIRD_PARTY_NOTICES.md');
  assert.match(notices, /Daily Activity/);
  assert.match(notices, /No licence file published upstream/);
  assert.match(notices, /Journal Bases/);
  assert.match(notices, /Sébastien Dubois/);
  assert.match(notices, /VISCERIUM Journal Tools/);
});
