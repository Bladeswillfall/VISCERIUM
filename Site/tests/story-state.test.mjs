import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const script = readFileSync(new URL('../../Vault/Templates/_Scripts/storyline_state.js', import.meta.url), 'utf8');
const addChange = readFileSync(new URL('../../Vault/Templates/StoryLine/Add Story Change.md', import.meta.url), 'utf8');
const openState = readFileSync(new URL('../../Vault/Templates/StoryLine/Open Story State.md', import.meta.url), 'utf8');
const startup = readFileSync(new URL('../../Vault/Templates/_Startup/Ensure StoryLine Fields.md', import.meta.url), 'utf8');
const stateView = readFileSync(new URL('../../Vault/System/Views/Story State.md', import.meta.url), 'utf8');
const stateStyles = readFileSync(new URL('../../Vault/.obsidian/snippets/Story State.css', import.meta.url), 'utf8');
const templaterConfig = JSON.parse(readFileSync(new URL('../../Vault/.obsidian/plugins/templater-obsidian/data.json', import.meta.url), 'utf8'));
const appearance = JSON.parse(readFileSync(new URL('../../Vault/.obsidian/appearance.json', import.meta.url), 'utf8'));

test('StoryLine state helper is syntactically valid and seeds native scene fields', () => {
  assert.doesNotThrow(() => new Function('module', 'exports', script));
  for (const [id, key] of [
    ['viscerium-want', 'viscerium_want'],
    ['viscerium-pressure', 'viscerium_pressure'],
    ['viscerium-after', 'viscerium_after'],
    ['viscerium-turn', 'viscerium_turn'],
    ['viscerium-cost', 'viscerium_cost'],
  ]) {
    assert.match(script, new RegExp(id));
    assert.match(script, new RegExp(key));
  }
  assert.match(script, /category: "scene"/);
  assert.match(script, /field-templates\.json/);
  assert.match(script, /storyLine\?\.fieldTemplates/);
});

test('StoryLine project inference preserves nested project roots', () => {
  const loadInferProjectBase = new Function('module', 'exports', `${script}\nreturn inferProjectBase;`);
  const inferProjectBase = loadInferProjectBase({ exports: {} }, {});
  const tp = {
    app: {
      plugins: {
        plugins: {
          storyline: { settings: { storyLineRoot: 'Stories' } },
        },
      },
    },
  };

  assert.equal(inferProjectBase(tp, 'Stories/My Novel/Scenes/Opening.md'), 'Stories/My Novel');
  assert.equal(inferProjectBase(tp, 'Stories/My Novel/My Novel.md'), 'Stories/My Novel');
  assert.equal(inferProjectBase(tp, 'Stories/My Series/Book One/Scenes/Opening.md'), 'Stories/My Series/Book One');
  assert.equal(inferProjectBase(tp, 'Lore/Events/Battle.md'), null);
});

