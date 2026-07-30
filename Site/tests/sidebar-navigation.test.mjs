import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { buildSidebar } from '../sidebar.mjs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('sidebar lists folders before articles at every level', async () => {
  const assertFoldersFirst = (entries) => {
    let foundArticle = false;

    for (const entry of entries) {
      if (entry.items) {
        assert.equal(foundArticle, false, `${entry.label} appears after an article`);
        assertFoldersFirst(entry.items);
      } else {
        foundArticle = true;
      }
    }
  };

  assertFoldersFirst(await buildSidebar());
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
  assert.match(header, /aria-label="Show sidebar"/);
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
