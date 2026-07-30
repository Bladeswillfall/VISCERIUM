import { attachChronosStyles, parseChronos } from 'chronos-timeline-md';
import { DataSet, Timeline } from 'vis-timeline/standalone';

/**
 * VISCERIUM fork of the Chronos 1.1.0 renderer.
 *
 * Upstream reference:
 * https://github.com/clairefro/chronos-timeline-md/blob/e26587822aa902214848479c346380fe96afd476/src/core/ChronosTimeline.ts
 *
 * The Chronos parser and default stylesheet remain upstream dependencies. This
 * fork owns the renderer boundary so the host can provide exact fictional-
 * calendar ticks without replacing vis-timeline's event viewport.
 */

function collectionValues(collection) {
  if (Array.isArray(collection)) return collection;
  if (collection && typeof collection.get === 'function') return collection.get();
  return [];
}

function temporalValue(value) {
  if (value instanceof Date) return value.valueOf();
  if (value && typeof value.valueOf === 'function') return value.valueOf();
  return value ?? '';
}

function itemSignature(items) {
  return collectionValues(items).map((item) => [
    item.id,
    item.group,
    temporalValue(item.start),
    temporalValue(item.end),
    item.type,
    item.className,
    item.content,
    item.title,
    item.style,
  ].join('\u001f')).join('\u001e');
}

function groupSignature(groups) {
  return collectionValues(groups).map((group) => [
    group.id,
    group.content,
    group.className,
    group.order,
  ].join('\u001f')).join('\u001e');
}

function stageDataSet(dataSet, values) {
  const next = collectionValues(values);
  const nextIds = new Set(next.map((item) => item.id));
  const removed = dataSet.getIds().filter((id) => !nextIds.has(id));
  if (next.length) dataSet.update(next);
  return removed;
}

function flushDataSet(dataSet) {
  dataSet.flush?.();
}

function fallbackTooltip(element, text) {
  element?.setAttribute?.('title', String(text ?? ''));
}

function calendarTickId(tick, kind) {
  const sign = tick.absoluteDay < 0 ? 'n' : 'p';
  return `vc-calendar-${kind}-${tick.unit}-${sign}${Math.abs(tick.absoluteDay)}`;
}

function calendarTickSignature(ticks) {
  return [
    ticks.scaleKey,
    ...ticks.secondary.map((tick) => `${calendarTickId(tick, 'secondary')}:${tick.date.valueOf()}`),
    ...ticks.primary.map((tick) => `${calendarTickId(tick, 'primary')}:${tick.date.valueOf()}:${tick.label ?? ''}`),
  ].join('|');
}

function refitIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5M8 12h8M12 8v8"
        fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </svg>`;
}

export class VisceriumChronosTimeline {
  constructor({
    container,
    settings = {},
    callbacks = {},
    cssRootClass,
    axis = {},
    timelineOptions = {},
  }) {
    if (!container) throw new Error('Chronos renderer requires a container.');

    this.container = container;
    this.settings = {
      selectedLocale: 'en',
      align: 'left',
      clickToUse: false,
      roundRanges: true,
      useUtc: true,
      useAI: false,
      ...settings,
    };
    this.callbacks = callbacks;
    this.cssRootClass = cssRootClass;
    this.axis = axis;
    this.hostTimelineOptions = { ...timelineOptions };
    this.setTooltip = callbacks.setTooltip ?? fallbackTooltip;
    this.timeline = undefined;
    this.itemsDataSet = undefined;
    this.groupsDataSet = undefined;
    this.items = [];
    this.itemModelSignature = '';
    this.groupModelSignature = '';
    this.refitButton = undefined;
    this.calendarTickIds = new Set();
    this.calendarTickModelSignature = '';
    this.calendarAxisFrame = undefined;
    this.calendarAxisSubscriptions = [];

    const documentRef = container.ownerDocument ?? globalThis.document;
    if (documentRef) {
      attachChronosStyles(
        documentRef,
        undefined,
        this.settings.theme?.cssVariables,
        cssRootClass,
        this.settings.theme?.disableDefaultStyles,
      );
    }
  }

  render(source) {
    const parsed = parseChronos(source, {
      selectedLocale: this.settings.selectedLocale,
      roundRanges: this.settings.roundRanges,
      settings: this.settings,
    });
    this.renderParsed(parsed);
    return parsed;
  }

  renderParsed(result) {
    if (this.timeline) {
      this.updateParsed(result);
      return;
    }

    const items = collectionValues(result?.items);
    const groups = collectionValues(result?.groups);
    const markers = collectionValues(result?.markers);
    const flags = result?.flags ?? {};

    this.container.classList.add('chronos-timeline-container');
    if (this.cssRootClass) this.container.classList.add(this.cssRootClass);

    this.items = items;
    this.itemModelSignature = itemSignature(items);
    this.groupModelSignature = groupSignature(groups);
    this.itemsDataSet = new DataSet(items);
    this.groupsDataSet = new DataSet(groups);

    const options = this.#timelineOptions(flags);
    this.timeline = groups.length
      ? new Timeline(this.container, this.itemsDataSet, this.groupsDataSet, options)
      : new Timeline(this.container, this.itemsDataSet, options);

    // Queue subsequent model changes so a group switch or range refresh is
    // committed as one browser paint instead of a visible remove-then-add gap.
    const queueOptions = { delay: null, max: Number.POSITIVE_INFINITY };
    this.itemsDataSet.setOptions({ queue: queueOptions });
    this.groupsDataSet.setOptions({ queue: queueOptions });

    this.#addMarkers(markers);
    this.#installTooltipBridge();
    this.#createRefitButton();
    this.#installCalendarAxis();

    if (!flags?.defaultView?.start || !flags?.defaultView?.end) {
      requestAnimationFrame(() => this.timeline?.fit({ animation: false }));
    }
  }

  updateParsed(result) {
    if (!this.timeline) {
      this.renderParsed(result);
      return;
    }

    const items = collectionValues(result?.items);
    const groups = collectionValues(result?.groups);
    const nextItems = itemSignature(items);
    const nextGroups = groupSignature(groups);
    const groupsChanged = nextGroups !== this.groupModelSignature;
    const itemsChanged = nextItems !== this.itemModelSignature;

    if (!groupsChanged && !itemsChanged) return;

    let removedGroups = [];
    if (groupsChanged) {
      // Make destination groups available before any item is reassigned.
      removedGroups = stageDataSet(this.groupsDataSet, groups);
      flushDataSet(this.groupsDataSet);
      this.groupModelSignature = nextGroups;
    }

    if (itemsChanged) {
      // Upsert destination items before removing stale ones. The queue flush
      // prevents vis-timeline from painting the transient empty dataset.
      const removedItems = stageDataSet(this.itemsDataSet, items);
      if (removedItems.length) this.itemsDataSet.remove(removedItems);
      flushDataSet(this.itemsDataSet);
      this.itemModelSignature = nextItems;
      this.items = items;
    }

    if (removedGroups.length) {
      // Old groups remain valid until every surviving item points at its new
      // group, so grouped-to-unified changes never pass through missing rows.
      this.groupsDataSet.remove(removedGroups);
      flushDataSet(this.groupsDataSet);
    }

    this.timeline.redraw();
  }

  redraw() {
    this.timeline?.redraw();
    this.axis.resetScale?.();
    this.calendarTickModelSignature = '';
    this.#scheduleCalendarAxis();
  }

  #timelineOptions(flags) {
    const options = {
      zoomMax: 2.997972e14,
      zoomable: true,
      moveable: true,
      selectable: true,
      multiselect: false,
      minHeight: '20rem',
      maxHeight: '40rem',
      align: this.settings.align,
      clickToUse: this.settings.clickToUse,
      rtl: false,
      orientation: { axis: 'bottom', item: 'top' },
      groupHeightMode: 'fitItems',
      stack: true,
      stackSubgroups: true,
      showCurrentTime: false,
      showMajorLabels: true,
      showMinorLabels: true,
      horizontalScroll: true,
      verticalScroll: true,
      margin: { item: { horizontal: 8, vertical: 5 }, axis: 8 },
      format: {
        minorLabels: (date, scale, step) => this.axis.formatMinorLabel?.(date, scale, step) ?? '',
        majorLabels: (date, scale, step) => this.axis.formatMajorLabel?.(date, scale, step) ?? '',
      },
      ...this.hostTimelineOptions,
    };

    if (flags?.defaultView?.start && flags?.defaultView?.end) {
      options.start = flags.defaultView.start;
      options.end = flags.defaultView.end;
    }
    if (flags?.noToday) options.showCurrentTime = false;
    if (flags?.noStack) options.stack = false;
    if (flags?.height) {
      options.height = `${flags.height}px`;
      options.verticalScroll = true;
    }
    return options;
  }

  #addMarkers(markers) {
    for (const [index, marker] of markers.entries()) {
      const id = `marker_${index}`;
      this.timeline.addCustomTime(new Date(marker.start), id);
      try {
        this.timeline.setCustomTimeMarker(marker.content, id, true);
      } catch {
        // Older vis-timeline builds do not expose marker labels.
      }
    }
  }

  #installTooltipBridge() {
    this.timeline.on('itemover', ({ item, event }) => {
      const model = this.itemsDataSet?.get(item);
      const target = event?.target?.closest?.('.vis-item') ?? event?.target;
      if (!model || !target) return;
      this.setTooltip(target, model.title ?? model.cDescription ?? model.content ?? '');
    });
  }

  #createRefitButton() {
    const button = this.container.ownerDocument.createElement('button');
    button.type = 'button';
    button.className = 'chronos-timeline-refit-button';
    button.setAttribute('aria-label', 'Fit all timeline events');
    button.innerHTML = refitIcon();
    this.setTooltip(button, 'Fit all');
    button.addEventListener('click', () => this.timeline?.fit({ animation: true }));
    this.container.appendChild(button);
    this.refitButton = button;
  }

  #installCalendarAxis() {
    if (!this.timeline || typeof this.axis.getTicks !== 'function') return;

    // Calendar boundaries are native CustomTime components. vis-timeline moves
    // them in the same redraw as event items, so labels and lines cannot trail
    // behind a pan or zoom. The visible tick set is refreshed only after the
    // interaction settles.
    const sync = () => this.#syncCalendarAxis();
    this.timeline.on('rangechanged', sync);
    this.calendarAxisSubscriptions.push(['rangechanged', sync]);
    this.#scheduleCalendarAxis();
  }

  #scheduleCalendarAxis() {
    if (!this.timeline) return;
    if (this.calendarAxisFrame !== undefined) cancelAnimationFrame(this.calendarAxisFrame);
    this.calendarAxisFrame = requestAnimationFrame(() => {
      this.calendarAxisFrame = undefined;
      this.#syncCalendarAxis();
    });
  }

  #syncCalendarAxis() {
    if (!this.timeline || typeof this.axis.getTicks !== 'function') return;
    const centerPanel = this.container.querySelector('.vis-panel.vis-center');
    const width = centerPanel?.getBoundingClientRect().width ?? 0;
    if (width <= 0) return;

    const range = this.timeline.getWindow();
    const ticks = this.axis.getTicks({ start: range.start, end: range.end, width });
    const signature = calendarTickSignature(ticks);
    if (signature === this.calendarTickModelSignature) return;

    const nextTickIds = new Set();
    const syncTick = (tick, kind) => {
      const id = calendarTickId(tick, kind);
      nextTickIds.add(id);
      if (this.calendarTickIds.has(id)) this.timeline.setCustomTime(tick.date, id);
      else this.timeline.addCustomTime(tick.date, id);

      const component = this.timeline.customTimes?.find((item) => item.options?.id === id);
      const bar = component?.bar ?? this.container.querySelector(`.vis-custom-time.${id}`);
      if (!bar) return;
      bar.dataset.vcCalendarKind = kind;
      bar.dataset.absoluteDay = String(tick.absoluteDay);
      bar.dataset.unit = tick.unit;
      let label = bar.querySelector(':scope > .vc-calendar-time-label');
      if (kind === 'primary' && tick.label) {
        bar.dataset.vcCalendarLabel = tick.label;
        if (!label) {
          label = this.container.ownerDocument.createElement('span');
          label.className = 'vc-calendar-time-label';
          label.setAttribute('aria-hidden', 'true');
          bar.appendChild(label);
        }
        label.textContent = tick.label;
      } else {
        delete bar.dataset.vcCalendarLabel;
        label?.remove();
      }
      bar.setAttribute('aria-hidden', 'true');
      bar.setAttribute('title', '');
    };

    for (const tick of ticks.secondary) syncTick(tick, 'secondary');
    for (const tick of ticks.primary) syncTick(tick, 'primary');
    for (const id of this.calendarTickIds) {
      if (!nextTickIds.has(id)) this.timeline.removeCustomTime(id);
    }

    this.calendarTickIds = nextTickIds;
    this.calendarTickModelSignature = signature;
  }

  destroy() {
    if (this.calendarAxisFrame !== undefined) cancelAnimationFrame(this.calendarAxisFrame);
    this.calendarAxisFrame = undefined;
    for (const [eventName, handler] of this.calendarAxisSubscriptions) {
      this.timeline?.off(eventName, handler);
    }
    this.calendarAxisSubscriptions = [];
    this.calendarTickIds.clear();
    this.calendarTickModelSignature = '';
    this.refitButton?.remove();
    this.refitButton = undefined;
    this.timeline?.destroy();
    this.timeline = undefined;
    this.itemsDataSet = undefined;
    this.groupsDataSet = undefined;
    this.items = [];
  }
}
