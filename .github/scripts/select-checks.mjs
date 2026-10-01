import { spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CHECKS = Object.freeze([
  'unit', 'gateway', 'build', 'obsidian_plugin', 'browser', 'graph_engines', 'contact', 'axe',
]);

const full = () => Object.fromEntries(CHECKS.map(name => [name, true]));
const empty = () => Object.fromEntries(CHECKS.map(name => [name, false]));

function markSite(checks) {
  for (const name of ['unit', 'build', 'browser', 'graph_engines', 'contact', 'axe']) {
    checks[name] = true;
  }
}

function markTestFile(checks, name) {
  if (/^Site\/tests\/[^/]+\.test\.mjs$/.test(name)) {
    checks.unit = true;
  } else if (/^Site\/tests\/accessibility\/[^/]+\.spec\.mjs$/.test(name)) {
    checks.build = true;
    checks.axe = true;
  } else if (/^Site\/tests\/browser\/[^/]+\.spec\.mjs$/.test(name)) {
    checks.build = true;
    checks.browser = true;
    if (/^Site\/tests\/browser\/graph[^/]*\.spec\.mjs$/.test(name)) checks.graph_engines = true;
    if (name === 'Site/tests/browser/contact.spec.mjs') checks.contact = true;
  } else if (/^Site\/tests\/[^/]+\.postbuild\.mjs$/.test(name)) {
    checks.build = true;
  } else {
    return false;
  }
  return true;
}

function markPath(checks, name) {
  // Unknown or CI-related changes run everything. Never guess their dependencies.
  if (typeof name !== 'string' || !name || name.startsWith('/')
    || name.includes('..') || /^\.github\/(?:workflows|scripts)\//.test(name)) return false;

  if (name === 'README.md') {
    checks.unit = true; // Site tests validate README rights notices and badges.
  } else if (/^(?:CONTRIBUTING|CODE_OF_CONDUCT)\.md$/.test(name)
    || /^docs\/.+\.md$/.test(name) || name === 'Site/tests/README.md') {
    return true;
  } else if (name.startsWith('Services/comment-gateway/')) {
    checks.gateway = true;
  } else if (/^Tools\/obsidian-viscerium-timelines\//.test(name)
    || /^Vault\/\.obsidian\/plugins\/viscerium-timelines\//.test(name)
    || name === 'Tools/scripts/sync-obsidian-plugins.mjs') {
    checks.obsidian_plugin = true;
    checks.unit = true;
  } else if (name.startsWith('Site/tests/') && markTestFile(checks, name)) {
    return true;
  } else if (name.startsWith('Site/') || name.startsWith('Vault/')) {
    markSite(checks);
  } else {
    return false;
  }
  return true;
}

export function selectChecks(paths, { fullRun = false } = {}) {
  if (fullRun || !Array.isArray(paths)) return full();
  const checks = empty();
  for (const name of paths) if (!markPath(checks, name)) return full();
  return checks;
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

function main() {
  const event = process.env.GITHUB_EVENT_NAME;
  let checks;
  if (event === 'pull_request') {
    try {
      checks = selectChecks(changedPaths(process.env.PR_BASE_SHA));
    } catch (error) {
      console.warn(error.message);
      checks = full();
    }
  } else {
    checks = full(); // A push to main or an unfamiliar event always gets full coverage.
  }
  const output = CHECKS.map(name => name + '=' + checks[name] + '\n').join('');
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, output);
  console.log('CI selection:', Object.entries(checks).map(([name, enabled]) =>
    name + '=' + (enabled ? 'run' : 'skip')).join(', '));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
