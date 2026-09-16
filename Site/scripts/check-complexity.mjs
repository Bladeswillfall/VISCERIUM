import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { isMainModule } from './script-entry.mjs';

const MAX_COMPLEXITY = 20;
// ponytail: These ceilings freeze pre-existing plugin debt exposed by moving source under Tools.
// Lower a ceiling when its hotspot is split. Never raise a ceiling to make a new regression pass.
const LEGACY_COMPLEXITY_CEILINGS = new Map([
  ['Tools/obsidian-viscerium-creator-tools/src/main.js', 24], // ImportReviewView.refresh
  ['Tools/obsidian-viscerium-image-tools/src/main.js', 22], // renderHeaderImage
  ['Tools/obsidian-viscerium-layout-tools/src/main.js', 21], // normaliseMalformedRenderedNesting
]);

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(siteRoot, '..');
const eslintCli = path.join(siteRoot, 'node_modules', 'eslint', 'bin', 'eslint.js');

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

function runEslint(files, maxComplexity) {
  if (!files.length) return true;
  const result = spawnSync(
    process.execPath,
    [
      eslintCli,
      '--no-config-lookup',
      '--report-unused-disable-directives',
      '--rule',
      `complexity: ["error", ${maxComplexity}]`,
      ...files,
    ],
    { cwd: repoRoot, stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  return result.status === 0;
}

export function runComplexityCheck() {
  const files = trackedJavaScriptFiles();
  const groups = new Map();

  for (const file of files) {
    const ceiling = LEGACY_COMPLEXITY_CEILINGS.get(file) ?? MAX_COMPLEXITY;
    const group = groups.get(ceiling) ?? [];
    group.push(file);
    groups.set(ceiling, group);
  }

  for (const [ceiling, group] of groups) {
    if (!runEslint(group, ceiling)) return false;
  }

  console.log(`Complexity guard checked ${files.length} tracked JavaScript files at max ${MAX_COMPLEXITY}.`);
  for (const [file, ceiling] of LEGACY_COMPLEXITY_CEILINGS) {
    console.log(`Legacy complexity ceiling ${ceiling}: ${file}`);
  }
  return true;
}

if (isMainModule(import.meta.url) && !runComplexityCheck()) process.exitCode = 1;
