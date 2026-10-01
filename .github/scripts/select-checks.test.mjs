import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHECKS, changedPaths, selectChecks } from './select-checks.mjs';

const all = Object.fromEntries(CHECKS.map(name => [name, true]));
const only = (...names) => Object.fromEntries(CHECKS.map(name => [name, names.includes(name)]));
const fullSite = only('unit', 'build', 'browser', 'graph_engines', 'contact', 'axe');

test('docs-only changes run only mandatory repository policy', () => {
  assert.deepEqual(selectChecks(['README.md', 'CONTRIBUTING.md', 'docs/guide.md']), only());
  assert.deepEqual(selectChecks([]), only());
});

test('gateway-only changes skip unrelated site and plugin jobs', () => {
  assert.deepEqual(selectChecks(['Services/comment-gateway/src/server.mjs']), only('gateway'));
});

test('plugin-only changes run plugin and linked site contracts', () => {
  assert.deepEqual(selectChecks(['Tools/obsidian-viscerium-timelines/src/main.ts']), only('obsidian_plugin', 'unit'));
  assert.deepEqual(selectChecks(['Vault/.obsidian/plugins/viscerium-timelines/main.js']), only('obsidian_plugin', 'unit'));
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

test('site or Vault changes retain all site coverage', () => {
  for (const file of ['Site/src/pages/index.astro', 'Site/public/_headers', 'Vault/Lore/example.md',
    'Site/package-lock.json', 'Site/tests/fixtures/storyline-test-scene.md']) {
    assert.deepEqual(selectChecks([file]), fullSite, file);
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
    assert.match(section.split(/^  [a-z_]+:\n/m)[0], /needs:.*changes/, name + ' needs change detection');
    assert.match(workflow, new RegExp('needs\\.changes\\.outputs\\.' + name));
  }
  assert.match(workflow, /CHANGES_RESULT:/);
  assert.match(workflow, /test "\$CHANGES_RESULT" = "success"/);
  assert.match(workflow, /"skipped"/);
});
