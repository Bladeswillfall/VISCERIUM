import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(
  new URL('../../Vault/System/Views/Article/Location Context/view.js', import.meta.url),
  'utf8',
);
const styles = await readFile(
  new URL('../../Vault/.obsidian/snippets/Callout styling.css', import.meta.url),
  'utf8',
);

class FakeElement {
  constructor({ text = '', cls = '' } = {}) {
    this.text = text;
    this.cls = cls;
    this.children = [];
    this.handlers = {};
    this.style = {};
    this.attributes = {};
  }
  createDiv(options = {}) { return this.append(new FakeElement(options)); }
  createEl(_tag, options = {}) { return this.append(new FakeElement(options)); }
  createSpan(options = {}) { return this.append(new FakeElement(options)); }
  append(child) { this.children.push(child); return child; }
  addClass(name) { this.cls = [this.cls, name].filter(Boolean).join(' '); }
  setAttribute(name, value) { this.attributes[name] = value; }
  setText(value) { this.text = value; }
  addEventListener(name, handler) { this.handlers[name] = handler; }
  findByText(text) {
    if (this.text === text) return this;
    for (const child of this.children) {
      const match = child.findByText(text);
      if (match) return match;
    }
    return null;
  }
  findByClass(name) {
    if (String(this.cls).split(/\s+/).includes(name)) return this;
    for (const child of this.children) {
      const match = child.findByClass(name);
      if (match) return match;
    }
    return null;
  }
}

test('Location context opens the linked Atlas note in Reading view', async () => {
  const location = { path: 'Lore/Eras/CITADEL/Locations/Test Location.md', basename: 'Test Location' };
  const mapNote = { path: 'Lore/Eras/CITADEL/Errack CITADEL Map.md', basename: 'Errack CITADEL Map' };
  const image = { path: 'Assets/Maps/Errack-CITADEL.webp', extension: 'webp' };
  const frontmatter = new Map([
    [location, {
      title: 'Test Location',
      type: 'location',
      era: 'CITADEL',
      location_kind: 'settlement',
      map: { id: 'errack-citadel' },
    }],
    [mapNote, {
      title: 'Errack CITADEL',
      type: 'map',
      era: 'CITADEL',
      mapId: 'errack-citadel',
      image: '/assets/maps/Errack-CITADEL.webp',
      width: 7680,
      height: 3840,
    }],
  ]);

  const root = new FakeElement();
  let viewState = null;
  let activeLeaf = null;
  const leaf = {
    async setViewState(state) { viewState = state; },
  };
  const app = {
    metadataCache: {
      getFileCache: (file) => ({ frontmatter: frontmatter.get(file) ?? {} }),
    },
    vault: {
      getAbstractFileByPath(path) {
        if (path === location.path) return location;
        if (path === image.path) return image;
        return null;
      },
      getMarkdownFiles: () => [location, mapNote],
      getResourcePath: () => 'app://map-image',
      adapter: {
        exists: async () => false,
      },
    },
    workspace: {
      getLeaf(mode, direction) {
        assert.equal(mode, 'split');
        assert.equal(direction, 'vertical');
        return leaf;
      },
      setActiveLeaf(nextLeaf, options) {
        activeLeaf = { leaf: nextLeaf, options };
      },
    },
  };
  const dv = {
    current: () => ({ file: { path: location.path } }),
    container: root,
  };

  const run = new Function('dv', 'app', `return async function () {\n${source}\n}`)(dv, app);
  await run();

  const button = root.findByText('Place on map');
  assert.ok(button, 'expected a canonical Location to expose Place on map');

  const preview = root.findByClass('vc-article-map-preview');
  const status = root.findByClass('vc-article-map-status');
  assert.equal(preview.attributes.role, 'img');
  assert.ok(status, 'expected visible Atlas placement status');
  assert.equal(status.text, 'Map linked. Open it and Shift-click to place this location.');
  assert.ok(!preview.children.includes(status), 'Atlas status must sit outside the role=img preview');

  await button.handlers.click();

  assert.deepEqual(viewState, {
    type: 'markdown',
    state: {
      file: mapNote.path,
      mode: 'preview',
      source: false,
    },
    active: true,
  });
  assert.deepEqual(activeLeaf, {
    leaf,
    options: { focus: true },
  });
});


test('Location context uses plain metadata hierarchy instead of chip badges', () => {
  assert.match(source, /vc-article-context-facts/);
  assert.doesNotMatch(source, /vc-article-context-chip/);
  assert.match(styles, /\.vc-article-context-fact/);
  assert.doesNotMatch(styles, /\.vc-article-context-chip/);
});
