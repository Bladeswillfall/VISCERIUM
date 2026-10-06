import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('font CDN origins are allowed by the report-only content security policy', () => {
  const headers = read('../public/_headers');

  assert.match(headers, /style-src[^;]*https:\/\/fonts\.googleapis\.com/);
  assert.match(headers, /font-src[^;]*https:\/\/fonts\.gstatic\.com/);
});

test('optional third-party origins are declared by the report-only content security policy', () => {
  const headers = read('../public/_headers');

  assert.match(headers, /script-src[^;]*https:\/\/static\.cloudflareinsights\.com/);
  assert.match(headers, /script-src[^;]*https:\/\/challenges\.cloudflare\.com/);
  assert.match(headers, /frame-src[^;]*https:\/\/challenges\.cloudflare\.com/);
  assert.match(headers, /connect-src[^;]*https:\/\/cloudflareinsights\.com/);
});

test('the public comments configuration targets the self-hosted Remark42 service', () => {
  const siteConfig = read('../site.config.mjs');
  const envExample = read('../.env.example');
  const headers = read('../public/_headers');

  assert.match(siteConfig, /https:\/\/comments\.viscerium\.co\.uk/);
  assert.match(siteConfig, /PUBLIC_COMMENTS_ENABLED/);
  assert.match(envExample, /PUBLIC_COMMENTS_ENABLED="1"/);
  assert.match(envExample, /PUBLIC_COMMENTS_HOST="https:\/\/comments\.viscerium\.co\.uk"/);
  assert.match(envExample, /PUBLIC_COMMENTS_SITE_ID="viscerium"/);
  assert.match(headers, /script-src[^;]*https:\/\/comments\.viscerium\.co\.uk/);
  assert.match(headers, /frame-src[^;]*https:\/\/comments\.viscerium\.co\.uk/);
  assert.match(headers, /connect-src[^;]*https:\/\/comments\.viscerium\.co\.uk/);
  assert.doesNotMatch(envExample, /PUBLIC_GISCUS_/);
  assert.doesNotMatch(headers, /https:\/\/giscus\.app/);
});

test('public site code cannot read Worker-only contact secrets', () => {
  const publicContactCode = [
    read('../site.config.mjs'),
    read('../astro.config.mjs'),
    read('../src/pages/contact.astro'),
  ].join('\n');

  assert.doesNotMatch(publicContactCode, /RESEND_API_KEY|TURNSTILE_SECRET_KEY/);
});

test('custom 404 route replaces Starlight default route', () => {
  const config = read('../astro.config.mjs');
  const notFoundPage = read('../src/pages/404.astro');

  assert.match(config, /disable404Route:\s*true/);
  assert.match(notFoundPage, /This page is not in the codex/);
});

test('dependency review includes comment gateway dependency files', () => {
  const workflow = read('../../.github/workflows/dependency-review.yml');

  for (const file of ['package.json', 'package-lock.json', '.npmrc']) {
    assert.ok(
      workflow.includes(`      - 'Services/comment-gateway/${file}'`),
      `dependency review must run for comment gateway ${file}`,
    );
  }
});

test('the checks workflow cannot create a follow-up repository commit', () => {
  const workflow = read('../../.github/workflows/checks.yml');

  assert.doesNotMatch(workflow, /contents:\s*write/);
  assert.doesNotMatch(workflow, /\bgit push\b/);
  assert.match(workflow, /cmp --silent dist\/main\.js/);
});

test('incremental Astro builds persist route output between CI runs', () => {
  const config = read('../astro.config.mjs');
  const workflow = read('../../.github/workflows/checks.yml');
  const dynamicRoutes = [
    read('../src/pages/community/[id].astro'),
    read('../src/pages/maps/[id].astro'),
    read('../src/pages/timelines/[id].astro'),
    read('../src/pages/eras/[era]/relationships/index.astro'),
  ];

  assert.match(config, /incrementalBuild:\s*true/);
  assert.doesNotMatch(config, /cacheDir:/);
  for (const route of dynamicRoutes) assert.match(route, /cacheKey:/);

  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /push:\n\s+branches:\s+\[main\]/);
  assert.match(workflow, /name: Restore Astro incremental build cache/);
  assert.match(workflow, /path: Site\/node_modules\/\.astro/);
  assert.match(workflow, /astro-incremental-v1-/);
  assert.match(workflow, /steps\.astro_cache\.outputs\.cache-hit/);
});

