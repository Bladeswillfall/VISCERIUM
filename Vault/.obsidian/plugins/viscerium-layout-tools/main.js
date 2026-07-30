const { MarkdownView, Notice, Plugin } = require('obsidian');

const INDENT_CALLOUT = 'vc-indent';
const INDENT_MARKER_CLASS = 'vc-layout-indent-marker';
const RENDERED_INDENT_CLASS = 'vc-layout-indent-rendered';
const RENDERED_COLUMNS_CLASS = 'vc-layout-cols-rendered';
const RENDERED_COLUMN_CLASS = 'vc-layout-col-rendered';
const INDENT_MARKER = `<span class="${INDENT_MARKER_CLASS}" aria-hidden="true" hidden></span>`;
const INDENT_HEADER_RE = /^(?:\s*>\s*)+\[!vc-indent\](?:[-+])?(?:\s+<span class="vc-layout-indent-marker" aria-hidden="true"(?: hidden)?><\/span>)?\s*$/;
const LEGACY_INDENT_HEADER_RE = /^(\s*(?:>\s*)+)\[!vc-indent\][-+]\s*(?:<span class="vc-layout-indent-marker" aria-hidden="true"><\/span>)?\s*$/;
const INDENT_MARKER_RE = /^(?:\s*>\s*)+<span class="vc-layout-indent-marker" aria-hidden="true"(?: hidden)?><\/span>\s*$/;
const INDENT_LABEL_RE = /^\[!vc-indent\](?:[-+])?$/;
const LAYOUT_TAG_RE = /^\[(\/)?(cols|col)(?:(?::|\s+)([^\]]*))?\]$/i;
const LAYOUT_GAPS = { none: '0', xs: '.35rem', sm: '.65rem', md: '1rem', lg: '1.5rem', xl: '2.25rem' };
const LAYOUT_ALIGN = new Set(['start', 'center', 'end', 'stretch']);

function quoteDepth(line) {
  const match = String(line ?? '').match(/^\s*((?:>\s*)*)/);
  return match ? (match[1].match(/>/g) ?? []).length : 0;
}

function quotePrefix(depth) {
  if (!depth) return '';
  return `${Array.from({ length: depth }, () => '>').join(' ')} `;
}

function stripOneQuote(line) {
  return String(line ?? '').replace(/^(\s*)>\s?/, '$1');
}

function isQuoteOnlyLine(line) {
  return quoteDepth(line) > 0 && String(line ?? '').replace(/^\s*(?:>\s*)+/, '').trim() === '';
}

function minimumQuoteDepth(markdown) {
  const depths = String(markdown ?? '')
    .split('\n')
    .filter((line) => line.trim())
    .map(quoteDepth);
  return depths.length ? Math.min(...depths) : 0;
}

function isFrontmatterLine(editor, lineNumber) {
  if (lineNumber < 0 || editor.lineCount() === 0 || editor.getLine(0).trim() !== '---') return false;
  for (let line = 1; line < editor.lineCount(); line += 1) {
    if (editor.getLine(line).trim() === '---') return lineNumber <= line;
  }
  return false;
}

function selectedBlockRange(editor) {
  const from = editor.getCursor('from');
  const to = editor.getCursor('to');
  const hasSelection = from.line !== to.line || from.ch !== to.ch;

  if (hasSelection) {
    let endLine = to.line;
    if (to.ch === 0 && endLine > from.line) endLine -= 1;
    return {
      start: { line: from.line, ch: 0 },
      end: { line: endLine, ch: editor.getLine(endLine).length },
    };
  }

  if (!editor.getLine(from.line).trim()) return null;

  let startLine = from.line;
  let endLine = from.line;
  while (startLine > 0 && editor.getLine(startLine - 1).trim()) startLine -= 1;
  while (endLine + 1 < editor.lineCount() && editor.getLine(endLine + 1).trim()) endLine += 1;

  return {
    start: { line: startLine, ch: 0 },
    end: { line: endLine, ch: editor.getLine(endLine).length },
  };
}

