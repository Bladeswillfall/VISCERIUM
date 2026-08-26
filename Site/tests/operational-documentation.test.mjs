import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd(), '..');
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

function between(content, start, end) {
  const startIndex = content.indexOf(start);
  assert.ok(startIndex >= 0, `Missing section start: ${start}`);
  const endIndex = content.indexOf(end, startIndex + start.length);
  assert.ok(endIndex > startIndex, `Missing section end after ${start}: ${end}`);
  return content.slice(startIndex, endIndex);
}

function htmlProgram(content, name) {
  const row = content.split('\n').find((line) => line.startsWith(`['${name}'`));
  assert.ok(row, `Missing visual architecture program: ${name}`);
  return row;
}

const sopFiles = [
  'Vault/System/SOPs/Atlas Authoring SOP.md',
  'Vault/System/SOPs/Entity Authoring SOP.md',
  'Vault/System/SOPs/Era Edition Workflow SOP.md',
  'Vault/System/SOPs/Relationship Authoring SOP.md',
  'Vault/System/SOPs/Schema Change SOP.md',
  'Vault/System/SOPs/Sourcebook Readiness SOP.md',
  'Vault/System/SOPs/Story Entity Workflow SOP.md',
  'Vault/System/SOPs/Storyteller View SOP.md',
  'Vault/System/SOPs/World Anvil Migration SOP.md',
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
  const guide = read('Site/tests/fixtures/world-anvil-migration-review.md');
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

test('architecture representations agree on core runtime invariants', () => {
  const architecture = JSON.parse(read('Architecture/viscerium-architecture.json'));
  const guide = read('Architecture/README.md');
  const html = read('Architecture/viscerium-architecture.html');

  const node = architecture.programs.find((program) => program.name === 'Node.js and npm');
  const astro = architecture.programs.find((program) => program.name === 'Astro');
  const telescope = architecture.programs.find((program) => program.name === 'Telescope');
  const pipeline = architecture.zones.find((zone) => zone.id === 'pipeline');

  assert.match(node?.version_rule ?? '', /Node 24/, 'machine architecture must record the supported Node runtime');
  assert.equal(astro?.output, 'Site/dist', 'machine architecture must record the Astro output');
  assert.match(telescope?.rule ?? '', /Pagefind is disabled/, 'machine architecture must record the search implementation');
  assert.match(pipeline?.rule ?? '', /Site\/scripts\/build-content\.mjs/, 'machine architecture must record the build orchestrator');

  const guideNode = between(guide, '### Node.js and npm', '### Astro');
  const guideAstro = between(guide, '### Astro', '### Starlight');
  const guideTelescope = between(guide, '### Telescope', '### Cloudflare Pages');
  const guideCloudflare = between(guide, '### Cloudflare Pages', '## Workflow — World Anvil transfer');
  const guidePublicBuild = between(guide, '## Workflow — public content build', '## Workflow — canonical timeline');

  assert.match(guideNode, /Node 24/, 'architecture guide Node section must match the supported runtime');
  assert.match(guideAstro, /Site\/dist/, 'architecture guide Astro section must match the deployment output');
  assert.match(guideTelescope, /Pagefind is disabled/, 'architecture guide Telescope section must match the search implementation');
  assert.match(guideCloudflare, /Site\/dist/, 'architecture guide Cloudflare section must match the deployment output');
  assert.match(guidePublicBuild, /Site\/scripts\/build-content\.mjs/, 'architecture guide public-build section must match the machine orchestrator');

  assert.match(htmlProgram(html, 'Node.js + npm'), /Node 24/, 'visual Node program must match the supported runtime');
  assert.match(htmlProgram(html, 'Telescope'), /Pagefind is disabled/, 'visual Telescope program must match the search implementation');
  const serveStage = html.split('\n').find((line) => line.includes('7 · SERVE')) ?? '';
  assert.match(serveStage, /Cloudflare Pages/, 'visual serve stage must match the deployment target');
  assert.match(serveStage, /Site\/dist/, 'visual serve stage must match the deployment output');
});
