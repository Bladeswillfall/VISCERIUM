import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CHECKS = Object.freeze([
  'unit', 'gateway', 'build', 'obsidian_plugin', 'browser', 'contact',
]);

export const BROWSER_SPECS = Object.freeze({
  core: Object.freeze([
    'tests/browser/sidebar-navigation.spec.mjs',
    'tests/browser/mobile-accessibility.spec.mjs',
  ]),
  graph: Object.freeze(['tests/browser/graph.spec.mjs']),
  timeline: Object.freeze(['tests/browser/timeline-smoke.spec.mjs']),
  atlas: Object.freeze([
    'tests/browser/atlas-layout.spec.mjs',
    'tests/browser/atlas-zoom-out.spec.mjs',
  ]),
  home: Object.freeze(['tests/browser/homepage-recent-articles.spec.mjs']),
  discussions: Object.freeze(['tests/browser/comments.spec.mjs']),
  contact: Object.freeze(['tests/browser/contact.spec.mjs']),
  storyteller: Object.freeze(['tests/browser/storyteller.spec.mjs']),
  era: Object.freeze([
    'tests/browser/era-context.spec.mjs',
    'tests/browser/era-primer.spec.mjs',
  ]),
  notFound: Object.freeze(['tests/browser/404.spec.mjs']),
});

const ALL_BROWSER_SPECS = Object.freeze([...new Set(Object.values(BROWSER_SPECS).flat())]);
export const COMPLETE_BROWSER_SPECS = Object.freeze([
  ...readdirSync(new URL('../../Site/tests/browser/', import.meta.url))
    .filter(name => name.endsWith('.spec.mjs'))
    .map(name => 'tests/browser/' + name)
    .sort(),
  'tests/accessibility/axe.spec.mjs',
]);
const fullChecks = () => Object.fromEntries(CHECKS.map(name => [name, true]));
const emptyChecks = () => Object.fromEntries(CHECKS.map(name => [name, false]));

const CONTACT_STYLE_INPUT = /^Site\/src\/styles\/(?:a11y|codex-ui|color-tokens|contact|editorial-shell|era-styles|header-controls|ion-(?:expressive-code|layers|theme)|layout|navigation|reader-settings|typography)\.css$/;
const GLOBAL_BROWSER_INPUT = /^(?:Site\/(?:astro|site)\.config\.mjs|Site\/package(?:-lock)?\.json)$/;
const GENERIC_UI_INPUT = /^Site\/src\/(?:components\/.*\.astro|pages\/.*\.astro|scripts\/.*\.js|styles\/.*\.css)$/;

function addBrowserSpecs(checks, specs, ...groups) {
  for (const group of groups) {
    for (const spec of BROWSER_SPECS[group]) specs.add(spec);
  }
  checks.browser = specs.size > 0;
}

function addAllBrowserSpecs(checks, specs) {
  for (const spec of ALL_BROWSER_SPECS) specs.add(spec);
  checks.browser = true;
}

function needsEnabledContactFixture(name) {
  return name === 'Site/src/pages/contact.astro'
    || name === 'Site/src/components/support/SupportHub.astro'
    || CONTACT_STYLE_INPUT.test(name)
    || GLOBAL_BROWSER_INPUT.test(name);
}

function isTimelinePluginSource(name) {
  return /^Tools\/obsidian-viscerium-timelines\//.test(name)
    || /^Vault\/\.obsidian\/plugins\/viscerium-timelines\//.test(name)
    || /^Site\/src\/lib\/(?:timeline|calendar)\//.test(name)
    || /^Site\/src\/styles\/timeline-(?:canvas|vis)\.css$/.test(name)
    || name === 'Tools/scripts/sync-obsidian-plugins.mjs';
}

