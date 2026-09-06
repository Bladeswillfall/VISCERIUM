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

test('Story State derives the four working views from scene events', () => {
  assert.match(stateView, /```dataviewjs/);
  assert.match(stateView, /viscerium_events/);
  assert.match(stateView, /Current Pressures/);
  assert.match(stateView, /Character State/);
  assert.match(stateView, /Information Map/);
  assert.match(stateView, /Relationships \/ Power/);
  assert.match(stateView, /consequence-update/);
  assert.match(stateView, /Dependence is rising while trust is falling/);
  assert.doesNotMatch(stateView, /processFrontMatter|vault\.modify/);
});

test('Story State presentation follows the creator UI grammar', () => {
  assert.match(stateStyles, /\.vc-story-state/);
  assert.match(stateStyles, /border-bottom: 1px solid/);
  assert.doesNotMatch(stateStyles, /box-shadow|linear-gradient|border-radius:\s*(?!4px)/);
  assert.ok(appearance.enabledCssSnippets.includes('Story State'));
});
