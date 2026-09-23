import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const vaultRoot = path.join(repoRoot, 'Vault');
const require = createRequire(import.meta.url);
const creatorPath = path.join(vaultRoot, 'Templates/_Scripts/create_lore_entity.js');

function mockTemplater({ title, description, era, locationKind = '', mapId = '', year = '', certainty = 'exact' }) {
  const moves = [];
  const renames = [];

  const tp = {
    file: {
      title: 'Untitled',
      folder: () => 'Drafts/Inbox',
      rename: async (value) => {
        renames.push(value);
        tp.file.title = value;
      },
      move: async (value) => moves.push(value),
    },
    system: {
      prompt: async (label, defaultValue = '') => {
        if (label === 'Name') return title;
        if (label === 'One-line identity (optional)') return description;
        if (label.startsWith('Continuity entity ID')) return defaultValue;
        if (label === 'Okse year') return year;
        throw new Error(`Unexpected prompt: ${label}`);
      },
      suggester: async (_labels, _values, _required, label) => {
        if (label === 'Era / scope') return era;
        if (label === 'Broad location kind — choose only if useful') return locationKind;
        if (label === 'Atlas target. Marker placement waits until this location has a canonical Lore path') return mapId;
        if (label === 'Add this event to the canonical timeline now?') return Boolean(year);
        if (label === 'How certain is this year?') return certainty;
        throw new Error(`Unexpected suggester: ${label}`);
      },
    },
    user: {
      reference_picker: async (_tp, options) => options.multiple ? [] : '',
    },
    app: {
      metadataCache: {
        getFileCache: (file) => ({
          frontmatter: file?.path === 'Lore/Maps/Errack CITADEL Map.md'
            ? { title: 'Errack CITADEL Map', type: 'map', era: 'CITADEL', mapId: 'errack-citadel' }
            : {},
        }),
      },
      vault: {
        getMarkdownFiles: () => mapId ? [{ path: 'Lore/Maps/Errack CITADEL Map.md', basename: 'Errack CITADEL Map' }] : [],
        getAbstractFileByPath: (relativePath) => {
          if (relativePath.startsWith('Templates/')) return { path: relativePath };
          return { path: relativePath };
        },
        read: async (file) => fs.readFile(path.join(vaultRoot, file.path), 'utf8'),
        createFolder: async () => {},
      },
    },
  };

  return { tp, moves, renames };
}

function loadCreator() {
  delete require.cache[require.resolve(creatorPath)];
  return require(creatorPath);
}

test('direct Location creation writes the shared Lore baseline', async () => {
  const creator = loadCreator();
  const { tp, moves, renames } = mockTemplater({
    title: 'Glass Harbour',
    description: 'A fortified harbour built around a volcanic inlet.',
    era: 'CITADEL',
    locationKind: 'settlement',
    mapId: 'errack-citadel',
  });

  const rendered = await creator(tp, { type: 'location' });
  const parsed = matter(rendered);

  assert.equal(parsed.data.title, 'Glass Harbour');
  assert.equal(parsed.data.type, 'location');
  assert.equal(parsed.data.development_level, 'stub');
  assert.equal(parsed.data.era, 'CITADEL');
  assert.equal(parsed.data.location_kind, 'settlement');
  assert.equal(parsed.data.map.id, 'errack-citadel');
  assert.equal(parsed.data.entity_id, 'glass-harbour');
  assert.equal(parsed.data.description, 'A fortified harbour built around a volcanic inlet.');
  assert.deepEqual(renames, ['Glass Harbour']);
  assert.deepEqual(moves, ['Drafts/Inbox/Locations/Glass Harbour']);
});

test('direct Technology creation stays an Item and writes the technology subtype', async () => {
  const creator = loadCreator();
  const { tp, moves } = mockTemplater({
    title: 'Aether Lathe',
    description: 'A precision machine used to cut Resonant components.',
    era: 'SMOG',
  });

  const rendered = await creator(tp, { type: 'item', itemType: 'technology' });
  const parsed = matter(rendered);

  assert.equal(parsed.data.type, 'item');
  assert.equal(parsed.data.item_type, 'technology');
  assert.equal(parsed.data.development_level, 'stub');
  assert.equal(parsed.data.era, 'SMOG');
  assert.equal(parsed.data.entity_id, 'aether-lathe');
  assert.deepEqual(moves, ['Drafts/Inbox/Items/Aether Lathe']);
});

test('direct Event creation can seed canonical year chronology without inventing day precision', async () => {
  const creator = loadCreator();
  const { tp, moves } = mockTemplater({
    title: 'The Ash Accord',
    description: 'An armistice that ended the first Halvmane border war.',
    era: 'CITADEL',
    year: '9320',
    certainty: 'disputed',
  });

  const rendered = await creator(tp, { type: 'event' });
  const parsed = matter(rendered);

  assert.equal(parsed.data.type, 'event');
  assert.equal(parsed.data.development_level, 'stub');
  assert.equal(parsed.data.era, 'CITADEL');
  assert.equal(parsed.data.entity_id, undefined);
  assert.deepEqual(parsed.data.calendarDate, {
    calendar: 'okse',
    year: 9320,
    month: 'niewmonath',
    day: 1,
    precision: 'year',
    certainty: 'disputed',
  });
  assert.equal(parsed.data.calendarEndDate, null);
  assert.deepEqual(moves, ['Drafts/Inbox/Events/The Ash Accord']);
});