function addBrowserForSource(checks, specs, name) {
  if (GLOBAL_BROWSER_INPUT.test(name)) {
    addAllBrowserSpecs(checks, specs);
    return;
  }

  const lower = name.toLowerCase();
  const groups = [];

  if (/(?:\/graph(?:\.|\/)|worldgraph|site-graph|relationship|cytoscape|dagre)/.test(lower)) groups.push('graph');
  if (/(?:timeline|calendar|chronicle)/.test(lower)) groups.push('timeline');
  if (/(?:atlas|leaflet|worldmap|\/maps?\/|maps\.json)/.test(lower)) groups.push('atlas');
  if (/site\/src\/(?:components\/home\/|pages\/index\.astro$|styles\/homepage\.css$)/.test(lower)) groups.push('home');
  if (/(?:comments?|webmentions?|codexdiscussions)/.test(lower)) groups.push('discussions');
  if (/(?:contact|support)/.test(lower)) groups.push('contact');
  if (/storyteller/.test(lower)) groups.push('storyteller');
  if (/(?:components\/era\/|eracontext|era-primer|era-styles)/.test(lower)) groups.push('era');
  if (/site\/src\/pages\/404\.astro$/.test(lower)) groups.push('notFound');

  if (groups.length) {
    addBrowserSpecs(checks, specs, ...new Set(groups));
  } else if (GENERIC_UI_INPUT.test(name)) {
    addBrowserSpecs(checks, specs, 'core');
  }
}

