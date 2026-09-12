import { timelineMessage } from './i18n.mjs';

const icons = {
  calendar: 'event',
  search: 'search',
  grouping: 'view-column',
  previous: 'chevron-left',
  next: 'chevron-right',
  zoomOut: 'zoom-out',
  zoomIn: 'zoom-in',
  reset: 'restart-alt',
  chronicle: 'codex',
  graph: 'bar-chart',
};

function icon(name) {
  const asset = icons[name];
  return `<span class="codex-icon codex-local-icon vc-timeline-control-icon" data-vc-toolbar-icon="${name}" aria-hidden="true" style="--icon: url('/icons/${asset}.svg')"></span>`;
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
 * Improves the existing timeline toolbar without changing renderer or timeline
 * state or any control event handlers. Existing controls are decorated and
 * regrouped in place so the renderer remains the single behaviour owner.
 */
export function installTimelineToolbar(root, options = {}) {
  const message = (key) => timelineMessage(options.messages, key);
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

  decorateField(calendar, 'calendar', message('calendar'), message('dateSystem'));
  decorateField(search, 'search', message('searchEvents'), message('filterRecords'));
  decorateField(grouping, 'grouping', message('grouping'), message('arrangeRows'));
  search.setAttribute('placeholder', message('searchPlaceholder'));
  search.setAttribute('aria-label', message('searchLabel'));
  calendar.setAttribute('aria-label', message('chooseCalendar'));
  grouping.setAttribute('aria-label', message('chooseGrouping'));

  const previous = toolbar.querySelector('[data-vc-prev]');
  const next = toolbar.querySelector('[data-vc-next]');
  const zoomOut = toolbar.querySelector('[data-vc-zoom-out]');
  const zoomIn = toolbar.querySelector('[data-vc-zoom-in]');
  const reset = toolbar.querySelector('[data-vc-reset]');
  const list = toolbar.querySelector('[data-vc-list]');

  decorateButton(previous, 'previous', message('previous'), message('previousLabel'));
  decorateButton(next, 'next', message('next'), message('nextLabel'));
  decorateButton(zoomOut, 'zoomOut', message('zoomOut'), message('zoomOutLabel'));
  decorateButton(zoomIn, 'zoomIn', message('zoomIn'), message('zoomInLabel'));
  decorateButton(reset, 'reset', message('reset'), message('resetLabel'));

  const syncViewButton = () => {
    if (!list) return;
    const chronicleVisible = root.classList.contains('is-chronicle-view')
      || list.getAttribute('aria-pressed') === 'true';
    decorateButton(
      list,
      chronicleVisible ? 'graph' : 'chronicle',
      chronicleVisible ? message('graphView') : message('chronicle'),
      chronicleVisible ? message('returnGraph') : message('openChronicle'),
    );
    list.classList.toggle('is-active-view', chronicleVisible);
  };
  syncViewButton();

  actions.replaceChildren(
    createActionGroup(message('viewGroup'), 'is-view', [list]),
    createActionGroup(message('navigateGroup'), 'is-navigation', [previous, next]),
    createActionGroup(message('scaleGroup'), 'is-scale', [zoomOut, zoomIn, reset]),
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
