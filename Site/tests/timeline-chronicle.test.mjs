import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('the Astro timeline enhances only the existing timeline list panel', () => {
  const app = read('../src/components/timeline/TimelineApp.astro');
  const chronicle = read('../src/lib/timeline/chronicle-view.mjs');
  const styles = read('../src/styles/timeline-chronicle.css');
  const renderer = read('../src/lib/timeline/chronos-native-renderer.mjs');

  assert.match(app, /installTimelineChronicle/);
  assert.match(app, /import '\.\.\/\.\.\/styles\/timeline-chronicle\.css'/);
  assert.match(app, /installTimelineChronicle\(mount, dataset\)/);

  assert.match(chronicle, /root\.querySelector\('\[data-vc-list-panel\]'\)/);
  assert.match(chronicle, /const plainList = listPanel\.querySelector\(':scope > ol'\)/);
  assert.match(chronicle, /uniqueEventIds\(plainList\.querySelectorAll\('\[data-vc-select-event\]'\)\)/);
  assert.match(chronicle, /new MutationObserver/);
  assert.match(chronicle, /observer\.observe\(listPanel, \{ childList: true \}\)/);
  assert.match(chronicle, /timelineStage\.hidden = chronicleVisible/);
  assert.match(chronicle, /minimapWrap\.hidden = chronicleVisible/);
  assert.doesNotMatch(chronicle, /\.setWindow\(|\.redraw\(|\.setItems\(|\.setGroups\(|VisceriumChronosTimeline|from 'vis-timeline/);

  assert.match(styles, /\.vc-chronicle-masthead/);
  assert.match(styles, /\.vc-chronicle-chapter-header/);
  assert.match(styles, /\.vc-chronicle-records::before/);
  assert.match(styles, /\.vc-chronicle-dossier/);
  assert.match(styles, /\.certainty-disputed \.vc-chronicle-marker/);
  assert.doesNotMatch(styles, /\.vis-(?:timeline|panel|item|group|label|time-axis)/);

  assert.doesNotMatch(renderer, /vc-chronicle|installTimelineChronicle/);
});

test('Chronicle masthead keeps a small timeline-only gap above its description', () => {
  const layout = read('../src/styles/timeline-chronicle.css');

  assert.match(
    layout,
    /\.sl-markdown-content \.vc-timeline-app \.vc-timeline-list \.vc-chronicle-masthead h2\s*\{[\s\S]*?margin-bottom: \.1em;/,
  );
  assert.doesNotMatch(layout, /(?:^|\n)\.sl-markdown-content h2\s*\{/);
});

test('chronicle records include readable summaries, dossiers and graph/article actions', () => {
  const chronicle = read('../src/lib/timeline/chronicle-view.mjs');

  assert.match(chronicle, /class="vc-chronicle-date"/);
  assert.match(chronicle, /class="vc-chronicle-title"/);
  assert.match(chronicle, /class="vc-chronicle-excerpt"/);
  assert.match(chronicle, /class="vc-chronicle-tags"/);
  assert.match(chronicle, /Archival dossier/);
  assert.match(chronicle, /Declared lanes/);
  assert.match(chronicle, /data-vc-chronicle-locate/);
  assert.match(chronicle, /Locate on timeline/);
  assert.match(chronicle, /data-vc-chronicle-article/);
  assert.match(chronicle, /Open full article/);
  assert.match(chronicle, /No records found/);
  assert.match(chronicle, /data-vc-list-more/);
});