function wrapVisualIndent(editor) {
  const range = selectedBlockRange(editor);
  if (!range) {
    new Notice('Select a Markdown block, or place the cursor inside a paragraph, before indenting.');
    return false;
  }

  for (let line = range.start.line; line <= range.end.line; line += 1) {
    if (isFrontmatterLine(editor, line)) {
      new Notice('VISCERIUM visual indents cannot be applied inside YAML frontmatter.');
      return false;
    }
  }

  const source = editor.getRange(range.start, range.end);
  const parentDepth = minimumQuoteDepth(source);
  const wrapperPrefix = quotePrefix(parentDepth + 1);
  const indentHeader = `${wrapperPrefix}[!${INDENT_CALLOUT}]`;
  const indentMarkerLine = `${wrapperPrefix}${INDENT_MARKER}`;
  const indentSpacerLine = wrapperPrefix.trimEnd();
  const quoted = source.split('\n').map((line) => (line.length ? `> ${line}` : '>')).join('\n');
  const replacement = `${indentHeader}\n${indentMarkerLine}\n${indentSpacerLine}\n${quoted}`;
  editor.replaceRange(replacement, range.start, range.end);

  const finalLine = range.start.line + replacement.split('\n').length - 1;
  editor.setCursor({ line: finalLine, ch: editor.getLine(finalLine).length });
  return true;
}

function enclosingIndent(editor, targetLine = editor.getCursor().line) {
  for (let headerLine = targetLine; headerLine >= 0; headerLine -= 1) {
    const header = editor.getLine(headerLine);
    if (!INDENT_HEADER_RE.test(header)) continue;

    const depth = quoteDepth(header);
    if (!depth) continue;

    let endLine = headerLine;
    for (let line = headerLine + 1; line < editor.lineCount(); line += 1) {
      if (quoteDepth(editor.getLine(line)) < depth) break;
      endLine = line;
    }

    if (targetLine <= endLine) return { headerLine, endLine, depth };
  }
  return null;
}

function unwrapVisualIndent(editor) {
  const selectionStart = editor.getCursor('from').line;
  const selectionEnd = editor.getCursor('to').line;
  const container = enclosingIndent(editor, selectionStart) ?? enclosingIndent(editor, selectionEnd);
  if (!container) {
    new Notice('The cursor or selection is not inside a VISCERIUM visual indent.');
    return false;
  }

  let contentStart = container.headerLine + 1;
  if (contentStart <= container.endLine && INDENT_MARKER_RE.test(editor.getLine(contentStart))) contentStart += 1;
  if (contentStart <= container.endLine && !stripOneQuote(editor.getLine(contentStart)).trim()) contentStart += 1;

  const content = [];
  for (let line = contentStart; line <= container.endLine; line += 1) {
    if (INDENT_MARKER_RE.test(editor.getLine(line))) continue;
    content.push(stripOneQuote(editor.getLine(line)));
  }

  const start = { line: container.headerLine, ch: 0 };
  const end = { line: container.endLine, ch: editor.getLine(container.endLine).length };
  const replacement = content.join('\n');
  editor.replaceRange(replacement, start, end);
  editor.setCursor({ line: container.headerLine, ch: 0 });
  return true;
}

function repairLegacyVisualIndents(editor) {
  if (!editor) return 0;
  const cursor = editor.getCursor();
  let repaired = 0;
  let linesAddedBeforeCursor = 0;

  for (let line = editor.lineCount() - 1; line >= 0; line -= 1) {
    const source = editor.getLine(line);
    const match = source.match(LEGACY_INDENT_HEADER_RE);
    if (!match) continue;

    const prefix = match[1];
    const replacement = `${prefix}[!vc-indent]\n${prefix}${INDENT_MARKER}`;
    editor.replaceRange(replacement, { line, ch: 0 }, { line, ch: source.length });
    repaired += 1;
    if (line < cursor.line) linesAddedBeforeCursor += 1;
  }

  if (repaired) {
    editor.setCursor({
      line: Math.min(cursor.line + linesAddedBeforeCursor, editor.lineCount() - 1),
      ch: cursor.ch,
    });
  }

  return repaired;
}

function repairMalformedNestedVisualIndents(editor) {
  if (!editor) return 0;
  let repaired = 0;

  for (let line = editor.lineCount() - 4; line >= 0; line -= 1) {
    const header = editor.getLine(line);
    if (!INDENT_HEADER_RE.test(header)) continue;

    const depth = quoteDepth(header);
    if (!depth) continue;

    const marker = editor.getLine(line + 1);
    const spacer = editor.getLine(line + 2);
    const firstContent = editor.getLine(line + 3);
    if (!INDENT_MARKER_RE.test(marker) || quoteDepth(marker) !== depth) continue;
    if (!isQuoteOnlyLine(spacer) || quoteDepth(spacer) !== depth) continue;
    if (quoteDepth(firstContent) <= depth) continue;

    for (let scaffoldLine = line; scaffoldLine <= line + 2; scaffoldLine += 1) {
      const source = editor.getLine(scaffoldLine);
      editor.replaceRange(`> ${source}`, { line: scaffoldLine, ch: 0 }, { line: scaffoldLine, ch: source.length });
    }
    repaired += 1;
  }

  return repaired;
}

