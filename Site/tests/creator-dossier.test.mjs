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
      this.basename = path.split('/').at(-1).replace(/\.md$/, '');
      this.extension = 'md';
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
  ];
  const records = new Map([
    [files[0], { title: 'Source', type: 'character', status: 'published', era: 'CITADEL', tags: [], relationships: {} }],
    [files[1], { title: 'Target', type: 'faction', status: 'published', era: 'CITADEL' }],
    [files[2], { title: 'Unpublished', type: 'faction', status: 'draft' }],
  ]);
  const app = {
    vault: {
      getMarkdownFiles: () => files,
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
  new Function('require', 'module', 'exports', `${creator}\nmodule.exports.__dossierTests = { semanticRelations, displayFact };`)(
    require, module, module.exports,
  );
  const plugin = Object.create(module.exports.prototype);
  plugin.app = app;
  plugin.refreshNoteContext = async () => {};
  return { plugin, records, source: files[0], target: files[1], helpers: module.exports.__dossierTests };
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
