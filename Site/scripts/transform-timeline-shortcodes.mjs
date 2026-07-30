import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs/promises';
import matter from 'gray-matter';
import { LANE_MODES, TIMELINE_IDS } from '../src/lib/timeline/core.mjs';

const siteRoot = process.cwd();
const docsDir = process.env.VISCERIUM_DOCS_DIR
  ? path.resolve(process.env.VISCERIUM_DOCS_DIR)
  : path.resolve(siteRoot, 'src/content/docs');
const timelineComponentPath = path.resolve(siteRoot, 'src/components/timeline/TimelineEmbed.astro');
const chronosComponentPath = path.resolve(siteRoot, 'src/components/timeline/ChronosEmbed.astro');

function parseBoolean(value, fallback) {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (String(value).toLowerCase() === 'true') return true;
  if (String(value).toLowerCase() === 'false') return false;
  return fallback;
}

function parseInlineSpec(id, spec) {
  const block = { timeline: id };
  for (const pair of String(spec ?? '').matchAll(/([a-z][\w-]*)=(?:"([^"]*)"|'([^']*)'|([^\s]+))/gi)) {
    const key = pair[1].toLowerCase();
    const value = pair[2] ?? pair[3] ?? pair[4] ?? '';
    if (key === 'timeline') block.timeline = value;
    if (key === 'calendar') block.defaultCalendar = value;
    if (key === 'lane' || key === 'lanemode') block.laneMode = value;
    if (key === 'filters' || key === 'showfilters') block.showFilters = parseBoolean(value, true);
    if (key === 'minimap' || key === 'showminimap') block.showMinimap = parseBoolean(value, true);
    if (key === 'legend' || key === 'showlegend') block.showLegend = parseBoolean(value, true);
    if (key === 'compact') block.compact = parseBoolean(value, false);
  }
  return block;
}

function normalizeBlock(value) {
  if (!value || typeof value !== 'object') return null;
  if (!TIMELINE_IDS.includes(value.timeline)) return null;
  const laneMode = LANE_MODES.includes(value.laneMode) ? value.laneMode : 'unified';
  return {
    timeline: value.timeline,
    defaultCalendar: typeof value.defaultCalendar === 'string' ? value.defaultCalendar : undefined,
    laneMode,
    showFilters: parseBoolean(value.showFilters, true),
    showMinimap: parseBoolean(value.showMinimap, true),
    showLegend: parseBoolean(value.showLegend, true),
    compact: parseBoolean(value.compact, false),
  };
}

function relativeImport(file, componentPath) {
  let relative = path.relative(path.dirname(file), componentPath).replace(/\\/g, '/');
  if (!relative.startsWith('.')) relative = `./${relative}`;
  return relative;
}

function warning(message) {
  const safe = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<aside className="codex-warning"><strong>Timeline warning:</strong> ${safe}</aside>`;
}

function fenceInfo(line) {
  const match = line.match(/^\s*(`{3,}|~{3,})\s*([^\s`]*)?.*$/);
  if (!match) return null;
  return {
    marker: match[1][0],
    length: match[1].length,
    language: String(match[2] ?? '').toLowerCase(),
  };
}

function isFenceClose(line, fence) {
  const expression = fence.marker === '`' ? /^\s*`{3,}\s*$/ : /^\s*~{3,}\s*$/;
  const match = line.match(expression);
  return Boolean(match && match[0].trim().length >= fence.length);
}

const files = (await Array.fromAsync(fs.glob('**/*.{md,mdx}', { cwd: docsDir })))
  .map((file) => path.resolve(docsDir, file))
  .sort();
for (const file of files) {
  const raw = await fs.readFile(file, 'utf8');
  const hasTimelineShortcode = /^\s*\[Timeline:[^\]]+\]\s*$/im.test(raw);
  const hasChronosFence = /^\s*(?:`{3,}|~{3,})\s*chronos\b/im.test(raw);
  if (!hasTimelineShortcode && !hasChronosFence) continue;

  const parsed = matter(raw);
  const blocks = parsed.data.timelineBlocks && typeof parsed.data.timelineBlocks === 'object' ? parsed.data.timelineBlocks : {};
  const lines = parsed.content.split(/\r?\n/);
  const output = [];
  let usedTimeline = false;
  let usedChronos = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const openingFence = fenceInfo(line);

    if (openingFence?.language === 'chronos') {
      const source = [];
      let closed = false;
      for (index += 1; index < lines.length; index += 1) {
        if (isFenceClose(lines[index], openingFence)) {
          closed = true;
          break;
        }
        source.push(lines[index]);
      }
      if (!closed) {
        output.push(warning('An unclosed Chronos code block was left as source text.'));
        output.push(line, ...source);
        continue;
      }
      usedChronos = true;
      output.push(`<ChronosEmbed source={${JSON.stringify(source.join('\n'))}} />`);
      continue;
    }

    if (openingFence) {
      output.push(line);
      for (index += 1; index < lines.length; index += 1) {
        output.push(lines[index]);
        if (isFenceClose(lines[index], openingFence)) break;
      }
      continue;
    }

    const match = line.match(/^\s*\[Timeline:([^\]\s]+)(?:\s+([^\]]+))?\]\s*$/i);
    if (!match) {
      output.push(line);
      continue;
    }

    const id = match[1];
    const inline = parseInlineSpec(id, match[2]);
    const block = normalizeBlock(blocks[id]) ?? normalizeBlock(inline);
    if (!block) {
      output.push(warning(`No valid timeline block found for '${id}'.`));
      continue;
    }

    usedTimeline = true;
    const props = [
      `timelineId=${JSON.stringify(block.timeline)}`,
      block.defaultCalendar ? `defaultCalendar=${JSON.stringify(block.defaultCalendar)}` : '',
      `laneMode=${JSON.stringify(block.laneMode)}`,
      `showFilters={${block.showFilters}}`,
      `showMinimap={${block.showMinimap}}`,
      `showLegend={${block.showLegend}}`,
      `compact={${block.compact}}`,
    ].filter(Boolean).join(' ');
    output.push(`<TimelineEmbed ${props} />`);
  }

  if (!usedTimeline && !usedChronos) continue;
  const outFile = file.replace(/\.md$/i, '.mdx');
  const imports = [];
  if (usedTimeline) imports.push(`import TimelineEmbed from '${relativeImport(outFile, timelineComponentPath)}';`);
  if (usedChronos) imports.push(`import ChronosEmbed from '${relativeImport(outFile, chronosComponentPath)}';`);
  if (usedTimeline) parsed.data.timelinePage = true;
  const content = `${imports.join('\n')}\n\n${output.join('\n')}`;
  await fs.writeFile(outFile, matter.stringify(content, parsed.data));
  if (outFile !== file) await fs.rm(file, { force: true });
  console.log(`Expanded timeline content in ${path.relative(docsDir, outFile)}`);
}
