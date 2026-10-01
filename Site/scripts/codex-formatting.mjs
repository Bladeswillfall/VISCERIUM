import { escapeHtml } from '../src/lib/codex-paths.mjs';
import { renderIconMarkup } from '../src/lib/icon-spec.mjs';

const CONTAINERS = {
  cols: ['div', 'cx-cols'],
  row: ['div', 'cx-row'],
  col: ['div', 'cx-col'],
  card: ['div', 'cx-card'],
  equation: ['section', 'cx-equation'],
};
const ASIDES = { note: 'note', warning: 'caution', lore: 'note' };
const TAGS = new Set([...Object.keys(CONTAINERS), ...Object.keys(ASIDES), 'artifact']);
const ARTIFACT_PRESETS = new Set(['citadel-note', 'smog-dispatch', 'nearsight-terminal', 'entropy-diagnostic']);
const GAP = { none: '0', xs: '.35rem', sm: '.65rem', md: '1rem', lg: '1.5rem', xl: '2.25rem' };
const ALIGN = new Set(['start', 'center', 'end', 'stretch']);
const JUSTIFY = new Set(['start', 'center', 'end', 'between', 'around', 'evenly']);
const CARD_VARIANTS = new Set(['plain', 'accent', 'muted', 'warning', 'danger', 'success']);
const INLINE_CONTAINER_TAG_RE = /\[\/?(?:cols|row|col|card|equation)(?:(?::|\s+)[^\]]*)?\]/gi;
const CONTAINER_AT_START_RE = /^\s*\[\/?(?:cols|row|col|card|equation)(?:(?::|\s+)[^\]]*)?\]/i;
const CONTAINER_CLOSE_AT_END_RE = /(?:\[\/(?:cols|row|col|card|equation)\]\s*)+$/i;

function tokens(spec) {
  return String(spec ?? '').trim().split(/\s+/).filter(Boolean);
}

function attributes(classes, styles, jsx) {
  const className = jsx ? 'className' : 'class';
  const uniqueClasses = [...new Set(classes.filter(Boolean))];
  const output = [`${className}="${uniqueClasses.join(' ')}"`];
  if (!Object.keys(styles).length) return output.join(' ');

  if (jsx) output.push(`style={${JSON.stringify(styles)}}`);
  else output.push(`style="${Object.entries(styles).map(([key, value]) => `${key}:${escapeHtml(value)}`).join(';')}"`);
  return output.join(' ');
}

function titleFrom(spec) {
  const match = String(spec).match(/\btitle=(?:"([^"]*)"|'([^']*)'|([^\s]+))/i);
  return match?.slice(1).find((value) => value !== undefined);
}

function layoutOptions(spec) {
  const classes = [];
  const styles = {};
  for (const token of tokens(spec)) {
    const lower = token.toLowerCase();
    const [key, value = ''] = lower.split('=', 2);
    if (key === 'gap' && GAP[value]) styles['--cx-gap'] = GAP[value];
    else if (key === 'align' && ALIGN.has(value)) classes.push(`cx-align-${value}`);
    else if (key === 'justify' && JUSTIFY.has(value)) classes.push(`cx-justify-${value}`);
    else if (['compact', 'bleed', 'center'].includes(key)) classes.push(`cx-${key}`);
  }
  return { classes, styles };
}

function containerOptions(tag, spec) {
  const [element, baseClasses] = CONTAINERS[tag];
  const classes = baseClasses.split(' ');
  const styles = {};

  if (tag === 'cols' || tag === 'row') {
    const layout = layoutOptions(spec);
    classes.push(...layout.classes);
    Object.assign(styles, layout.styles);
  }

  if (tag === 'cols') {
    const ratio = tokens(spec).find((token) => /^\d+(?:-\d+){1,5}$/.test(token));
    if (ratio) styles['--cx-columns'] = ratio.split('-').map((part) => `${Number(part)}fr`).join(' ');
  }

  if (tag === 'col') {
    for (const token of tokens(spec)) {
      const lower = token.toLowerCase();
      if (/^(?:[1-9]|1[0-2])$/.test(lower)) styles['--cx-span'] = lower;

      const span = lower.match(/^(sm|md|lg|xl):([1-9]|1[0-2])$/);
      if (span) styles[`--cx-${span[1]}-span`] = span[2];

      const order = lower.match(/^order(?:-(sm|md|lg|xl))?[-:]([1-9]|1[0-2])$/);
      if (order) styles[order[1] ? `--cx-${order[1]}-order` : '--cx-order'] = order[2];

      const self = lower.match(/^align=(start|center|end|stretch)$/);
      if (self) styles['--cx-self'] = self[1];
    }
  }

  if (tag === 'card') {
    for (const token of tokens(spec)) {
      const lower = token.toLowerCase();
      if (CARD_VARIANTS.has(lower)) classes.push(`cx-card-${lower}`);
      if (lower === 'compact') classes.push('cx-card-compact');
    }
  }

  if (tag === 'equation' && tokens(spec).includes('compact')) classes.push('cx-equation-compact');
  return { element, classes, styles };
}

