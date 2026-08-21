import { DataSet, Timeline } from 'vis-timeline/standalone';
import { VisceriumChronosTimeline } from '../chronos-fork/VisceriumChronosTimeline.mjs';
import { escapeHtml } from '../codex-paths.mjs';
import { calendars, defaultCalendarId, formatAbsoluteDay } from '../calendar/runtime.mjs';
import {
  IMPORTANCE_LEVELS,
  absoluteDayToSyntheticDate as absoluteDayToSyntheticDateBase,
  bucketTimelineEvents,
  chooseCalendar,
  compareTimelineEvents,
  createTimelineRangeIndex,
  eventOverlapsRange,
  getZoomImportanceThreshold,
  importanceIsVisible,
  parseTimelineUrlState,
  queryTimelineRange,
  syntheticDateToAbsoluteDay as syntheticDateToAbsoluteDayBase,
  timelineEventSearchText,
  updateTimelineUrl,
} from './core.mjs';
import { createCalendarAxisFormatter } from './calendar-axis.mjs';
import { createChronosTimelineModel } from './chronos-adapter.mjs';
import { timelineList, timelineMessage, timelinePlural } from './i18n.mjs';

const VIEWPORT_BUFFER_FACTOR = 1.25;
const SEARCH_DEBOUNCE_MS = 140;
const LIST_PAGE_SIZE = 100;
const MINIMAP_BUCKET_COUNT = 320;

function cssToken(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
}

function certaintyLabel(messages, certainty) {
  return timelineMessage(messages, ['approximate', 'disputed', 'legendary'].includes(certainty) ? certainty : 'exact');
}

function checkboxList(name, values, labels = {}) {
  return values
    .map((value) => `<label class="vc-timeline-check"><input type="checkbox" name="${name}" value="${escapeHtml(value)}"> <span>${escapeHtml(labels[value] ?? value)}</span></label>`)
    .join('');
}