function isIndentLabelElement(element) {
  return element?.tagName === 'P' && INDENT_LABEL_RE.test(String(element.textContent ?? '').trim());
}

function directMarkerHolder(element) {
  for (const child of Array.from(element?.children ?? [])) {
    if (child.classList?.contains(INDENT_MARKER_CLASS)) return child;
    if (child.tagName === 'P' && child.querySelector?.(`.${INDENT_MARKER_CLASS}`)) return child;
  }
  return null;
}

function removeDirectIndentScaffold(element) {
  for (const child of Array.from(element?.children ?? [])) {
    if (isIndentLabelElement(child)) child.remove();
    else if (child.classList?.contains(INDENT_MARKER_CLASS)) child.remove();
    else if (child.tagName === 'P' && child.querySelector?.(`.${INDENT_MARKER_CLASS}`)) child.remove();
  }
}

function normaliseMalformedRenderedNesting(container) {
  const children = Array.from(container?.children ?? []);
  for (let index = 0; index < children.length; index += 1) {
    const label = children[index];
    if (!isIndentLabelElement(label)) continue;

    let nextIndex = index + 1;
    const nextChild = children[nextIndex];
    const markerSharesLabel = Boolean(label.querySelector?.(`.${INDENT_MARKER_CLASS}`));
    const markerHolder = !markerSharesLabel && nextChild && (
      nextChild.classList?.contains(INDENT_MARKER_CLASS)
      || (nextChild.tagName === 'P' && nextChild.querySelector?.(`.${INDENT_MARKER_CLASS}`))
    ) ? nextChild : null;
    if (markerHolder) nextIndex += 1;

    while (children[nextIndex]?.tagName === 'P' && !String(children[nextIndex].textContent ?? '').trim()) nextIndex += 1;
    const nestedBlockquote = children[nextIndex];
    if (nestedBlockquote?.tagName !== 'BLOCKQUOTE') continue;

    nestedBlockquote.classList.add(RENDERED_INDENT_CLASS);
    label.remove();
    markerHolder?.remove();
  }
}

function normaliseRenderedIndents(root) {
  if (!root?.querySelectorAll) return;

  const nestingContainers = [root, ...Array.from(root.querySelectorAll('blockquote, .callout-content'))];
  for (const container of nestingContainers) normaliseMalformedRenderedNesting(container);

  const callouts = Array.from(root.querySelectorAll('.callout[data-callout="vc-indent"]'));
  if (root.matches?.('.callout[data-callout="vc-indent"]')) callouts.unshift(root);
  for (const callout of callouts) {
    callout.classList.add(RENDERED_INDENT_CLASS);
    for (const child of Array.from(callout.children ?? [])) {
      if (child.classList?.contains('callout-title')) child.remove();
      if (child.classList?.contains('callout-content')) removeDirectIndentScaffold(child);
    }
  }

  const blockquotes = Array.from(root.querySelectorAll('blockquote'));
  if (root.matches?.('blockquote')) blockquotes.unshift(root);
  for (const blockquote of blockquotes) {
    const hasDirectLabel = Array.from(blockquote.children ?? []).some(isIndentLabelElement);
    const markerHolder = directMarkerHolder(blockquote);
    if (!hasDirectLabel && !markerHolder && !blockquote.classList.contains(RENDERED_INDENT_CLASS)) continue;
    blockquote.classList.add(RENDERED_INDENT_CLASS);
    removeDirectIndentScaffold(blockquote);
  }
}

function parseRenderedLayoutTag(element) {
  if (element?.tagName !== 'P') return null;
  const match = String(element.textContent ?? '').trim().match(LAYOUT_TAG_RE);
  if (!match) return null;
  return { closing: Boolean(match[1]), tag: match[2].toLowerCase(), spec: match[3] ?? '' };
}

