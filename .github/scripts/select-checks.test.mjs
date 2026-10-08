import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { BROWSER_SPECS, CHECKS, COMPLETE_BROWSER_SPECS, canReuseVerifiedChecks, changedPaths, selectChecks, selectPlan, selectScheduledPlan } from './select-checks.mjs';

const all = Object.fromEntries(CHECKS.map(name => [name, true]));
const only = (...names) => Object.fromEntries(CHECKS.map(name => [name, names.includes(name)]));
const specs = (...groups) => [...new Set(groups.flatMap(group => BROWSER_SPECS[group]))];

test('docs and service changes avoid unrelated site checks', () => {
  assert.deepEqual(selectPlan(['CONTRIBUTING.md', 'docs/guide.md']), { checks: only(), browserSpecs: [] });
  assert.deepEqual(selectPlan(['CLOUDFLARE_PAGES_SETUP.md']), { checks: only(), browserSpecs: [] });
  assert.deepEqual(selectPlan(['README.md']), { checks: only('unit'), browserSpecs: [] });
  assert.deepEqual(selectPlan(['Services/comment-gateway/src/server.mjs']), {
    checks: only('gateway'), browserSpecs: [],
  });
});

test('lore and generated-content edits build without browser, graph, or unit suites', () => {
  for (const file of [
    'Vault/Lore/Eras/CITADEL/Events/example.md',
    'Vault/System/Publishing Rules.md',
    'Site/src/content/docs/example.mdx',
    'Site/CHANGELOG.md',
    'Site/public/_headers',
  ]) {
    assert.deepEqual(selectPlan([file]), { checks: only('build'), browserSpecs: [] }, file);
  }
});

test('generic UI changes run only the core functional browser checks', () => {
  for (const file of [
    'Site/src/components/CodexHeader.astro',
    'Site/src/pages/community/[id].astro',
    'Site/src/styles/statement-pages.css',
  ]) {
    assert.deepEqual(selectPlan([file]), {
      checks: only('build', 'browser'),
      browserSpecs: specs('core'),
    }, file);
  }
});

test('feature changes run only their functional browser specs', () => {
  assert.deepEqual(selectPlan(['Site/src/components/WorldGraph.astro']), {
    checks: only('build', 'browser'),
    browserSpecs: specs('graph'),
  });
  assert.deepEqual(selectPlan(['Site/src/lib/site-graph.mjs']), {
    checks: only('unit', 'build', 'browser'),
    browserSpecs: specs('graph'),
  });
  assert.deepEqual(selectPlan(['Site/src/pages/maps/[id].astro']), {
    checks: only('build', 'browser'),
    browserSpecs: specs('atlas'),
  });
  assert.deepEqual(selectPlan(['Site/src/pages/index.astro']), {
    checks: only('build', 'browser'),
    browserSpecs: specs('home'),
  });
  assert.deepEqual(selectPlan(['Site/src/components/CodexDiscussions.astro']), {
    checks: only('build', 'browser'),
    browserSpecs: specs('discussions'),
  });
  assert.deepEqual(selectPlan(['Site/src/components/StorytellerSwitcher.astro']), {
    checks: only('build', 'browser'),
    browserSpecs: specs('storyteller'),
  });
  assert.deepEqual(selectPlan(['Site/src/components/era/EraPrimer.astro']), {
    checks: only('build', 'browser'),
    browserSpecs: specs('era'),
  });
  assert.deepEqual(selectPlan(['Site/src/pages/404.astro']), {
    checks: only('build', 'browser'),
    browserSpecs: specs('notFound'),
  });
});

test('timeline code keeps plugin integrity and only the timeline browser smoke test', () => {
  assert.deepEqual(selectPlan(['Tools/obsidian-viscerium-timelines/src/main.ts']), {
    checks: only('unit', 'obsidian_plugin'),
    browserSpecs: [],
  });
  assert.deepEqual(selectPlan(['Site/src/lib/timeline/renderer.mjs']), {
    checks: only('unit', 'build', 'obsidian_plugin', 'browser'),
    browserSpecs: specs('timeline'),
  });
  assert.deepEqual(selectPlan(['Site/src/styles/timeline-vis.css']), {
    checks: only('unit', 'build', 'obsidian_plugin', 'browser'),
    browserSpecs: specs('timeline'),
  });
});

