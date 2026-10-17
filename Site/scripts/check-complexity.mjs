import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import ts from 'typescript';
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

function trackedSourceFiles() {
  const git = spawnSync(
    'git',
    ['ls-files', '-z', '--', ':(glob)**/*.js', ':(glob)**/*.mjs', ':(glob)**/*.cjs', ':(glob)**/*.ts'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  if (git.error) throw git.error;
  if (git.status !== 0) throw new Error(git.stderr.trim() || 'git ls-files failed');

  return git.stdout
    .split('\0')
    .filter(Boolean)
    .filter((file) => existsSync(path.join(repoRoot, file)))
    .filter((file) => !file.endsWith('.d.ts'))
    .filter((file) => !file.includes('/dist/'))
    .filter((file) => !file.startsWith('Vault/.obsidian/plugins/'))
    .filter((file) => !file.startsWith('Vault/System/Views/'));
}

function runEslint(files, maxComplexity) {
  if (!files.length) return true;

  const args = [
    eslintCli,
    '--no-config-lookup',
    '--report-unused-disable-directives',
    '--rule', `complexity: ["error", ${maxComplexity}]`,
    '--rule', 'no-debugger: error',
    '--rule', 'no-dupe-args: error',
    '--rule', 'no-duplicate-case: error',
    '--rule', 'no-unreachable: error',
  ];
  const javascriptFiles = files.filter((file) => !file.endsWith('.ts'));
  if (javascriptFiles.length) {
    const result = spawnSync(process.execPath, [...args, ...javascriptFiles], {
      cwd: repoRoot, stdio: 'inherit',
    });
    if (result.error) throw result.error;
    if (result.status !== 0) return false;
  }

  // ESLint's default parser reads JavaScript, so strip TypeScript types before linting.
  for (const file of files.filter((name) => name.endsWith('.ts'))) {
    const source = readFileSync(path.join(repoRoot, file), 'utf8');
    const javascript = ts.transpileModule(source, {
      fileName: file,
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }).outputText;
    const result = spawnSync(
      process.execPath,
      [...args, '--stdin', '--stdin-filename', file.slice(0, -3) + '.js'],
      { cwd: repoRoot, input: javascript, stdio: ['pipe', 'inherit', 'inherit'] },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) return false;
  }
  return true;
}

export function runComplexityCheck() {
  const files = trackedSourceFiles();
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

  console.log(`Complexity guard checked ${files.length} tracked JavaScript and TypeScript files at max ${MAX_COMPLEXITY}.`);
  for (const [file, ceiling] of LEGACY_COMPLEXITY_CEILINGS) {
    console.log(`Legacy complexity ceiling ${ceiling}: ${file}`);
  }
  return true;
}

if (isMainModule(import.meta.url) && !runComplexityCheck()) process.exitCode = 1;
