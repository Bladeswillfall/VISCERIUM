import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd(), '..');
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const sopFiles = [
  'Vault/System/SOPs/Atlas Authoring SOP.md',
  'Vault/System/SOPs/Entity Authoring SOP.md',
  'Vault/System/SOPs/Era Edition Workflow SOP.md',
  'Vault/System/SOPs/Relationship Authoring SOP.md',
  'Vault/System/SOPs/Schema Change SOP.md',
  'Vault/System/SOPs/Sourcebook Readiness SOP.md',
  'Vault/System/SOPs/Story Entity Workflow SOP.md',
  'Vault/System/SOPs/Storyteller View SOP.md',
];

test('all operational SOPs reference the shared documentation writing standard', () => {
  for (const file of sopFiles) {
    const content = read(file);
    assert.match(content, /\[\[Documentation Writing Standard\]\]/, `${file} must reference the writing standard`);
    assert.match(content, /> \*\*Use this SOP when:\*\*/, `${file} must state when to use it`);
    assert.match(content, /> \*\*Result:\*\*/, `${file} must state the expected result`);
    assert.match(content, /> \*\*First action:\*\*/, `${file} must state the first action`);
    assert.match(content, /## Purpose/, `${file} must state its purpose`);
    assert.match(content, /## (Check the result|Check structural health)/, `${file} must include a result or health check`);
    assert.match(content, /## Stop condition/, `${file} must state when the procedure can stop`);
  }
});

test('the World Anvil migration guide gives exact novice-facing Obsidian actions', () => {
  const guide = read('Vault/Drafts/Inbox/World Anvil Migration Review.md');
  assert.match(guide, /World Anvil Import → Review first/);
  assert.match(guide, /Tier 1/);
  assert.match(guide, /Tier 4/);
  assert.match(guide, /## Recommended decision order/);
  assert.match(guide, /VISCERIUM Creator Tools: Set controlled era \/ Universal scope/);
  assert.match(guide, /VISCERIUM Creator Tools: Set continuity entity ID/);
  assert.match(guide, /VISCERIUM Creator Tools: Create era edition from current note/);
  assert.match(guide, /Ctrl\/Cmd \+ P/);
  assert.match(guide, /Convert one import to current format/);
  assert.match(guide, /Update an existing World Anvil import/);
  assert.match(guide, /## Ready to file/);
  assert.match(guide, /does \*\*not\*\* mean the article is ready for publication/);
});

test('creator references record Templater, migration frontmatter, and sidebar actions', () => {
  const commands = read('Vault/System/SOPs/Creator Command Reference.md');
  assert.match(commands, /## Templater commands and hotkeys/);
  assert.match(commands, /does not currently store custom hotkeys/);
  assert.match(commands, /Templater: Insert template/);
  assert.match(commands, /### Update an existing World Anvil import/);
  assert.match(commands, /Do not insert a full creation or type template/);
  assert.match(commands, /No Templater command currently creates or edits the public article facts sidebar/);

  const schema = read('Vault/System/Frontmatter Schema.md');
  assert.match(schema, /### Choose the sidebar you mean/);
  assert.match(schema, /### Article facts sidebar/);
  assert.match(schema, /sidebar:\n  sections:/);
  assert.match(schema, /replaceMeta: true/);

  const publishing = read('Vault/System/Publishing Rules.md');
  assert.match(publishing, /They do not configure the Codex article facts sidebar/);
});

test('the architecture handoff documents current programs and workflows', () => {
  const architecture = JSON.parse(read('Architecture/viscerium-architecture.json'));
  assert.equal(architecture.schema_version, '2.0.0');
  assert.equal(architecture.documentation_style.formal_compliance_claim, false);

  const programs = new Set(architecture.programs.map((program) => program.name));
  for (const required of [
    'Obsidian',
    'Obsidian Bases',
    'Templater',
    'VISCERIUM Creator Tools',
    'StoryLine',
    'VISCERIUM Timelines',
    'Git',
    'GitHub',
    'Astro',
    'Starlight',
    'Telescope',
    'Cloudflare Pages',
  ]) {
    assert.ok(programs.has(required), `architecture must document ${required}`);
  }

  for (const workflow of [
    'worldanvil_migration',
    'story_entity_authoring',
    'era_edition_authoring',
    'public_build',
    'canonical_timeline',
    'storyline_timeline',
    'public_search',
    'git_and_ci',
  ]) {
    assert.ok(Array.isArray(architecture.pipelines[workflow]), `architecture must document ${workflow}`);
    assert.ok(architecture.pipelines[workflow].length > 0, `${workflow} must contain steps`);
  }
});

test('the visual architecture map reflects the current search and era systems', () => {
  const html = read('Architecture/viscerium-architecture.html');
  assert.match(html, /VISCERIUM Creator Tools/);
  assert.match(html, /World Anvil transfer/);
  assert.match(html, /Create an era edition/);
  assert.match(html, /Telescope/);
  assert.match(html, /Pagefind is disabled/);
  assert.match(html, /Programs and plugins/);
  assert.match(html, /Change routing/);
});
