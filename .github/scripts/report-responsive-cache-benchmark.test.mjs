import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { benchmarkData, benchmarkReport } from './report-responsive-cache-benchmark.mjs';

const sample = {
  COLD_MS: '30000',
  WARM_MS: '19000',
  RESTORE_MS: '1500',
  COLD_VARIANTS: '12',
  WARM_VARIANTS: '12',
  CACHE_BYTES: '2621440',
  DIST_BYTES: '10485760',
  ASTRO_BYTES: '1048576',
  MAP_TILES_BYTES: '2097152',
  ATLAS_COLD_HIT: 'true',
  ATLAS_WARM_HIT: 'true',
  ATLAS_COLD_KEY: 'atlas-tiles-v1-exact',
  ATLAS_WARM_KEY: 'atlas-tiles-v1-exact',
  RESPONSIVE_HIT: 'true',
};

test('compares full builds and includes the real cache restore time', () => {
  const summary = benchmarkReport(sample);
  assert.match(summary, /Cold production build \| 30.00 s/);
  assert.match(summary, /Warm production build \| 19.00 s/);
  assert.match(summary, /Real GitHub cache restore \| 1.50 s/);
  assert.match(summary, /Warm build \+ restore \| 20.50 s/);
  assert.match(summary, /Cold minus warm \+ restore \| \+9.50 s/);
  assert.match(summary, /Generated site size \| 10.00 MiB/);
  assert.match(summary, /Compiled _astro assets \| 1.00 MiB/);
  assert.match(summary, /Generated Atlas map tiles \| 2.00 MiB/);
  assert.match(summary, /separate GitHub-hosted runners/);
});

test('exports numeric measurements and comparability for later comparisons', () => {
  const result = benchmarkData(sample);
  assert.deepEqual({
    cold: result.cold, warm: result.warm, restore: result.restore,
    totalWarm: result.totalWarm, difference: result.difference,
    comparable: result.comparable,
    distBytes: result.distBytes, astroBytes: result.astroBytes, mapTilesBytes: result.mapTilesBytes,
  }, { cold: 30000, warm: 19000, restore: 1500, totalWarm: 20500,
    difference: 9500, comparable: true,
    distBytes: 10485760, astroBytes: 1048576, mapTilesBytes: 2097152 });
});

test('reports a regression rather than hiding slower warm builds', () => {
  const summary = benchmarkReport({ ...sample, WARM_MS: '39000' });
  assert.match(summary, /Cold minus warm \+ restore \| -10.50 s/);
});

test('rejects missing restores or invalid measurements', () => {
  assert.throws(() => benchmarkReport({ ...sample, RESPONSIVE_HIT: 'false' }), /did not restore/);
  assert.throws(() => benchmarkReport({ ...sample, COLD_MS: '' }), /Invalid benchmark measurement/);
  assert.throws(() => benchmarkReport({ ...sample, CACHE_BYTES: '-5' }), /Invalid benchmark measurement/);
  assert.throws(() => benchmarkReport({ ...sample, DIST_BYTES: '0' }), /Invalid benchmark measurement/);
  assert.throws(() => benchmarkReport({ ...sample, MAP_TILES_BYTES: undefined }), /Invalid benchmark measurement/);
});

test('distinguishes matched fallback restores from misses', () => {
  const fallback = { ...sample, ATLAS_COLD_HIT: 'false', ATLAS_WARM_HIT: 'false',
    ATLAS_COLD_KEY: 'atlas-tiles-v1-old', ATLAS_WARM_KEY: 'atlas-tiles-v1-old' };
  assert.equal(benchmarkData(fallback).comparable, true);
  assert.match(benchmarkReport(fallback), /fallback restore cold \/ fallback restore warm/);
  assert.equal(benchmarkData({ ...fallback, ATLAS_WARM_KEY: 'atlas-tiles-v1-different' }).comparable, false);
  const missed = { ...fallback, ATLAS_COLD_HIT: '', ATLAS_WARM_HIT: '',
    ATLAS_COLD_KEY: '', ATLAS_WARM_KEY: '' };
  assert.equal(benchmarkData(missed).comparable, true);
  assert.match(benchmarkReport(missed), /miss cold \/ miss warm/);
  assert.equal(benchmarkData({ ...missed, ATLAS_WARM_HIT: 'false',
    ATLAS_WARM_KEY: 'atlas-tiles-v1-old' }).comparable, false);
  assert.equal(benchmarkData({ ...sample, ATLAS_WARM_KEY: '' }).comparable, false);
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
  assert.match(workflow, /cache-matched-key/);
  assert.match(workflow, /test "\$before_state" = "\$after_state"/);
  assert.match(workflow, /report-responsive-cache-benchmark\.mjs/);
  assert.match(workflow, /upload-artifact@/);
  assert.match(workflow, /node --test \.github\/scripts\/report-responsive-cache-benchmark\.test\.mjs/);
});
