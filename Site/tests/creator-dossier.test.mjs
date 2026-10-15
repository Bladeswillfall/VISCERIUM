import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const creator = readFileSync(new URL('../../Tools/obsidian-viscerium-creator-tools/src/main.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../../Tools/obsidian-viscerium-creator-tools/styles.css', import.meta.url), 'utf8');

function harness() {
  const sourcePath = 'Lore/Eras/CITADEL/Characters/Source.md';
  const targetPath = 'Lore/Eras/CITADEL/Factions/Target.md';

  class TFile {
    constructor(path) {
      this.path = path;
      const name = path.split('/').at(-1);
      this.name = name;
      this.basename = name.replace(/\.[^.]+$/, '');
      this.extension = name.split('.').at(-1);
    }
  }

  class SuggestModal {
    setPlaceholder(value) { this.placeholder = value; }
    open() {
      const candidates = this.getSuggestions('');
      if (this.placeholder === 'Connect to which article?') {
        assert.ok(!candidates.some((item) => item.value.startsWith('Drafts/')), 'published notes cannot connect to drafts');
      }
      const selected = candidates.find((item) => (
        this.placeholder === 'Relationship type' ? item.value === 'allies' : item.value === targetPath
      ));
      assert.ok(selected, `Missing allowed choice for ${this.placeholder}`);
      this.onChooseSuggestion(selected);
      this.onClose();
    }
    onClose() {}
  }

  class Modal {
    open() { this.submit('forest, war'); }
    close() { this.onClose(); }
  }

  const files = [
    new TFile(sourcePath),
    new TFile(targetPath),
    new TFile('Drafts/Lore/Unpublished.md'),
    new TFile('Lore/Unpublished.md'),
  ];
  const artwork = new TFile('Assets/Images/640faf5b8cd2814de13871ff58c900b6.webp');
  const records = new Map([
    [files[0], {
      title: 'Source', type: 'character', status: 'published', era: 'CITADEL', faction: 'Target',
      image: artwork.name, alt: 'Source artwork', description: 'An illustrated source article.', tags: [], relationships: {},
    }],
    [files[1], { title: 'Target', type: 'faction', status: 'published', era: 'CITADEL' }],
    [files[2], { title: 'Unpublished', type: 'faction', status: 'draft' }],
    [files[3], { title: 'Unpublished public path', type: 'faction', status: 'draft', image: artwork.name }],
  ]);
  const app = {
    vault: {
      getMarkdownFiles: () => files,
      getFiles: () => [...files, artwork],
      getAbstractFileByPath: (path) => files.find((file) => file.path === path) ?? null,
    },
    metadataCache: {
      getFileCache: (file) => ({ frontmatter: records.get(file) }),
      getFirstLinkpathDest: (path) => files.find((file) => file.path.replace(/\.md$/, '').toLowerCase() === path.toLowerCase()) ?? null,
    },
    fileManager: {
      processFrontMatter: async (file, update) => update(records.get(file)),
    },
  };
  const module = { exports: {} };
  const require = (name) => {
    assert.equal(name, 'obsidian');
    return {
      ItemView: class {}, Modal, Notice: class {}, Plugin: class {}, Setting: class {},
      SuggestModal, TFile, normalizePath: (value) => value,
    };
  };
  new Function('require', 'module', 'exports', `${creator}\nmodule.exports.__dossierTests = { semanticRelations, displayFact, LoreGalleryView };`)(
    require, module, module.exports,
  );
  const plugin = Object.create(module.exports.prototype);
  plugin.app = app;
  plugin.refreshNoteContext = async () => {};
  return { plugin, records, source: files[0], target: files[1], artwork, helpers: module.exports.__dossierTests };
}

test('creator dossier retains one canonical frontmatter record for typed relationships and tags', async () => {
  const { plugin, records, source, target, helpers } = harness();
  const frontmatter = records.get(source);

  await plugin.addSemanticRelationship(source);
  assert.deepEqual(frontmatter.relationships.allies, [`[[${target.path.slice(0, -3)}|Target]]`]);

  await plugin.addSemanticRelationship(source);
  assert.equal(frontmatter.relationships.allies.length, 1, 'repeated authoring does not add duplicate edges');

  await plugin.editDossierFact(source, 'faction', 'faction');
  assert.equal(frontmatter.faction, 'Target');

  await plugin.editDossierTags(source);
  assert.deepEqual(frontmatter.tags, ['forest', 'war']);
  assert.equal(frontmatter.status, 'published', 'the dossier must not change publication state');

  const linked = frontmatter.relationships.allies[0];
  await plugin.removeSemanticRelationship(source, 'allies', linked);
  assert.deepEqual(frontmatter.relationships, {}, 'remove preserves every other frontmatter field');

  const richer = { target: '[[A Rival]]', since: '412 EC', description: 'Historical pact', directed: false };
  frontmatter.relationships = { allies: [richer] };
  assert.equal(helpers.semanticRelations(frontmatter)[0].entry, richer, 'existing relationship metadata is retained');
  assert.equal(helpers.displayFact('[[Lore/Somewhere|Somewhere]]'), 'Somewhere');
});