test('story changes are appended as authored event history', () => {
  assert.match(script, /viscerium_events/);
  assert.match(script, /kind: "information"/);
  assert.match(script, /kind: "relationship"/);
  assert.match(script, /kind: "power"/);
  assert.match(script, /kind: "consequence"/);
  assert.match(script, /kind: "consequence-update"/);
  assert.match(script, /data\.viscerium_events = \[\.\.\.existing,/);
  assert.doesNotMatch(script, /current_relationship_state|current_information_state|current_power_state/);
});

test('Templater exposes one story-change action and one derived state view', () => {
  assert.match(addChange, /storyline_state\(tp, "add-change"\)/);
  assert.match(openState, /storyline_state\(tp, "open-state"\)/);
  assert.match(startup, /storyline_state\(tp, "startup"\)/);
  assert.ok(templaterConfig.enabled_templates_hotkeys.includes('Templates/StoryLine/Add Story Change.md'));
  assert.ok(templaterConfig.enabled_templates_hotkeys.includes('Templates/StoryLine/Open Story State.md'));
  assert.ok(templaterConfig.startup_templates.includes('Templates/_Startup/Ensure StoryLine Fields.md'));
});

test('Open Story State passes the selected project and active scene into the shared state view', () => {
  assert.match(script, /workspace\.__visceriumStoryStateProjectBase = project\.base/);
  assert.match(stateView, /workspace\?\.__visceriumStoryStateProjectBase/);
  assert.doesNotMatch(stateView, /delete app\.workspace\.__visceriumStoryStateProjectBase/);
  assert.match(script, /workspace\.__visceriumStoryStateScenePath = active\.path/);
  assert.match(stateView, /workspace\?\.__visceriumStoryStateScenePath/);
  assert.doesNotMatch(stateView, /delete app\.workspace\.__visceriumStoryStateScenePath/);
});

test('Story State derives the four working views from scene events', () => {
  assert.match(stateView, /```dataviewjs/);
  assert.match(stateView, /viscerium_events/);
  assert.match(stateView, /Current Pressures/);
  assert.match(stateView, /Character State/);
  assert.match(stateView, /Information Map/);
  assert.match(stateView, /Relationships \/ Power/);
  assert.match(stateView, /Scene Context/);
  assert.match(stateView, /activeScene\.notesFile/);
  assert.match(stateView, /notesPage\?\.file\?\.outlinks/);
  assert.match(stateView, /Research\//);
  assert.match(stateView, /Codex\//);
  assert.match(stateView, /projectPage\?\.seriesId/);
  assert.match(stateView, /codexPrefixes/);
  assert.match(stateView, /consequence-update/);
  assert.match(stateView, /Dependence is rising while trust is falling/);
  assert.match(stateView, /latestByActorType\.set\(`\$\{event\.actor\}\\u0000\$\{event\.type\}`/);
  assert.doesNotMatch(stateView, /processFrontMatter|vault\.modify/);
});

test('Story State presentation follows the creator UI grammar', () => {
  assert.match(stateStyles, /\.vc-story-state/);
  assert.match(stateStyles, /\.vc-story-state-title-row/);
  assert.doesNotMatch(stateView, /vc-story-state-kicker|STORYLINE/);
  assert.doesNotMatch(stateStyles, /border-bottom:\s*1px solid/);
  assert.doesNotMatch(stateStyles, /box-shadow|linear-gradient|border-radius:\s*(?!4px)/);
  assert.ok(appearance.enabledCssSnippets.includes('Story State'));
});

test('Scene Context survives refreshes and resolves sibling project notes and relative scene notes', () => {
  const block = stateView.match(/\`\`\`dataviewjs\n([\s\S]*?)\n\`\`\`/)?.[1];
  assert.ok(block, 'Story State Dataview script exists');

  class Element {
    constructor(tag = 'div', options = {}) {
      this.tag = tag;
      this.text = options.text ?? '';
      this.children = [];
      this.classList = { add() {} };
    }
    createEl(tag, options) {
      const child = new Element(tag, options);
      this.children.push(child);
      return child;
    }
    createDiv(options) { return this.createEl('div', options); }
    createSpan(options) { return this.createEl('span', options); }
    addEventListener() {}
    texts() { return [this.text, ...this.children.flatMap((child) => child.texts())]; }
  }

  for (const projectBase of ['Stories/My Series/Book One', 'Stories/My Novel']) {
    const title = projectBase.split('/').at(-1);
    const scenePath = `${projectBase}/Scenes/Opening.md`;
    const notesPath = `${projectBase}/SceneNotes/Opening.md`;
    const researchPath = `${projectBase}/Research/Source.md`;
    const seriesCodexPath = `${projectBase.split('/').slice(0, -1).join('/')}/Codex/Shared.md`;
    const projectNotePath = projectBase.includes('/My Series/')
      ? projectBase : `${projectBase}/${title}`;
    const pages = [
      { type: 'scene', title: 'Opening', file: { path: scenePath, name: 'Opening', outlinks: [] },
        notesFile: 'SceneNotes/Opening.md' },
      { file: { path: notesPath, outlinks: [{ path: researchPath }, { path: seriesCodexPath }] } },
    ];
    const projectNote = { seriesId: 'series-1', file: { path: `${projectNotePath}.md` } };
    const workspace = {
      __visceriumStoryStateProjectBase: projectBase,
      __visceriumStoryStateScenePath: scenePath,
      getActiveFile: () => ({ path: 'System/Views/Story State.md' }),
      openLinkText() {},
    };
    const app = { workspace, plugins: { plugins: { storyline: { settings: { storyLineRoot: 'Stories' } } } } };
    const queried = [];
    const render = () => {
      const container = new Element();
      const dv = {
        container, pages: () => pages,
        page(path) {
          queried.push(path);
          if (path === projectNotePath) return projectNote;
          return pages.find((page) => page.file.path === path) ?? null;
        },
        el: (_tag, value) => container.createEl('p', { text: value }),
      };
      new Function('app', 'dv', block)(app, dv);
      return container.texts().filter(Boolean);
    };

    const first = render();
    const second = render();
    for (const texts of [first, second]) {
      assert.ok(texts.includes('Scene Context'), 'selected scene remains visible on both renders');
      assert.ok(texts.includes('Scene notes'), 'scene notes reference is included');
      assert.ok(texts.includes('Research'), 'project-relative notes contribute research links');
      assert.ok(texts.includes('Project references'), 'series-level Codex links are included');
    }
    assert.ok(queried.includes(notesPath), 'Dataview looks up the qualified notes path');
    assert.ok(queried.includes(projectNotePath), 'Dataview finds the supported project-note location');
    assert.equal(workspace.__visceriumStoryStateScenePath, scenePath, 'refresh preserves scene selection');
    assert.equal(workspace.__visceriumStoryStateProjectBase, projectBase, 'refresh preserves project selection');
  }
});
