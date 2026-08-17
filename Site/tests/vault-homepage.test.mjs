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

test('VISCERIUM Home is a modular creator dashboard rather than a manual', async () => {
  const home = matter(await readText('Home.md'));
  const appearance = await readJson('.obsidian/appearance.json');
  const templater = await readJson('.obsidian/plugins/templater-obsidian/data.json');
  const hero = await readText('System/Views/Home/Hero/view.js');
  const continuing = await readText('System/Views/Home/Continue/view.js');
  const attention = await readText('System/Views/Home/Attention/view.js');
  const chronicle = await readText('System/Views/Home/Chronicle/view.js');
  const activity = await readText('System/Views/Home/Activity/view.js');
  const navigate = await readText('System/Views/Home/Navigate/view.js');

  assert.equal(home.data.publish, undefined, 'Home must not carry the legacy publish boolean');
  assert.ok(home.data.cssclasses?.includes('viscerium-home'));
  assert.equal(home.data.headerImage, 'Assets/Images/errack-header.webp');
  assert.equal(home.data.focusTitle, 'World Anvil Migration');
  assert.equal(home.data.focusPrimary, 'System/Bases/World Anvil Import.base');

  for (const snippet of ['Creator UI foundation', 'File explorer', 'Bases', 'Home dashboard']) {
    assert.ok(appearance.enabledCssSnippets.includes(snippet), `${snippet} should be enabled`);
  }

  assert.ok(templater.enabled_templates_hotkeys.includes('Templates/Databases/New Story Entity.md'));
  assert.ok(templater.startup_templates.includes('Templates/_Startup/Open VISCERIUM Home.md'));

  for (const view of ['Hero', 'Continue', 'Attention', 'Chronicle', 'Activity', 'Navigate']) {
    assert.match(home.content, new RegExp(`await dv\\.view\\(\"System/Views/Home/${view}\"\\)`));
  }
  assert.doesNotMatch(home.content, /dv\.current\(\)\.file/);
  assert.doesNotMatch(home.content, /SYSTEM HEALTH|HOW THIS VAULT WORKS|VISCERIUM AT A GLANCE/);

  assert.match(hero, /dv\.currentFilePath \|\| "Home\.md"/);
  assert.match(hero, /metadataCache\.getFileCache/);
  assert.match(hero, /CURRENT FOCUS · MANUAL/);
  assert.match(hero, /Create new/);
  assert.match(hero, /vc-home-create-panel/);
  assert.match(hero, /templaterCreateCommand\("Templates\/Lore\/New Lore Entity\.md"\)/);
  assert.match(hero, /templaterCreateCommand\("Templates\/Databases\/New Story Entity\.md"\)/);
  assert.match(hero, /templaterCreateCommand\("Templates\/Databases\/New Myrkild Unit\.md"\)/);
  assert.match(hero, /viscerium-timelines:open-storyline-project-timeline/);
  assert.doesNotMatch(hero, /diagnose-storyline-integration/);

  assert.match(continuing, /Loading recent work…/);
  assert.match(continuing, /dv\.index\?\.initialized/);
  assert.match(continuing, /activeProjectFile/);
  assert.match(continuing, /System\/Bases\/Lore Registry\.base/);
  assert.match(continuing, /Show all recent work/);

  assert.match(attention, /Checking project state…/);
  assert.match(attention, /dv\.index\?\.initialized/);
  assert.match(attention, /requestIdleCallback/);
  assert.match(attention, /System\/Bases\/Needs Attention\.base/);
  assert.match(attention, /System\/Bases\/Publishing\.base/);

  assert.match(chronicle, /journal-bases:open-current-daily/);
  assert.match(chronicle, /journal-bases:open-current-weekly/);
  assert.match(chronicle, /journal-bases:open-current-monthly/);
  assert.match(chronicle, /journal-bases:open-current-yearly/);

  assert.match(activity, /viscerium-creator-activity:v2/);
  assert.match(activity, /index < 182/);
  assert.match(activity, /vc-home-heatmap/);

  assert.match(navigate, /System\/Creator Tasks/);
  assert.match(navigate, /System\/Bases\/Needs Attention\.base/);
  assert.match(navigate, /vc-home-nav-grid/);
});

test('creator UI grammar keeps page chrome flat and creator controls deliberately rounded', async () => {
  const foundation = await readText('.obsidian/snippets/Creator UI foundation.css');
  const homeCss = await readText('.obsidian/snippets/Home dashboard.css');
  const callouts = await readText('.obsidian/snippets/Callout styling.css');
  const bases = await readText('.obsidian/snippets/Bases.css');

  assert.match(foundation, /--vc-radius-static:\s*0/);
  assert.match(foundation, /--vc-radius-control:\s*4px/);
  assert.match(homeCss, /--vc-home-control-radius:\s*7px/);
  assert.match(homeCss, /--vc-home-radius:\s*10px/);
  assert.match(homeCss, /button\.vc-home-button/);
  assert.match(homeCss, /border-radius:\s*var\(--vc-home-control-radius\)/);
  assert.match(homeCss, /inset 0 -3px 0/);
  assert.match(homeCss, /vc-home-create-panel/);
  assert.match(callouts, /border-radius:\s*0/);
  assert.match(bases, /bases-view\[data-view-type="table"\][\s\S]*?border-radius:\s*0/);
});

