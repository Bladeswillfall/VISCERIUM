import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { CHECKS, changedPaths, selectChecks } from './select-checks.mjs';

const all = Object.fromEntries(CHECKS.map(name => [name, true]));
const only = (...names) => Object.fromEntries(CHECKS.map(name => [name, names.includes(name)]));
const fullSite = only('unit', 'build', 'browser', 'graph_engines', 'axe');
const fullSiteWithContact = only('unit', 'build', 'browser', 'graph_engines', 'contact', 'axe');
const fullSiteWithPlugin = () => only('unit', 'build', 'obsidian_plugin', 'browser', 'graph_engines', 'axe');

test('docs-only changes run only mandatory repository policy', () => {
  assert.deepEqual(selectChecks(['CONTRIBUTING.md', 'docs/guide.md']), only());
  assert.deepEqual(selectChecks(['README.md']), only('unit'), 'README rights and badges have unit contracts');
  assert.deepEqual(selectChecks([]), only());
});

test('gateway-only changes skip unrelated site and plugin jobs', () => {
  assert.deepEqual(selectChecks(['Services/comment-gateway/src/server.mjs']), only('gateway'));
});

test('plugin and shared timeline changes run plugin integrity checks', () => {
  assert.deepEqual(selectChecks(['Tools/obsidian-viscerium-timelines/src/main.ts']), only('obsidian_plugin', 'unit'));
  assert.deepEqual(selectChecks(['Vault/.obsidian/plugins/viscerium-timelines/main.js']), only('obsidian_plugin', 'unit'));
  assert.deepEqual(selectChecks(['Site/src/lib/timeline/renderer.mjs']), fullSiteWithPlugin());
  assert.deepEqual(selectChecks(['Site/src/lib/calendar/runtime.mjs']), fullSiteWithPlugin());
  assert.deepEqual(selectChecks(['Site/src/styles/timeline-canvas.css']), fullSiteWithPlugin());
});

test('unit-only and postbuild-only edits do not run browser jobs', () => {
  assert.deepEqual(selectChecks(['Site/tests/responsive-image-cache.test.mjs']), only('unit'));
  assert.deepEqual(selectChecks(['Site/tests/i18n-output.postbuild.mjs']), only('build'));
});

test('browser test edits trigger only necessary browsers and their build', () => {
  assert.deepEqual(selectChecks(['Site/tests/browser/sidebar-navigation.spec.mjs']), only('build', 'browser'));
  assert.deepEqual(selectChecks(['Site/tests/browser/graph.spec.mjs']), only('build', 'browser', 'graph_engines'));
  assert.deepEqual(selectChecks(['Site/tests/browser/contact.spec.mjs']), only('build', 'browser', 'contact'));
  assert.deepEqual(selectChecks(['Site/tests/accessibility/axe.spec.mjs']), only('build', 'axe'));
});

test('combined PR changes select the union of affected jobs', () => {
  assert.deepEqual(selectChecks([
    'Site/tests/responsive-image-cache.test.mjs', 'Services/comment-gateway/tests/server.test.mjs',
  ]), only('unit', 'gateway'));
  assert.deepEqual(selectChecks([
    'Site/tests/browser/graph.spec.mjs', 'Site/tests/accessibility/axe.spec.mjs',
  ]), only('build', 'browser', 'graph_engines', 'axe'));
});

test('site or Vault changes retain site coverage without unrelated contact builds', () => {
  for (const file of ['Site/src/pages/index.astro', 'Site/public/_headers', 'Vault/Lore/example.md',
    'Site/tests/fixtures/storyline-test-scene.md']) {
    assert.deepEqual(selectChecks([file]), fullSite, file);
  }
  for (const file of ['Site/src/pages/contact.astro', 'Site/src/styles/contact.css',
    'Site/site.config.mjs', 'Site/astro.config.mjs', 'Site/wrangler.toml',
    'Site/package.json', 'Site/package-lock.json']) {
    assert.deepEqual(selectChecks([file]), fullSiteWithContact, file);
  }
});

test('CI files, unknown paths, and failed path detection run everything', () => {
  for (const file of ['.github/workflows/checks.yml', '.github/scripts/select-checks.mjs',
    'Tools/new-tool/config.json', 'Services/new-service/main.mjs', 'docs/generate.mjs',
    '../outside', '/absolute']) {
    assert.deepEqual(selectChecks([file]), all, file);
  }
  assert.deepEqual(selectChecks(null), all);
  assert.deepEqual(selectChecks(['README.md'], { fullRun: true }), all);
  assert.throws(() => changedPaths('not-a-commit'), /invalid PR base/);
});

test('workflow gates each job and verifies both selected and intentionally skipped results', () => {
  const workflow = readFileSync(new URL('../workflows/checks.yml', import.meta.url), 'utf8');
  assert.match(workflow, /^  changes:\n/m);
  assert.match(workflow, /PR_BASE_SHA:/);
  assert.match(workflow, /node \.github\/scripts\/select-checks\.mjs/);
  for (const name of CHECKS) {
    const section = workflow.split(new RegExp('^  ' + name + ':\\n', 'm'))[1];
    assert.ok(section, 'missing CI job: ' + name);
    const job = section.split(/^  [a-z_]+:\n/m)[0];
    assert.equal([...job.matchAll(/^    needs:/gm)].length, 1, name + ' cannot declare needs twice');
    assert.match(job, /needs:.*changes/, name + ' needs change detection');
    assert.match(workflow, new RegExp('needs\\.changes\\.outputs\\.' + name));
  }
  assert.match(workflow, /CHANGES_RESULT:/);
  assert.match(workflow, /test "\$CHANGES_RESULT" = "success"/);
  assert.match(workflow, /"skipped"/);
});

test('aggregate verification accepts only the skips selected by change detection', () => {
  const workflow = readFileSync(new URL('../workflows/checks.yml', import.meta.url), 'utf8');
  const script = workflow.split(/^  verify:\n/m)[1]?.split('        run: |\n')[1]?.replace(/^          /gm, '');
  assert.ok(script, 'aggregate verification must have a runnable shell script');
  const environment = { CHANGES_RESULT: 'success', REPOSITORY_RESULT: 'success' };
  for (const name of CHECKS) {
    environment['RUN_' + name.toUpperCase()] = 'false';
    environment[name.toUpperCase() + '_RESULT'] = 'skipped';
  }
  const run = (overrides = {}) => spawnSync('bash', ['-e', '-c', script], {
    encoding: 'utf8', env: { ...process.env, ...environment, ...overrides },
  });
  assert.equal(run().status, 0, 'unselected suites must be allowed to skip');
  assert.notEqual(run({ RUN_UNIT: 'true' }).status, 0, 'a required skipped job cannot pass');
  assert.notEqual(run({ UNIT_RESULT: 'failure' }).status, 0, 'an unselected failed job is not an intentional skip');
  assert.notEqual(run({ CHANGES_RESULT: 'failure' }).status, 0, 'broken change detection cannot pass');
  assert.equal(run({ RUN_UNIT: 'true', UNIT_RESULT: 'success' }).status, 0);
});
