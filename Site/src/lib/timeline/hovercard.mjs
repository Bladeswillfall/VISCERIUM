import { formatAbsoluteDay } from '../calendar/runtime.mjs';

function normaliseVisibleText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function formatEventDate(event, calendarId) {
  const start = formatAbsoluteDay(event.absoluteStartDay, calendarId, event.precision);
  if (event.absoluteEndDay === undefined) return start;
  return `${start} — ${formatAbsoluteDay(
    event.absoluteEndDay,
    calendarId,
    event.endPrecision ?? event.precision,
  )}`;
}

/**
 * Install the original VISCERIUM body-level timeline hovercard.
 *
 * vis-timeline still owns item geometry, selection and interaction. This helper
 * owns only the single hover presentation so browser title bubbles and the
 * native vis tooltip cannot appear alongside it.
 */
export function installTimelineHovercard(root, dataset) {
  const events = dataset?.events ?? [];
  const eventById = new Map(events.map((event) => [event.id, event]));
  const eventByTitle = new Map(events.map((event) => [event.title, event]));
  const eventsByLongestTitle = [...events].sort((left, right) => right.title.length - left.title.length);
  const calendarSelect = root.querySelector('[data-vc-calendar]');
  const tooltip = document.createElement('div');
  const tooltipId = `vc-timeline-hovercard-${Math.random().toString(36).slice(2, 10)}`;

  tooltip.id = tooltipId;
  tooltip.className = 'vis-tooltip vc-timeline-hovercard';
  tooltip.hidden = true;
  tooltip.setAttribute('role', 'tooltip');
  tooltip.innerHTML = `
    <span class="vc-timeline-hovercard-date"></span>
    <strong class="vc-timeline-hovercard-title"></strong>
    <span class="vc-timeline-hovercard-description"></span>`;
  document.body.append(tooltip);

  const dateElement = tooltip.querySelector('.vc-timeline-hovercard-date');
  const titleElement = tooltip.querySelector('.vc-timeline-hovercard-title');
  const descriptionElement = tooltip.querySelector('.vc-timeline-hovercard-description');
  let activeItem;
  let activeEvent;
  let positionFrame;
  let destroyed = false;

  const itemForTarget = (target) => target?.closest?.('.vis-item.vc-timeline-item');

  const eventForItem = (item) => {
    const id = item?.getAttribute?.('data-id');
    if (id && eventById.has(id)) return eventById.get(id);

    const visibleTitle = normaliseVisibleText(item?.textContent);
    if (!visibleTitle) return undefined;
    return eventByTitle.get(visibleTitle)
      ?? eventsByLongestTitle.find((event) => visibleTitle.includes(event.title));
  };

  const stripNativeTitle = (element) => {
    const item = element?.matches?.('.vis-item.vc-timeline-item')
      ? element
      : element?.closest?.('.vis-item.vc-timeline-item');
    if (!item) return;
    item.removeAttribute('title');
    item.querySelectorAll('[title]').forEach((child) => child.removeAttribute('title'));
  };

  const stripAllNativeTitles = () => {
    root.querySelectorAll('.vis-item.vc-timeline-item[title], .vis-item.vc-timeline-item [title]')
      .forEach(stripNativeTitle);
  };

  const position = () => {
    if (destroyed || !activeItem || tooltip.hidden) return;
    const itemRect = activeItem.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportPadding = 8;
    const gap = 10;
    const maximumLeft = Math.max(viewportPadding, window.innerWidth - tooltipRect.width - viewportPadding);
    const left = Math.min(
      maximumLeft,
      Math.max(viewportPadding, itemRect.left + itemRect.width / 2 - tooltipRect.width / 2),
    );
    let top = itemRect.top - tooltipRect.height - gap;
    if (top < viewportPadding) {
      top = Math.min(
        window.innerHeight - tooltipRect.height - viewportPadding,
        itemRect.bottom + gap,
      );
    }
    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.max(viewportPadding, Math.round(top))}px`;
  };

  const schedulePosition = () => {
    window.cancelAnimationFrame(positionFrame);
    positionFrame = window.requestAnimationFrame(position);
  };

  const hide = () => {
    activeItem?.removeAttribute('aria-describedby');
    activeItem = undefined;
    activeEvent = undefined;
    tooltip.hidden = true;
  };

  const show = (item) => {
    const event = eventForItem(item);
    if (!event) {
      hide();
      return;
    }

    activeItem?.removeAttribute('aria-describedby');
    activeItem = item;
    activeEvent = event;
    stripNativeTitle(item);

    const calendarId = calendarSelect?.value ?? dataset.defaultCalendar;
    dateElement.textContent = formatEventDate(event, calendarId);
    titleElement.textContent = event.title;
    descriptionElement.textContent = event.description;
    tooltip.dataset.vcEventId = event.id;
    activeItem.setAttribute('aria-describedby', tooltipId);
    tooltip.hidden = false;
    schedulePosition();

    // Chronos emits its itemover bridge during the same pointer turn. Strip any
    // title it writes before the browser can open a second native title bubble.
    queueMicrotask(() => stripNativeTitle(activeItem));
  };

  const handlePointerOver = (event) => {
    const item = itemForTarget(event.target);
    if (!item || item === activeItem) return;
    show(item);
  };

  const handlePointerOut = (event) => {
    if (!activeItem) return;
    const nextItem = itemForTarget(event.relatedTarget);
    if (nextItem === activeItem) return;
    hide();
  };

  const handleFocusIn = (event) => {
    const item = itemForTarget(event.target);
    if (item) show(item);
  };

  const handleFocusOut = (event) => {
    const nextItem = itemForTarget(event.relatedTarget);
    if (nextItem === activeItem) return;
    hide();
  };

  const handleCalendarChange = () => {
    if (activeItem && activeEvent) show(activeItem);
  };

  const titleObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') stripNativeTitle(mutation.target);
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;
          stripNativeTitle(node);
          node.querySelectorAll?.('.vis-item.vc-timeline-item[title], .vis-item.vc-timeline-item [title]')
            .forEach(stripNativeTitle);
        }
      }
    }
  });
  titleObserver.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['title'],
  });

  stripAllNativeTitles();
  root.addEventListener('pointerover', handlePointerOver, true);
  root.addEventListener('pointerout', handlePointerOut, true);
  root.addEventListener('focusin', handleFocusIn, true);
  root.addEventListener('focusout', handleFocusOut, true);
  calendarSelect?.addEventListener('change', handleCalendarChange);
  window.addEventListener('scroll', schedulePosition, true);
  window.addEventListener('resize', schedulePosition);

  return () => {
    destroyed = true;
    window.cancelAnimationFrame(positionFrame);
    titleObserver.disconnect();
    root.removeEventListener('pointerover', handlePointerOver, true);
    root.removeEventListener('pointerout', handlePointerOut, true);
    root.removeEventListener('focusin', handleFocusIn, true);
    root.removeEventListener('focusout', handleFocusOut, true);
    calendarSelect?.removeEventListener('change', handleCalendarChange);
    window.removeEventListener('scroll', schedulePosition, true);
    window.removeEventListener('resize', schedulePosition);
    activeItem?.removeAttribute('aria-describedby');
    tooltip.remove();
  };
}