function renderTemplate(dataset, options, instanceId) {
  const message = (key, values) => escapeHtml(timelineMessage(options.messages, key, values));
  const categories = [...new Set(dataset.events.flatMap((event) => event.categories))].sort();
  const eraOptions = dataset.id === 'super' ? dataset.eras.map((era) => era.id) : [];
  const importanceLabels = Object.fromEntries(
    IMPORTANCE_LEVELS.map((importance) => [importance, timelineMessage(options.messages, importance)]),
  );
  const detailsTitleId = `vc-timeline-detail-title-${instanceId}`;
  return `
    <section class="vc-timeline-app vc-chronos-powered vc-chronos-native${options.compact ? ' is-compact' : ''}" aria-label="${escapeHtml(dataset.title)}">
      <div class="vc-timeline-toolbar" role="toolbar" aria-label="${message('controls')}">
        <label class="vc-timeline-field"><span>${message('calendar')}</span><select data-vc-calendar>${calendars.map((calendar) => `<option value="${calendar.id}">${escapeHtml(calendar.shortName ?? calendar.name)}</option>`).join('')}</select></label>
        <label class="vc-timeline-field vc-timeline-search"><span>${message('searchEvents')}</span><input data-vc-search type="search" autocomplete="off" placeholder="${message('searchEvents')}"></label>
        <label class="vc-timeline-field"><span>${message('groupView')}</span><select data-vc-lane><option value="unified">${message('unified')}</option><option value="lane">${message('declaredLane')}</option><option value="category">${message('category')}</option></select></label>
        <div class="vc-timeline-actions">
          <button type="button" data-vc-prev aria-label="${message('previousLabel')}">← ${message('previous')}</button>
          <button type="button" data-vc-next aria-label="${message('nextLabel')}">${message('next')} →</button>
          <button type="button" data-vc-zoom-out aria-label="${message('zoomOut')}">−</button>
          <button type="button" data-vc-zoom-in aria-label="${message('zoomIn')}">+</button>
          <button type="button" data-vc-reset>${message('reset')}</button>
          <button type="button" data-vc-list aria-pressed="false">${message('listView')}</button>
        </div>
      </div>
      ${options.showFilters ? `<details class="vc-timeline-filters" data-vc-filters><summary>${message('filters')}</summary><div class="vc-timeline-filter-grid"><fieldset><legend>${message('importance')}</legend>${checkboxList('importance', IMPORTANCE_LEVELS, importanceLabels)}</fieldset><fieldset><legend>${message('categories')}</legend>${categories.length ? checkboxList('categories', categories) : `<p>${message('noCategories')}</p>`}</fieldset>${eraOptions.length ? `<fieldset><legend>${message('eras')}</legend>${checkboxList('eras', eraOptions)}</fieldset>` : ''}<div class="vc-timeline-filter-actions"><button type="button" data-vc-clear>${message('clearFilters')}</button></div></div></details>` : ''}
      <div class="vc-era-strip" aria-label="${message('eraRanges')}">${dataset.eras.map((era) => `<span class="vc-era-action era-${cssToken(era.id)}"><button type="button" data-vc-era="${escapeHtml(era.id)}">${escapeHtml(era.title)}</button><a href="${escapeHtml(era.href)}" aria-label="${message('openEraArticle', { era: era.title })}">${message('article')}</a></span>`).join('')}</div>
      <div class="vc-timeline-stage">
        <div class="vc-timeline-canvas vc-chronos-host" data-vc-canvas tabindex="0" aria-label="${message('canvasLabel')}"></div>
      </div>
      ${options.showMinimap ? `<details class="vc-timeline-minimap-wrap" data-vc-minimap-wrap open><summary>${message('overview')}</summary><div class="vc-timeline-minimap" data-vc-minimap aria-label="${message('overviewLabel')}"></div></details>` : ''}
      <div class="vc-timeline-status" data-vc-status role="status" aria-live="polite"></div>
      <div class="vc-timeline-list" data-vc-list-panel hidden></div>
      <aside class="vc-timeline-details" data-vc-details hidden aria-labelledby="${detailsTitleId}">
        <button type="button" class="vc-timeline-detail-close" data-vc-close aria-label="${message('closeDetails')}">×</button>
        <div data-vc-detail-body></div>
      </aside>
      ${options.showLegend ? `<div class="vc-timeline-legend" aria-label="${message('legend')}"><span class="importance-landmark">${message('landmark')}</span><span class="importance-major">${message('major')}</span><span class="importance-standard">${message('standard')}</span><span class="certainty-approximate">${message('approximate')}</span><span class="certainty-disputed">${message('disputed')}</span><span class="certainty-legendary">${message('legendary')}</span><span class="vc-chronos-credit">VISCERIUM Chronos fork</span></div>` : ''}
    </section>`;
}

function chronosSettings(options) {
  return {
    selectedLocale: options.locale,
    align: options.direction === 'rtl' ? 'right' : 'left',
    clickToUse: false,
    roundRanges: true,
    useUtc: true,
    useAI: false,
    theme: {
      customClass: 'vc-chronos-core',
    },
    messages: options.messages,
  };
}

