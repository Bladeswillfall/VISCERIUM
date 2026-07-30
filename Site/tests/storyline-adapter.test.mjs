import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildStoryLineTimelineDataset,
  inferStoryLineProjectBase,
  parseStoryLineDate,
} from '../src/lib/timeline/storyline-adapter.mjs';
import { toAbsoluteDay } from '../src/lib/calendar/runtime.mjs';

test('parses StoryLine human-readable VISCERIUM dates', () => {
  const parsed = parseStoryLineDate('16 Sólmanuthur, 9250');
  assert.deepEqual(parsed, {
    calendar: 'okse',
    year: 9250,
    month: 'solmanuthur',
    day: 16,
    precision: 'day',
    certainty: 'exact',
  });
});

test('parses compact StoryLine dates and explicit calendar prefix', () => {
  assert.deepEqual(parseStoryLineDate('9250-solmanuthur-16'), {
    calendar: 'okse', year: 9250, month: 'solmanuthur', day: 16, precision: 'day', certainty: 'exact',
  });
  assert.deepEqual(parseStoryLineDate('okse:16 Solmanuthur, 9250'), {
    calendar: 'okse', year: 9250, month: 'solmanuthur', day: 16, precision: 'day', certainty: 'exact',
  });
});

test('infers StoryLine project base from project and scene paths', () => {
  assert.equal(inferStoryLineProjectBase('Stories/My Novel/Scenes/Opening.md'), 'Stories/My Novel');
  assert.equal(inferStoryLineProjectBase('Stories/My Novel/My Novel.md'), 'Stories/My Novel');
  assert.equal(inferStoryLineProjectBase('Stories/My Series/Book One/Scenes/Opening.md'), 'Stories/My Series/Book One');
  assert.equal(inferStoryLineProjectBase('Lore/Events/Battle.md'), null);
});

test('builds a VISCERIUM timeline dataset directly from StoryLine scene metadata', () => {
  const { dataset, issues } = buildStoryLineTimelineDataset([
    {
      filePath: 'Stories/Test/Scenes/Two.md',
      type: 'scene',
      title: 'Second scene',
      storyDate: '17 Sólmanuthur, 9250',
      chronologicalOrder: 2,
      characters: ['[[A]]'],
      location: '[[B]]',
    },
    {
      filePath: 'Stories/Test/Scenes/One.md',
      type: 'scene',
      title: 'First scene',
      storyDate: '16 Sólmanuthur, 9250',
      chronologicalOrder: 1,
    },
    {
      filePath: 'Stories/Test/Scenes/Undated.md',
      type: 'scene',
      title: 'Undated scene',
    },
  ], 'Test');

  assert.equal(dataset.events.length, 2);
  assert.equal(dataset.events[0].title, 'First scene');
  assert.equal(dataset.events[0].absoluteStartDay, toAbsoluteDay({ calendar: 'okse', year: 9250, month: 'solmanuthur', day: 16 }));
  assert.equal(dataset.events[1].title, 'Second scene');
  assert.deepEqual(dataset.events[1].participants, ['[[A]]']);
  assert.deepEqual(dataset.events[1].locations, ['[[B]]']);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].filePath, 'Stories/Test/Scenes/Undated.md');
});