function applyRenderedColumnOptions(container, spec) {
  let ratio;
  for (const token of String(spec ?? '').trim().split(/\s+/).filter(Boolean)) {
    const lower = token.toLowerCase();
    if (/^\d+(?:-\d+){1,5}$/.test(lower)) ratio = lower;
    else {
      const [key, value = ''] = lower.split('=', 2);
      if (key === 'gap' && LAYOUT_GAPS[value]) container.style.setProperty('--vc-layout-gap', LAYOUT_GAPS[value]);
      if (key === 'align' && LAYOUT_ALIGN.has(value)) container.style.setProperty('--vc-layout-align', value);
    }
  }
  if (ratio) {
    container.style.setProperty('--vc-layout-columns', ratio.split('-').map((part) => `${Number(part)}fr`).join(' '));
  }
}

function findClosingColumnsTag(opening) {
  let depth = 1;
  for (let node = opening.nextElementSibling; node; node = node.nextElementSibling) {
    const marker = parseRenderedLayoutTag(node);
    if (marker?.tag !== 'cols') continue;
    depth += marker.closing ? -1 : 1;
    if (depth === 0) return node;
  }
  return null;
}

function createRenderedColumn(ownerDocument) {
  const column = ownerDocument.createElement('div');
  column.classList.add(RENDERED_COLUMN_CLASS);
  return column;
}

function renderColumnsGroup(opening, marker) {
  const closing = findClosingColumnsTag(opening);
  const parent = opening.parentElement;
  if (!closing || !parent || closing.parentElement !== parent) return false;

  const grid = opening.ownerDocument.createElement('div');
  grid.classList.add(RENDERED_COLUMNS_CLASS);
  applyRenderedColumnOptions(grid, marker.spec);
  parent.insertBefore(grid, opening);

  let column = null;
  let columnCount = 0;
  let nestedColumnsDepth = 0;
  let node = opening.nextElementSibling;

  while (node && node !== closing) {
    const next = node.nextElementSibling;
    const nodeMarker = parseRenderedLayoutTag(node);

    if (nodeMarker?.tag === 'cols') {
      nestedColumnsDepth += nodeMarker.closing ? -1 : 1;
      (column ?? grid).appendChild(node);
    } else if (nestedColumnsDepth === 0 && nodeMarker?.tag === 'col') {
      if (nodeMarker.closing) {
        column = null;
      } else {
        column = createRenderedColumn(opening.ownerDocument);
        grid.appendChild(column);
        columnCount += 1;
      }
      node.remove();
    } else {
      if (!column) {
        column = createRenderedColumn(opening.ownerDocument);
        grid.appendChild(column);
        columnCount += 1;
      }
      column.appendChild(node);
    }

    node = next;
  }

  opening.remove();
  closing.remove();
  if (!grid.style.getPropertyValue('--vc-layout-columns') && columnCount > 0) {
    grid.style.setProperty('--vc-layout-columns', Array.from({ length: columnCount }, () => '1fr').join(' '));
  }

  normaliseRenderedColumns(grid);
  return true;
}

function layoutParagraphLines(paragraph) {
  const lines = [[]];
  const newLine = () => lines.push([]);

  for (const child of Array.from(paragraph?.childNodes ?? [])) {
    if (child.nodeType === 3) {
      const parts = String(child.nodeValue ?? '').split(/\r?\n/);
      for (let index = 0; index < parts.length; index += 1) {
        if (parts[index]) lines[lines.length - 1].push(paragraph.ownerDocument.createTextNode(parts[index]));
        if (index < parts.length - 1) newLine();
      }
    } else if (child.nodeName === 'BR') {
      newLine();
    } else {
      lines[lines.length - 1].push(child);
    }
  }

  return lines;
}

function layoutLineText(line) {
  return line.map((node) => String(node.textContent ?? '')).join('').trim();
}

