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
const creatorPath = path.join(vaultRoot, 'Templates/_Scripts/create_map.js');

function loadCreator() {
  delete require.cache[require.resolve(creatorPath)];
  return require(creatorPath);
}

test('guided Map creation writes Atlas identity and derives image paths', async () => {
  const creator = loadCreator();
  const template = await fs.readFile(path.join(vaultRoot, 'Templates/Publishing/Map Template.md'), 'utf8');

  const tp = {
    file: { title: 'Untitled' },
    user: {
      create_from_skeleton: async () => {
        tp.file.title = 'Northern Shelf';
        return template.replace(/^title:\s*["']?\{\{title\}\}["']?\s*$/m, 'title: "Northern Shelf"');
      },
    },
    system: {
      prompt: async (label, defaultValue = '') => {
        if (label === 'One-line map purpose (optional)') return 'Regional Atlas map of the Northern Shelf.';
        if (label === 'Map ID') return defaultValue;
        throw new Error(`Unexpected prompt: ${label}`);
      },
      suggester: async (_labels, _values, _required, label) => {
        if (label === 'Era / scope') return 'NEARSIGHT';
        if (label === 'Map image') return 'Assets/Maps/Northern-Shelf.webp';
        throw new Error(`Unexpected suggester: ${label}`);
      },
    },
    app: {
      metadataCache: {
        getFileCache: () => ({ frontmatter: {} }),
      },
      vault: {
        getMarkdownFiles: () => [],
        getFiles: () => [
          { path: 'Assets/Maps/Northern-Shelf.webp' },
          { path: 'Assets/Maps/Northern-Shelf.webp.markers.json' },
          { path: 'Assets/Images/Not-A-Map.webp' },
        ],
      },
    },
  };

  const rendered = await creator(tp);
  const parsed = matter(rendered);

  assert.equal(parsed.data.title, 'Northern Shelf');
  assert.equal(parsed.data.type, 'map');
  assert.equal(parsed.data.description, 'Regional Atlas map of the Northern Shelf.');
  assert.equal(parsed.data.era, 'NEARSIGHT');
  assert.equal(parsed.data.mapId, 'northern-shelf');
  assert.equal(parsed.data.image, '/assets/maps/Northern-Shelf.webp');
  assert.equal(parsed.data.mapMarkers, 'Assets/Maps/Northern-Shelf.webp.markers.json');
  assert.equal(parsed.data.width, null);
  assert.equal(parsed.data.height, null);
  assert.match(parsed.content, /```zoommap/);
  assert.match(parsed.content, /image: Assets\/Maps\/Northern-Shelf\.webp/);
  assert.match(parsed.content, /markers: Assets\/Maps\/Northern-Shelf\.webp\.markers\.json/);
  assert.match(parsed.content, /id: northern-shelf-authoring/);
  assert.match(parsed.content, /responsive: false/);
  assert.match(parsed.content, /render: canvas/);
  assert.match(parsed.content, /Shift-click/);
});

test('guided Map creation suggests a unique mapId', () => {
  const creator = loadCreator();
  const file = { path: 'Lore/Maps/Northern Shelf.md' };
  const tp = {
    app: {
      metadataCache: {
        getFileCache: (candidate) => candidate === file ? { frontmatter: { mapId: 'northern-shelf' } } : { frontmatter: {} },
      },
      vault: {
        getMarkdownFiles: () => [file],
      },
    },
  };

  assert.equal(creator.suggestedMapId(tp, 'Northern Shelf'), 'northern-shelf-2');
});


test('CITADEL authoring map opens in an interactive working view', async () => {
  const source = await fs.readFile(
    path.join(vaultRoot, 'Lore/Eras/CITADEL/Errack CITADEL Map.md'),
    'utf8',
  );

  assert.match(source, /responsive: false/);
  assert.match(source, /render: canvas/);
  assert.match(source, /view:\n\s+zoom: 0\.2\n\s+centerX: 0\.5\n\s+centerY: 0\.5/);
  assert.match(source, /Shift-click/);
  assert.match(source, /Right-click/);
});