test('contact-sensitive inputs keep the enabled-form fixture without broad browser coverage', () => {
  assert.deepEqual(selectPlan(['Site/src/pages/contact.astro']), {
    checks: only('build', 'browser', 'contact'),
    browserSpecs: specs('contact'),
  });
  for (const file of ['Site/src/styles/a11y.css', 'Site/src/styles/typography.css']) {
    assert.deepEqual(selectPlan([file]), {
      checks: only('build', 'browser', 'contact'),
      browserSpecs: specs('core'),
    }, file);
  }
});

test('tested runtime config sources still select unit tests', () => {
  assert.deepEqual(selectPlan(['Site/src/config/rights.mjs']), {
    checks: only('unit', 'build'),
    browserSpecs: [],
  });
  assert.deepEqual(selectPlan(['Site/src/scripts/reader-settings.js']), {
    checks: only('unit', 'build', 'browser'),
    browserSpecs: specs('core'),
  });
});

test('dependency and global config changes run the curated full browser set', () => {
  const plan = selectPlan(['Site/package-lock.json']);
  assert.deepEqual(plan.checks, only('unit', 'build', 'browser', 'contact'));
  assert.deepEqual(plan.browserSpecs, specs(
    'core', 'graph', 'timeline', 'atlas', 'home', 'discussions', 'contact', 'storyteller', 'era', 'notFound',
  ));
});

test('browser and Axe test-file edits run their specs', () => {
  assert.deepEqual(selectPlan(['Site/tests/responsive-image-cache.test.mjs']), {
    checks: only('unit'), browserSpecs: [],
  });
  assert.deepEqual(selectPlan(['Site/tests/i18n-output.postbuild.mjs']), {
    checks: only('build'), browserSpecs: [],
  });
  assert.deepEqual(selectPlan(['Site/tests/browser/graph.spec.mjs']), {
    checks: only('build', 'browser'), browserSpecs: specs('graph'),
  });
  assert.deepEqual(selectPlan(['Site/tests/browser/graph-label-contrast.spec.mjs']), {
    checks: only('build', 'browser'), browserSpecs: ['tests/browser/graph-label-contrast.spec.mjs'],
  });
  assert.deepEqual(selectPlan(['Site/tests/accessibility/axe.spec.mjs']), {
    checks: only('build', 'browser'), browserSpecs: ['tests/accessibility/axe.spec.mjs'],
  });
  assert.deepEqual(selectPlan(['Site/tests/browser/removed.spec.mjs']), {
    checks: only('build', 'browser'),
    browserSpecs: specs('core', 'graph', 'timeline', 'atlas', 'home', 'discussions', 'contact', 'storyteller', 'era', 'notFound'),
  });
});

test('combined changes select the union of affected functional checks', () => {
  assert.deepEqual(selectPlan([
    'Site/src/components/WorldGraph.astro',
    'Site/src/pages/maps/[id].astro',
    'Services/comment-gateway/tests/server.test.mjs',
  ]), {
    checks: only('gateway', 'build', 'browser'),
    browserSpecs: specs('graph', 'atlas'),
  });
});

test('CI files, unknown paths, and failed path detection run all browser specs', () => {
  for (const file of [
    '.github/workflows/checks.yml',
    '.github/scripts/select-checks.mjs',
    'Tools/new-tool/config.json',
    'Services/new-service/main.mjs',
    'docs/generate.mjs',
    '../outside',
    '/absolute',
  ]) {
    const plan = selectPlan([file]);
    assert.deepEqual(plan.checks, all, file);
    assert.deepEqual(plan.browserSpecs, COMPLETE_BROWSER_SPECS, file);
  }
  assert.deepEqual(selectChecks(null), all);
  assert.deepEqual(selectChecks(['README.md'], { fullRun: true }), all);
  assert.throws(() => changedPaths('not-a-commit'), /invalid PR base/);
});

