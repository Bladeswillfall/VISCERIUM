const icons = {
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 10h18"></path>',
  search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path>',
  grouping: '<path d="M4 6h6M14 6h6M7 6v12M17 6v12M4 18h6M14 18h6"></path>',
  previous: '<path d="m15 18-6-6 6-6"></path>',
  next: '<path d="m9 18 6-6-6-6"></path>',
  zoomOut: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4M8 11h6"></path>',
  zoomIn: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4M11 8v6M8 11h6"></path>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"></path><path d="M3 3v5h5"></path>',
  chronicle: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22.5z"></path><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5a2.5 2.5 0 0 1 2.5 2.5z"></path>',
  graph: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"></path>',
};

function icon(name) {
  return `<svg class="vc-timeline-control-icon" data-vc-toolbar-icon="${name}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name] ?? ''}</svg>`;
}

function decorateField(control, iconName, label, hint) {
  const field = control.closest('.vc-timeline-field');
  const heading = field?.querySelector(':scope > span');
  if (!field || !heading) return;

  field.classList.add('vc-timeline-toolbar-field');
  heading.className = 'vc-timeline-field-heading';
  heading.innerHTML = `${icon(iconName)}<span class="vc-timeline-field-label">${label}</span><span class="vc-timeline-field-hint">${hint}</span>`;
}

function decorateButton(button, iconName, label, title) {
  if (!button) return;
  button.classList.add('vc-timeline-command');

  const currentIcon = button.querySelector(':scope > .vc-timeline-control-icon');
  const currentLabel = button.querySelector(':scope > .vc-timeline-command-label');
  const contentMatches = currentIcon?.dataset.vcToolbarIcon === iconName
    && currentLabel?.textContent === label;
  if (!contentMatches) {
    button.innerHTML = `${icon(iconName)}<span class="vc-timeline-command-label">${label}</span>`;
  }
  if (button.getAttribute('aria-label') !== title) button.setAttribute('aria-label', title);
  if (button.getAttribute('title') !== title) button.setAttribute('title', title);
}

function createActionGroup(label, className, buttons) {
  const group = document.createElement('div');
  group.className = `vc-timeline-action-group ${className}`;
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', label);

  const heading = document.createElement('span');
  heading.className = 'vc-timeline-action-heading';
  heading.textContent = label;

  const row = document.createElement('div');
  row.className = 'vc-timeline-action-row';
  for (const button of buttons) {
    if (button) row.append(button);
  }

  group.append(heading, row);
  return group;
}

/**
 * Improves the existing timeline toolbar without changing Chronos, timeline
 * state or any control event handlers. Existing controls are decorated and
 * regrouped in place so the renderer remains the single behaviour owner.
 */
export function installTimelineToolbar(root) {
  const toolbar = root.querySelector('.vc-timeline-toolbar');
  const actions = toolbar?.querySelector('.vc-timeline-actions');
  const calendar = toolbar?.querySelector('[data-vc-calendar]');
  const search = toolbar?.querySelector('[data-vc-search]');
  const grouping = toolbar?.querySelector('[data-vc-lane]');
  if (!toolbar || !actions || !calendar || !search || !grouping) return () => {};

  const toolbarContainer = document.createElement('div');
  toolbarContainer.className = 'vc-timeline-toolbar-container';
  toolbarContainer.dataset.vcToolbarContainer = 'true';
  toolbar.before(toolbarContainer);
  toolbarContainer.append(toolbar);

  toolbar.classList.add('vc-timeline-toolbar-enhanced');
  toolbar.dataset.vcToolbarEnhanced = 'true';

  decorateField(calendar, 'calendar', 'Calendar', 'Date system');
  decorateField(search, 'search', 'Search events', 'Filter records');
  decorateField(grouping, 'grouping', 'Grouping', 'Arrange rows');
  search.setAttribute('placeholder', 'Search titles, factions, locations…');
  search.setAttribute('aria-label', 'Search timeline events');
  calendar.setAttribute('aria-label', 'Choose calendar date system');
  grouping.setAttribute('aria-label', 'Choose how timeline rows are grouped');

  const previous = toolbar.querySelector('[data-vc-prev]');
  const next = toolbar.querySelector('[data-vc-next]');
  const zoomOut = toolbar.querySelector('[data-vc-zoom-out]');
  const zoomIn = toolbar.querySelector('[data-vc-zoom-in]');
  const reset = toolbar.querySelector('[data-vc-reset]');
  const list = toolbar.querySelector('[data-vc-list]');

  decorateButton(previous, 'previous', 'Previous', 'Select the previous matching event');
  decorateButton(next, 'next', 'Next', 'Select the next matching event');
  decorateButton(zoomOut, 'zoomOut', 'Zoom out', 'Show a wider date range');
  decorateButton(zoomIn, 'zoomIn', 'Zoom in', 'Show a narrower date range');
  decorateButton(reset, 'reset', 'Reset', 'Return to the default date range');

  const syncViewButton = () => {
    if (!list) return;
    const chronicleVisible = root.classList.contains('is-chronicle-view')
      || list.getAttribute('aria-pressed') === 'true';
    decorateButton(
      list,
      chronicleVisible ? 'graph' : 'chronicle',
      chronicleVisible ? 'Graph view' : 'Chronicle',
      chronicleVisible ? 'Return to interactive graph view' : 'Open chronicle reading view',
    );
    list.classList.toggle('is-active-view', chronicleVisible);
  };
  syncViewButton();

  actions.replaceChildren(
    createActionGroup('View', 'is-view', [list]),
    createActionGroup('Navigate', 'is-navigation', [previous, next]),
    createActionGroup('Scale', 'is-scale', [zoomOut, zoomIn, reset]),
  );

  let viewSyncQueued = false;
  const scheduleViewSync = () => {
    if (viewSyncQueued) return;
    viewSyncQueued = true;
    queueMicrotask(() => {
      viewSyncQueued = false;
      syncViewButton();
    });
  };
  const viewObserver = list ? new MutationObserver(scheduleViewSync) : null;
  viewObserver?.observe(list, {
    childList: true,
    attributes: true,
    attributeFilter: ['aria-pressed'],
  });

  return () => {
    viewObserver?.disconnect();
    toolbar.classList.remove('vc-timeline-toolbar-enhanced');
    delete toolbar.dataset.vcToolbarEnhanced;
    if (toolbarContainer.isConnected) toolbarContainer.replaceWith(toolbar);
  };
}
