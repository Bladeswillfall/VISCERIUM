import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const vaultRoot = path.join(repoRoot, 'Vault');

async function readText(relativePath) {
  return fs.readFile(path.join(vaultRoot, relativePath), 'utf8');
}

async function readJson(relativePath) {
  return JSON.parse(await readText(relativePath));
}

test('frontmatter plugins separate mechanical, authorial and continuity fields', async () => {
  const plugins = await readJson('.obsidian/community-plugins.json');
  const autoProperties = await readJson('.obsidian/plugins/auto-properties/data.json');
  const metadataMenu = await readJson('.obsidian/plugins/metadata-menu/data.json');

  assert.ok(plugins.includes('auto-properties'));
  assert.ok(plugins.includes('metadata-menu'));

  const automaticRules = new Map(autoProperties.rules.map((rule) => [rule.key, rule]));
  assert.deepEqual([...automaticRules.keys()], ['created', 'updated', 'word_count', 'open_task_count']);
  assert.equal(automaticRules.get('created').autoadd, false);
  assert.equal(automaticRules.get('created').no_overwrite, true);
  assert.deepEqual(automaticRules.get('updated').trigger, ['modification']);
  assert.ok(!automaticRules.has('published'), 'publication is an editorial event and must not be inferred from file timestamps');
  for (const rule of automaticRules.values()) {
    assert.ok(rule.whererun.includes('Lore'));
    assert.ok(rule.whererun.includes('Drafts'));
    assert.ok(rule.whereignore.includes('Drafts/WorldAnvil Import'));
  }

  const presetFields = new Map(metadataMenu.presetFields.map((field) => [field.name, field]));
  assert.deepEqual(presetFields.get('status').options.valuesList, {
    0: 'draft',
    1: 'published',
  });
  assert.ok(presetFields.has('type'));
  assert.ok(presetFields.has('headerImage'));
  assert.ok(presetFields.has('related'));
  assert.ok(presetFields.has('location'));
  assert.ok(presetFields.has('faction'));
  assert.ok(presetFields.has('participants'));
  assert.ok(!presetFields.has('era'));
  assert.ok(!presetFields.has('development_level'));
  assert.deepEqual(presetFields.get('headerImage').options.folders, ['Assets/Images']);

  for (const fieldName of ['created', 'updated', 'era', 'entity_id', 'calendarDate', 'timeline', 'import_issues']) {
    assert.ok(metadataMenu.globallyIgnoredFields.includes(fieldName), `${fieldName} must not be edited through Metadata Menu`);
  }
});

test('all note-creation templates seed authoring and publication dates', async () => {
  const templates = [
    'Templates/Lore/New Lore Entity.md',
    'Templates/Databases/New Story Entity.md',
    'Templates/Databases/New Myrkild Unit.md',
    'Templates/Lore/Article Template.md',
    'Templates/Lore/Character Template.md',
    'Templates/Lore/Faction Template.md',
    'Templates/Lore/Location Template.md',
    'Templates/Lore/Event Template.md',
    'Templates/Lore/Species Template.md',
    'Templates/Lore/Item Template.md',
    'Templates/Lore/Calendar Template.md',
    'Templates/Lore/Era Template.md',
    'Templates/Publishing/Map Template.md',
    'Templates/Publishing/Image Metadata Template.md',
    'Templates/Timelines/Timeline Template.md',
    'Templates/Timelines/Chronos Timeline Template.md',
    'Templates/Databases/Myrkild Unit Profile.md',
  ];

  for (const template of templates) {
    const source = await readText(template);
    assert.match(source, /created:/, `${template} must seed the guarded created property`);
    assert.match(source, /published:/, `${template} must seed the editorial published property`);
    assert.match(source, /updated:/, `${template} must seed the automatic updated property`);
  }
});
