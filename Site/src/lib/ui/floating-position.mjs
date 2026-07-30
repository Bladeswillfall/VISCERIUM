const DEFAULT_PLACEMENTS = ['top', 'bottom', 'right', 'left'];
const DEFAULT_ALIGNMENTS = ['center', 'start', 'end'];

const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), Math.max(minimum, maximum));

function normaliseRect(rect) {
  const left = finite(rect?.left ?? rect?.x);
  const top = finite(rect?.top ?? rect?.y);
  const explicitWidth = Number(rect?.width);
  const explicitHeight = Number(rect?.height);
  const right = finite(rect?.right, left + (Number.isFinite(explicitWidth) ? explicitWidth : 0));
  const bottom = finite(rect?.bottom, top + (Number.isFinite(explicitHeight) ? explicitHeight : 0));
  const width = Number.isFinite(explicitWidth) ? explicitWidth : Math.max(0, right - left);
  const height = Number.isFinite(explicitHeight) ? explicitHeight : Math.max(0, bottom - top);

  return {
    left,
    top,
    right: Number.isFinite(Number(rect?.right)) ? right : left + width,
    bottom: Number.isFinite(Number(rect?.bottom)) ? bottom : top + height,
    width,
    height,
  };
}

function normaliseInsets(value) {
  if (typeof value === 'number') {
    return { top: value, right: value, bottom: value, left: value };
  }

  return {
    top: finite(value?.top),
    right: finite(value?.right),
    bottom: finite(value?.bottom),
    left: finite(value?.left),
  };
}

function intersectRects(first, second) {
  if (!second) return first;
  const left = Math.max(first.left, second.left);
  const top = Math.max(first.top, second.top);
  const right = Math.min(first.right, second.right);
  const bottom = Math.min(first.bottom, second.bottom);

  if (right <= left || bottom <= top) return first;
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function insetRect(rect, insets) {
  const left = rect.left + insets.left;
  const top = rect.top + insets.top;
  const right = rect.right - insets.right;
  const bottom = rect.bottom - insets.bottom;

  if (right <= left || bottom <= top) return rect;
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function candidateCoordinates(anchor, floating, placement, alignment, gap) {
  const anchorCenterX = anchor.left + anchor.width / 2;
  const anchorCenterY = anchor.top + anchor.height / 2;
  let x;
  let y;

  if (placement === 'top' || placement === 'bottom') {
    x = alignment === 'start'
      ? anchor.left
      : alignment === 'end'
        ? anchor.right - floating.width
        : anchorCenterX - floating.width / 2;
    y = placement === 'top'
      ? anchor.top - floating.height - gap
      : anchor.bottom + gap;
  } else {
    x = placement === 'left'
      ? anchor.left - floating.width - gap
      : anchor.right + gap;
    y = alignment === 'start'
      ? anchor.top
      : alignment === 'end'
        ? anchor.bottom - floating.height
        : anchorCenterY - floating.height / 2;
  }

  return { x, y };
}

function overflowFor(candidate, floating, bounds) {
  return {
    left: Math.max(0, bounds.left - candidate.x),
    right: Math.max(0, candidate.x + floating.width - bounds.right),
    top: Math.max(0, bounds.top - candidate.y),
    bottom: Math.max(0, candidate.y + floating.height - bounds.bottom),
  };
}

function totalOverflow(overflow) {
  return overflow.left + overflow.right + overflow.top + overflow.bottom;
}

/**
 * Place a floating surface inside the intersection of the viewport and an
 * optional component boundary. It tries centred placement first, then start
 * and end alignment, before flipping sides. This makes the common case feel
 * stable while still avoiding clipped edge tooltips.
 */
export function computeSafeFloatingPosition({
  anchorRect,
  floatingRect,
  viewportRect,
  boundaryRect,
  safeArea = 8,
  gap = 10,
  placements = DEFAULT_PLACEMENTS,
  alignments = DEFAULT_ALIGNMENTS,
} = {}) {
  const anchor = normaliseRect(anchorRect);
  const floating = normaliseRect(floatingRect);
  const viewport = normaliseRect(viewportRect);
  const boundary = boundaryRect ? normaliseRect(boundaryRect) : undefined;
  const bounds = insetRect(intersectRects(viewport, boundary), normaliseInsets(safeArea));
  const usablePlacements = placements.filter((placement) => DEFAULT_PLACEMENTS.includes(placement));
  const usableAlignments = alignments.filter((alignment) => DEFAULT_ALIGNMENTS.includes(alignment));
  const candidatePlacements = usablePlacements.length > 0 ? usablePlacements : DEFAULT_PLACEMENTS;
  const candidateAlignments = usableAlignments.length > 0 ? usableAlignments : DEFAULT_ALIGNMENTS;
  let best;

  candidatePlacements.forEach((placement, placementIndex) => {
    candidateAlignments.forEach((alignment, alignmentIndex) => {
      const coordinates = candidateCoordinates(anchor, floating, placement, alignment, gap);
      const overflow = overflowFor(coordinates, floating, bounds);
      const score = totalOverflow(overflow) * 1_000 + placementIndex * 10 + alignmentIndex;
      const candidate = { ...coordinates, placement, alignment, overflow, score };
      if (!best || candidate.score < best.score) best = candidate;
    });
  });

  const maximumX = Math.max(bounds.left, bounds.right - floating.width);
  const maximumY = Math.max(bounds.top, bounds.bottom - floating.height);
  const x = clamp(best?.x ?? bounds.left, bounds.left, maximumX);
  const y = clamp(best?.y ?? bounds.top, bounds.top, maximumY);
  const arrowInset = Math.min(16, floating.width / 2, floating.height / 2);
  const arrowX = clamp(anchor.left + anchor.width / 2 - x, arrowInset, floating.width - arrowInset);
  const arrowY = clamp(anchor.top + anchor.height / 2 - y, arrowInset, floating.height - arrowInset);

  return {
    x,
    y,
    placement: best?.placement ?? 'top',
    alignment: best?.alignment ?? 'center',
    arrowX,
    arrowY,
    bounds,
    overflow: best?.overflow ?? { left: 0, right: 0, top: 0, bottom: 0 },
  };
}

export function getVisualViewportRect(view = window) {
  const visualViewport = view.visualViewport;
  const left = finite(visualViewport?.offsetLeft);
  const top = finite(visualViewport?.offsetTop);
  const width = finite(visualViewport?.width, view.innerWidth);
  const height = finite(visualViewport?.height, view.innerHeight);
  return { left, top, right: left + width, bottom: top + height, width, height };
}