test('scheduled plan covers all browser specs, Axe, and the enabled contact fixture', () => {
  const plan = selectScheduledPlan();
  assert.deepEqual(plan.checks, only('build', 'browser', 'contact'));
  assert.ok(plan.browserSpecs.includes('tests/browser/contact.spec.mjs'));
  assert.deepEqual(plan.browserSpecs, COMPLETE_BROWSER_SPECS);
  assert.ok(plan.browserSpecs.includes('tests/browser/graph-label-contrast.spec.mjs'));
  assert.ok(plan.browserSpecs.includes('tests/accessibility/axe.spec.mjs'));
  const workflow = readFileSync(new URL('../workflows/checks.yml', import.meta.url), 'utf8');
  assert.match(workflow, /schedule:\n\s+- cron:/);
});

test('workflow gates selected jobs and passes explicit browser specs', () => {
  const workflow = readFileSync(new URL('../workflows/checks.yml', import.meta.url), 'utf8');
  assert.match(workflow, /group: checks-\$\{\{ github\.event\.pull_request\.number \|\| github\.ref \}\}/);
  assert.match(workflow, /cancel-in-progress: \$\{\{ github\.event_name == 'pull_request' \}\}/);
  assert.match(workflow, /^  changes:\n/m);
  assert.match(workflow, /browser_specs: \$\{\{ steps\.select\.outputs\.browser_specs \}\}/);
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
  assert.doesNotMatch(workflow, /^  graph_engines:\n/m);
  assert.doesNotMatch(workflow, /^  axe:\n/m);
  assert.doesNotMatch(workflow, /benchmark:timelines/);

  const browser = workflow.split(/^  browser:\n/m)[1]?.split(/^  contact:\n/m)[0];
  assert.ok(browser, 'browser CI job must exist');
  assert.match(browser, /BROWSER_SPECS: \$\{\{ needs\.changes\.outputs\.browser_specs \}\}/);
  assert.match(browser, /read -r -a specs <<< "\$BROWSER_SPECS"/);
  assert.match(browser, /playwright test "\$\{specs\[@\]\}"/);
  assert.doesNotMatch(browser, /matrix\.shard|--shard=/);
});

test('aggregate verification accepts only skips selected by change detection', () => {
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

test('metadata-only edit reuses verification only when the exact head already passed', () => {
  const head = 'a'.repeat(40);
  const event = { action: 'edited', changes: { body: { from: 'old' } },
    pull_request: { head: { sha: head } } };
  const passed = [{ id: 100, name: 'verify', head_sha: head, status: 'completed', conclusion: 'success' }];
  assert.equal(canReuseVerifiedChecks(event, passed), true);
  assert.equal(canReuseVerifiedChecks({ ...event, changes: { title: { from: 'old' } } }, passed), true);
  assert.equal(canReuseVerifiedChecks({ ...event, changes: { body: {}, base: {} } }, passed), false);
  assert.equal(canReuseVerifiedChecks({ ...event, changes: {} }, passed), false);
  assert.equal(canReuseVerifiedChecks({ ...event, action: 'synchronize' }, passed), false);
  assert.equal(canReuseVerifiedChecks(event, [{ ...passed[0], head_sha: 'b'.repeat(40) }]), false);
  assert.equal(canReuseVerifiedChecks(event, [{ ...passed[0], conclusion: 'failure' }]), false);
  assert.equal(canReuseVerifiedChecks(event, [{ ...passed[0], status: 'in_progress' }]), false);
  assert.equal(canReuseVerifiedChecks(event, null), false);
  assert.equal(canReuseVerifiedChecks(event, [
    ...passed, { ...passed[0], id: 101, conclusion: 'failure' },
  ]), false, 'newer failed verification must override an older success');
  assert.equal(canReuseVerifiedChecks(event, [
    { ...passed[0], id: 101, conclusion: 'failure' }, ...passed,
  ]), false, 'check API ordering must not change the decision');
  assert.equal(canReuseVerifiedChecks(event, [
    ...passed, { ...passed[0], id: 101, status: 'in_progress', conclusion: null },
  ]), false, 'newer incomplete verification blocks the fast path');
  assert.equal(canReuseVerifiedChecks(event, [
    { ...passed[0], id: 99, conclusion: 'failure' }, ...passed,
  ]), true, 'newest completed verification decides the result');
  assert.equal(canReuseVerifiedChecks(event, [{ ...passed[0], id: undefined }]), false);

});