test('Axe accessibility runtime uses the lockfile instead of a second npm install', () => {
  const pkg = JSON.parse(read('../package.json'));
  const lock = JSON.parse(read('../package-lock.json'));
  const workflow = read('../../.github/workflows/checks.yml');
  const axe = workflow.split(/^  axe:\n/m)[1]?.split(/^  browser:\n/m)[0];

  assert.equal(pkg.devDependencies['@axe-core/playwright'], '4.13.0');
  assert.equal(lock.packages[''].devDependencies['@axe-core/playwright'], '4.13.0');
  assert.equal(lock.packages['node_modules/@axe-core/playwright'].version, '4.13.0');
  assert.equal(lock.packages['node_modules/axe-core'].version, '4.13.0');
  assert.ok(axe, 'Axe CI job must exist');
  assert.match(axe, /npm ci --silent --no-audit --no-fund/);
  assert.doesNotMatch(axe, /npm install --no-save|Install Axe accessibility runtime/);
});

test('aggregated changelog headings have unique IDs', () => {
  const changelog = read('../CHANGELOG.md');
  const headings = [...changelog.matchAll(/^###\s+(.+)$/gm)].map((match) => match[1].toLowerCase());

  assert.equal(new Set(headings).size, headings.length);
});

test('browser CI containers match locked Playwright and isolate contact tests', () => {
  const lock = JSON.parse(read('../package-lock.json'));
  const version = lock.packages['node_modules/@playwright/test'].version;
  const workflow = read('../../.github/workflows/checks.yml');
  const jobs = workflow.split(/^jobs:\n/m)[1];
  assert.ok(jobs, 'Checks workflow must define jobs');
  const jobIds = [...jobs.matchAll(/^  ([a-z][a-z0-9_-]*):$/gm)].map((match) => match[1]);
  assert.equal(new Set(jobIds).size, jobIds.length, 'workflow job IDs must be unique');
  const images = [...workflow.matchAll(/playwright:v([0-9.]+)-noble@sha256:([a-f0-9]{64})/g)];

  assert.equal(images.length, 4, 'browser, graph, contact and Axe jobs must use pinned images');
  assert.equal([...workflow.matchAll(/shell: bash/g)].length, 4, 'all container jobs must retain Bash');
  for (const image of images) assert.equal(image[1], version);

  const browser = workflow.split(/^  browser:\n/m)[1]?.split(/^  graph_engines:\n/m)[0];
  const graph = workflow.split(/^  graph_engines:\n/m)[1]?.split(/^  contact:\n/m)[0];
  const contact = workflow.split(/^  contact:\n/m)[1]?.split(/^  verify:\n/m)[0];
  const verify = workflow.split(/^  verify:\n/m)[1];
  assert.ok(browser && graph && contact && verify, 'browser, graph, contact and verify jobs must exist');
  assert.match(browser, /name: Run browser checks/);
  assert.match(browser, /playwright test tests\/browser --browser=chromium/);
  assert.doesNotMatch(browser, /--browser=firefox|--browser=webkit/);
  assert.match(graph, /needs: \[changes, build\]/);
  assert.match(graph, /if: needs\.changes\.outputs\.graph_engines == 'true'/);
  assert.match(graph, /name: Download production build/);
  assert.match(graph, /playwright test tests\/browser\/graph\*\.spec\.mjs --browser=firefox/);
  assert.match(graph, /playwright test tests\/browser\/graph\*\.spec\.mjs --browser=webkit/);
  assert.doesNotMatch(browser, /Build enabled contact browser fixture|Restore Atlas tile cache/);
  assert.match(contact, /Restore Atlas tile cache/);
  assert.match(contact, /name: Build enabled contact browser fixture/);
  assert.match(contact, /name: Run enabled contact browser check/);
  assert.match(contact, /PUBLIC_CONTACT_FORM_ENABLED: '1'/);
  assert.match(contact, /CONTACT_FORM_TEST_ENABLED: '1'/);
  assert.match(contact, /HOME: \/root/);
  assert.match(verify, /^      - graph_engines$/m);
  assert.match(verify, /GRAPH_ENGINES_RESULT: \$\{\{ needs\.graph_engines\.result \}\}/);
  assert.match(verify, /test "\$GRAPH_ENGINES_RESULT" = "success"/);
  assert.match(verify, /^      - contact$/m);
  assert.match(verify, /CONTACT_RESULT: \$\{\{ needs\.contact\.result \}\}/);
  assert.match(verify, /test "\$CONTACT_RESULT" = "success"/);
});