function markTestFile(checks, specs, name) {
  if (/^Site\/tests\/[^/]+\.test\.mjs$/.test(name)) {
    checks.unit = true;
    return true;
  }

  if (/^Site\/tests\/[^/]+\.postbuild\.mjs$/.test(name)) {
    checks.build = true;
    return true;
  }

  if (/^Site\/tests\/browser\/[^/]+\.spec\.mjs$/.test(name)) {
    const relative = name.replace(/^Site\//, '');
    checks.build = true;
    if (COMPLETE_BROWSER_SPECS.includes(relative)) {
      specs.add(relative);
      checks.browser = true;
      if (name === 'Site/tests/browser/contact.spec.mjs') checks.contact = true;
    } else {
      // Deleted browser specs still trigger the current smoke tests.
      addAllBrowserSpecs(checks, specs);
    }
    return true;
  }

  if (/^Site\/tests\/accessibility\//.test(name)) {
    checks.build = true;
    checks.browser = true;
    specs.add('tests/accessibility/axe.spec.mjs');
    return true;
  }

  if (/^Site\/tests\/fixtures\//.test(name)) return true;
  return false;
}

function markSitePath(checks, specs, name) {
  checks.build = true;

  if (/^Site\/(?:scripts\/|functions\/|src\/(?:scripts|config|lib)\/|src\/data\/.*\.(?:mjs|ts)$|src\/content\.config\.ts$)/.test(name)
    || GLOBAL_BROWSER_INPUT.test(name)) {
    checks.unit = true;
  }

  addBrowserForSource(checks, specs, name);
  if (needsEnabledContactFixture(name)) checks.contact = true;
}

function markPath(checks, specs, name) {
  // CI changes and unknown paths run the complete plan.
  if (typeof name !== 'string' || !name || name.startsWith('/')
    || name.includes('..') || /^\.github\/(?:workflows|scripts)\//.test(name)) return false;

  if (name === 'README.md') {
    checks.unit = true;
    return true;
  }

  if (/^(?:CONTRIBUTING|CODE_OF_CONDUCT)\.md$/.test(name)
    || /^docs\/.+\.md$/.test(name) || name === 'Site/tests/README.md'
    || name === 'CLOUDFLARE_PAGES_SETUP.md') return true;

  if (name.startsWith('Services/comment-gateway/')) {
    checks.gateway = true;
    return true;
  }

  if (isTimelinePluginSource(name)) {
    checks.obsidian_plugin = true;
    checks.unit = true;
    if (name.startsWith('Site/')) {
      checks.build = true;
      addBrowserSpecs(checks, specs, 'timeline');
    }
    return true;
  }

  if (name.startsWith('Site/tests/') && markTestFile(checks, specs, name)) return true;

  if (name.startsWith('Vault/')) {
    checks.build = true;
    return true;
  }

  if (!name.startsWith('Site/')) return false;

  markSitePath(checks, specs, name);
  return true;
}

export function selectPlan(paths, { fullRun = false } = {}) {
  if (fullRun || !Array.isArray(paths)) {
    return { checks: fullChecks(), browserSpecs: [...COMPLETE_BROWSER_SPECS] };
  }

  const checks = emptyChecks();
  const specs = new Set();
  for (const name of paths) {
    if (!markPath(checks, specs, name)) {
      return { checks: fullChecks(), browserSpecs: [...COMPLETE_BROWSER_SPECS] };
    }
  }
  return { checks, browserSpecs: [...specs] };
}

export function selectScheduledPlan() {
  return { checks: { ...emptyChecks(), build: true, browser: true, contact: true }, browserSpecs: [...COMPLETE_BROWSER_SPECS] };
}

export function selectChecks(paths, options) {
  return selectPlan(paths, options).checks;
}

export function changedPaths(base) {
  if (!/^[0-9a-f]{40}$/.test(base ?? '')) throw new Error('Missing or invalid PR base commit');
  const result = spawnSync('git', ['diff', '--no-ext-diff', '--no-renames', '--name-only', '-z', base, 'HEAD', '--'], {
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error('Cannot compare PR changes against its base; run every check');
  }
  return result.stdout.toString('utf8').split('\0').filter(Boolean);
}

// A metadata edit may reuse an already-passing verification for this exact head SHA.
// A missing, failed, or untrusted API result falls back to the complete plan.
export function canReuseVerifiedChecks(event, checkRuns) {
  if (event?.action !== 'edited' || !event.changes || !Array.isArray(checkRuns)) return false;
  const changed = Object.keys(event.changes);
  if (!changed.length || changed.some(name => name !== 'title' && name !== 'body')) return false;
  const head = event.pull_request?.head?.sha;
  return /^[0-9a-f]{40}$/.test(head ?? '') && checkRuns.some(check =>
    check.name === 'verify' && check.head_sha === head
    && check.status === 'completed' && check.conclusion === 'success');
}

function canSkipMetadataOnlyEdit() {
  try {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    if (event?.action !== 'edited') return false;
    const head = event.pull_request?.head?.sha;
    const repo = process.env.GITHUB_REPOSITORY;
    if (!/^[0-9a-f]{40}$/.test(head ?? '')
      || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo ?? '')) return false;
    const result = spawnSync('gh', ['api', `repos/${repo}/commits/${head}/check-runs?per_page=100`], {
      encoding: 'utf8', maxBuffer: 2 * 1024 * 1024,
    });
    if (result.error || result.status !== 0) return false;
    return canReuseVerifiedChecks(event, JSON.parse(result.stdout).check_runs);
  } catch {
    return false;
  }
}

function main() {
  const event = process.env.GITHUB_EVENT_NAME;
  let plan;
  if (event === 'pull_request') {
    try {
      plan = canSkipMetadataOnlyEdit() ? selectPlan([]) : selectPlan(changedPaths(process.env.PR_BASE_SHA));
    } catch (error) {
      console.warn(error.message);
      plan = selectPlan(null);
    }
  } else if (event === 'schedule') {
    plan = selectScheduledPlan();
  } else {
    plan = selectPlan(null);
  }

  const output = [
    ...CHECKS.map(name => name + '=' + plan.checks[name]),
    'browser_specs=' + plan.browserSpecs.join(' '),
  ].join('\n') + '\n';
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, output);
  console.log('CI selection:', Object.entries(plan.checks).map(([name, enabled]) =>
    name + '=' + (enabled ? 'run' : 'skip')).join(', '));
  if (plan.browserSpecs.length) console.log('Browser specs:', plan.browserSpecs.join(', '));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