test('creator foundation overrides Baseline display-serif headings with the configured heading face', async () => {
  const foundation = await readText('.obsidian/snippets/Creator UI foundation.css');
  const headings = await readText('.obsidian/snippets/Heading hierarchy.css');

  for (let level = 1; level <= 6; level += 1) {
    assert.match(
      foundation,
      new RegExp(`--h${level}-font:\\s*var\\(--vc-font-heading,\\s*var\\(--font-text\\)\\)`),
    );
  }
  assert.doesNotMatch(foundation, /Instrument Serif/);
  assert.match(headings, /--vc-accent-line/);
  assert.match(headings, /color-mix\(in srgb, var\(--vc-accent/);
});

test('Home dashboard uses pane width, a fixed hero artwork layer and responsive two-column bands', async () => {
  const homeCss = await readText('.obsidian/snippets/Home dashboard.css');

  assert.match(homeCss, /--line-width-adaptive:\s*300em/);
  assert.match(homeCss, /--vc-home-hero-art-height:\s*380px/);
  assert.match(homeCss, /@container\s+viscerium-home/);
  assert.match(homeCss, /markdown-preview-view\.viscerium-home \.metadata-container/);
  assert.match(homeCss, /markdown-source-view\.mod-cm6\.viscerium-home \.metadata-container/);
  assert.match(homeCss, /markdown-source-view\.mod-cm6\.viscerium-home \.inline-title/);
  assert.match(homeCss, /vc-home-launch[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto/);
  assert.match(homeCss, /vc-home-continue-grid[\s\S]*?grid-template-columns:\s*1fr\s+1fr/);
  assert.match(homeCss, /home-secondary[\s\S]*?grid-template-columns:\s*1fr\s+1fr/);
  assert.match(homeCss, /@container viscerium-home \(max-width: 760px\)/);
  assert.match(homeCss, /vc-home-nav-grid/);
});

test('Home keeps one primary focus action and one-level creation disclosure', async () => {
  const hero = await readText('System/Views/Home/Hero/view.js');
  const homeCss = await readText('.obsidian/snippets/Home dashboard.css');

  assert.match(hero, /addLaunchButton\(page\.focusPrimaryLabel, page\.focusPrimary, true, "play"\)/);
  assert.match(hero, /addLaunchButton\("Create new", null, false, "plus"\)/);
  assert.match(hero, /createToggle\.setAttribute\("aria-expanded", "false"\)/);
  assert.match(hero, /panel\.hidden = true/);
  assert.match(hero, /Create something new/);
  assert.match(hero, /Worldbuilding/);
  assert.match(hero, /Story/);
  assert.match(hero, /Myrkild/);
  assert.match(hero, /Chronicle/);
  assert.match(homeCss, /vc-home-button-primary/);
  assert.match(homeCss, /vc-home-button-secondary/);
  assert.match(homeCss, /vc-home-button-action/);
});

test('Home uses restrained semantic colour cues for lore, story, progress and intervention states', async () => {
  const homeCss = await readText('.obsidian/snippets/Home dashboard.css');
  const propertiesCss = await readText('.obsidian/snippets/Compact properties.css');

  assert.match(homeCss, /--vc-home-story:\s*#b87f62/);
  assert.match(homeCss, /--vc-home-lore:\s*#758fa0/);
  assert.match(homeCss, /--vc-home-green:\s*#7e9a79/);
  assert.match(homeCss, /--vc-home-red:\s*#cf6c5b/);
  assert.match(homeCss, /vc-home-area-canon[^\n]*var\(--vc-home-lore\)/);
  assert.match(homeCss, /vc-home-area-writing[^\n]*var\(--vc-home-story\)/);
  assert.match(homeCss, /vc-home-attention-severity[\s\S]*?var\(--vc-home-red\)/);
  assert.match(homeCss, /vc-home-ready-count[\s\S]*?var\(--vc-home-green\)/);
  assert.match(propertiesCss, /metadata-properties-heading[\s\S]*?color-mix/);
});

test('creator activity is local, rolling, responsive and non-gamified', async () => {
  const startup = await readText('Templates/_Startup/Open VISCERIUM Home.md');
  const activity = await readText('System/Views/Home/Activity/view.js');
  const homeCss = await readText('.obsidian/snippets/Home dashboard.css');

  assert.match(startup, /ACTIVITY_KEY/);
  assert.match(startup, /STATE_KEY/);
  assert.match(startup, /KEEP_DAYS\s*=\s*371/);
  assert.match(startup, /getMarkdownFiles\(\)/);
  assert.match(startup, /localStorage\.setItem/);
  assert.match(startup, /pruneDays/);
  assert.doesNotMatch(startup, /Creator Activity\.json/);
  assert.doesNotMatch(startup, /adapter\.write/);

  assert.match(activity, /viscerium-creator-activity:v2/);
  assert.match(activity, /25 \* 7/);
  assert.match(activity, /index < 182/);
  assert.match(activity, /active days/);
  assert.match(activity, /changed files/);
  assert.doesNotMatch(activity, /streak|score|completion percentage/i);

  assert.match(homeCss, /vc-home-heatmap[\s\S]*?grid-template-rows:\s*repeat\(7,\s*7px\)/);
  assert.match(homeCss, /vc-home-heatmap[\s\S]*?grid-auto-columns:\s*7px/);
  assert.match(homeCss, /vc-home-heatmap[\s\S]*?overflow:\s*hidden/);
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