test('the dossier uses existing plugin context and theme styles without website-only fields', () => {
  assert.match(creator, /renderDossier\(root, frontmatter, type\)/);
  assert.match(creator, /this\.renderDossier\(root, frontmatter, type\)/);
  assert.match(creator, /async addSemanticRelationship\(file\)/);
  assert.match(creator, /data\.relationships = groups/);
  assert.match(creator, /data\.tags = updated/);
  assert.match(creator, /this\.app\.metadataCache\.on\('changed'/);
  assert.match(styles, /\.vc-dossier-hero/);
  assert.match(styles, /\.vc-dossier-network/);
  assert.match(styles, /var\(--vc-context-card\)/);
});

test('visual Lore browsing resolves hash-named artwork and exposes only illustrated published Lore', () => {
  const { plugin, source, artwork } = harness();

  assert.equal(plugin.dossierImageFile(source, artwork.name), artwork, 'hash-named Assets artwork resolves by filename');
  assert.deepEqual(
    plugin.visualLoreEntries().map((entry) => [entry.title, entry.eras, entry.type, entry.factions, entry.image]),
    [['Source', ['CITADEL'], 'character', ['Target'], artwork]],
  );
  assert.match(creator, /id: 'open-visual-lore-browser'/);
  assert.match(creator, /class LoreGalleryView extends ItemView/);
  assert.match(styles, /\.vc-lore-gallery-cards/);
});

test('open Visual Lore galleries follow metadata, file moves, and artwork changes', async () => {
  const { plugin, records, source, artwork, helpers } = harness();
  const callbacks = { metadata: {}, vault: {} };

  class Element {
    constructor(options = {}) {
      this.text = options.text || '';
      this.cls = options.cls || '';
      this.children = [];
    }
    empty() { this.children = []; }
    addClass(value) { this.cls = value; }
    createEl(_tag, options = {}) {
      const child = new Element(options);
      this.children.push(child);
      return child;
    }
    createDiv(options = {}) { return this.createEl('div', options); }
    find(cls) {
      if (this.cls === cls) return this;
      return this.children.map((child) => child.find(cls)).find(Boolean) || null;
    }
  }

  const view = new helpers.LoreGalleryView(null, plugin);
  view.app = plugin.app;
  view.contentEl = new Element();
  view.registerDomEvent = () => {};
  plugin.app.vault.getResourcePath = () => 'app://test-artwork';
  let refreshes = 0;
  const originalRefresh = view.refresh.bind(view);
  view.refresh = async () => { refreshes += 1; await originalRefresh(); };

  plugin.app.workspace = {
    getLeavesOfType: (kind) => kind === 'viscerium-lore-gallery' ? [{ view }] : [],
    onLayoutReady: (callback) => callback(),
    getActiveFile: () => null,
    on: () => ({}),
  };
  plugin.app.metadataCache.on = (name, callback) => { callbacks.metadata[name] = callback; return {}; };
  plugin.app.vault.on = (name, callback) => { callbacks.vault[name] = callback; return {}; };
  plugin.registerView = () => {};
  plugin.addCommand = () => {};
  plugin.registerEvent = () => {};

  await plugin.onload();
  await view.refresh();
  const count = () => view.contentEl.find('vc-lore-gallery-count')?.text;
  assert.equal(count(), '1 illustrated article');

  records.get(source).status = 'draft';
  callbacks.metadata.changed(source);
  assert.equal(count(), '0 illustrated articles', 'unpublished notes disappear without reopening the gallery');

  records.get(source).status = 'published';
  records.get(source).era = 'SMOG';
  callbacks.metadata.changed(source);
  assert.ok(view.contentEl.find('vc-lore-gallery-cards'), 'newly published notes reappear after metadata refresh');
  assert.equal(view.options(plugin.visualLoreEntries(), 'eras')[0], 'SMOG');

  view.filters.faction = 'Target';
  records.get(source).faction = 'Other';
  callbacks.metadata.changed(source);
  assert.equal(view.filters.faction, '', 'a removed filter option is cleared');
  assert.equal(count(), '1 illustrated article');

  const originalPath = source.path;
  source.path = 'Drafts/Lore/Source.md';
  callbacks.vault.rename(source, originalPath);
  assert.equal(count(), '0 illustrated articles', 'moving a note out of Lore removes its card');

  source.path = originalPath;
  callbacks.vault.rename(source, 'Drafts/Lore/Source.md');
  assert.equal(count(), '1 illustrated article', 'moving it back restores its card');

  const oldArtworkPath = artwork.path;
  artwork.path = 'Private/Images/removed.webp';
  callbacks.vault.rename(artwork, oldArtworkPath);
  assert.equal(count(), '0 illustrated articles', 'renaming artwork out of Assets removes a broken card');

  const before = refreshes;
  callbacks.metadata.changed({ path: 'System/Unrelated.md' });
  assert.equal(refreshes, before, 'non-Lore metadata changes do not rebuild the gallery');
});
