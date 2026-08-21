import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('the timeline component installs a scoped toolbar enhancement after existing behaviour', () => {
  const app = read('../src/components/timeline/TimelineApp.astro');
  const toolbar = read('../src/lib/timeline/toolbar-ui.mjs');
  const styles = read('../src/styles/timeline-controls.css');
  const canvasStyles = read('../src/styles/timeline-canvas.css');
  const containerStart = styles.indexOf('Origin: timeline-toolbar-container.css');
  const buttonsStart = styles.indexOf('Origin: timeline-buttons.css');
  const containerStyles = styles.slice(containerStart, buttonsStart);
  const buttonStyles = styles.slice(buttonsStart);

  assert.match(app, /installTimelineToolbar/);
  assert.match(app, /timeline-controls\.css/);
  assert.doesNotMatch(app, /timeline-(?:toolbar|toolbar-container|buttons)\.css/);
  assert.match(app, /installTimelineToolbar\(mount, options\)/);

  assert.match(toolbar, /vc-timeline-toolbar/);
  assert.match(toolbar, /vcToolbarEnhanced = 'true'/);
  assert.match(toolbar, /vc-timeline-toolbar-container/);
  assert.match(toolbar, /toolbarContainer\.append\(toolbar\)/);
  assert.match(toolbar, /toolbarContainer\.replaceWith\(toolbar\)/);
  assert.match(toolbar, /createActionGroup\(message\('viewGroup'\)[\s\S]*createActionGroup\(message\('navigateGroup'\)[\s\S]*createActionGroup\(message\('scaleGroup'\)/);
  assert.match(toolbar, /message\('searchPlaceholder'\)/);
  assert.match(toolbar, /message\('dateSystem'\)/);
  assert.match(toolbar, /message\('arrangeRows'\)/);
  assert.match(toolbar, /MutationObserver\(scheduleViewSync\)/);
  assert.match(toolbar, /attributeFilter: \['aria-pressed'\]/);
  assert.match(toolbar, /viewObserver\?\.disconnect/);
  assert.doesNotMatch(toolbar, /setWindow|redraw|setItems|setGroups|VisceriumChronosTimeline|vis-timeline/);

  assert.match(styles, /Origin: timeline-toolbar\.css/);
  assert.match(styles, /vc-timeline-toolbar-enhanced/);
  assert.match(styles, /vc-timeline-action-group/);
  assert.match(styles, /vc-timeline-command/);
  assert.match(styles, /height: 3rem/);
  assert.match(styles, /margin: 0 !important/);
  assert.match(styles, /vc-timeline-action-group\.is-view/);
  assert.match(styles, /pointer-events: none/);
  assert.match(styles, /max-width: 38rem/);
  assert.doesNotMatch(styles, /\.vis-(?:timeline|panel|item|group|label|time-axis)/);

  assert.match(containerStyles, /Origin: timeline-toolbar-container\.css/);
  assert.match(containerStyles, /vc-timeline-toolbar-container/);
  assert.match(containerStyles, /container-name: vc-timeline-toolbar/);
  assert.match(containerStyles, /container-type: inline-size/);
  assert.match(containerStyles, /@container vc-timeline-toolbar \(max-width: 1440px\)/);
  assert.match(containerStyles, /grid-column: 1 \/ -1/);
  assert.match(containerStyles, /flex-wrap: wrap/);
  assert.doesNotMatch(containerStyles, /\.vc-timeline-app\s*\{/);
  assert.doesNotMatch(containerStyles, /\.vis-(?:timeline|panel|item|group|label|time-axis)/);

  assert.match(buttonStyles, /Origin: timeline-buttons\.css/);
  assert.match(canvasStyles, /--vc-timeline-button-radius: \.55rem/);
  assert.match(buttonStyles, /\.vc-timeline-app :is\(\.vc-timeline-toolbar, \.vc-timeline-filter-actions\) button\s*\{[\s\S]*border-radius: var\(--vc-timeline-button-radius\)/);
  assert.doesNotMatch(buttonStyles, /\.vis-(?:timeline|panel|item|group|label|time-axis)/);
});

test('toolbar buttons retain visible labels, icons and accessible names', () => {
  const toolbar = read('../src/lib/timeline/toolbar-ui.mjs');

  assert.match(toolbar, /vc-timeline-control-icon/);
  assert.match(toolbar, /vc-timeline-command-label/);
  assert.match(toolbar, /data-vc-toolbar-icon/);
  assert.match(toolbar, /contentMatches/);
  assert.match(toolbar, /message\('previousLabel'\)/);
  assert.match(toolbar, /message\('zoomOutLabel'\)/);
  assert.match(toolbar, /message\('resetLabel'\)/);
  assert.match(toolbar, /message\('openChronicle'\)/);
  assert.match(toolbar, /message\('returnGraph'\)/);
  assert.match(toolbar, /setAttribute\('aria-label', title\)/);
  assert.match(toolbar, /setAttribute\('title', title\)/);
});
