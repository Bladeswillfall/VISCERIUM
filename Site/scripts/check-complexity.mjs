import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { COMPLEXITY_BASELINE } from './complexity-baseline.mjs';
import { isMainModule } from './script-entry.mjs';

const MAX_COMPLEXITY = 20;
const ESLINT_VERSION = '10.9.0';
const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(siteRoot, '..');

function scoreMap(entries) {
  const scores = new Map();
  for (const entry of entries) {
    const existing = scores.get(entry.file) ?? [];
    existing.push(...entry.scores);
    scores.set(entry.file, existing.sort((a, b) => a - b));
  }
  return scores;
}

function subtractScores(left, right) {
  const remaining = [...right];
  return left.filter((score) => {
    const index = remaining.indexOf(score);
    if (index === -1) return true;
    remaining.splice(index, 1);
    return false;
  });
}

export function compareComplexityFindings(findings, baseline = COMPLEXITY_BASELINE) {
  const current = scoreMap(findings.map(({ file, score }) => ({ file, scores: [score] })));
  const expected = scoreMap(baseline);
  const files = new Set([...current.keys(), ...expected.keys()]);
  const added = [];
  const resolved = [];

  for (const file of files) {
    const actualScores = current.get(file) ?? [];
    const expectedScores = expected.get(file) ?? [];
    for (const score of subtractScores(actualScores, expectedScores)) added.push({ file, score });
    for (const score of subtractScores(expectedScores, actualScores)) resolved.push({ file, score });
  }

  return { added, resolved };
}

function trackedJavaScriptFiles() {
  const git = spawnSync(
    'git',
    ['ls-files', '-z', '--', ':(glob)**/*.js', ':(glob)**/*.mjs', ':(glob)**/*.cjs'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  if (git.error) throw git.error;
  if (git.status !== 0) throw new Error(git.stderr.trim() || 'git ls-files failed');

  return git.stdout
    .split('\0')
    .filter(Boolean)
    .filter((file) => !file.includes('/dist/'))
    .filter((file) => !file.startsWith('Vault/.obsidian/plugins/'))
    .filter((file) => !file.startsWith('Vault/System/Views/'));
}

function eslintFindings(files) {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(
    npm,
    [
      'exec',
      '--yes',
      `--package=eslint@${ESLINT_VERSION}`,
      '--',
      'eslint',
      '--no-config-lookup',
      '--rule',
      `complexity: ["error", ${MAX_COMPLEXITY}]`,
      '--format',
      'json',
      ...files,
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    },
  );
  if (result.error) throw result.error;

  let reports;
  try {
    reports = JSON.parse(result.stdout || '[]');
  } catch {
    throw new Error(result.stderr.trim() || 'ESLint did not return JSON output');
  }

  const unexpected = [];
  const findings = [];
  for (const report of reports) {
    const file = path.relative(repoRoot, report.filePath).replace(/\\/g, '/');
    for (const message of report.messages) {
      if (message.ruleId !== 'complexity') {
        if (message.severity === 2) unexpected.push(`${file}:${message.line ?? 0} ${message.message}`);
        continue;
      }
      const match = message.message.match(/complexity of (\d+)/i);
      if (!match) {
        unexpected.push(`${file}:${message.line ?? 0} ${message.message}`);
        continue;
      }
      findings.push({ file, score: Number(match[1]) });
    }
  }

  if (unexpected.length > 0 || result.status === 2) {
    throw new Error(`ESLint failed:\n${unexpected.join('\n') || result.stderr.trim()}`);
  }
  return findings;
}

export function runComplexityCheck() {
  const files = trackedJavaScriptFiles();
  const findings = eslintFindings(files);
  const { added, resolved } = compareComplexityFindings(findings);

  if (added.length === 0 && resolved.length === 0) {
    console.log(`Complexity guard checked ${files.length} tracked JavaScript files at max ${MAX_COMPLEXITY}.`);
    console.log(`Grandfathered findings: ${findings.length}. New findings: 0.`);
    return true;
  }

  for (const finding of added) {
    console.error(`New complexity violation: ${finding.file} (${finding.score}).`);
  }
  for (const finding of resolved) {
    console.error(`Resolved complexity baseline entry must be removed: ${finding.file} (${finding.score}).`);
  }
  return false;
}

if (isMainModule(import.meta.url) && !runComplexityCheck()) process.exitCode = 1;
