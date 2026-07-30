import { performance } from 'node:perf_hooks';
import { compileTimelineRecords } from '../src/lib/timeline/compiler.mjs';

function era(id, order, startYear, endYear, allowGapAfter = false) {
  return {
    sourcePath: `Eras/${id}.md`,
    href: `/eras/${id}/`,
    data: {
      title: id.toUpperCase(),
      description: `${id} era`,
      status: 'published',
      type: 'era',
      eraId: id,
      calendarDate: { calendar: 'okse', year: startYear, month: 'niewmonath', day: 1, precision: 'year' },
      calendarEndDate: { calendar: 'okse', year: endYear, intercalaryDay: 'engimanutur-02', precision: 'year' },
      timeline: { kind: 'era', order, visualToken: `e${order}`, allowGapAfter },
    },
  };
}

const eras = [
  era('citadel', 1, 9201, 9400, true),
  era('smog', 2, 10701, 10900),
  era('nearsight', 3, 10901, 11100, true),
  era('entropy', 4, 11401, 11600),
];

const ranges = [
  ['CITADEL', 9201, 9400],
  ['SMOG', 10701, 10900],
  ['NEARSIGHT', 10901, 11100],
  ['ENTROPY', 11401, 11600],
];
const importance = ['landmark', 'major', 'standard', 'minor', 'incidental'];
const categories = ['military', 'political', 'technology', 'resonance', 'future-category'];

function makeEvents(count) {
  return Array.from({ length: count }, (_, index) => {
    const [eraName, start, end] = ranges[index % ranges.length];
    const span = end - start + 1;
    const year = start + (index % span);
    return {
      sourcePath: `Eras/${eraName}/Events/Synthetic ${String(index).padStart(5, '0')}.md`,
      href: `/synthetic/${index}/`,
      data: {
        title: `Synthetic Event ${String(index).padStart(5, '0')}`,
        description: 'A concise synthetic timeline event used only for performance verification.',
        status: 'published',
        type: 'event',
        era: eraName,
        calendarDate: { calendar: 'okse', year, month: 'niewmonath', day: (index % 28) + 1, precision: 'day', certainty: 'exact' },
        timeline: {
          kind: 'event',
          importance: importance[index % importance.length],
          categories: [categories[index % categories.length]],
          lanes: [`lane-${index % 24}`],
          global: 'auto',
          era: 'auto',
          order: index % 4,
        },
        tags: ['synthetic'],
      },
    };
  });
}

for (const count of [1_000, 5_000]) {
  const records = [...eras, ...makeEvents(count)];
  const memoryBefore = process.memoryUsage().heapUsed;
  const start = performance.now();
  const compiled = compileTimelineRecords(records);
  const elapsed = performance.now() - start;
  const heapDelta = Math.max(0, process.memoryUsage().heapUsed - memoryBefore) / 1024 / 1024;
  const jsonBytes = Buffer.byteLength(JSON.stringify(compiled.datasets.super));
  console.log(JSON.stringify({
    events: count,
    compileMs: Number(elapsed.toFixed(2)),
    heapDeltaMiB: Number(heapDelta.toFixed(2)),
    superEvents: compiled.datasets.super.events.length,
    superDatasetKiB: Number((jsonBytes / 1024).toFixed(2)),
  }));
  if (elapsed > 5_000) throw new Error(`${count}-event timeline compilation exceeded the 5 second verification ceiling.`);
}
