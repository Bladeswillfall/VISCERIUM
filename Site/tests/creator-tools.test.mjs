import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const creatorPlugin = readFileSync(new URL('../../Tools/obsidian-viscerium-creator-tools/src/main.js', import.meta.url), 'utf8');
const creatorStyles = readFileSync(new URL('../../Tools/obsidian-viscerium-creator-tools/styles.css', import.meta.url), 'utf8');
const editingToolbarConfig = JSON.parse(readFileSync(new URL('../../Vault/.obsidian/plugins/editing-toolbar/data.json', import.meta.url), 'utf8'));
const loreTemplate = readFileSync(new URL('../../Vault/Templates/Lore/New Lore Entity.md', import.meta.url), 'utf8');
const loreCreator = readFileSync(new URL('../../Vault/Templates/_Scripts/create_lore_entity.js', import.meta.url), 'utf8');
const storyTemplate = readFileSync(new URL('../../Vault/Templates/Databases/New Story Entity.md', import.meta.url), 'utf8');
const homeHero = readFileSync(new URL('../../Vault/System/Views/Home/Hero/view.js', import.meta.url), 'utf8');
const templaterConfig = JSON.parse(readFileSync(new URL('../../Vault/.obsidian/plugins/templater-obsidian/data.json', import.meta.url), 'utf8'));

test('creator tools own the shared creation entry point used by Home', () => {
  assert.match(creatorPlugin, /id: 'create'/);
  assert.match(creatorPlugin, /name: 'Create\.\.\.'/);
  assert.match(creatorPlugin, /What are you creating\?/);
  assert.match(creatorPlugin, /What kind of worldbuilding\?/);
  assert.match(creatorPlugin, /Templates\/Lore\/New Location\.md/);
  assert.match(creatorPlugin, /Templates\/Lore\/New Event\.md/);
  assert.match(creatorPlugin, /Templates\/Lore\/New Technology\.md/);
  assert.match(creatorPlugin, /Templates\/Publishing\/New Map\.md/);
  assert.match(creatorPlugin, /Templates\/Timelines\/New Timeline\.md/);
  assert.match(homeHero, /viscerium-creator-tools:create/);
  assert.doesNotMatch(homeHero, /templaterCreateCommand|vc-home-create-panel/);
  assert.ok(templaterConfig.enabled_templates_hotkeys.includes('Templates/Lore/New Location.md'));
  assert.ok(templaterConfig.enabled_templates_hotkeys.includes('Templates/Lore/New Event.md'));
  assert.ok(templaterConfig.enabled_templates_hotkeys.includes('Templates/Lore/New Technology.md'));
  assert.ok(templaterConfig.enabled_templates_hotkeys.includes('Templates/Publishing/New Map.md'));
  assert.ok(templaterConfig.enabled_templates_hotkeys.includes('Templates/Timelines/New Timeline.md'));
});

