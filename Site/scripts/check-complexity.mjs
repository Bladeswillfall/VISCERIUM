import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { isMainModule } from './script-entry.mjs';

const MAX_COMPLEXITY = 20;
const ESLINT_VERSION = '10.9.0';
const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(siteRoot, '..');

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
    .filter((file) => existsSync(path.join(repoRoot, file)))
    .filter((file) => !file.includes('/dist/'))
    .filter((file) => !file.startsWith('Vault/.obsidian/plugins/'))
    .filter((file) => !file.startsWith('Vault/System/Views/'));
}

export function runComplexityCheck() {
  const files = trackedJavaScriptFiles();
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
      '--report-unused-disable-directives',
      '--rule',
      `complexity: ["error", ${MAX_COMPLEXITY}]`,
      ...files,
    ],
    { cwd: repoRoot, stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) return false;

  console.log(`Complexity guard checked ${files.length} tracked JavaScript files at max ${MAX_COMPLEXITY}.`);
  return true;
}

if (isMainModule(import.meta.url) && !runComplexityCheck()) process.exitCode = 1;
