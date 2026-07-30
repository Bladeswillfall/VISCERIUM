import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('the timeline island installs a scoped toolbar enhancement after existing behaviour', () => {
  const island = read('../src/components/timeline/TimelineIsland.tsx');
  const toolbar = read('../src/lib/timeline/toolbar-ui.mjs');
  const styles = read('../src/styles/timeline-toolbar.css');
  const containerStyles = read('../src/styles/timeline-toolbar-container.css');
  const buttonStyles = read('../src/styles/timeline-buttons.css');

  assert.match(island, /installTimelineToolbar/);
  assert.match(island, /timeline-toolbar\.css/);
  assert.match(island, /timeline-toolbar-container\.css/);
  assert.match(island, /timeline-buttons\.css/);
  assert.match(island, /const cleanupToolbar = installTimelineToolbar\(root\)/);
  assert.match(island, /cleanupToolbar\(\);[\s\S]*cleanupChronicle\(\);[\s\S]*cleanupHovercard\(\);[\s\S]*cleanupTimeline\(\);/);

  assert.match(toolbar, /vc-timeline-toolbar/);
  assert.match(toolbar, /vcToolbarEnhanced = 'true'/);
  assert.match(toolbar, /vc-timeline-toolbar-container/);
  assert.match(toolbar, /toolbarContainer\.append\(toolbar\)/);
  assert.match(toolbar, /toolbarContainer\.replaceWith\(toolbar\)/);
  assert.match(toolbar, /createActionGroup\('View'[\s\S]*createActionGroup\('Navigate'[\s\S]*createActionGroup\('Scale'/);
  assert.match(toolbar, /Search titles, factions, locations…/);
  assert.match(toolbar, /Date system/);
  assert.match(toolbar, /Arrange rows/);
  assert.match(toolbar, /MutationObserver\(scheduleViewSync\)/);
  assert.match(toolbar, /attributeFilter: \['aria-pressed'\]/);
  assert.match(toolbar, /viewObserver\?\.disconnect/);
  assert.doesNotMatch(toolbar, /setWindow|redraw|setItems|setGroups|VisceriumChronosTimeline|vis-timeline/);

  assert.match(styles, /vc-timeline-toolbar-enhanced/);
  assert.match(styles, /vc-timeline-action-group/);
  assert.match(styles, /vc-timeline-command/);
  assert.match(styles, /height: 3rem/);
  assert.match(styles, /margin: 0 !important/);
  assert.match(styles, /vc-timeline-action-group\.is-view/);
  assert.match(styles, /pointer-events: none/);
  assert.match(styles, /max-width: 38rem/);
  assert.doesNotMatch(styles, /\.vis-(?:timeline|panel|item|group|label|time-axis)/);

  assert.match(containerStyles, /vc-timeline-toolbar-container/);
  assert.match(containerStyles, /container-name: vc-timeline-toolbar/);
  assert.match(containerStyles, /container-type: inline-size/);
  assert.match(containerStyles, /@container vc-timeline-toolbar \(max-width: 1440px\)/);
  assert.match(containerStyles, /grid-column: 1 \/ -1/);
  assert.match(containerStyles, /flex-wrap: wrap/);
  assert.doesNotMatch(containerStyles, /\.vc-timeline-app\s*\{/);
  assert.doesNotMatch(containerStyles, /\.vis-(?:timeline|panel|item|group|label|time-axis)/);

  assert.match(buttonStyles, /--vc-timeline-button-radius: \.55rem/);
  assert.match(buttonStyles, /\.vc-timeline-app button\s*\{[\s\S]*border-radius: var\(--vc-timeline-button-radius\)/);
  assert.doesNotMatch(buttonStyles, /\.vis-(?:timeline|panel|item|group|label|time-axis)/);
});

test('toolbar buttons retain visible labels, icons and accessible names', () => {
  const toolbar = read('../src/lib/timeline/toolbar-ui.mjs');

  assert.match(toolbar, /vc-timeline-control-icon/);
  assert.match(toolbar, /vc-timeline-command-label/);
  assert.match(toolbar, /data-vc-toolbar-icon/);
  assert.match(toolbar, /contentMatches/);
  assert.match(toolbar, /Select the previous matching event/);
  assert.match(toolbar, /Show a wider date range/);
  assert.match(toolbar, /Return to the default date range/);
  assert.match(toolbar, /Open chronicle reading view/);
  assert.match(toolbar, /Return to interactive graph view/);
  assert.match(toolbar, /setAttribute\('aria-label', title\)/);
  assert.match(toolbar, /setAttribute\('title', title\)/);
});
