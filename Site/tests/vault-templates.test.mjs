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
const STORYTELLER_START = '<!-- viscerium:storyteller:start -->';
const STORYTELLER_END = '<!-- viscerium:storyteller:end -->';

async function readText(relativePath) {
  return fs.readFile(path.join(vaultRoot, relativePath), 'utf8');
}

async function readJson(relativePath) {
  return JSON.parse(await readText(relativePath));
}

function topLevelFrontmatterKeys(source) {
  if (!source.startsWith('---')) return [];
  const closing = source.indexOf('\n---', 3);
  if (closing < 0) return [];
  return source
    .slice(source.indexOf('\n') + 1, closing)
    .split(/\r?\n/)
    .filter((line) => /^[A-Za-z_][A-Za-z0-9_-]*\s*:/.test(line))
    .map((line) => line.slice(0, line.indexOf(':')).trim());
}

function templaterScript(source) {
  const start = source.indexOf('<%*');
  const end = source.lastIndexOf('%>');
  if (start < 0 || end < start) return null;
  return source.slice(start + 3, end);
}

const publicSkeletons = [
  ['Templates/Lore/Article Template.md', 'article'],
  ['Templates/Lore/Character Template.md', 'character'],
  ['Templates/Lore/Faction Template.md', 'faction'],
  ['Templates/Lore/Location Template.md', 'location'],
  ['Templates/Lore/Event Template.md', 'event'],
  ['Templates/Lore/Species Template.md', 'species'],
  ['Templates/Lore/Item Template.md', 'item'],
  ['Templates/Lore/Calendar Template.md', 'calendar'],
  ['Templates/Lore/Era Template.md', 'era'],
  ['Templates/Publishing/Map Template.md', 'map'],
  ['Templates/Publishing/Image Metadata Template.md', 'image'],
  ['Templates/Timelines/Timeline Template.md', 'timeline'],
  ['Templates/Timelines/Chronos Timeline Template.md', 'timeline'],
];

const literalFrontmatterTemplates = [
  ...publicSkeletons.map(([relativePath]) => relativePath),
  'Templates/Databases/Myrkild Unit Profile.md',
];

const creatorTemplates = [
  'Templates/Databases/New Story Entity.md',
  'Templates/Databases/Add Storyteller Fields.md',
  'Templates/Lore/Add Location Fields.md',
  'Templates/Databases/Myrkild Unit Profile.md',
  'Templates/_Internals/Story Entity Core.md',
  'Templates/_Internals/Folder Entity Router.md',
  'Templates/_Startup/Open VISCERIUM Home.md',
  'Templates/Lore/New Lore Entity.md',
  'Templates/Databases/New Myrkild Unit.md',
  'Templates/_Scripts/reference_picker.js',
  'Templates/_Scripts/folder_entity_router.js',
];

