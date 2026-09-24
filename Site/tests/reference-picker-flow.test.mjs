import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const require = createRequire(import.meta.url);
const pickerPath = path.join(repoRoot, 'Vault/Templates/_Scripts/reference_picker.js');

function loadPicker() {
  delete require.cache[require.resolve(pickerPath)];
  return require(pickerPath);
}

test('reference picker restricts candidates to the selected era', async () => {
  const picker = loadPicker();
  const files = [
    { path: 'Lore/CITADEL/Factions/Citadel Faction.md', basename: 'Citadel Faction' },
    { path: 'Lore/SMOG/Factions/Smog Faction.md', basename: 'Smog Faction' },
    { path: 'Lore/Universal/Factions/Legacy Faction.md', basename: 'Legacy Faction' },
    { path: 'Lore/CITADEL/Locations/Citadel Region.md', basename: 'Citadel Region' },
    { path: 'Lore/SMOG/Locations/Smog Region.md', basename: 'Smog Region' },
  ];
  const frontmatter = new Map([
    [files[0], { title: 'Citadel Faction', type: 'faction', era: 'CITADEL' }],
    [files[1], { title: 'Smog Faction', type: 'faction', era: 'SMOG' }],
    [files[2], { title: 'Legacy Faction', type: 'faction', eras: ['CITADEL', 'SMOG'] }],
    [files[3], { title: 'Citadel Region', type: 'location', era: 'CITADEL' }],
    [files[4], { title: 'Smog Region', type: 'location', era: 'SMOG' }],
  ]);

  const calls = [];
  const tp = {
    app: {
      metadataCache: {
        getFileCache: (file) => ({ frontmatter: frontmatter.get(file) ?? {} }),
      },
      vault: {
        getMarkdownFiles: () => files,
      },
    },
    system: {
      multi_suggester: async (labels, values) => {
        calls.push({ labels, values });
        return [];
      },
      suggester: async (labels, values) => {
        calls.push({ labels, values });
        return '';
      },
    },
  };

  await picker(tp, {
    types: ['faction'],
    multiple: true,
    allowCreate: false,
    era: 'CITADEL',
  });
  await picker(tp, {
    types: ['location'],
    multiple: false,
    allowCreate: false,
    era: 'CITADEL',
  });

  assert.deepEqual(calls[0].labels, ['Citadel Faction', 'Legacy Faction']);
  assert.deepEqual(calls[0].values, ['Citadel Faction', 'Legacy Faction']);
  assert.deepEqual(calls[1].labels, ['Leave blank', 'Citadel Region']);
  assert.deepEqual(calls[1].values, ['', 'Citadel Region']);
});


test('reference picker stamps the selected era onto a newly created related stub', async () => {
  const picker = loadPicker();
  let created = null;

  const tp = {
    app: {
      metadataCache: {
        getFileCache: () => ({ frontmatter: {} }),
      },
      vault: {
        getMarkdownFiles: () => [],
        getAbstractFileByPath: () => null,
        createFolder: async () => {},
        create: async (path, content) => {
          created = { path, content };
        },
      },
    },
    system: {
      multi_suggester: async (_labels, values) => [values.at(-1)],
      prompt: async () => 'New CITADEL Faction',
    },
  };

  const selected = await picker(tp, {
    types: ['faction'],
    multiple: true,
    label: 'faction',
    stubType: 'faction',
    stubFolder: 'Drafts/Inbox/Factions',
    era: 'CITADEL',
  });

  assert.deepEqual(selected, ['New CITADEL Faction']);
  assert.equal(created.path, 'Drafts/Inbox/Factions/New CITADEL Faction.md');
  assert.match(created.content, /^era: "CITADEL"$/m);
});
