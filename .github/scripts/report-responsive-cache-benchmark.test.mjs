import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { benchmarkReport } from './report-responsive-cache-benchmark.mjs';

const sample = {
  COLD_MS: '30000',
  WARM_MS: '19000',
  RESTORE_MS: '1500',
  COLD_VARIANTS: '12',
  WARM_VARIANTS: '12',
  CACHE_BYTES: '2621440',
  ATLAS_COLD_HIT: 'true',
  ATLAS_WARM_HIT: 'true',
  RESPONSIVE_HIT: 'true',
};

test('compares full builds and includes the real cache restore time', () => {
  const summary = benchmarkReport(sample);
  assert.match(summary, /Cold production build \| 30.00 s/);
  assert.match(summary, /Warm production build \| 19.00 s/);
  assert.match(summary, /Real GitHub cache restore \| 1.50 s/);
  assert.match(summary, /Warm build \+ restore \| 20.50 s/);
  assert.match(summary, /Cold minus warm \+ restore \| \+9.50 s/);
  assert.match(summary, /separate GitHub-hosted runners/);
});

test('reports a regression rather than hiding slower warm builds', () => {
  const summary = benchmarkReport({ ...sample, WARM_MS: '39000' });
  assert.match(summary, /Cold minus warm \+ restore \| -10.50 s/);
});

test('rejects missing restores or invalid measurements', () => {
  assert.throws(() => benchmarkReport({ ...sample, RESPONSIVE_HIT: 'false' }), /did not restore/);
  assert.throws(() => benchmarkReport({ ...sample, COLD_MS: '' }), /Invalid benchmark measurement/);
  assert.throws(() => benchmarkReport({ ...sample, CACHE_BYTES: '-5' }), /Invalid benchmark measurement/);
});

test('marks different Atlas cache status or responsive entry counts as confounded', () => {
  const summary = benchmarkReport({ ...sample, ATLAS_WARM_HIT: 'false', WARM_VARIANTS: '11' });
  assert.match(summary, /Do not attribute the time difference solely/);
});

test('benchmark runs only when requested or its files change', () => {
  const workflow = readFileSync(new URL('../workflows/benchmark-responsive-cache.yml', import.meta.url), 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /pull_request:\n    paths:/);
  assert.doesNotMatch(workflow, /^  push:/m);
  assert.match(workflow, /actions\/cache\/save@/);
  assert.match(workflow, /actions\/cache\/restore@/);
  assert.match(workflow, /fail-on-cache-miss: true/);
  assert.match(workflow, /report-responsive-cache-benchmark\.mjs/);
  assert.match(workflow, /node --test \.github\/scripts\/report-responsive-cache-benchmark\.test\.mjs/);
});