function artifactOptions(spec) {
  const [rawPreset, ...rest] = tokens(spec);
  const preset = rawPreset?.toLowerCase();
  if (!ARTIFACT_PRESETS.has(preset)) throw new Error('Unknown artifact preset: ' + (rawPreset ?? '(missing)'));
  const options = { 'data-preset': preset };
  for (const match of rest.join(' ').matchAll(/([a-z][a-z-]*)=(?:"([^"]*)"|'([^']*)'|([^\s]+))/gi)) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    if (name === 'title' || name === 'date') options['data-' + name] = value;
    if (name === 'condition' && ['archive', 'field', 'battered'].includes(value)) options['data-condition'] = value;
    if (name === 'hand' && ['copy', 'field', 'urgent'].includes(value)) options['data-hand'] = value;
    if (name === 'ink' && ['fresh', 'worn', 'feathered'].includes(value)) options['data-ink'] = value;
  }
  return Object.entries(options).map(([key, val]) => key + '="' + escapeHtml(val) + '"').join(' ');
}

// Inline marginalia stays with the text it annotates. Nested annotations are rejected.
function expandMarginalia(line, notes, jsx) {
  const attr = jsx ? 'className' : 'class';
  return line.replace(/\[marginalia\s+note=(?:"([^"]+)"|'([^']+)')\]|\[\/marginalia\]/gi, (match, double, single) => {
    if (/^\[\/marginalia/i.test(match)) {
      const note = notes.pop();
      if (note === undefined) throw new Error('Unmatched [/marginalia] inside artifact');
      return '</span><span ' + attr + '="cx-artifact-source-note">[Marginal note: ' + escapeHtml(note) + ']</span>';
    }
    if (notes.length) throw new Error('Nested marginalia are not supported');
    const note = double ?? single;
    notes.push(note);
    return '<span ' + attr + '="cx-artifact-anchor" data-note="' + escapeHtml(note) + '">';
  });
}

function parseTag(line) {
  const match = line.match(/^\s*\[(\/)?([a-z][a-z0-9-]*)(?:(?::|\s+)([^\]]*))?\]\s*$/i);
  if (!match) return null;
  const tag = match[2].toLowerCase();
  return TAGS.has(tag) ? { closing: Boolean(match[1]), tag, spec: match[3] ?? '' } : null;
}

function expandInlineContainerTags(line) {
  const source = String(line ?? '');
  if (!CONTAINER_AT_START_RE.test(source) && !CONTAINER_CLOSE_AT_END_RE.test(source)) return [source];

  const parts = [];
  let cursor = 0;
  for (const match of source.matchAll(INLINE_CONTAINER_TAG_RE)) {
    if (match.index > cursor) parts.push(source.slice(cursor, match.index));
    parts.push(match[0]);
    cursor = match.index + match[0].length;
  }
  if (cursor < source.length) parts.push(source.slice(cursor));
  return parts.filter((part) => part.length > 0);
}

function transformTag(line, stack, options) {
  const parsed = parseTag(line);
  if (!parsed) return null;

  if (parsed.closing) {
    if (stack.at(-1) !== parsed.tag) return null;
    stack.pop();
    if (parsed.tag === 'artifact') return '\n</div>\n</section>';
    return ASIDES[parsed.tag] ? ':::' : `\n</${CONTAINERS[parsed.tag][0]}>`;
  }

  stack.push(parsed.tag);
  if (parsed.tag === 'artifact') {
    const classAttr = options.jsx ? 'className' : 'class';
    return '<section ' + classAttr + '="cx-artifact" ' + artifactOptions(parsed.spec) + '>\n<div ' + classAttr + '="cx-artifact-source">\n';
  }
  const aside = ASIDES[parsed.tag];
  if (aside) {
    const title = titleFrom(parsed.spec)?.replace(/[\[\]]/g, '');
    return `:::${aside}${title ? `[${title}]` : ''}`;
  }

  const { element, classes, styles } = containerOptions(parsed.tag, parsed.spec);
  const title = titleFrom(parsed.spec);
  const titleMarkup = parsed.tag === 'equation' && title
    ? `\n\n<p ${attributes(['cx-equation-title'], {}, options.jsx)}>${escapeHtml(title)}</p>\n`
    : '\n';
  return `<${element} ${attributes(classes, styles, options.jsx)}>${titleMarkup}`;
}

function transformHeading(line, options) {
  const match = line.match(/^(\s{0,3}#{1,6}\s+)\[icon:([^\]]+)\]\s+(.+)$/i);
  if (!match) return null;
  const icon = renderIconMarkup(match[2], { jsx: options.jsx, className: 'codex-heading-icon' });
  return icon ? `${match[1]}${icon} ${match[3]}` : null;
}

export function requiresCodexMdx(markdown) {
  return /^\s*\[\/?(?:cols|row|col|card|equation|artifact)(?::|\s|\])/im.test(String(markdown));
}

export function transformCodexFormatting(markdown, options = {}) {
  const output = [];
  const stack = [];
  const notes = [];
  let fence;

  for (const line of String(markdown).split(/\r?\n/)) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      output.push(line);
      if (marker?.[1][0] === fence.marker && marker[1].length >= fence.length) fence = undefined;
      continue;
    }
    if (marker) {
      fence = { marker: marker[1][0], length: marker[1].length };
      output.push(line);
      continue;
    }

    for (const logicalLine of expandInlineContainerTags(line)) {
      const converted = transformHeading(logicalLine, options) ?? transformTag(logicalLine, stack, options);
      if (converted?.includes('</section>') && notes.length) throw new Error('Unclosed marginalia inside artifact');
      output.push(converted ?? (stack.includes('artifact') ? expandMarginalia(logicalLine, notes, options.jsx) : logicalLine));
    }
  }

  if (notes.length) throw new Error('Unclosed marginalia');
  return output.join('\n');
}
