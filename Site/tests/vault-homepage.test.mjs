import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const vaultRoot = path.join(repoRoot, 'Vault');

async function readText(relativePath) {
  return fs.readFile(path.join(vaultRoot, relativePath), 'utf8');
}

async function readJson(relativePath) {
  return JSON.parse(await readText(relativePath));
}

test('VISCERIUM Home is a compact creator dashboard rather than a manual', async () => {
  const home = matter(await readText('Home.md'));
  const appearance = await readJson('.obsidian/appearance.json');
  const templater = await readJson('.obsidian/plugins/templater-obsidian/data.json');

  assert.equal(home.data.publish, undefined, 'Home must not carry the legacy publish boolean');
  assert.ok(home.data.cssclasses?.includes('viscerium-home'));
  for (const snippet of ['Creator UI foundation', 'File explorer', 'Bases', 'Home dashboard']) {
    assert.ok(appearance.enabledCssSnippets.includes(snippet), `${snippet} should be enabled`);
  }

  assert.ok(templater.enabled_templates_hotkeys.includes('Templates/Databases/New Story Entity.md'));
  assert.ok(templater.startup_templates.includes('Templates/_Startup/Open VISCERIUM Home.md'));

  assert.match(home.content, /FOCUS/);
  assert.match(home.content, /World Anvil Migration/);
  assert.match(home.content, /Open Review First/);
  assert.match(home.content, /home-workspace/);
  assert.match(home.content, /CONTINUE/);
  assert.match(home.content, /vc-home-continue-list/);
  assert.match(home.content, /page\.title \?\? page\.file\.name/);
  assert.match(home.content, /CREATE/);
  assert.match(home.content, /vc-home-create-primary/);
  assert.match(home.content, /WRITING/);
  assert.match(home.content, /activeProjectFile/);
  assert.match(home.content, /CREATOR ACTIVITY/);
  assert.match(home.content, /vc-home-heatmap/);
  assert.match(home.content, /viscerium-creator-activity:v2/);
  assert.match(home.content, /NAVIGATE/);
  assert.match(home.content, /vc-home-nav-grid/);
  assert.match(home.content, /System\/Creator Tasks/);

  const creatorTemplatePaths = [
    'Templates/Databases/New Story Entity.md',
    'Templates/Lore/New Lore Entity.md',
    'Templates/Databases/New Myrkild Unit.md',
  ];
  for (const templatePath of creatorTemplatePaths) {
    assert.ok(templater.enabled_templates_hotkeys.includes(templatePath));
    assert.ok(home.content.includes(`templaterCreateCommand(\"${templatePath}\")`));
  }

  assert.match(home.content, /viscerium-timelines:open-storyline-project-timeline/);
  assert.doesNotMatch(home.content, /viscerium-timelines:diagnose-storyline-integration/);
  assert.doesNotMatch(home.content, /Creator Activity\.json/);
  assert.doesNotMatch(home.content, /SYSTEM HEALTH/);
  assert.doesNotMatch(home.content, /HOW THIS VAULT WORKS/);
  assert.doesNotMatch(home.content, /VISCERIUM AT A GLANCE/);
  assert.doesNotMatch(home.content, /dv\.table\(/);
});

test('creator UI grammar keeps static surfaces square and controls lightly rounded', async () => {
  const foundation = await readText('.obsidian/snippets/Creator UI foundation.css');
  const homeCss = await readText('.obsidian/snippets/Home dashboard.css');
  const callouts = await readText('.obsidian/snippets/Callout styling.css');
  const bases = await readText('.obsidian/snippets/Bases.css');

  assert.match(foundation, /--vc-radius-static:\s*0/);
  assert.match(foundation, /--vc-radius-control:\s*4px/);
  assert.match(homeCss, /border-radius:\s*0/);
  assert.match(homeCss, /button\.vc-home-button/);
  assert.match(homeCss, /var\(--vc-radius-control/);
  assert.match(callouts, /border-radius:\s*0/);
  assert.match(bases, /bases-view\[data-view-type="table"\][\s\S]*?border-radius:\s*0/);
  assert.match(bases, /bases-cards-item[\s\S]*?var\(--vc-radius-control/);
  assert.doesNotMatch(homeCss, /linear-gradient\(/);
  assert.doesNotMatch(homeCss, /radial-gradient\(/);
});

test('creator foundation overrides Baseline display-serif headings with the configured text face', async () => {
  const foundation = await readText('.obsidian/snippets/Creator UI foundation.css');
  const headings = await readText('.obsidian/snippets/Heading hierarchy.css');

  for (let level = 1; level <= 6; level += 1) {
    assert.match(foundation, new RegExp(`--h${level}-font:\\s*var\\(--font-text\\)`));
  }
  assert.doesNotMatch(foundation, /Instrument Serif/);
  assert.match(headings, /--vc-accent-line/);
  assert.match(headings, /color-mix\(in srgb, var\(--vc-accent/);
});

test('Home dashboard uses pane width and hides duplicate document chrome in both modes', async () => {
  const homeCss = await readText('.obsidian/snippets/Home dashboard.css');

  assert.match(homeCss, /--line-width-adaptive:\s*300em/);
  assert.match(homeCss, /@container\s+viscerium-home/);
  assert.match(homeCss, /markdown-preview-view\.viscerium-home \.metadata-container/);
  assert.match(homeCss, /markdown-source-view\.mod-cm6\.viscerium-home \.metadata-container/);
  assert.match(homeCss, /markdown-source-view\.mod-cm6\.viscerium-home \.inline-title/);
  assert.match(homeCss, /grid-template-columns:\s*minmax\(0,\s*1\.65fr\)\s+minmax\(18rem,\s*1fr\)/);
  assert.match(homeCss, /vc-home-nav-grid/);
});

test('Home has one solid Focus action and quieter creation/workspace controls', async () => {
  const home = matter(await readText('Home.md'));
  const homeCss = await readText('.obsidian/snippets/Home dashboard.css');

  assert.equal((home.content.match(/vc-home-button-primary/g) ?? []).length, 1);
  assert.match(home.content, /vc-home-button-create/);
  assert.match(home.content, /vc-home-button-tertiary/);
  assert.match(home.content, /Creator Context/);
  assert.match(home.content, /Story Timeline/);
  assert.match(homeCss, /vc-home-button-create/);
  assert.match(homeCss, /vc-home-button-tertiary/);
});

test('Home uses restrained semantic colour cues rather than monochrome or full-card tinting', async () => {
  const homeCss = await readText('.obsidian/snippets/Home dashboard.css');
  const propertiesCss = await readText('.obsidian/snippets/Compact properties.css');

  assert.match(homeCss, /home-writing[^\n]*--vc-home-section-accent:\s*var\(--vc-writing/);
  assert.match(homeCss, /home-activity[^\n]*--vc-home-section-accent:\s*var\(--vc-activity/);
  assert.match(homeCss, /home-navigate[^\n]*--vc-home-section-accent:\s*var\(--vc-tools/);
  assert.match(homeCss, /border-bottom:\s*1px solid color-mix/);
  assert.match(propertiesCss, /metadata-properties-heading[\s\S]*?color-mix/);
  assert.doesNotMatch(homeCss, /background:\s*var\(--vc-writing/);
});

test('creator activity is local, rolling, responsive and non-gamified', async () => {
  const startup = await readText('Templates/_Startup/Open VISCERIUM Home.md');
  const home = matter(await readText('Home.md'));
  const homeCss = await readText('.obsidian/snippets/Home dashboard.css');

  assert.match(startup, /ACTIVITY_KEY/);
  assert.match(startup, /STATE_KEY/);
  assert.match(startup, /KEEP_DAYS\s*=\s*371/);
  assert.match(startup, /getMarkdownFiles\(\)/);
  assert.match(startup, /localStorage\.setItem/);
  assert.match(startup, /pruneDays/);
  assert.doesNotMatch(startup, /Creator Activity\.json/);
  assert.doesNotMatch(startup, /adapter\.write/);
  assert.match(home.content, /52 weeks/);
  assert.doesNotMatch(home.content, /streak|score|completion percentage/i);
  assert.match(homeCss, /grid-template-columns:\s*repeat\(52,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(homeCss, /grid-template-rows:\s*repeat\(7,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(homeCss, /aspect-ratio:\s*52\s*\/\s*7/);
  assert.doesNotMatch(homeCss, /grid-auto-columns:\s*6px/);
  assert.doesNotMatch(homeCss, /vc-home-activity-scroll[\s\S]{0,180}overflow-x:\s*auto/);
});

test('creator task hub uses ordinary Markdown tasks without introducing a task plugin', async () => {
  const taskHub = await readText('System/Creator Tasks.md');
  const plugins = await readJson('.obsidian/community-plugins.json');

  assert.match(taskHub, /dv\.taskList/);
  assert.match(taskHub, /ordinary Markdown checkboxes/i);
  assert.doesNotMatch(taskHub, /completion percentage/i);
  assert.ok(!plugins.includes('tasknotes'));
});

test('retired overlapping snippets stay removed', async () => {
  const appearance = await readJson('.obsidian/appearance.json');
  const retired = [
    'Active file indicator',
    'Article list colors',
    'Bases cards',
    'Bases table',
    'Compact file explorer',
    'Compact status bar',
    'Folder colors',
    'Folder hierarchy',
    'List spacing',
    'MySnippets menu',
    'VISCERIUM Home file',
    'VISCERIUM Homepage',
    'VISCERIUM Homepage responsive',
    'VISCERIUM UI tokens',
    'Workspace labels',
  ];

  for (const snippet of retired) {
    assert.ok(!appearance.enabledCssSnippets.includes(snippet), `${snippet} must remain disabled`);
    await assert.rejects(fs.access(path.join(vaultRoot, `.obsidian/snippets/${snippet}.css`)));
  }
});
