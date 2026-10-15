import { appendFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function measuredNumber(source, name, { allowZero = false } = {}) {
  const value = Number(source[name]);
  if (source[name] === undefined || !Number.isSafeInteger(value) || value < (allowZero ? 0 : 1)) {
    throw new Error(`Invalid benchmark measurement: ${name}`);
  }
  return value;
}

function atlasState(hit, matchedKey) {
  if (hit === 'true' && matchedKey) return 'exact hit';
  if (hit === 'false' && matchedKey) return 'fallback restore';
  if (!hit && !matchedKey) return 'miss';
  return 'unverified';
}

export function benchmarkData(source) {
  if (source.RESPONSIVE_HIT !== 'true') throw new Error('Warm job did not restore the exact benchmark cache.');

  const cold = measuredNumber(source, 'COLD_MS');
  const warm = measuredNumber(source, 'WARM_MS');
  const restore = measuredNumber(source, 'RESTORE_MS', { allowZero: true });
  const coldVariants = measuredNumber(source, 'COLD_VARIANTS');
  const warmVariants = measuredNumber(source, 'WARM_VARIANTS');
  const bytes = measuredNumber(source, 'CACHE_BYTES');
  const distBytes = measuredNumber(source, 'DIST_BYTES');
  const astroBytes = measuredNumber(source, 'ASTRO_BYTES');
  const mapTilesBytes = measuredNumber(source, 'MAP_TILES_BYTES');
  const totalWarm = warm + restore;
  const difference = cold - totalWarm;
  const atlasColdHit = source.ATLAS_COLD_HIT ?? '';
  const atlasWarmHit = source.ATLAS_WARM_HIT ?? '';
  const atlasColdKey = source.ATLAS_COLD_KEY ?? '';
  const atlasWarmKey = source.ATLAS_WARM_KEY ?? '';
  const atlasCold = atlasState(atlasColdHit, atlasColdKey);
  const atlasWarm = atlasState(atlasWarmHit, atlasWarmKey);
  const comparable = atlasCold !== 'unverified' && atlasCold === atlasWarm
    && atlasColdKey === atlasWarmKey && coldVariants === warmVariants;
  return { cold, warm, restore, totalWarm, difference, coldVariants, warmVariants, bytes,
    distBytes, astroBytes, mapTilesBytes, comparable,
    atlasColdHit, atlasWarmHit, atlasColdKey, atlasWarmKey };
}

export function benchmarkReport(source) {
  const { cold, warm, restore, totalWarm, difference, coldVariants, warmVariants, bytes,
    distBytes, astroBytes, mapTilesBytes, comparable } = benchmarkData(source);
  const seconds = value => (value / 1000).toFixed(2);
  const atlasCold = atlasState(source.ATLAS_COLD_HIT, source.ATLAS_COLD_KEY);
  const atlasWarm = atlasState(source.ATLAS_WARM_HIT, source.ATLAS_WARM_KEY);

  return [
    '### Responsive image cache benchmark',
    '',
    '| Measurement | Result |',
    '| --- | ---: |',
    `| Cold production build | ${seconds(cold)} s |`,
    `| Warm production build | ${seconds(warm)} s |`,
    `| Real GitHub cache restore | ${seconds(restore)} s |`,
    `| Warm build + restore | ${seconds(totalWarm)} s |`,
    `| Cold minus warm + restore | ${difference >= 0 ? '+' : ''}${seconds(difference)} s |`,
    `| Responsive cache size | ${(bytes / 1024 / 1024).toFixed(2)} MiB |`,
    `| Generated site size | ${(distBytes / 1024 / 1024).toFixed(2)} MiB |`,
    `| Compiled _astro assets | ${(astroBytes / 1024 / 1024).toFixed(2)} MiB |`,
    `| Generated Atlas map tiles | ${(mapTilesBytes / 1024 / 1024).toFixed(2)} MiB |`,
    `| Cached asset entries | ${coldVariants} cold / ${warmVariants} warm |`,
    `| Atlas tile cache | ${atlasCold} cold / ${atlasWarm} warm |`,
    ...(comparable && atlasCold === 'exact hit' ? [] : [
      `| Atlas matched keys | ${source.ATLAS_COLD_KEY || 'none'} cold / ${source.ATLAS_WARM_KEY || 'none'} warm |`,
    ]),
    '',
    comparable
      ? 'Both runs used the same Atlas cache state and matched key, with equal responsive cache entry counts.'
      : '**Caution:** Atlas cache state, matched keys or responsive entry counts differ. Do not attribute the time difference solely to the responsive cache.',
    '',
    'This is one observational pair on separate GitHub-hosted runners. It excludes checkout, dependency installation,',
    'cache-save time and runner scheduling. Repeat before drawing performance conclusions.',
    '',
  ].join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const summary = benchmarkReport(process.env);
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  if (process.env.BENCHMARK_JSON) writeFileSync(process.env.BENCHMARK_JSON,
    JSON.stringify(benchmarkData(process.env), null, 2) + '\n');
}
