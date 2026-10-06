import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { isMainModule } from './script-entry.mjs';

const COMMANDS = {
  pre: [
    ['npm', ['run', 'check:astro']],
  ],
  post: [
    ['npm', ['run', 'validate:icons']],
    ['node', ['--test', 'tests/i18n-output.postbuild.mjs']],
    ['npm', ['run', 'security:artifacts']],
    ['npm', ['run', 'performance:check']],
  ],
};

export function validationCommands(phase, env = process.env) {
  const commands = COMMANDS[phase];
  if (!commands) throw new Error(`Unknown build validation phase "${phase}".`);
  return env.CF_PAGES === '1' ? [] : commands;
}

function executable(command) {
  if (command === 'node') return process.execPath;
  if (command === 'npm' && process.platform === 'win32') return 'npm.cmd';
  return command;
}

export function runBuildValidation(phase, env = process.env) {
  const commands = validationCommands(phase, env);
  if (commands.length === 0) {
    console.log(`Cloudflare Pages build: skipped duplicate ${phase}build validation.`);
    return;
  }

  for (const [command, args] of commands) {
    const result = spawnSync(executable(command), args, { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      process.exitCode = result.status ?? 1;
      return;
    }
  }
}

if (isMainModule(import.meta.url)) runBuildValidation(process.argv[2]);
