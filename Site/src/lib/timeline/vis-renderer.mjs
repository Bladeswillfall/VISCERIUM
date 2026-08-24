import { DataSet, Timeline } from 'vis-timeline/standalone';
import { timelineMessage } from './i18n.mjs';

function stage(dataSet, values) {
  const nextIds = new Set(values.map((item) => item.id));
  const removed = dataSet.getIds().filter((id) => !nextIds.has(id));
  if (values.length) dataSet.update(values);
  return removed;
}

function tickId(tick, kind) {
  return `vc-calendar-${kind}-${tick.unit}-${tick.absoluteDay < 0 ? 'n' : 'p'}${Math.abs(tick.absoluteDay)}`;
}

function tickSignature(ticks) {
  return [
    ticks.scaleKey,
    ...ticks.secondary.map((tick) => `${tickId(tick, 'secondary')}:${tick.date.valueOf()}`),
    ...ticks.primary.map((tick) => `${tickId(tick, 'primary')}:${tick.date.valueOf()}:${tick.label ?? ''}`),
  ].join('|');
}

function refitIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5M8 12h8M12 8v8"
        fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </svg>`;
}

export function createTimelineCanvas({ container, model, axis, messages, direction, compact, maximumDays }) {
  if (!container) throw new Error('Timeline canvas requires a container.');

  container.classList.add('viscerium-timeline-container');
  const items = new DataSet(model.items);
  const groups = new DataSet(model.groups);
  const timeline = new Timeline(container, items, groups, {
    align: direction === 'rtl' ? 'right' : 'left',
    rtl: direction === 'rtl',
    clickToUse: false,
    height: compact ? '22rem' : '24rem',
    minHeight: '20rem',
    maxHeight: '40rem',
    zoomKey: 'ctrlKey',
    zoomMin: 86_400_000,
    zoomMax: Math.max(86_400_000, maximumDays * 86_400_000),
    zoomable: true,
    moveable: true,
    selectable: true,
    multiselect: false,
    orientation: { axis: 'bottom', item: 'top' },
    groupHeightMode: 'fitItems',
    stack: true,
    stackSubgroups: true,
    showCurrentTime: false,
    horizontalScroll: true,
    verticalScroll: true,
    margin: { item: { horizontal: 8, vertical: 5 }, axis: 8 },
    format: {
      minorLabels: (date, scale, step) => axis.formatMinorLabel?.(date, scale, step) ?? '',
      majorLabels: (date, scale, step) => axis.formatMajorLabel?.(date, scale, step) ?? '',
    },
    tooltip: { followMouse: true, overflowMethod: 'cap' },
  });

  const queue = { delay: null, max: Number.POSITIVE_INFINITY };
  items.setOptions({ queue });
  groups.setOptions({ queue });

  const button = container.ownerDocument.createElement('button');
  button.type = 'button';
  button.className = 'vc-timeline-refit-button';
  button.setAttribute('aria-label', timelineMessage(messages, 'fitAllLabel'));
  button.title = timelineMessage(messages, 'fitAll');
  button.innerHTML = refitIcon();
  button.addEventListener('click', () => timeline.fit({ animation: true }));
  container.append(button);

  let axisFrame;
  let axisSignature = '';
  let tickIds = new Set();

  const syncAxis = () => {
    const width = container.querySelector('.vis-panel.vis-center')?.getBoundingClientRect().width ?? 0;
    if (width <= 0) return;
    const range = timeline.getWindow();
    const ticks = axis.getTicks({ start: range.start, end: range.end, width });
    const signature = tickSignature(ticks);
    if (signature === axisSignature) return;

    const nextIds = new Set();
    const syncTick = (tick, kind) => {
      const id = tickId(tick, kind);
      nextIds.add(id);
      if (tickIds.has(id)) timeline.setCustomTime(tick.date, id);
      else timeline.addCustomTime(tick.date, id);

      const component = timeline.customTimes?.find((item) => item.options?.id === id);
      const bar = component?.bar ?? container.querySelector(`.vis-custom-time.${id}`);
      if (!bar) return;
      bar.dataset.vcCalendarKind = kind;
      bar.dataset.absoluteDay = String(tick.absoluteDay);
      bar.dataset.unit = tick.unit;
      let label = bar.querySelector(':scope > .vc-calendar-time-label');
      if (kind === 'primary' && tick.label) {
        bar.dataset.vcCalendarLabel = tick.label;
        if (!label) {
          label = container.ownerDocument.createElement('span');
          label.className = 'vc-calendar-time-label';
          label.setAttribute('aria-hidden', 'true');
          bar.append(label);
        }
        label.textContent = tick.label;
      } else {
        delete bar.dataset.vcCalendarLabel;
        label?.remove();
      }
      bar.setAttribute('aria-hidden', 'true');
      bar.removeAttribute('title');
    };

    for (const tick of ticks.secondary) syncTick(tick, 'secondary');
    for (const tick of ticks.primary) syncTick(tick, 'primary');
    for (const id of tickIds) if (!nextIds.has(id)) timeline.removeCustomTime(id);
    tickIds = nextIds;
    axisSignature = signature;
  };

  const scheduleAxis = () => {
    cancelAnimationFrame(axisFrame);
    axisFrame = requestAnimationFrame(syncAxis);
  };
  timeline.on('rangechanged', scheduleAxis);
  scheduleAxis();

  return {
    timeline,
    update(nextModel) {
      const removedGroups = stage(groups, nextModel.groups);
      groups.flush?.();
      const removedItems = stage(items, nextModel.items);
      if (removedItems.length) items.remove(removedItems);
      items.flush?.();
      if (removedGroups.length) groups.remove(removedGroups);
      groups.flush?.();
      timeline.redraw();
    },
    redraw() {
      timeline.redraw();
      axis.resetScale?.();
      axisSignature = '';
      scheduleAxis();
    },
    destroy() {
      cancelAnimationFrame(axisFrame);
      timeline.off('rangechanged', scheduleAxis);
      button.remove();
      timeline.destroy();
    },
  };
}