export function mountTimeline(root, dataset, suppliedOptions = {}) {
  if (!root) throw new Error('Timeline mount root is required.');
  if (!dataset?.id || !Array.isArray(dataset.events) || !Array.isArray(dataset.eras)) {
    throw new Error('Timeline dataset is malformed.');
  }

  const options = {
    defaultCalendar: suppliedOptions.defaultCalendar ?? dataset.defaultCalendar ?? defaultCalendarId,
    laneMode: suppliedOptions.laneMode ?? 'unified',
    showFilters: suppliedOptions.showFilters !== false,
    showMinimap: suppliedOptions.showMinimap !== false,
    showLegend: suppliedOptions.showLegend !== false,
    compact: suppliedOptions.compact === true,
    articleHandler: suppliedOptions.articleHandler,
    locale: suppliedOptions.locale,
    direction: suppliedOptions.direction,
    messages: suppliedOptions.messages,
  };
  const numberFormatter = new Intl.NumberFormat(options.locale);
  const message = (key, values) => timelineMessage(options.messages, key, values);
  const syntheticOriginDay = dataset.absoluteStartDay;
  const toSyntheticDate = (absoluteDay) => absoluteDayToSyntheticDateBase(absoluteDay, syntheticOriginDay);
  const fromSyntheticDate = (date) => syntheticDateToAbsoluteDayBase(date, syntheticOriginDay);
  const instanceId = Math.random().toString(36).slice(2, 10);
  root.innerHTML = renderTemplate(dataset, options, instanceId);
  root.dataset.enhanced = 'true';

  const canvas = root.querySelector('[data-vc-canvas]');
  const status = root.querySelector('[data-vc-status]');
  const details = root.querySelector('[data-vc-details]');
  const detailBody = root.querySelector('[data-vc-detail-body]');
  const listPanel = root.querySelector('[data-vc-list-panel]');
  const calendarSelect = root.querySelector('[data-vc-calendar]');
  const searchInput = root.querySelector('[data-vc-search]');
  const laneSelect = root.querySelector('[data-vc-lane]');
  const minimapElement = root.querySelector('[data-vc-minimap]');
  const detailsTitleId = `vc-timeline-detail-title-${instanceId}`;
  const storageKey = 'viscerium.timeline.calendar';
  const calendarIds = calendars.map((calendar) => calendar.id);
  const currentUrl = new URL(window.location.href);
  const rawQueryCalendar = currentUrl.searchParams.get('calendar');
  const urlState = parseTimelineUrlState(currentUrl, {
    calendarIds,
    fallbackCalendar: options.defaultCalendar,
    fallbackLaneMode: options.laneMode,
  });
  let storedCalendar;
  try {
    storedCalendar = window.localStorage.getItem(storageKey);
  } catch {
    storedCalendar = undefined;
  }
  const state = {
    calendar: chooseCalendar({
      queryCalendar: rawQueryCalendar && calendarIds.includes(rawQueryCalendar) ? rawQueryCalendar : undefined,
      storedCalendar,
      timelineDefault: options.defaultCalendar,
      globalDefault: defaultCalendarId,
      calendarIds,
    }),
    selected: urlState.selected,
    search: urlState.search ?? '',
    importance: urlState.importance ?? [],
    categories: urlState.categories ?? [],
    eras: urlState.eras ?? [],
    laneMode: urlState.laneMode ?? options.laneMode,
    visibleStartDay: urlState.visibleStartDay,
    visibleEndDay: urlState.visibleEndDay,
  };

  calendarSelect.value = state.calendar;
  searchInput.value = state.search;
  laneSelect.value = state.laneMode;
  for (const name of ['importance', 'categories', 'eras']) {
    for (const input of root.querySelectorAll(`input[name="${name}"]`)) {
      input.checked = state[name].includes(input.value);
    }
  }

  const eventById = new Map(dataset.events.map((event) => [event.id, event]));
  const searchTextById = new Map(dataset.events.map((event) => [event.id, timelineEventSearchText(event)]));
  const rangeIndex = createTimelineRangeIndex(dataset.events);
  const dateCache = new Map();
  const formatEventDate = (event) => {
    const key = `${state.calendar}:${event.id}:${event.precision}:${event.endPrecision ?? ''}`;
    if (dateCache.has(key)) return dateCache.get(key);
    const start = formatAbsoluteDay(event.absoluteStartDay, state.calendar, event.precision, { locale: options.locale });
    const value = event.absoluteEndDay === undefined
      ? start
      : `${start} – ${formatAbsoluteDay(event.absoluteEndDay, state.calendar, event.endPrecision ?? event.precision, { locale: options.locale })}`;
    dateCache.set(key, value);
    return value;
  };

  function resolveInitialWindow() {
    if (
      Number.isSafeInteger(state.visibleStartDay)
      && Number.isSafeInteger(state.visibleEndDay)
      && state.visibleStartDay < state.visibleEndDay
    ) {
      return { startDay: state.visibleStartDay, endDay: state.visibleEndDay };
    }

    const era = dataset.id === 'super' ? null : dataset.eras[0];
    const padding = era?.defaultViewport?.paddingDays ?? 30;
    return {
      startDay: era?.defaultViewport?.startDay ?? dataset.absoluteStartDay - padding,
      endDay: era?.defaultViewport?.endDay ?? dataset.absoluteEndDay + padding,
    };
  }

  function bufferedRange(startDay, endDay) {
    const span = Math.max(1, endDay - startDay);
    const padding = Math.max(30, Math.ceil(span * VIEWPORT_BUFFER_FACTOR));
    return {
      startDay: Math.max(dataset.absoluteStartDay, Math.floor(startDay - padding)),
      endDay: Math.min(dataset.absoluteEndDay, Math.ceil(endDay + padding)),
    };
  }

  function eventMatchesActiveFilters(event, threshold) {
    if (!importanceIsVisible(event.importance, threshold)) return false;
    if (state.importance.length && !state.importance.includes(event.importance)) return false;
    if (state.categories.length && !state.categories.some((category) => event.categories.includes(category))) return false;
    if (state.eras.length && !state.eras.some((era) => event.eras.includes(era))) return false;
    const search = state.search.trim().toLowerCase();
    return !search || searchTextById.get(event.id)?.includes(search);
  }

  const initialWindow = resolveInitialWindow();
  const initialLoadedRange = bufferedRange(initialWindow.startDay, initialWindow.endDay);
  let loadedStartDay = initialLoadedRange.startDay;
  let loadedEndDay = initialLoadedRange.endDay;
  let currentThreshold = getZoomImportanceThreshold(Math.max(1, initialWindow.endDay - initialWindow.startDay));
  let matchingEvents = rangeIndex.byStart.filter((event) => eventMatchesActiveFilters(event, currentThreshold));
  let matchingEventIds = new Set(matchingEvents.map((event) => event.id));
  let renderedEvents = queryTimelineRange(rangeIndex, loadedStartDay, loadedEndDay)
    .filter((event) => matchingEventIds.has(event.id));
  let renderedEventIds = new Set(renderedEvents.map((event) => event.id));
  let selectedIndex = -1;
  let listRenderLimit = LIST_PAGE_SIZE;
  let listDirty = true;
  let searchDebounceHandle;

  const chronos = new VisceriumChronosTimeline({
    container: canvas,
    settings: chronosSettings(options),
    callbacks: {
      setTooltip: (element, fallbackText) => {
        const itemElement = element.closest?.('[data-id]') ?? element;
        const id = itemElement?.getAttribute?.('data-id');
        const event = id ? eventById.get(id) : undefined;
        element.setAttribute('title', event ? `${formatEventDate(event)} – ${event.description}` : fallbackText);
      },
    },
    cssRootClass: 'vc-chronos-core',
    axis: createCalendarAxisFormatter({
      getCalendarId: () => state.calendar,
      getLocale: () => options.locale,
      fromSyntheticDate,
    }),
    timelineOptions: {
      rtl: options.direction === 'rtl',
      height: options.compact ? '22rem' : '24rem',
      minHeight: '20rem',
      zoomKey: 'ctrlKey',
      zoomMin: 86_400_000,
      zoomMax: Math.max(86_400_000, (dataset.absoluteEndDay - dataset.absoluteStartDay + 365) * 86_400_000),
      tooltip: { followMouse: true, overflowMethod: 'cap' },
    },
  });

  const initialModel = createChronosTimelineModel({
    dataset,
    events: renderedEvents,
    laneMode: state.laneMode,
    formatEventDate,
    locale: options.locale,
    messages: options.messages,
    visibleStartDay: initialWindow.startDay,
    visibleEndDay: initialWindow.endDay,
  });
  chronos.renderParsed(initialModel.parsed);
  const timeline = chronos.timeline;
  if (!timeline) throw new Error('The VISCERIUM Chronos fork did not create a timeline instance.');

  let minimap;
  let minimapItems;
  let minimapIdleHandle;
  let minimapTimeoutHandle;
  let destroyed = false;

  function renderList(reset = false) {
    if (listPanel.hidden) {
      listDirty = true;
      return;
    }
    if (reset) listRenderLimit = LIST_PAGE_SIZE;

    const visibleEvents = matchingEvents.slice(0, listRenderLimit);
    const remaining = Math.max(0, matchingEvents.length - visibleEvents.length);
    const nextCount = Math.min(LIST_PAGE_SIZE, remaining);
    listPanel.innerHTML = `
      <ol>${visibleEvents.map((event) => `<li><button type="button" data-vc-select-event="${escapeHtml(event.id)}"><span>${escapeHtml(formatEventDate(event))}</span><strong>${escapeHtml(event.title)}</strong><small>${escapeHtml(event.description)}</small></button></li>`).join('')}</ol>
      ${remaining > 0 ? `<button type="button" class="vc-timeline-list-more" data-vc-list-more>${escapeHtml(message('showMore', { count: numberFormatter.format(nextCount) }))} <span>(${escapeHtml(message('remaining', { count: numberFormatter.format(remaining) }))})</span></button>` : ''}`;
    listDirty = false;
  }

  function refreshMatchingEvents(threshold) {
    currentThreshold = threshold;
    matchingEvents = rangeIndex.byStart.filter((event) => eventMatchesActiveFilters(event, threshold));
    matchingEventIds = new Set(matchingEvents.map((event) => event.id));
    selectedIndex = state.selected ? matchingEvents.findIndex((event) => event.id === state.selected) : -1;
    listDirty = true;
  }

  function addSelectedEventIfNeeded(events) {
    const selectedEvent = state.selected ? eventById.get(state.selected) : undefined;
    if (
      !selectedEvent
      || !eventOverlapsRange(selectedEvent, loadedStartDay, loadedEndDay)
      || events.some((event) => event.id === selectedEvent.id)
    ) return events;
    return [...events, selectedEvent].sort(compareTimelineEvents);
  }

  function refreshItems({ force = false, filtersChanged = false } = {}) {
    const windowRange = timeline.getWindow();
    const visibleStartDay = fromSyntheticDate(windowRange.start);
    const visibleEndDay = fromSyntheticDate(windowRange.end);
    const span = Math.max(1, visibleEndDay - visibleStartDay);
    const threshold = getZoomImportanceThreshold(span);
    const thresholdChanged = threshold !== currentThreshold;
    const outsideLoadedRange = visibleStartDay < loadedStartDay || visibleEndDay > loadedEndDay;

    if (filtersChanged || thresholdChanged) refreshMatchingEvents(threshold);
    if (!force && !filtersChanged && !thresholdChanged && !outsideLoadedRange) return;

    if (outsideLoadedRange || force) {
      const nextRange = bufferedRange(visibleStartDay, visibleEndDay);
      loadedStartDay = nextRange.startDay;
      loadedEndDay = nextRange.endDay;
    }

    renderedEvents = queryTimelineRange(rangeIndex, loadedStartDay, loadedEndDay)
      .filter((event) => matchingEventIds.has(event.id));
    renderedEvents = addSelectedEventIfNeeded(renderedEvents);
    renderedEventIds = new Set(renderedEvents.map((event) => event.id));

    const model = createChronosTimelineModel({
      dataset,
      events: renderedEvents,
      laneMode: state.laneMode,
      formatEventDate,
      locale: options.locale,
      messages: options.messages,
      visibleStartDay,
      visibleEndDay,
    });
    chronos.updateParsed(model.parsed);
    status.textContent = message('status', {
      rendered: numberFormatter.format(renderedEvents.length),
      matching: numberFormatter.format(matchingEvents.length),
      total: numberFormatter.format(dataset.events.length),
    });
    if (filtersChanged || thresholdChanged) renderList(true);
  }

  function syncViewportState() {
    const range = timeline.getWindow();
    state.visibleStartDay = fromSyntheticDate(range.start);
    state.visibleEndDay = fromSyntheticDate(range.end);
    if (minimapItems) {
      minimapItems.update({
        id: 'viewport',
        start: range.start,
        end: range.end,
        type: 'range',
        content: '',
        className: 'vc-minimap-viewport',
      });
    }
  }

  function syncUrl() {
    const updated = updateTimelineUrl(window.location.href, state);
    window.history.replaceState({}, '', `${updated.pathname}${updated.search}${updated.hash}`);
  }

  function resetWindow() {
    const era = dataset.id === 'super' ? null : dataset.eras[0];
    const padding = era?.defaultViewport?.paddingDays ?? 30;
    const start = era?.defaultViewport?.startDay ?? dataset.absoluteStartDay - padding;
    const end = era?.defaultViewport?.endDay ?? dataset.absoluteEndDay + padding;
    timeline.setWindow(toSyntheticDate(start), toSyntheticDate(end), { animation: false });
  }

  function zoomEra(id) {
    const era = dataset.eras.find((item) => item.id === id);
    if (!era) return;
    const padding = era.defaultViewport?.paddingDays ?? 30;
    timeline.setWindow(
      toSyntheticDate(era.absoluteStartDay - padding),
      toSyntheticDate(era.absoluteEndDay + padding),
    );
  }

  function renderDetails(event) {
    if (!event) return;
    detailBody.innerHTML = `
      <p class="vc-detail-kicker">${escapeHtml(formatEventDate(event))}</p>
      <h2 id="${detailsTitleId}">${escapeHtml(event.title)}</h2>
      <p>${escapeHtml(event.description)}</p>
      <dl>
        <div><dt>${escapeHtml(message('precision'))}</dt><dd>${escapeHtml(event.precision)}</dd></div>
        <div><dt>${escapeHtml(message('certainty'))}</dt><dd>${escapeHtml(certaintyLabel(options.messages, event.certainty))}</dd></div>
        <div><dt>${escapeHtml(message('importance'))}</dt><dd>${escapeHtml(message(event.importance))}</dd></div>
        <div><dt>${escapeHtml(message('categories'))}</dt><dd>${escapeHtml(event.categories.length ? timelineList(event.categories, options.locale) : message('uncategorised'))}</dd></div>
        <div><dt>${escapeHtml(message('era'))}</dt><dd>${escapeHtml(event.eras.length ? timelineList(event.eras, options.locale) : message('outsideEras'))}</dd></div>
        <div><dt>${escapeHtml(message('factions'))}</dt><dd>${escapeHtml(event.factions.length ? timelineList(event.factions, options.locale) : '–')}</dd></div>
        <div><dt>${escapeHtml(message('locations'))}</dt><dd>${escapeHtml(event.locations.length ? timelineList(event.locations, options.locale) : '–')}</dd></div>
        <div><dt>${escapeHtml(message('participants'))}</dt><dd>${escapeHtml(event.participants.length ? timelineList(event.participants, options.locale) : '–')}</dd></div>
      </dl>
      <a class="vc-detail-link" href="${escapeHtml(event.href)}" data-vc-article data-source-path="${escapeHtml(event.sourcePath ?? '')}">${escapeHtml(message('openFullArticle'))}</a>`;
    const article = detailBody.querySelector('[data-vc-article]');
    if (options.articleHandler) {
      article.addEventListener('click', (eventObject) => {
        eventObject.preventDefault();
        options.articleHandler(event);
      });
    }
    details.hidden = false;
  }

  function ensureEventRendered(event) {
    if (renderedEventIds.has(event.id)) return;
    const currentRange = timeline.getWindow();
    const currentSpan = Math.max(30, fromSyntheticDate(currentRange.end) - fromSyntheticDate(currentRange.start));
    const eventEnd = event.absoluteEndDay ?? event.absoluteStartDay;
    const eventSpan = Math.max(1, eventEnd - event.absoluteStartDay);
    const targetSpan = Math.max(currentSpan, eventSpan + 60);
    const centre = event.absoluteStartDay + eventSpan / 2;
    const start = Math.floor(centre - targetSpan / 2);
    const end = Math.ceil(centre + targetSpan / 2);
    timeline.setWindow(toSyntheticDate(start), toSyntheticDate(end), { animation: false });
    refreshItems({ force: true });
  }

  function selectEvent(id, focusDetails = false) {
    const event = eventById.get(id);
    if (!event) return;
    state.selected = event.id;
    ensureEventRendered(event);
    selectedIndex = matchingEvents.findIndex((item) => item.id === event.id);
    timeline.setSelection([event.id], { focus: true, animation: true });
    renderDetails(event);
    syncUrl();
    if (focusDetails) details.querySelector('[data-vc-close]')?.focus();
  }

  function stepEvent(delta) {
    if (!matchingEvents.length) return;
    selectedIndex = selectedIndex < 0
      ? (delta > 0 ? 0 : matchingEvents.length - 1)
      : (selectedIndex + delta + matchingEvents.length) % matchingEvents.length;
    selectEvent(matchingEvents[selectedIndex].id, false);
  }

  function applyFilters() {
    state.search = searchInput.value;
    for (const name of ['importance', 'categories', 'eras']) {
      state[name] = [...root.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
    }
    refreshItems({ force: true, filtersChanged: true });
    syncUrl();
  }

  function scheduleSearch() {
    window.clearTimeout(searchDebounceHandle);
    searchDebounceHandle = window.setTimeout(applyFilters, SEARCH_DEBOUNCE_MS);
  }

  function mountMinimap() {
    if (destroyed || !minimapElement || minimap) return;

    minimapItems = new DataSet();
    minimap = new Timeline(minimapElement, minimapItems, {
      height: '4.5rem',
      stack: false,
      showCurrentTime: false,
      showMajorLabels: false,
      showMinorLabels: false,
      selectable: false,
      moveable: false,
      zoomable: false,
      margin: { item: 2, axis: 0 },
    });
    minimap.on('click', ({ time }) => timeline.moveTo(time, { animation: true }));

    const buckets = bucketTimelineEvents(
      dataset.events,
      dataset.absoluteStartDay,
      dataset.absoluteEndDay,
      MINIMAP_BUCKET_COUNT,
    );
    const maximumDensity = Math.max(1, ...buckets.map((bucket) => bucket.count));
    minimapItems.add([
      ...dataset.eras.map((era) => ({
        id: `mini-era:${era.id}`,
        start: toSyntheticDate(era.absoluteStartDay),
        end: toSyntheticDate(era.absoluteEndDay + 1),
        type: 'background',
        content: '',
        className: `vc-era-band era-${cssToken(era.id)}`,
      })),
      ...buckets.map((bucket) => ({
        id: `mini-density:${bucket.index}`,
        start: toSyntheticDate(bucket.absoluteDay),
        type: 'point',
        content: '',
        title: timelinePlural(options.messages, 'eventCount', bucket.count, options.locale),
        className: `vc-mini-event density-${Math.max(1, Math.ceil((bucket.count / maximumDensity) * 4))}`,
      })),
      {
        id: 'viewport',
        start: toSyntheticDate(initialWindow.startDay),
        end: toSyntheticDate(initialWindow.endDay),
        type: 'range',
        content: '',
        className: 'vc-minimap-viewport',
      },
    ]);
    minimap.setWindow(
      toSyntheticDate(dataset.absoluteStartDay),
      toSyntheticDate(dataset.absoluteEndDay),
      { animation: false },
    );
    syncViewportState();
  }

  function scheduleMinimap() {
    if (!minimapElement) return;
    if (typeof window.requestIdleCallback === 'function') {
      minimapIdleHandle = window.requestIdleCallback(mountMinimap, { timeout: 1_500 });
    } else {
      minimapTimeoutHandle = window.setTimeout(mountMinimap, 250);
    }
  }

  timeline.on('rangechanged', () => {
    syncViewportState();
    refreshItems();
    syncUrl();
  });
  timeline.on('select', ({ items }) => {
    const id = items.find((item) => !String(item).startsWith('era:'));
    if (id) selectEvent(String(id), false);
  });
  timeline.on('click', ({ item }) => {
    if (typeof item === 'string' && item.startsWith('era:')) zoomEra(item.split(':')[1]);
  });

  calendarSelect.addEventListener('change', () => {
    state.calendar = calendarSelect.value;
    dateCache.clear();
    try {
      window.localStorage.setItem(storageKey, state.calendar);
    } catch {
      // URL state remains available when storage is blocked.
    }
    const windowRange = timeline.getWindow();
    refreshItems({ force: true });
    chronos.redraw();
    renderList(true);
    if (state.selected) renderDetails(eventById.get(state.selected));
    timeline.setWindow(windowRange.start, windowRange.end, { animation: false });
    syncViewportState();
    syncUrl();
  });
  searchInput.addEventListener('input', scheduleSearch);
  laneSelect.addEventListener('change', () => {
    state.laneMode = laneSelect.value;
    refreshItems({ force: true });
    syncUrl();
  });
  for (const input of root.querySelectorAll('.vc-timeline-filters input')) input.addEventListener('change', applyFilters);
  root.querySelector('[data-vc-clear]')?.addEventListener('click', () => {
    window.clearTimeout(searchDebounceHandle);
    searchInput.value = '';
    for (const input of root.querySelectorAll('.vc-timeline-filters input')) input.checked = false;
    applyFilters();
  });
  root.querySelector('[data-vc-prev]').addEventListener('click', () => stepEvent(-1));
  root.querySelector('[data-vc-next]').addEventListener('click', () => stepEvent(1));
  root.querySelector('[data-vc-zoom-in]').addEventListener('click', () => timeline.zoomIn(0.35));
  root.querySelector('[data-vc-zoom-out]').addEventListener('click', () => timeline.zoomOut(0.35));
  root.querySelector('[data-vc-reset]').addEventListener('click', resetWindow);
  root.querySelector('[data-vc-list]').addEventListener('click', (event) => {
    const visible = listPanel.hidden;
    listPanel.hidden = !visible;
    canvas.hidden = visible;
    event.currentTarget.setAttribute('aria-pressed', String(visible));
    event.currentTarget.textContent = visible ? message('graphView') : message('listView');
    if (visible && listDirty) renderList(true);
    if (!visible) chronos.redraw();
  });
  listPanel.addEventListener('click', (event) => {
    const selectButton = event.target.closest?.('[data-vc-select-event]');
    if (selectButton) {
      selectEvent(selectButton.dataset.vcSelectEvent, true);
      return;
    }
    const moreButton = event.target.closest?.('[data-vc-list-more]');
    if (moreButton) {
      listRenderLimit += LIST_PAGE_SIZE;
      renderList(false);
    }
  });
  root.querySelector('[data-vc-close]').addEventListener('click', () => {
    details.hidden = true;
    state.selected = undefined;
    timeline.setSelection([]);
    syncUrl();
  });
  for (const button of root.querySelectorAll('[data-vc-era]')) {
    button.addEventListener('click', () => zoomEra(button.dataset.vcEra));
  }

  timeline.setWindow(
    toSyntheticDate(initialWindow.startDay),
    toSyntheticDate(initialWindow.endDay),
    { animation: false },
  );
  status.textContent = message('status', {
    rendered: numberFormatter.format(renderedEvents.length),
    matching: numberFormatter.format(matchingEvents.length),
    total: numberFormatter.format(dataset.events.length),
  });
  syncViewportState();
  scheduleMinimap();
  if (state.selected && eventById.has(state.selected)) {
    selectEvent(state.selected, false);
  }

  return () => {
    destroyed = true;
    window.clearTimeout(searchDebounceHandle);
    if (minimapIdleHandle !== undefined && typeof window.cancelIdleCallback === 'function') {
      window.cancelIdleCallback(minimapIdleHandle);
    }
    if (minimapTimeoutHandle !== undefined) window.clearTimeout(minimapTimeoutHandle);
    chronos.destroy();
    minimap?.destroy();
    root.innerHTML = '';
  };
}