function splitRenderedLayoutParagraph(paragraph) {
  if (paragraph?.tagName !== 'P' || !String(paragraph.textContent ?? '').includes('[')) return false;
  const lines = layoutParagraphLines(paragraph);
  if (!lines.some((line) => LAYOUT_TAG_RE.test(layoutLineText(line)))) return false;

  const segments = [];
  let contentLines = [];
  const flushContent = () => {
    if (!contentLines.length) return;
    segments.push({ marker: false, lines: contentLines });
    contentLines = [];
  };

  for (const line of lines) {
    if (LAYOUT_TAG_RE.test(layoutLineText(line))) {
      flushContent();
      segments.push({ marker: true, lines: [line] });
    } else {
      contentLines.push(line);
    }
  }
  flushContent();

  if (segments.length <= 1) return false;
  const parent = paragraph.parentElement;
  if (!parent) return false;

  for (const segment of segments) {
    const replacement = paragraph.cloneNode(false);
    segment.lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) replacement.appendChild(paragraph.ownerDocument.createTextNode('\n'));
      for (const node of line) replacement.appendChild(node);
    });
    if (segment.marker || String(replacement.textContent ?? '').trim() || replacement.children.length) {
      parent.insertBefore(replacement, paragraph);
    }
  }
  paragraph.remove();
  return true;
}

function splitRenderedLayoutMarkerParagraphs(root) {
  if (!root?.querySelectorAll) return;
  let changed = true;
  while (changed) {
    changed = false;
    const paragraphs = [];
    if (root.matches?.('p')) paragraphs.push(root);
    paragraphs.push(...Array.from(root.querySelectorAll('p')));
    for (const paragraph of paragraphs) {
      if (!splitRenderedLayoutParagraph(paragraph)) continue;
      changed = true;
      break;
    }
  }
}

function normaliseRenderedColumns(root) {
  if (!root?.querySelectorAll) return;
  splitRenderedLayoutMarkerParagraphs(root);

  let transformed = true;
  while (transformed) {
    transformed = false;
    const candidates = [];
    if (root.matches?.('p')) candidates.push(root);
    candidates.push(...Array.from(root.querySelectorAll('p')));

    for (const candidate of candidates) {
      const marker = parseRenderedLayoutTag(candidate);
      if (!marker || marker.closing || marker.tag !== 'cols') continue;
      if (!renderColumnsGroup(candidate, marker)) continue;
      transformed = true;
      break;
    }
  }
}

module.exports = class VisceriumLayoutToolsPlugin extends Plugin {
  async onload() {
    this.registerMarkdownPostProcessor((element) => {
      normaliseRenderedIndents(element);
      normaliseRenderedColumns(element);
    });

    this.addCommand({
      id: 'visual-indent-block',
      name: 'Visual indent: move block right',
      hotkeys: [{ modifiers: ['Alt'], key: ']' }],
      editorCheckCallback: (checking, editor) => {
        const range = selectedBlockRange(editor);
        if (!range) return false;
        if (!checking) wrapVisualIndent(editor);
        return true;
      },
    });

    this.addCommand({
      id: 'visual-outdent-block',
      name: 'Visual indent: move block left',
      hotkeys: [{ modifiers: ['Alt'], key: '[' }],
      editorCheckCallback: (checking, editor) => {
        const available = Boolean(enclosingIndent(editor));
        if (!available) return false;
        if (!checking) unwrapVisualIndent(editor);
        return true;
      },
    });

    this.addCommand({
      id: 'repair-legacy-visual-indents',
      name: 'Repair visual indents created by previous versions',
      editorCallback: (editor) => {
        const repairedLegacy = repairLegacyVisualIndents(editor);
        const repairedNested = repairMalformedNestedVisualIndents(editor);
        const repaired = repairedLegacy + repairedNested;
        new Notice(repaired ? `Repaired ${repaired} visual indent${repaired === 1 ? '' : 's'}.` : 'No legacy visual indents found.');
      },
    });

    this.addRibbonIcon('indent-increase', 'VISCERIUM: visually indent block', () => {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!view?.editor || !wrapVisualIndent(view.editor)) return;
    });

    this.registerEvent(this.app.workspace.on('editor-menu', (menu, editor) => {
      menu.addItem((item) => {
        item
          .setTitle('VISCERIUM: Move block right')
          .setIcon('indent-increase')
          .onClick(() => wrapVisualIndent(editor));
      });
      if (enclosingIndent(editor)) {
        menu.addItem((item) => {
          item
            .setTitle('VISCERIUM: Move block left')
            .setIcon('indent-decrease')
            .onClick(() => unwrapVisualIndent(editor));
        });
      }
    }));

    const repairActiveView = () => {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!view?.editor) return;
      repairLegacyVisualIndents(view.editor);
      repairMalformedNestedVisualIndents(view.editor);
    };

    this.app.workspace.onLayoutReady(repairActiveView);
    this.registerEvent(this.app.workspace.on('file-open', () => setTimeout(repairActiveView, 0)));
  }
};
