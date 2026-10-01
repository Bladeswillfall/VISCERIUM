import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function measuredNumber(source, name, { allowZero = false } = {}) {
  const value = Number(source[name]);
  if (source[name] === undefined || !Number.isSafeInteger(value) || value < (allowZero ? 0 : 1)) {
    throw new Error(`Invalid benchmark measurement: ${name}`);
  }
  return value;
}

export function benchmarkReport(source) {
  if (source.RESPONSIVE_HIT !== 'true') throw new Error('Warm job did not restore the exact benchmark cache.');

  const cold = measuredNumber(source, 'COLD_MS');
  const warm = measuredNumber(source, 'WARM_MS');
  const restore = measuredNumber(source, 'RESTORE_MS', { allowZero: true });
  const coldVariants = measuredNumber(source, 'COLD_VARIANTS');
  const warmVariants = measuredNumber(source, 'WARM_VARIANTS');
  const bytes = measuredNumber(source, 'CACHE_BYTES');
  const totalWarm = warm + restore;
  const difference = cold - totalWarm;
  const comparable = source.ATLAS_COLD_HIT === source.ATLAS_WARM_HIT && coldVariants === warmVariants;
  const seconds = value => (value / 1000).toFixed(2);
  const atlas = hit => hit === 'true' ? 'exact hit' : hit === 'false' ? 'miss' : 'unspecified';

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
    `| Cached asset entries | ${coldVariants} cold / ${warmVariants} warm |`,
    `| Atlas tile cache | ${atlas(source.ATLAS_COLD_HIT)} cold / ${atlas(source.ATLAS_WARM_HIT)} warm |`,
    '',
    comparable
      ? 'Both runs used the same Atlas cache status and produced the same number of responsive cache entries.'
      : '**Caution:** Atlas cache status or responsive entry counts differ. Do not attribute the time difference solely to the responsive cache.',
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
}
