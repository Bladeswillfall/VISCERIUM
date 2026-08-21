import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { buildSidebar } from '../sidebar.mjs';
import { sidebarIconForLabel } from '../src/config/sidebar-taxonomy.mjs';
import { parseIconLabel } from '../src/lib/icon-spec.mjs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const labelOf = (entry) => parseIconLabel(entry?.label ?? '').label;

function flattenSidebar(entries) {
  return (entries ?? []).flatMap((entry) => [
    entry,
    ...flattenSidebar(entry.items),
  ]);
}

test('sidebar follows the canonical global and era hierarchy', async () => {
  const sidebar = await buildSidebar();
  const groups = sidebar.filter((entry) => Array.isArray(entry.items));
  const groupLabels = groups.map(labelOf);

  assert.deepEqual(groupLabels.slice(0, 6), [
    'Degel System',
    'Eras',
    'The Wyrd',
    'Naranoricon',
    'Myrkildicary',
    'Meta Content',
  ]);
  assert.equal(groupLabels.includes('Explore'), false);

  const degel = groups.find((entry) => labelOf(entry) === 'Degel System');
  assert.ok(degel);
  assert.equal(degel.items.some((entry) => labelOf(entry) === 'Atlas' && entry.link === '/maps/'), true);

  const eras = groups.find((entry) => labelOf(entry) === 'Eras');
  assert.ok(eras);
  const eraGroups = eras.items.filter((entry) => Array.isArray(entry.items));
  assert.deepEqual(eraGroups.slice(0, 4).map(labelOf), ['CITADEL', 'SMOG', 'NEARSIGHT', 'ENTROPY']);

  const citadel = eraGroups.find((entry) => labelOf(entry) === 'CITADEL');
  assert.ok(citadel);
  assert.deepEqual(citadel.items.slice(0, 2).map(labelOf), ['Overview', 'Relationships']);
  assert.equal(citadel.items[1].link, '/eras/citadel/relationships/');

  const citadelGroups = citadel.items.filter((entry) => Array.isArray(entry.items));
  assert.deepEqual(citadelGroups.map(labelOf), [
    'Events',
    'Nations',
    'International Groups',
    'Professions',
    'Bestiary',
    'Flora & Fungi',
    'Weapons & Armour',
    'Transportation',
  ]);

  const nations = citadelGroups.find((entry) => labelOf(entry) === 'Nations');
  assert.ok(nations);
  assert.equal(nations.items.some((entry) => labelOf(entry) === 'Okse Dominion'), true);

  assert.equal(citadel.items[1].attrs?.['data-sidebar-icon'], 'relationships');
  assert.equal(sidebarIconForLabel(nations.label), 'faction');
  assert.equal(sidebarIconForLabel('Naranoricon'), 'naranor');
  assert.equal(flattenSidebar(sidebar).some((entry) => /\[Icon:/i.test(entry.label ?? '')), false);
});

test('desktop sidebar overlay uses an explicit unlayered state', () => {
  const navigation = read('../src/styles/navigation.css');
  const timelinePages = read('../src/styles/timeline-canvas.css');

  assert.match(navigation, /html\[data-codex-desktop-sidebar\] #starlight__sidebar\s*\{/);
  assert.match(navigation, /visibility: visible/);
  assert.match(navigation, /html\[data-codex-desktop-sidebar\]\.codex-sidebar-collapsed #starlight__sidebar\s*\{/);
  assert.match(navigation, /visibility: hidden/);
  assert.match(navigation, /html:not\(\[data-codex-desktop-sidebar\]\) \.codex-sidebar-toggle/);
  assert.doesNotMatch(navigation, /:is\(nav\.sidebar-print-hide, \.sidebar-pane\)/);
  assert.doesNotMatch(
    navigation,
    /html\[data-codex-desktop-sidebar\]\.codex-sidebar-collapsed \.main-frame\s*\{[\s\S]*?padding-inline-start:\s*0/,
  );
  assert.match(
    timelinePages,
    /\.main-frame:has\(> \.codex-timeline-page\)\s*\{[\s\S]*?padding-inline:\s*clamp\(1rem, 2\.4vw, 3rem\)/,
  );
  assert.match(navigation, /pointer-events: none/);
  assert.match(navigation, /transform: translateX\(-110%\)/);
});

test('desktop sidebar toggle lives in the sticky header while the sidebar runtime rebinds safely', () => {
  const header = read('../src/components/CodexHeader.astro');
  const footer = read('../src/components/StarlightFooter.astro');
  const shell = read('../src/scripts/codex-shell.js');
  const headerControls = read('../src/styles/header-controls.css');

  assert.match(header, /data-codex-sidebar-toggle/);
  assert.match(header, /aria-controls="starlight__sidebar"/);
  assert.match(header, /aria-expanded="false"/);
  assert.match(header, /data-sidebar-show=\{t\('viscerium\.sidebar\.show'\)\}/);
  assert.match(header, /data-sidebar-hide=\{t\('viscerium\.sidebar\.hide'\)\}/);
  assert.doesNotMatch(footer, /<button[\s\S]*?data-codex-sidebar-toggle/);
  assert.match(shell, /document\.querySelector\('\[data-codex-sidebar-toggle\]'\)/);
  assert.match(headerControls, /\.codex-header \.codex-sidebar-toggle\s*\{[\s\S]*?position:\s*static/);
  assert.match(headerControls, /\.codex-header \.title-wrapper\s*\{[\s\S]*?gap:\s*\.4rem/);
  assert.match(headerControls, /html\[data-codex-wide-header\] header\.header\s*\{[\s\S]*?position:\s*sticky !important/);
  assert.match(headerControls, /html\[data-codex-wide-header\] \.main-frame\s*\{[\s\S]*?padding-top:\s*var\(--sl-mobile-toc-height, 0rem\)/);

  assert.match(shell, /document\.getElementById\('starlight__sidebar'\)/);
  assert.match(shell, /window\.matchMedia\('\(min-width: 800px\)'\)/);
  assert.match(shell, /root\.toggleAttribute\('data-codex-desktop-sidebar', hasDesktopSidebar\)/);
  assert.match(shell, /document\.addEventListener\('astro:page-load', \(\) => runtime\.sync\(true\)\)/);
  assert.match(shell, /desktopQuery\.addEventListener\('change', \(\) => runtime\.sync\(true\)\)/);
  assert.match(shell, /setCollapsed\(button, resetCollapsed \|\| root\.classList\.contains\('codex-sidebar-collapsed'\)\)/);
  assert.match(shell, /collapsed \? button\.dataset\.sidebarShow : button\.dataset\.sidebarHide/);
  assert.match(shell, /runtime\.sync\(true\)/);
  assert.match(shell, /button\.dataset\.codexSidebarBound === 'true'/);
  assert.doesNotMatch(shell, /viscerium-sidebar-collapsed/);
  assert.match(footer, /html:not\(\[data-codex-desktop-sidebar\]\) #starlight__sidebar/);
});

test('mobile header uses thresholded fixed reveal and hide states', () => {
  const shell = read('../src/scripts/codex-shell.js');
  const headerControls = read('../src/styles/header-controls.css');

  assert.match(shell, /const mobileRevealDistance = 64/);
  assert.match(shell, /const mobileHideDistance = 36/);
  assert.match(shell, /root\.toggleAttribute\('data-codex-mobile-header', !isDesktop\)/);
  assert.match(shell, /root\.toggleAttribute\('data-codex-mobile-header-hidden', hidden && !desktopQuery\.matches\)/);
  assert.match(shell, /direction !== runtime\.mobileScrollDirection/);
  assert.match(shell, /runtime\.mobileScrollDistance \+= Math\.abs\(delta\)/);
  assert.match(shell, /window\.addEventListener\('scroll', runtime\.onMobileScroll, \{ passive: true \}\)/);

  assert.match(headerControls, /html\[data-codex-mobile-header\] header\.header\s*\{[\s\S]*?position:\s*fixed !important/);
  assert.match(headerControls, /transition:\s*transform \.28s cubic-bezier\(\.22, \.61, \.36, 1\)/);
  assert.match(headerControls, /html\[data-codex-mobile-header\]\[data-codex-mobile-header-hidden\] header\.header\s*\{[\s\S]*?translateY\(calc\(-100% - 1px\)\)/);
  assert.doesNotMatch(headerControls, /html\[data-codex-mobile-header\] \.page\s*\{/);
});

test('mobile table of contents follows the auto-hiding header without changing its functionality', () => {
  const headerControls = read('../src/styles/header-controls.css');

  assert.match(
    headerControls,
    /html\[data-codex-mobile-header\] mobile-starlight-toc > nav\s*\{[\s\S]*?top:\s*calc\(var\(--sl-nav-height, 3\.5rem\) - 1px\) !important/,
  );
  assert.match(
    headerControls,
    /html\[data-codex-mobile-header\]\[data-codex-mobile-header-hidden\] mobile-starlight-toc > nav\s*\{[\s\S]*?top:\s*0 !important/,
  );
  assert.match(
    headerControls,
    /mobile-starlight-toc > nav\s*\{[\s\S]*?transition:\s*top \.28s cubic-bezier\(\.22, \.61, \.36, 1\)/,
  );
});

test('mobile sidebar controls follow the auto-hiding header without being covered', () => {
  const headerControls = read('../src/styles/header-controls.css');

  assert.match(
    headerControls,
    /html\[data-codex-mobile-header\] \.sidebar > starlight-menu-button button\s*\{[\s\S]*?translateY\(var\(--sl-nav-height, 3\.5rem\)\)/,
  );
  assert.match(
    headerControls,
    /html\[data-codex-mobile-header\]\[data-codex-mobile-header-hidden\] \.sidebar > starlight-menu-button button\s*\{[\s\S]*?translateY\(0\)/,
  );
  assert.match(
    headerControls,
    /html\[data-codex-mobile-header\] \.sidebar-pane\s*\{[\s\S]*?inset-block-start:\s*var\(--sl-nav-height, 3\.5rem\)/,
  );
  assert.match(
    headerControls,
    /html\[data-codex-mobile-header\]\[data-codex-mobile-header-hidden\] \.sidebar-pane\s*\{[\s\S]*?inset-block-start:\s*0/,
  );
});

test('homepage has no first-load reveal and still supports the sidebar rail', () => {
  const homepage = read('../src/pages/index.astro');

  assert.match(homepage, /hasSidebar=\{true\}/);
  assert.match(homepage, /html\[data-codex-desktop-sidebar\]:not\(\.codex-sidebar-collapsed\) \.main-frame:has\(\.home-gateway\)/);
  assert.match(homepage, /padding-inline-start: var\(--codex-sidebar-overlay-width\) !important/);
  assert.doesNotMatch(homepage, /HomeReveal|homepage-reveal|client:load/);
  assert.equal(existsSync(new URL('../src/components/home/HomeReveal.tsx', import.meta.url)), false);
  assert.equal(existsSync(new URL('../src/styles/homepage-reveal.css', import.meta.url)), false);
});

test('mobile page table of contents is owned by the responsive runtime', () => {
  const shell = read('../src/scripts/codex-shell.js');
  const navigation = read('../src/styles/navigation.css');

  assert.match(navigation, /@media \(min-width: 800px\)/);
  assert.match(navigation, /--sl-mobile-toc-height: 0rem/);
  assert.match(shell, /document\.getElementById\('starlight__on-this-page--mobile'\)/);
  assert.match(shell, /summary\?\.closest\('nav'\)/);
  assert.match(shell, /navigation\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(shell, /navigation\.style\.removeProperty\('display'\)/);
  assert.match(shell, /new MutationObserver\(\(\) => runtime\.syncMobileToc\(\)\)/);
  assert.match(shell, /runtime\.mobileTocObserver\.observe\(document\.body, \{ childList: true, subtree: true \}\)/);
});
