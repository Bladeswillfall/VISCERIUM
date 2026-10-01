import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

test('Graph CI stops on a failed Firefox run instead of masking it with WebKit', (t) => {
  const workflow = readFileSync(new URL('../../.github/workflows/checks.yml', import.meta.url), 'utf8');
  const graph = workflow.split(/^  graph_engines:\n/m)[1]?.split(/^  contact:\n/m)[0];
  assert.ok(graph, 'Graph cross-browser job must exist');

  const block = graph.match(
    /      - name: Run Graph checks in Firefox and WebKit\n        env:\n          HOME: \/root\n        run: \|\n((?:          .*\n)+)/,
  )?.[1];
  assert.ok(block, 'Graph job must have a runnable test step');
  const script = block.replace(/^          /gm, '');
  assert.match(script, /--browser=firefox/);
  assert.match(script, /--browser=webkit/);

  const directory = mkdtempSync(path.join(tmpdir(), 'viscerium-graph-ci-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const trace = path.join(directory, 'engines.txt');
  const stub = [
    'npx() {',
    '  case " $* " in',
    '    *--browser=firefox*) printf "firefox\n" >> "$TRACE"; return "$FIREFOX_EXIT" ;;',
    '    *--browser=webkit*) printf "webkit\n" >> "$TRACE"; return 0 ;;',
    '    *) return 90 ;;',
    '  esac',
    '}',
  ].join('\n');

  const run = (firefoxExit) => spawnSync('bash', ['-c', stub + '\n' + script], {
    encoding: 'utf8',
    env: { ...process.env, RUNNER_TEMP: directory, TRACE: trace, FIREFOX_EXIT: String(firefoxExit) },
  });

  const failure = run(17);
  assert.equal(failure.status, 17, failure.stderr);
  assert.equal(readFileSync(trace, 'utf8'), 'firefox\n', 'WebKit must not hide Firefox failures');

  writeFileSync(trace, '');
  const success = run(0);
  assert.equal(success.status, 0, success.stderr);
  assert.equal(readFileSync(trace, 'utf8'), 'firefox\nwebkit\n');
});
