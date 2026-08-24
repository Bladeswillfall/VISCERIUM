import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs/promises';
import matter from 'gray-matter';
import { resolveTimelineOptions } from '../src/lib/timeline/options.mjs';

const siteRoot = process.cwd();
const docsDir = process.env.VISCERIUM_DOCS_DIR
  ? path.resolve(process.env.VISCERIUM_DOCS_DIR)
  : path.resolve(siteRoot, 'src/content/docs');
const timelineComponentPath = path.resolve(siteRoot, 'src/components/timeline/TimelineEmbed.astro');

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
  if (!hasTimelineShortcode) continue;

  const parsed = matter(raw);
  const blocks = parsed.data.timelineBlocks && typeof parsed.data.timelineBlocks === 'object' ? parsed.data.timelineBlocks : {};
  const lines = parsed.content.split(/\r?\n/);
  const output = [];
  let usedTimeline = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const openingFence = fenceInfo(line);

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
    const block = resolveTimelineOptions(id, match[2], blocks[id]);
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

  if (!usedTimeline) continue;
  const outFile = file.replace(/\.md$/i, '.mdx');
  const imports = [];
  if (usedTimeline) imports.push(`import TimelineEmbed from '${relativeImport(outFile, timelineComponentPath)}';`);
  if (usedTimeline) parsed.data.timelinePage = true;
  const content = `${imports.join('\n')}\n\n${output.join('\n')}`;
  await fs.writeFile(outFile, matter.stringify(content, parsed.data));
  if (outFile !== file) await fs.rm(file, { force: true });
  console.log(`Expanded timeline content in ${path.relative(docsDir, outFile)}`);
}
