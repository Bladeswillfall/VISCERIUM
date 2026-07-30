import { computeSafeFloatingPosition, getVisualViewportRect } from './floating-position.mjs';

const TRIGGER_SELECTOR = '[data-smart-tooltip]';
const BOUNDARY_SELECTOR = '[data-smart-tooltip-boundary]';
const DEFAULT_MAX_WIDTH = 304;

const tokens = (value) => String(value ?? '').split(/\s+/).filter(Boolean);

function parsePreference(trigger, attribute, fallback) {
  const values = String(trigger.getAttribute(attribute) ?? '')
    .split(/[\s,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
  return values.length > 0 ? values : fallback;
}

function triggerForTarget(root, target) {
  if (!(target instanceof Element)) return undefined;
  const trigger = target.closest(TRIGGER_SELECTOR);
  if (!trigger) return undefined;
  if (root instanceof Document || root.contains(trigger)) return trigger;
  return undefined;
}

/** Install one delegated, body-level tooltip surface for the supplied root. */
export function installSmartTooltips(root = document) {
  const doc = root instanceof Document ? root : root.ownerDocument;
  if (!doc?.body) return () => {};

  const tooltip = doc.createElement('div');
  const tooltipId = `codex-smart-tooltip-${Math.random().toString(36).slice(2, 10)}`;
  tooltip.id = tooltipId;
  tooltip.className = 'codex-smart-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  doc.body.append(tooltip);
  doc.documentElement.classList.add('smart-tooltips-ready');

  let activeTrigger;
  let previousDescribedBy;
  let descriptionLinked = false;
  let positionFrame;
  let revealFrame;
  let destroyed = false;
  const resizeObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(() => schedulePosition())
    : undefined;

  const position = () => {
    if (destroyed || !activeTrigger || tooltip.hidden) return;

    const viewportRect = getVisualViewportRect(doc.defaultView ?? window);
    const boundaryElement = activeTrigger.closest(BOUNDARY_SELECTOR);
    const boundaryRect = boundaryElement?.getBoundingClientRect();
    const safeArea = Number(activeTrigger.getAttribute('data-smart-tooltip-safe-area')) || 12;
    const boundaryWidth = boundaryRect
      ? Math.min(viewportRect.right, boundaryRect.right) - Math.max(viewportRect.left, boundaryRect.left)
      : viewportRect.width;
    const availableWidth = Math.max(120, Math.min(DEFAULT_MAX_WIDTH, viewportRect.width - safeArea * 2, boundaryWidth - safeArea * 2));

    tooltip.style.maxWidth = `${Math.round(availableWidth)}px`;
    const floatingRect = tooltip.getBoundingClientRect();
    const result = computeSafeFloatingPosition({
      anchorRect: activeTrigger.getBoundingClientRect(),
      floatingRect,
      viewportRect,
      boundaryRect,
      safeArea,
      gap: Number(activeTrigger.getAttribute('data-smart-tooltip-gap')) || 10,
      placements: parsePreference(activeTrigger, 'data-smart-tooltip-placement', ['top', 'bottom', 'right', 'left']),
      alignments: parsePreference(activeTrigger, 'data-smart-tooltip-align', ['center', 'start', 'end']),
    });

    tooltip.dataset.placement = result.placement;
    tooltip.dataset.alignment = result.alignment;
    tooltip.style.left = `${Math.round(result.x)}px`;
    tooltip.style.top = `${Math.round(result.y)}px`;
    tooltip.style.setProperty('--smart-tooltip-arrow-x', `${Math.round(result.arrowX)}px`);
    tooltip.style.setProperty('--smart-tooltip-arrow-y', `${Math.round(result.arrowY)}px`);
  };

  function schedulePosition() {
    if (destroyed || !activeTrigger || tooltip.hidden) return;
    cancelAnimationFrame(positionFrame);
    positionFrame = requestAnimationFrame(position);
  }

  const restoreDescription = () => {
    if (!activeTrigger || !descriptionLinked) return;
    if (previousDescribedBy === null) activeTrigger.removeAttribute('aria-describedby');
    else activeTrigger.setAttribute('aria-describedby', previousDescribedBy);
  };

  const hide = () => {
    cancelAnimationFrame(revealFrame);
    restoreDescription();
    resizeObserver?.disconnect();
    activeTrigger = undefined;
    previousDescribedBy = undefined;
    descriptionLinked = false;
    tooltip.classList.remove('is-visible');
    tooltip.hidden = true;
  };

  const show = (trigger) => {
    const content = trigger.getAttribute('data-smart-tooltip')?.trim();
    if (!content) {
      hide();
      return;
    }
    if (trigger === activeTrigger && !tooltip.hidden) return;

    hide();
    activeTrigger = trigger;
    previousDescribedBy = trigger.getAttribute('aria-describedby');
    const accessibleLabel = trigger.getAttribute('aria-label')?.trim();
    descriptionLinked = !accessibleLabel?.includes(content);
    if (descriptionLinked) {
      trigger.setAttribute('aria-describedby', [...new Set([...tokens(previousDescribedBy), tooltipId])].join(' '));
    }
    tooltip.textContent = content;
    tooltip.hidden = false;

    const computedStyle = getComputedStyle(trigger);
    const accent = computedStyle.getPropertyValue('--smart-tooltip-accent').trim()
      || computedStyle.getPropertyValue('--era-primer-accent').trim();
    if (accent) tooltip.style.setProperty('--smart-tooltip-accent', accent);
    else tooltip.style.removeProperty('--smart-tooltip-accent');

    resizeObserver?.observe(trigger);
    resizeObserver?.observe(tooltip);
    position();
    revealFrame = requestAnimationFrame(() => tooltip.classList.add('is-visible'));
  };

  const handlePointerOver = (event) => {
    if (event.pointerType === 'touch') return;
    const trigger = triggerForTarget(root, event.target);
    if (trigger) show(trigger);
  };

  const handlePointerOut = (event) => {
    if (!activeTrigger || !(event.target instanceof Node) || !activeTrigger.contains(event.target)) return;
    if (event.relatedTarget instanceof Node && activeTrigger.contains(event.relatedTarget)) return;
    hide();
  };

  const handleFocusIn = (event) => {
    const trigger = triggerForTarget(root, event.target);
    if (trigger) show(trigger);
  };

  const handleFocusOut = (event) => {
    if (!activeTrigger || !(event.target instanceof Node) || !activeTrigger.contains(event.target)) return;
    if (event.relatedTarget instanceof Node && activeTrigger.contains(event.relatedTarget)) return;
    hide();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && activeTrigger) {
      const trigger = activeTrigger;
      hide();
      trigger.focus?.({ preventScroll: true });
    }
  };

  root.addEventListener('pointerover', handlePointerOver, true);
  root.addEventListener('pointerout', handlePointerOut, true);
  root.addEventListener('focusin', handleFocusIn, true);
  root.addEventListener('focusout', handleFocusOut, true);
  root.addEventListener('keydown', handleKeyDown, true);
  doc.defaultView?.addEventListener('scroll', schedulePosition, true);
  doc.defaultView?.addEventListener('resize', schedulePosition);
  doc.defaultView?.visualViewport?.addEventListener('resize', schedulePosition);
  doc.defaultView?.visualViewport?.addEventListener('scroll', schedulePosition);

  return () => {
    destroyed = true;
    cancelAnimationFrame(positionFrame);
    cancelAnimationFrame(revealFrame);
    restoreDescription();
    resizeObserver?.disconnect();
    root.removeEventListener('pointerover', handlePointerOver, true);
    root.removeEventListener('pointerout', handlePointerOut, true);
    root.removeEventListener('focusin', handleFocusIn, true);
    root.removeEventListener('focusout', handleFocusOut, true);
    root.removeEventListener('keydown', handleKeyDown, true);
    doc.defaultView?.removeEventListener('scroll', schedulePosition, true);
    doc.defaultView?.removeEventListener('resize', schedulePosition);
    doc.defaultView?.visualViewport?.removeEventListener('resize', schedulePosition);
    doc.defaultView?.visualViewport?.removeEventListener('scroll', schedulePosition);
    tooltip.remove();
    doc.documentElement.classList.remove('smart-tooltips-ready');
  };
}
