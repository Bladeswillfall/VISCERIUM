import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Telescope owns search while the custom header stays enabled', () => {
  const config = read('../astro.config.mjs');

  assert.match(config, /pagefind:\s*false/);
  assert.match(config, /starlightTelescope\(\{[\s\S]*key:\s*'k'/);
  assert.match(config, /Header:\s*'\.\/src\/components\/CodexHeader\.astro'/);
  assert.match(config, /'\.\/src\/styles\/header-controls\.css'/);
});

test('the Codex header renders the Telescope search trigger, era context and theme controls', () => {
  const header = read('../src/components/CodexHeader.astro');
  const search = read('../src/components/CodexSearch.astro');
  const eraContext = read('../src/components/EraContextControls.astro');
  const shell = read('../src/scripts/codex-shell.js');
  const headerCss = read('../src/styles/header-controls.css');

  assert.match(header, /import CodexSearch from '\.\/CodexSearch\.astro'/);
  assert.match(header, /import EraContextControls from '\.\/EraContextControls\.astro'/);
  assert.match(header, /import ThemeSelect from 'virtual:starlight\/components\/ThemeSelect'/);
  assert.match(header, /<CodexSearch \/>/);
  assert.match(header, /<EraContextControls \/>/);
  assert.match(header, /<ThemeSelect \/>/);
  assert.match(header, /data-codex-header-search/);
  assert.match(header, /data-codex-header-controls/);

  assert.match(shell, /telescope-search \.telescope__trigger-btn/);
  assert.match(search, /aria-controls="telescope-dialog"/);
  assert.doesNotMatch(search, /pagefind/i);
  assert.match(eraContext, /data-era-exit-template=\{t\('viscerium\.era\.exitEra'/);
  assert.match(shell, /fillEra\(node\.dataset\.eraExitTemplate\)/);
  assert.match(shell, /viscerium-era-context/);

  assert.match(header, /import '\.\.\/scripts\/codex-shell\.js'/);
  assert.match(shell, /window\.matchMedia\('\(min-width: 800px\)'\)/);
  assert.match(shell, /const isDesktop = desktopQuery\.matches/);
  assert.match(shell, /root\.toggleAttribute\('data-codex-wide-header', isDesktop\)/);
  assert.match(shell, /root\.toggleAttribute\('data-codex-mobile-header', !isDesktop\)/);
  assert.match(shell, /desktopQuery\.addEventListener\('change', runtime\.sync\)/);
  assert.match(shell, /document\.addEventListener\('astro:page-load', runtime\.sync\)/);

  assert.match(headerCss, /html\[data-codex-wide-header\] \.codex-header-search/);
  assert.match(headerCss, /min-width:\s*14rem !important/);
  assert.doesNotMatch(headerCss, /@media\s*\(\s*min-width/);
  assert.match(headerCss, /\.codex-theme-control select/);
});

test('the Telescope plugin retains a hidden controller mount', () => {
  const config = read('../astro.config.mjs');
  const header = read('../src/components/CodexHeader.astro');
  const headerCss = read('../src/styles/header-controls.css');

  assert.match(config, /starlightTelescope\(\{/);
  assert.match(header, /class="right-group codex-header-controls print:hidden"/);
  assert.match(header, /Telescope injects its hidden controller into `\.right-group`/);
  assert.match(headerCss, /\.codex-header telescope-search/);
  assert.match(headerCss, /\.codex-header telescope-search\s*\{\s*display:\s*none/);
});

test('global shell scripts are processed once instead of repeated inline', () => {
  for (const component of [
    '../src/components/CodexSearch.astro',
    '../src/components/EraContextControls.astro',
    '../src/components/Webmentions.astro',
    '../src/components/CodexHeader.astro',
    '../src/components/StarlightFooter.astro',
  ]) {
    assert.doesNotMatch(read(component), /<script\s+is:inline>/);
  }
  assert.match(read('../src/components/CodexHeader.astro'), /import '\.\.\/scripts\/codex-shell\.js'/);
});

test('the top ribbon is visually flat, centred and free of GitHub branding', () => {
  const header = read('../src/components/CodexHeader.astro');
  const headerCss = read('../src/styles/header-controls.css');

  assert.doesNotMatch(header, /SocialIcons/);
  assert.doesNotMatch(header, /social-icons/);
  assert.doesNotMatch(headerCss, /linear-gradient/);
  assert.match(
    headerCss,
    /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(16rem,\s*34rem\)\s+minmax\(0,\s*1fr\)/
  );
  assert.match(headerCss, /\.codex-header-search\s*\{[\s\S]*justify-self:\s*center/);
  assert.match(headerCss, /\.codex-header-controls\s*\{[\s\S]*justify-self:\s*end/);
});

test('the complete header ribbon is borderless without removing focus indicators', () => {
  const headerCss = read('../src/styles/header-controls.css');

  assert.match(
    headerCss,
    /header\.header,[\s\S]*\.codex-header \*::after\s*\{[\s\S]*border:\s*0 !important;/
  );
  assert.doesNotMatch(headerCss, /border-color\s*:/);
  assert.match(headerCss, /:focus-visible[\s\S]*outline:\s*2px solid/);
});

test('theme controls are not duplicated inside the sidebar', () => {
  const sidebar = read('../src/components/IonSidebar.astro');

  assert.doesNotMatch(sidebar, /MobileMenuFooter/);
  assert.doesNotMatch(sidebar, /ThemeSelect/);
  assert.doesNotMatch(sidebar, /starlight-theme-select/);
});