test('Creator Tools hands canonical locations to native Atlas marker placement', () => {
  assert.match(creatorPlugin, /id: 'place-active-location-on-atlas'/);
  assert.match(creatorPlugin, /Place active location on Atlas\.\.\./);
  assert.match(creatorPlugin, /locationFile\.path\.startsWith\('Lore\/'\)/);
  assert.match(creatorPlugin, /frontmatter\.type.*=== 'map'/);
  assert.match(creatorPlugin, /frontmatter\.mapId/);
  assert.match(creatorPlugin, /getLeaf\('split', 'vertical'\)/);
  assert.match(creatorPlugin, /mapLeaf\.setViewState/);
  assert.match(creatorPlugin, /mode: 'preview'/);
  assert.match(creatorPlugin, /source: false/);
  assert.match(creatorPlugin, /processFrontMatter\(locationFile/);
  assert.match(creatorPlugin, /data\.map = \{ \.\.\.existingMap, id: mapId \}/);
  assert.match(creatorPlugin, /Shift-click the position or use Add marker here/);
  assert.match(creatorPlugin, /Insert new map\.\.\./);
});

test('Creator Tools opens canonical era chronology beside active events', () => {
  assert.match(creatorPlugin, /id: 'review-active-event-chronology'/);
  assert.match(creatorPlugin, /Review active event chronology\.\.\./);
  assert.match(creatorPlugin, /Lore\/Eras\/\$\{era\}\.md/);
  assert.match(creatorPlugin, /calendarDate/);
  assert.match(creatorPlugin, /sole canonical start date/);
  assert.match(creatorPlugin, /calendarEndDate only for a genuine period/);
  assert.match(creatorPlugin, /Drafts are not canonical timeline input/);
  assert.match(creatorPlugin, /Refresh compiled timelines/);
});

test('first-party creator plugin is syntactically valid and exposes era/continuity commands', () => {
  assert.doesNotThrow(() => new Function(creatorPlugin));
  assert.match(creatorPlugin, /\['CITADEL', 'SMOG', 'NEARSIGHT', 'ENTROPY'\]/);
  assert.match(creatorPlugin, /\.\.\.HISTORICAL_ERAS, 'Universal'/);
  assert.match(creatorPlugin, /id: 'set-controlled-era'/);
  assert.match(creatorPlugin, /id: 'set-continuity-entity-id'/);
  assert.match(creatorPlugin, /id: 'create-era-edition'/);
  assert.match(creatorPlugin, /Drafts\/Inbox\/Era Editions/);
  assert.match(creatorPlugin, /data\.status = 'draft'/);
  assert.match(creatorPlugin, /delete data\.eras/);
  assert.match(creatorPlugin, /delete data\.publish/);
});

test('creator tools provide one opt-in next action for ordinary notes', () => {
  assert.match(creatorPlugin, /const NOTE_CONTEXT_VIEW = 'viscerium-note-context'/);
  assert.match(creatorPlugin, /class NoteContextView extends ItemView/);
  assert.match(creatorPlugin, /id: 'open-active-note-context'/);
  assert.match(creatorPlugin, /name: 'Open connected context'/);
  assert.match(creatorPlugin, /registerView\(NOTE_CONTEXT_VIEW/);
  assert.match(creatorPlugin, /Write the one-line identity/);
  assert.match(creatorPlugin, /Develop one useful section/);
  assert.match(creatorPlugin, /Decide whether this belongs on an Atlas/);
  assert.match(creatorPlugin, /frontmatter\.map\?\.id/);
  assert.match(creatorPlugin, /Set the historical era/);
  assert.match(creatorPlugin, /Add canonical chronology/);
  assert.match(creatorPlugin, /hasCalendarYear/);
  assert.match(creatorPlugin, /Continue only when something changed/);
  assert.match(creatorPlugin, /getLeavesOfType\(NOTE_CONTEXT_VIEW\)/);
  assert.match(creatorPlugin, /id: 'connect-related-note'/);
  assert.match(creatorPlugin, /CONNECTED CONTEXT/);
  assert.match(creatorPlugin, /contextLinks\(this\.file\)/);
  assert.match(creatorPlugin, /backlinksFor\(this\.file\)/);
  assert.match(creatorPlugin, /calendarDateLabel\(frontmatter\.calendarDate\)/);
  assert.doesNotMatch(creatorPlugin, /note context.*progress|completion percentage/i);
});

test('connected context derives relationships and backlinks from canonical note data', () => {
  const CreatorPlugin = loadCreatorPluginClass();
  const target = { path: 'Lore/Target.md', basename: 'Target', extension: 'md' };
  const source = { path: 'Lore/Source.md', basename: 'Source', extension: 'md' };
  const plugin = Object.create(CreatorPlugin.prototype);
  plugin.frontmatter = (file) => file === target ? {
    region: 'Northreach',
    faction: ['Citadel Council'],
    related: ['[[Lore/Other.md|Other]]'],
    relationships: {
      allies: [{ target: 'Citadel Council', description: 'Duplicate target should not duplicate the UI link.' }],
      rivals: [{ target: 'Rival League' }],
    },
  } : { title: 'Source article' };
  plugin.app = {
    metadataCache: {
      resolvedLinks: {
        'Lore/Source.md': { 'Lore/Target.md': 2 },
      },
    },
    vault: {
      getAbstractFileByPath: (value) => value === source.path ? source : null,
    },
  };

  assert.deepEqual(
    plugin.contextLinks(target).map(({ kind, label }) => [kind, label]),
    [
      ['Region', 'Northreach'],
      ['Faction', 'Citadel Council'],
      ['Related', 'Other'],
      ['rivals', 'Rival League'],
    ],
  );
  assert.deepEqual(
    plugin.backlinksFor(target).map(({ label, count }) => [label, count]),
    [['Source article', 2]],
  );
});

test('editing toolbar keeps the permanent bar small and moves formatting to selection context', () => {
  const top = JSON.stringify(editingToolbarConfig.menuCommands);
  const following = JSON.stringify(editingToolbarConfig.followingCommands);

  assert.equal(editingToolbarConfig.enableTopToolbar, true);
  assert.equal(editingToolbarConfig.enableFollowingToolbar, true);
  assert.match(top, /SubmenuCommands-viscerium-insert/);
  assert.match(top, /SubmenuCommands-viscerium-connect/);
  assert.match(top, /viscerium-creator-tools:open-active-note-context/);
  assert.match(top, /viscerium-creator-tools:connect-related-note/);
  assert.match(top, /viscerium-creator-tools:place-active-location-on-atlas/);
  assert.match(top, /viscerium-creator-tools:review-active-event-chronology/);
  assert.doesNotMatch(top, /change-font-color|change-background-color|fullscreen-focus|justify/);
  assert.match(following, /toggle-bold/);
  assert.match(following, /toggle-italics/);
  assert.match(following, /toggle-highlight/);
  assert.match(following, /insert-wikilink/);
});

test('creator tools provide disposable World Anvil review context in the right sidebar', () => {
  assert.match(creatorPlugin, /const IMPORT_REVIEW_VIEW = 'viscerium-import-review'/);
  assert.match(creatorPlugin, /worldanvil-migration-review:start/);
  assert.match(creatorPlugin, /registerView\(IMPORT_REVIEW_VIEW/);
  assert.match(creatorPlugin, /getRightLeaf\(false\)/);
  assert.match(creatorPlugin, /workspace\.revealLeaf\(leaf\)/);
  assert.match(creatorPlugin, /workspace\.on\('file-open'/);
  assert.match(creatorPlugin, /vault\.on\('modify'/);
  assert.match(creatorPlugin, /open-worldanvil-import-review/);
  assert.match(creatorPlugin, /Review complete/);
  assert.match(creatorPlugin, /No file was moved, deleted, published or made canonical/);
});

test('World Anvil review tasks use the note checklist as source and keep generated issue mirrors aligned', () => {
  assert.match(creatorPlugin, /setImportReviewTask/);
  assert.match(creatorPlugin, /await this\.app\.vault\.modify\(file, after\)/);
  assert.match(creatorPlugin, /syncImportIssueMirror/);
  assert.match(creatorPlugin, /await this\.syncImportIssueMirror\(file\)/);
  assert.match(creatorPlugin, /processFrontMatter\(file/);
  assert.match(creatorPlugin, /if \(checked\) next\.delete\(issue\)/);
  assert.match(creatorPlugin, /else next\.add\(issue\)/);
});

test('World Anvil review context supports same-title comparison and priority queue navigation', () => {
  assert.match(creatorPlugin, /findCurrentCodexMatch/);
  assert.match(creatorPlugin, /getLeaf\('split', 'vertical'\)/);
  assert.match(creatorPlugin, /Open .* side-by-side/);
  assert.match(creatorPlugin, /records\.sort\(\(a, b\) => a\.rank - b\.rank \|\| b\.issueCount - a\.issueCount/);
  assert.match(creatorPlugin, /← Previous/);
  assert.match(creatorPlugin, /Next →/);
  assert.match(creatorPlugin, /WORLDANVIL_BASE_PATH/);
});

test('multi-era imports remain in contextual review until their structural split is resolved', () => {
  assert.match(creatorPlugin, /'multi-era-review'/);
  assert.match(creatorPlugin, /eraCount\(frontmatter\) > 1/);
  assert.match(creatorPlugin, /Resolve multi-era continuity into deliberate historical editions/);
  assert.match(creatorPlugin, /Open era-edition workflow guide/);
});

test('connected context sidebar uses editorial module cards', () => {
  assert.match(creatorStyles, /\.vc-note-context-module\s*\{/);
  assert.match(creatorStyles, /border-left:\s*2px solid color-mix/);
  assert.match(creatorStyles, /\.vc-note-context-next\s*\{/);
  assert.match(creatorStyles, /--vc-context-card/);
});

test('import review pane follows creator visual grammar', () => {
  assert.match(creatorStyles, /\.vc-import-review/);
  assert.match(creatorStyles, /\.vc-note-context/);
  assert.match(creatorStyles, /border-radius: var\(--vc-radius-control, 4px\)/);
  assert.match(creatorStyles, /vc-review-danger/);
  assert.match(creatorStyles, /vc-review-warning/);
  assert.match(creatorStyles, /vc-review-reference/);
  assert.match(creatorStyles, /vc-review-success/);
});

test('creator templates use the controlled era vocabulary and continuity IDs', () => {
  assert.match(loreTemplate, /tp\.user\.create_lore_entity\(tp\)/);
  assert.match(loreCreator, /const ERA_OPTIONS = \[\.\.\.HISTORICAL_ERAS, "Universal"\]/);
  assert.match(loreCreator, /entity_id/);
  assert.match(loreCreator, /itemType/);
  assert.match(loreCreator, /technology: "Technology"/);
  assert.doesNotMatch(loreCreator, /publish:\s*false/);

  assert.match(storyTemplate, /const ERA_OPTIONS = \["CITADEL", "SMOG", "NEARSIGHT", "ENTROPY", "Universal"\]/);
  assert.match(storyTemplate, /Continuity entity ID/);
  assert.match(storyTemplate, /replace\(\/\^publish:/);
});


function loadCreatorPluginClass() {
  class EmptyView {}
  class TFile {}
  const obsidian = {
    ItemView: EmptyView,
    Modal: class {},
    Notice: class {},
    Plugin: class {},
    Setting: class {},
    SuggestModal: class {},
    TFile,
    normalizePath: (value) => value,
  };
  const localModule = { exports: {} };
  const localRequire = (name) => {
    assert.equal(name, 'obsidian');
    return obsidian;
  };
  new Function('require', 'module', 'exports', creatorPlugin)(localRequire, localModule, localModule.exports);
  return localModule.exports;
}

test('note context keeps Atlas placement pending until a linked marker exists', async () => {
  const CreatorPlugin = loadCreatorPluginClass();
  const location = {
    path: 'Lore/Eras/CITADEL/Locations/Test Location.md',
    basename: 'Test Location',
  };
  const mapNote = {
    path: 'Lore/Eras/CITADEL/Errack CITADEL Map.md',
    basename: 'Errack CITADEL Map',
  };
  const frontmatter = new Map([
    [location, {
      title: 'Test Location',
      description: 'A canonical test location.',
      type: 'location',
      status: 'published',
      development_level: 'complete',
      map: { id: 'errack-citadel' },
    }],
    [mapNote, {
      title: 'Errack CITADEL',
      type: 'map',
      mapId: 'errack-citadel',
      mapMarkers: 'Assets/Maps/Errack-CITADEL.canonical.markers.json',
    }],
  ]);
  let sidecar = { markers: [] };

  const plugin = Object.create(CreatorPlugin.prototype);
  plugin.app = {
    metadataCache: {
      getFileCache: (file) => ({ frontmatter: frontmatter.get(file) ?? {} }),
    },
    vault: {
      getMarkdownFiles: () => [mapNote],
      adapter: {
        exists: async () => true,
        read: async () => JSON.stringify(sidecar),
      },
    },
  };

  let next = await plugin.noteNextAction(location);
  assert.equal(next.action, 'atlas');
  assert.equal(next.label, 'Place this location on its Atlas');

  sidecar = {
    markers: [{
      link: '[[Lore/Eras/CITADEL/Locations/Test Location]]',
    }],
  };
  next = await plugin.noteNextAction(location);
  assert.equal(next.action, undefined);
  assert.equal(next.label, 'Continue only when something changed');
});
