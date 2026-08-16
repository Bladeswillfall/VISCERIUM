import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveTimelineOptions } from '../src/lib/timeline/options.mjs';

const defaults = {
  timeline: 'citadel',
  defaultCalendar: undefined,
  laneMode: 'unified',
  showFilters: true,
  showMinimap: true,
  showLegend: true,
  compact: false,
};

const cases = [
  {
    name: 'defaults',
    args: ['citadel', '', undefined],
    expected: defaults,
  },
  {
    name: 'short aliases',
    args: ['citadel', 'calendar="okse" lane=category filters=false minimap=true legend=false compact=true', undefined],
    expected: {
      ...defaults,
      defaultCalendar: 'okse',
      laneMode: 'category',
      showFilters: false,
      showLegend: false,
      compact: true,
    },
  },
  {
    name: 'long aliases',
    args: ['citadel', "lanemode=lane showfilters=false showminimap=false showlegend=true", undefined],
    expected: {
      ...defaults,
      laneMode: 'lane',
      showFilters: false,
      showMinimap: false,
    },
  },
  {
    name: 'configured block wins',
    args: ['citadel', 'lane=category', {
      timeline: 'smog',
      defaultCalendar: 'okse',
      laneMode: 'lane',
      showFilters: false,
      showMinimap: false,
      showLegend: false,
      compact: true,
    }],
    expected: {
      timeline: 'smog',
      defaultCalendar: 'okse',
      laneMode: 'lane',
      showFilters: false,
      showMinimap: false,
      showLegend: false,
      compact: true,
    },
  },
  {
    name: 'invalid configured block falls back to inline options',
    args: ['entropy', 'lane=category', { timeline: 'unknown' }],
    expected: {
      ...defaults,
      timeline: 'entropy',
      laneMode: 'category',
    },
  },
  {
    name: 'invalid lane and booleans use existing defaults',
    args: ['citadel', 'lane=diagonal filters=maybe minimap=maybe legend=maybe compact=maybe', undefined],
    expected: defaults,
  },
  {
    name: 'invalid timeline ID',
    args: ['unknown', 'lane=category', undefined],
    expected: null,
  },
  {
    name: 'invalid timeline override',
    args: ['citadel', 'timeline=unknown', undefined],
    expected: null,
  },
];

test('site and Obsidian consumers use the same option parser', async () => {
  const consumerFiles = [
    '../scripts/transform-timeline-shortcodes.mjs',
    '../../Tools/obsidian-viscerium-timelines/main.ts',
  ];
  const consumers = [];

  for (const file of consumerFiles) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(source, /import \{ resolveTimelineOptions \} from .*timeline\/options\.mjs/);
    assert.match(source, /resolveTimelineOptions\(id, match\[2\], (?:configuredBlocks|blocks)\[id\]\)/);
    assert.doesNotMatch(source, /function (?:parseBoolean|parseInline(?:Spec|Block)|normalizeBlock)/);
    consumers.push(resolveTimelineOptions);
  }

  for (const consumer of consumers) {
    for (const fixture of cases) {
      assert.deepEqual(consumer(...fixture.args), fixture.expected, fixture.name);
    }
  }
});
