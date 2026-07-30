import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('registers the official Preact renderer for Astro islands', () => {
  const packageJson = JSON.parse(read('../package.json'));
  const astroConfig = read('../astro.config.mjs');
  const tsconfig = JSON.parse(read('../tsconfig.json'));

  assert.equal(packageJson.dependencies['@astrojs/preact'], '6.0.1');
  assert.equal(packageJson.dependencies.preact, '10.29.7');
  assert.match(astroConfig, /import preact from '@astrojs\/preact'/);
  assert.match(astroConfig, /integrations:\s*\[\s*preact\(\)/);
  assert.equal(tsconfig.compilerOptions.jsx, 'react-jsx');
  assert.equal(tsconfig.compilerOptions.jsxImportSource, 'preact');
});

test('TimelineApp delegates browser behaviour to a client-loaded island', () => {
  const app = read('../src/components/timeline/TimelineApp.astro');

  assert.match(app, /import TimelineIsland from '\.\/TimelineIsland'/);
  assert.match(app, /import '\.\.\/\.\.\/styles\/timeline-loading\.css'/);
  assert.match(app, /import '\.\.\/\.\.\/styles\/timeline-performance\.css'/);
  assert.match(app, /import '\.\.\/\.\.\/styles\/chronos-calendar-axis\.css'/);
  assert.doesNotMatch(app, /timeline-scroll\.css/);
  assert.match(app, /<TimelineIsland[\s\S]*client:load/);
  assert.match(app, /fallbackEvents=\{fallbackEvents\}/);
  assert.doesNotMatch(app, /<script>|astro:page-load|__visceriumTimelineRuntime|application\/json/);
});

test('the Preact island owns one forked Chronos mount, one hovercard and ordered cleanup', () => {
  const island = read('../src/components/timeline/TimelineIsland.tsx');

  assert.match(island, /useEffect\(/);
  assert.match(island, /useRef<HTMLDivElement>/);
  assert.match(island, /import \{ installTimelineHovercard \} from '\.\.\/\.\.\/lib\/timeline\/hovercard\.mjs'/);
  assert.match(island, /await import\('\.\.\/\.\.\/lib\/timeline\/chronos-native-renderer\.mjs'\)/);
  assert.match(island, /const cleanupTimeline = mountTimeline\(root, dataset, options\)/);
  assert.match(island, /const cleanupHovercard = installTimelineHovercard\(root, dataset\)/);
  assert.match(island, /cleanup = \(\) => \{[\s\S]*cleanupHovercard\(\);[\s\S]*cleanupTimeline\(\);/);
  assert.match(island, /return \(\) => \{[\s\S]*cleanup\?\.\(\)/);
  assert.match(island, /class="vc-timeline-fallback"/);
  assert.match(island, /data-vc-timeline-skeleton/);
  assert.match(island, /root\.setAttribute\('aria-busy', 'true'\)/);
  assert.match(island, /fallbackRef\.current\.hidden = true/);
  assert.match(island, /skeletonRef\.current\.hidden = false/);
  assert.doesNotMatch(island, /prepareTimelineViewportGuard|installAdaptiveTimelineGrid|installCalendarYearAxisSync|installTimelineTooltipContentSync/);
  assert.doesNotMatch(island, /astro:page-load|astro:before-swap|customElements|MutationObserver/);
});

test('timeline startup uses the resolved viewport once and defers the minimap', () => {
  const renderer = read('../src/lib/timeline/chronos-native-renderer.mjs');

  assert.match(renderer, /function resolveInitialWindow\(\)/);
  assert.match(renderer, /getZoomImportanceThreshold\(Math\.max\(1, initialWindow\.endDay - initialWindow\.startDay\)\)/);
  assert.match(renderer, /events: renderedEvents,[\s\S]*visibleStartDay: initialWindow\.startDay,[\s\S]*visibleEndDay: initialWindow\.endDay/);
  assert.match(renderer, /function scheduleMinimap\(\)/);
  assert.match(renderer, /window\.requestIdleCallback\(mountMinimap, \{ timeout: 1_500 \}\)/);
  assert.match(renderer, /timeline\.setWindow\([\s\S]*initialWindow\.startDay[\s\S]*initialWindow\.endDay/);
  assert.doesNotMatch(renderer, /\}\s*else\s*\{\s*resetWindow\(\);\s*\}\s*refreshItems\(true\)/);
});

test('large timeline runtime bounds graph, list, search and minimap work', () => {
  const renderer = read('../src/lib/timeline/chronos-native-renderer.mjs');

  assert.match(renderer, /createTimelineRangeIndex\(dataset\.events\)/);
  assert.match(renderer, /queryTimelineRange\(rangeIndex, loadedStartDay, loadedEndDay\)/);
  assert.match(renderer, /const VIEWPORT_BUFFER_FACTOR = 1\.25/);
  assert.match(renderer, /const LIST_PAGE_SIZE = 100/);
  assert.match(renderer, /listPanel\.hidden[\s\S]*listDirty = true/);
  assert.match(renderer, /data-vc-list-more/);
  assert.match(renderer, /window\.setTimeout\(applyFilters, SEARCH_DEBOUNCE_MS\)/);
  assert.match(renderer, /bucketTimelineEvents\([\s\S]*MINIMAP_BUCKET_COUNT/);
  assert.doesNotMatch(renderer, /\.\.\.dataset\.events\.map\(\(event\) => \(\{[\s\S]*id: `mini:/);
});

test('group and item changes stay inside one forked Chronos instance', () => {
  const renderer = read('../src/lib/timeline/chronos-native-renderer.mjs');
  const fork = read('../src/lib/chronos-fork/VisceriumChronosTimeline.mjs');
  const adapter = read('../src/lib/timeline/chronos-adapter.mjs');

  assert.match(renderer, /export function mountTimeline/);
  assert.match(renderer, /chronos\.updateParsed\(model\.parsed\)/);
  assert.match(renderer, /laneSelect\.addEventListener\('change'/);
  assert.match(fork, /updateParsed\(result\)/);
  assert.match(fork, /nextGroups !== this\.groupModelSignature/);
  assert.match(fork, /nextItems !== this\.itemModelSignature/);
  assert.match(fork, /stageDataSet\(this\.groupsDataSet, groups\)/);
  assert.match(fork, /stageDataSet\(this\.itemsDataSet, items\)/);
  assert.match(fork, /this\.groupsDataSet\.setOptions\(\{ queue: queueOptions \}\)/);
  assert.match(fork, /this\.itemsDataSet\.setOptions\(\{ queue: queueOptions \}\)/);
  assert.match(fork, /if \(removedItems\.length\) this\.itemsDataSet\.remove\(removedItems\)/);
  assert.match(fork, /if \(removedGroups\.length\)[\s\S]*this\.groupsDataSet\.remove\(removedGroups\)/);
  assert.doesNotMatch(renderer, /Proxy\s*\(|ChronosTimeline\.prototype|MutationObserver|ResizeObserver/);
  assert.match(adapter, /if \(laneMode === 'unified'\)[\s\S]*groups: \[chronology\]/);
});

test('the fork owns axis and geometry while the site owns one non-layout hovercard', () => {
  const island = read('../src/components/timeline/TimelineIsland.tsx');
  const renderer = read('../src/lib/timeline/chronos-native-renderer.mjs');
  const fork = read('../src/lib/chronos-fork/VisceriumChronosTimeline.mjs');
  const hovercard = read('../src/lib/timeline/hovercard.mjs');
  const viewportStyles = read('../src/styles/timeline-viewport.css');

  assert.match(renderer, /callbacks: \{[\s\S]*setTooltip:/);
  assert.match(renderer, /createCalendarAxisFormatter/);
  assert.match(fork, /#installTooltipBridge\(\)/);
  assert.match(fork, /format: \{[\s\S]*minorLabels:[\s\S]*majorLabels:/);
  assert.match(island, /installTimelineHovercard\(root, dataset\)/);
  assert.match(hovercard, /tooltip\.className = 'vis-tooltip vc-timeline-hovercard'/);
  assert.match(hovercard, /document\.body\.append\(tooltip\)/);
  assert.match(hovercard, /attributeFilter: \['title'\]/);
  assert.match(hovercard, /queueMicrotask\(\(\) => stripNativeTitle\(activeItem\)\)/);
  assert.match(viewportStyles, /body > \.vis-tooltip:not\(\.vc-timeline-hovercard\)/);
  assert.match(viewportStyles, /--vc-hovercard-bg:\s*color-mix\(in oklch, var\(--codex-surface-raised-color\)/);
  assert.match(viewportStyles, /--vc-hovercard-text:\s*var\(--sl-color-text\)/);
  assert.doesNotMatch(viewportStyles, /:root\[data-theme='light'\] body > \.vc-timeline-hovercard/);
  assert.doesNotMatch(renderer, /MutationObserver|ResizeObserver|installTimelineDomGuards/);
  assert.doesNotMatch(island, /MutationObserver|ResizeObserver/);
});

test('canonical timeline pages explicitly omit the right sidebar and release content width constraints', () => {
  const twoColumn = read('../src/components/CodexTwoColumnContent.astro');
  const performanceStyles = read('../src/styles/timeline-performance.css');
  const contentSchema = read('../src/content.config.ts');
  const transform = read('../scripts/transform-timeline-shortcodes.mjs');

  assert.match(contentSchema, /timelinePage: z\.boolean\(\)\.optional\(\)/);
  assert.match(transform, /if \(usedTimeline\) parsed\.data\.timelinePage = true/);
  assert.match(twoColumn, /const timelinePage = starlightRoute\.entry\.data\.timelinePage === true/);
  assert.match(twoColumn, /timelinePage && "codex-timeline-page"/);
  assert.match(twoColumn, /!timelinePage && !explorationPage && starlightRoute\.toc/);
  assert.match(twoColumn, /data-timeline-page=\{timelinePage \|\| undefined\}/);
  assert.match(performanceStyles, /\.codex-two-column-content\.codex-timeline-page/);
  assert.match(performanceStyles, /--sl-content-width: 100%/);
  assert.match(performanceStyles, /grid-template-columns: minmax\(0, 1fr\)/);
  assert.doesNotMatch(performanceStyles, /right-sidebar[^\n]*display:\s*none/);
});