test('publishable Lore skeletons start safe and include one reusable Storyteller footer', async () => {
  for (const [relativePath, expectedType] of publicSkeletons) {
    const source = await readText(relativePath);
    const parsed = matter(source);

    assert.equal(parsed.data.title, '{{title}}', `${relativePath} should derive title from the note filename`);
    assert.equal(parsed.data.publish, undefined, `${relativePath} must not carry the legacy publish boolean`);
    assert.equal(parsed.data.status, 'draft', `${relativePath} must start as a draft`);
    assert.equal(parsed.data.type, expectedType, `${relativePath} should declare its semantic type`);
    assert.doesNotMatch(parsed.content, /^#\s+\{\{title\}\}/m, `${relativePath} should not duplicate the note/page title as a body H1`);
    assert.doesNotMatch(parsed.content, /^##\s+Comments\s*$/m, `${relativePath} should not create an empty duplicate comments section`);
    assert.doesNotMatch(parsed.content, /viscerium-sidebar|```dataviewjs/i, `${relativePath} should stay portable and not render the retired Obsidian infobox`);
    assert.equal(source.split(STORYTELLER_START).length - 1, 1, `${relativePath} should contain one Storyteller start marker`);
    assert.equal(source.split(STORYTELLER_END).length - 1, 1, `${relativePath} should contain one Storyteller end marker`);
    assert.match(parsed.content, /^## Storyteller View$/m, `${relativePath} should expose a foldable Storyteller heading in Obsidian`);
    assert.ok(source.indexOf(STORYTELLER_START) < source.indexOf(STORYTELLER_END), `${relativePath} should order Storyteller boundaries correctly`);

    if (Object.hasOwn(parsed.data, 'tags')) {
      assert.ok(Array.isArray(parsed.data.tags), `${relativePath} tags should be an array, not YAML null`);
    }
    if (Object.hasOwn(parsed.data, 'related')) {
      assert.ok(Array.isArray(parsed.data.related), `${relativePath} related should be an array, not YAML null`);
    }
  }
});

test('literal template frontmatter contains no duplicate top-level fields', async () => {
  for (const relativePath of literalFrontmatterTemplates) {
    const keys = topLevelFrontmatterKeys(await readText(relativePath));
    assert.equal(new Set(keys).size, keys.length, `${relativePath} contains a duplicate top-level frontmatter field`);
  }
});

test('interactive Templater script blocks parse as async JavaScript', async () => {
  for (const relativePath of creatorTemplates) {
    const source = await readText(relativePath);
    const script = templaterScript(source);
    if (!script) continue;

    assert.doesNotThrow(
      () => new Function(`return async function __visceriumTemplate__() {\n${script}\n}`),
      `${relativePath} contains invalid Templater JavaScript`,
    );
  }
});

test('folder-triggered Templater rules cover Lore, Inbox, specialist databases and nested folders', async () => {
  const config = await readJson('.obsidian/plugins/templater-obsidian/data.json');
  const rules = new Map(config.folder_templates.map((entry) => [entry.folder, entry.template]));

  assert.equal(config.trigger_on_file_creation_mode, 'folder');
  assert.equal(rules.get('Lore'), 'Templates/_Internals/Folder Entity Router.md');
  assert.equal(rules.get('Drafts/Inbox'), 'Templates/_Internals/Folder Entity Router.md');
  assert.equal(rules.get('Drafts/Databases/Fauna'), 'Templates/Databases/New Story Entity.md');
  assert.equal(rules.get('Drafts/Databases/Flora'), 'Templates/Databases/New Story Entity.md');
  assert.equal(rules.get('Drafts/Databases/Fungi'), 'Templates/Databases/New Story Entity.md');
  assert.equal(rules.get('Drafts/Databases/Items'), 'Templates/Databases/New Story Entity.md');
  assert.equal(rules.get('Drafts/Databases/Myrkild Units'), 'Templates/Databases/New Myrkild Unit.md');

  const storyEntity = await readText('Templates/Databases/New Story Entity.md');
  assert.match(storyEntity, /currentFolder\.startsWith/);
  assert.match(storyEntity, /!startedInTypeFolder/);
});

test('folder entity router selects the nearest semantic template and path-derived defaults', () => {
  const routerPath = path.join(vaultRoot, 'Templates/_Scripts/folder_entity_router.js');
  delete require.cache[require.resolve(routerPath)];
  const router = require(routerPath);

  assert.equal(router.classifyFolder('Lore/Eras/CITADEL/Weapons & Armour/Weaponry').type, 'item');
  assert.equal(router.classifyFolder('Lore/Eras/CITADEL/Armour').type, 'item');
  assert.equal(router.classifyFolder('Lore/Eras/CITADEL/Nations').type, 'faction');
  assert.equal(router.classifyFolder('Lore/Universal/Fauna/Reptile').type, 'species');
  assert.equal(router.classifyFolder('Lore/Myrkildicary').type, 'species');
  assert.equal(router.classifyFolder('Lore/Eras').type, 'era');
  assert.equal(router.classifyFolder('Lore/Eras/CITADEL'), null);

  assert.equal(router.inferEra('Lore/Eras/CITADEL/Weapons & Armour/Weaponry'), 'CITADEL');
  assert.equal(router.inferEra('Lore/Universal/Fauna/Reptile'), 'Universal');
  assert.equal(router.inferSubtype('item', 'Lore/Eras/CITADEL/Weapons & Armour/Weaponry'), 'weapon');
  assert.equal(router.inferSubtype('item', 'Lore/Eras/CITADEL/Armour'), 'armour');
  assert.equal(router.inferSubtype('species', 'Lore/Universal/Fauna/Reptile'), 'reptile');
  assert.equal(router.inferSubtype('species', 'Lore/Myrkildicary'), 'Myrkild');

  assert.equal(router.ROUTES.item.template, 'Templates/Lore/Item Template.md');
  assert.equal(router.ROUTES.species.template, 'Templates/Lore/Species Template.md');
  assert.equal(router.ROUTES.calendar.template, 'Templates/Lore/Calendar Template.md');
  assert.equal(router.ROUTES.article.template, 'Templates/Lore/Article Template.md');
});

test('creator-facing workflows author Storyteller material as Markdown rather than properties', async () => {
  for (const relativePath of creatorTemplates) {
    const content = await readText(relativePath);
    assert.ok(content.trim().length > 0, `${relativePath} should not be empty`);
  }

  const wrapper = await readText('Templates/Databases/New Story Entity.md');
  const injector = await readText('Templates/Databases/Add Storyteller Fields.md');
  const locationInjector = await readText('Templates/Lore/Add Location Fields.md');
  const core = await readText('Templates/_Internals/Story Entity Core.md');
  const lore = await readText('Templates/Lore/New Lore Entity.md');
  const unit = await readText('Templates/Databases/New Myrkild Unit.md');
  const unitProfile = await readText('Templates/Databases/Myrkild Unit Profile.md');
  const folderRouter = await readText('Templates/_Internals/Folder Entity Router.md');

  assert.match(wrapper, /Story Entity Core/);
  assert.match(injector, /viscerium:storyteller:start/);
  assert.match(injector, /viscerium:storyteller:end/);
  assert.match(injector, /already contains a Storyteller section/);
  assert.doesNotMatch(injector, /processFrontMatter|current_wants|local_tension/);
  assert.match(locationInjector, /type:\s*location/);
  assert.match(locationInjector, /location_kind/);
  assert.match(locationInjector, /settlement_scale/);
  assert.match(locationInjector, /route_connections/);
  assert.match(locationInjector, /tp\.user\.reference_picker/);
  assert.match(core, /Stop when usable/);
  assert.match(core, /tp\.user\.reference_picker/);
  assert.match(core, /storytellerSections/);
  assert.match(core, /viscerium:storyteller:start/);
  assert.doesNotMatch(core, /propertyOrder/);
  assert.match(lore, /tp\.user\.reference_picker/);
  assert.match(lore, /LOCATION_KINDS/);
  assert.match(lore, /Add Location Fields/);
  assert.match(lore, /viscerium:storyteller:start/);
  assert.doesNotMatch(lore, /Add Storyteller Fields/);
  assert.match(unit, /tp\.user\.reference_picker/);
  assert.match(unitProfile, /viscerium:storyteller:start/);
  assert.doesNotMatch(unitProfile, /\[\[Add Storyteller Fields\]\]/);
  assert.match(folderRouter, /tp\.user\.folder_entity_router/);
});

test('sourcebook location fields survive in representative non-canon location notes', async () => {
  const port = matter(await readText('Lore/Demo/Demo Trade Port.md')).data;
  const fort = matter(await readText('Lore/Demo/Demo Frontier Fort.md')).data;
  const ward = matter(await readText('Lore/Demo/Demo Market Ward.md')).data;

  assert.equal(port.type, 'location');
  assert.equal(port.location_kind, 'settlement');
  assert.match(port.economic_role, /cargo|trade/i);
  assert.ok(port.local_services);

  assert.equal(fort.type, 'location');
  assert.equal(fort.location_kind, 'site');
  assert.ok(fort.access_conditions);
  assert.ok(fort.notable_features);

  assert.equal(ward.type, 'location');
  assert.equal(ward.location_kind, 'settlement');
  assert.ok(ward.population_band);
  assert.ok(ward.governance_summary);
});

test('sourcebook-readiness guidance stays progressive and avoids completion-by-metadata', async () => {
  const sourcebook = await readText('System/SOPs/Sourcebook Readiness SOP.md');

  assert.match(sourcebook, /Do not turn worldbuilding into a completion exercise/i);
  assert.match(sourcebook, /^## Develop important everyday-world facts$/m);
  assert.match(sourcebook, /^## Decide whether a concept needs its own note$/m);
  assert.match(sourcebook, /Okse Dominion/);
  assert.match(sourcebook, /Safe to invent later/);
  assert.match(sourcebook, /Stop when a future writer can make the next creative decision/);
});

test('ordinary article width has no competing retired global width or infobox snippets', async () => {
  const appearance = await readJson('.obsidian/appearance.json');

  assert.equal(appearance.cssTheme, 'Baseline');
  assert.ok(!appearance.enabledCssSnippets.includes('Readable line width'));
  assert.ok(!appearance.enabledCssSnippets.includes('Infobox sidebar'));

  const retired = [
    '.obsidian/snippets/Readable line width.css',
    '.obsidian/snippets/Infobox sidebar.css',
    'Views/viscerium-sidebar/view.js',
    'Views/viscerium-sidebar/view.css',
    'System/Dataview Sidebar Templates.md',
  ];

  for (const relativePath of retired) {
    await assert.rejects(fs.access(path.join(vaultRoot, relativePath)), undefined, `${relativePath} should remain retired`);
  }
});

test('era template never emits an unresolved custom template variable as a timeline shortcode', async () => {
  const era = await readText('Templates/Lore/Era Template.md');
  assert.doesNotMatch(era, /\[Timeline:\{\{eraId\}\}\]/);
  assert.match(era, /\[Timeline:<eraId>\]/);
});
