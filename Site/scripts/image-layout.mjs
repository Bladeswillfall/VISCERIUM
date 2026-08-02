const ALIGNMENTS = new Set(['left', 'right', 'center', 'wide', 'full']);
const SHAPE_FLAGS = new Set(['shape', 'contour']);
const MAX_IMAGE_WIDTH = 2400;
const MAX_IMAGE_GAP = 96;

function clampInteger(value, minimum, maximum) {
  const number = Number(value);
  if (!Number.isInteger(number)) return undefined;
  return Math.min(maximum, Math.max(minimum, number));
}

function escapeAttribute(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function safeClassToken(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9_-]+/g, '');
}

export function parseObsidianImageEmbed(rawSpec) {
  const parts = String(rawSpec ?? '').split('|').map((part) => part.trim());
  const target = parts.shift() ?? '';
  const issues = [];
  const altParts = [];
  let alignment;
  let width;
  let gap;
  let shape = false;
  let explicitAlt;

  for (const token of parts.filter(Boolean)) {
    const lower = token.toLowerCase();

    if (ALIGNMENTS.has(lower)) {
      if (alignment && alignment !== lower) issues.push(`multiple image alignments were supplied; using ${lower}`);
      alignment = lower;
      continue;
    }

    if (SHAPE_FLAGS.has(lower)) {
      shape = true;
      continue;
    }

    if (/^\d{1,4}$/.test(lower)) {
      width = clampInteger(lower, 1, MAX_IMAGE_WIDTH);
      continue;
    }

    const gapMatch = lower.match(/^gap=(\d{1,3})$/);
    if (gapMatch) {
      gap = clampInteger(gapMatch[1], 0, MAX_IMAGE_GAP);
      continue;
    }

    if (/^alt=/i.test(token)) {
      explicitAlt = token.slice(token.indexOf('=') + 1).trim();
      continue;
    }

    altParts.push(token);
  }

  if (!alignment && width) alignment = 'center';
  if (shape && !['left', 'right'].includes(alignment)) {
    issues.push('shape wrapping requires left or right alignment; rectangular layout will be used');
    shape = false;
  }

  const alt = explicitAlt || altParts.join(' | ') || undefined;
  const hasLayout = Boolean(alignment || width || gap !== undefined || shape);

  return {
    target,
    alignment,
    width,
    gap,
    shape,
    alt,
    hasLayout,
    issues,
  };
}

export function renderArticleImage({ spec, filename, url, href }) {
  const alignment = ALIGNMENTS.has(spec?.alignment) ? spec.alignment : 'center';
  const classes = ['vc-image-embed', `vc-image-${safeClassToken(alignment)}`];
  const styles = [];

  if (spec?.shape) classes.push('vc-image-shape');
  if (spec?.width) styles.push(`--vc-image-width:${spec.width}px`);
  if (spec?.gap !== undefined) styles.push(`--vc-image-gap:${spec.gap}px`);
  if (spec?.shape) styles.push(`--vc-image-shape:url(&quot;${escapeAttribute(url)}&quot;)`);

  const styleAttribute = styles.length ? ` style="${styles.join(';')}"` : '';
  const alt = escapeAttribute(spec?.alt || filename);
  const image = `<img src="${escapeAttribute(url)}" alt="${alt}" loading="lazy" decoding="async">`;
  const content = href
    ? `<a href="${escapeAttribute(href)}" class="vc-image-link">${image}</a>`
    : image;

  return `<figure class="${classes.join(' ')}"${styleAttribute}>${content}</figure>`;
}
