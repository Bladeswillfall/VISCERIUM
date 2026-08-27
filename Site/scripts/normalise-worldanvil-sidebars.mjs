import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { isMainModule } from './script-entry.mjs';

const DEFAULT_IMPORT_DIR = path.resolve(process.cwd(), '../Vault/Drafts/WorldAnvil Import');
const ARTWORK_DISCLAIMER = /all artwork that isn['’]t an original creation/i;

const SECTIONS = new Map([
  ['specifications', { title: 'Specifications' }],
  ['options', { title: 'Options' }],
  ['largest recorded', { title: 'Largest recorded' }],
  ['production', { title: 'Production' }],
  ['related historical events', { title: 'Related historical events', consumeItems: true }],
]);

const FIELDS = new Map([
  ['title', { label: 'Title', target: 'meta' }],
  ['pronouns', { label: 'Pronouns', target: 'meta' }],
  ['age', { label: 'Age', target: 'meta' }],
  ['gender', { label: 'Gender', target: 'meta' }],
  ['type', { label: 'Type', target: 'meta' }],
  ['item type', { label: 'Item type', target: 'meta' }],
  ['style of government', { label: 'Government', target: 'meta' }],
  ['style of goverment', { label: 'Government', target: 'meta' }],
  ['driving ideology', { label: 'Driving ideology', target: 'meta' }],
  ['currency', { label: 'Currency', target: 'meta' }],
  ['manufacturer', { label: 'Manufacturer', target: 'meta' }],
  ['origin', { label: 'Origin', target: 'meta' }],
  ['rarity', { label: 'Rarity', target: 'meta' }],
  ['eyes', { label: 'Eyes', target: 'Appearance' }],
  ['hair', { label: 'Hair', target: 'Appearance' }],
  ['skin tone/pigmentation', { label: 'Skin tone / pigmentation', target: 'Appearance' }],
  ['skin tone', { label: 'Skin tone', target: 'Appearance' }],
  ['physical traits', { label: 'Physical traits', target: 'Appearance' }],
  ['physical trait', { label: 'Physical traits', target: 'Appearance' }],
  ['avg. height', { label: 'Average height', target: 'Physical profile' }],
  ['avg height', { label: 'Average height', target: 'Physical profile' }],
  ['avg. weight', { label: 'Average weight', target: 'Physical profile' }],
  ['avg weight', { label: 'Average weight', target: 'Physical profile' }],
  ['ruler(s)', { label: 'Rulers', target: 'Leadership' }],
  ['rulers', { label: 'Rulers', target: 'Leadership' }],
  ['leader(s)', { label: 'Leaders', target: 'Leadership' }],
  ['leader', { label: 'Leader', target: 'Leadership' }],
  ['places of note', { label: 'Places of note', target: 'Places of note', mode: 'items' }],
  ['succeeded by', { label: 'Succeeded by', target: 'Succession' }],
  ['preceded by', { label: 'Preceded by', target: 'Succession' }],
  ['predecessor', { label: 'Predecessor', target: 'Succession' }],
  ['successor', { label: 'Successor', target: 'Succession' }],
  ['member of (current)', { label: 'Current', target: 'Membership' }],
  ['member of (former)', { label: 'Former', target: 'Membership' }],
  ['membership', { label: 'Membership', target: 'Membership' }],
  ['affiliation', { label: 'Affiliation', target: 'Membership' }],
  ['affiliations', { label: 'Affiliations', target: 'Membership' }],
  ['members (active)', { label: 'Active members', target: 'Members', mode: 'items' }],
  ['members', { label: 'Members', target: 'Members', mode: 'items' }],
  ['ammunition', { label: 'Ammunition', target: 'Specifications' }],
  ['length', { label: 'Length', target: 'Specifications' }],
  ['barrel', { label: 'Barrel', target: 'Specifications' }],
  ['effective range', { label: 'Effective range', target: 'Specifications' }],
  ['range', { label: 'Range', target: 'Specifications' }],
  ['features', { label: 'Features', target: 'Specifications' }],
  ['crew', { label: 'Crew', target: 'Specifications' }],
  ['capacity', { label: 'Capacity', target: 'Specifications' }],
  ['calibre', { label: 'Calibre', target: 'Specifications' }],
  ['caliber', { label: 'Calibre', target: 'Specifications' }],
  ['armament', { label: 'Armament', target: 'Specifications' }],
  ['firing-mode(s)', { label: 'Firing modes', target: 'Options' }],
  ['firing modes', { label: 'Firing modes', target: 'Options' }],
  ['stock', { label: 'Stock', target: 'Options' }],
  ['route of administration', { label: 'Route of administration', target: 'Administration' }],
  ['onset of action', { label: 'Onset of action', target: 'Administration' }],
  ['elimination half-life', { label: 'Elimination half-life', target: 'Administration' }],
  ['found in', { label: 'Found in', target: 'Details' }],
  ['primary property', { label: 'Primary property', target: 'Details' }],
  ['formation driver', { label: 'Formation driver', target: 'Details' }],
  ['children', { label: 'Children', target: 'Family' }],
]);

function cleanLabel(value) {
  let text = String(value ?? '').trim().replace(/\u00a0/g, ' ');
  if (/^\*\*.*\*\*:?$/.test(text)) text = text.replace(/^\*\*/, '').replace(/\*\*:?$/, '');
  if (/^__.*__:?$/.test(text)) text = text.replace(/^__/, '').replace(/__:?$/, '');
  return text.replace(/:$/, '').trim();
}

function keyFor(value) {
  return cleanLabel(value).toLocaleLowerCase('en').replace(/\s+/g, ' ').trim();
}

function legacyType(filePath) {
  const name = path.basename(filePath, path.extname(filePath));
  const dash = name.indexOf('-');
  return dash === -1 ? 'Article' : name.slice(0, dash);
}

function blocksFromBody(body) {
  const lines = String(body ?? '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let index = 0;
  while (index < lines.length) {
    while (index < lines.length && lines[index].trim() === '') index += 1;
    if (index >= lines.length) break;
    const start = index;
    while (index < lines.length && lines[index].trim() !== '') index += 1;
    const end = index - 1;
    blocks.push({ start, end, text: lines.slice(start, end + 1).join('\n').trim() });
  }
  return { lines, blocks };
}

function isBoundary(block) {
  const text = block?.text?.trim() ?? '';
  return /^#{2,6}\s+/.test(text) || /^---+$/.test(text) || ARTWORK_DISCLAIMER.test(text);
}

function isDetailsHeading(block) {
  return /^#{2,6}\s+details\s*$/i.test(block?.text?.trim() ?? '');
}

function fieldFor(type, key) {
  if (key === 'height') {
    if (type === 'Person') return { label: 'Height', target: 'Appearance' };
    if (type === 'Item' || type === 'Vehicle') return { label: 'Height', target: 'Specifications' };
    return { label: 'Height', target: 'Physical profile' };
  }
  if (key === 'weight') {
    if (type === 'Person') return { label: 'Weight', target: 'Appearance' };
    if (type === 'Item' || type === 'Vehicle') return { label: 'Weight', target: 'Specifications' };
    return { label: 'Weight', target: 'Physical profile' };
  }
  return FIELDS.get(key) ?? null;
}

function knownToken(block, type) {
  if (!block || block.text.includes('\n')) return null;
  const key = keyFor(block.text);
  const section = SECTIONS.get(key);
  if (section) return { kind: 'section', ...section };
  const field = fieldFor(type, key);
  return field ? { kind: 'field', ...field } : null;
}

function isLikelyGenericLabel(block) {
  if (!block || block.text.includes('\n')) return false;
  const raw = block.text.trim();
  const label = cleanLabel(raw);
  if (!label || label.length > 72) return false;
  if (/^(?:!\[|\[.+\]\(|>|[-*+]\s|```|~~~)/.test(raw)) return false;
  if (/^[~+\-]?\d[\d\s.,:'"/%x×-]*$/i.test(label)) return false;
  if (/[.!?]$/.test(label)) return false;
  if (label.split(/\s+/).length > 10) return false;
  const first = label.match(/[A-Za-z]/)?.[0];
  if (first && first !== first.toUpperCase()) return false;
  return true;
}

function cleanValueLine(line) {
  return String(line ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/^\s*[-*+]\s+/, '')
    .replace(/\s{2,}$/g, '')
    .trim()
    .replace(/,+$/, '');
}

function valueLines(block) {
  return String(block?.text ?? '').split('\n').map(cleanValueLine).filter(Boolean);
}

function markdownLink(value) {
  const match = String(value ?? '').trim().match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  return match ? { label: match[1].trim(), href: match[2].trim() } : null;
}

function ensureSection(sections, title) {
  let section = sections.find((item) => item.title === title);
  if (!section) {
    section = { title, fields: [], items: [] };
    sections.push(section);
  }
  return section;
}

function fieldTarget(definition, activeSection) {
  if (definition.target === 'meta') return 'meta';
  if (activeSection && ['Physical profile', 'Specifications', 'Options', 'Details'].includes(definition.target)) return activeSection;
  return definition.target || activeSection || 'Details';
}

function addField(sidebar, definition, block, activeSection) {
  const values = valueLines(block);
  if (values.length === 0) return false;

  const target = fieldTarget(definition, activeSection);
  if (definition.mode === 'items') {
    const section = ensureSection(sidebar.sections, target === 'meta' ? definition.label : target);
    for (const value of values) section.items.push(markdownLink(value) ?? value);
    return true;
  }

  let value = values.length === 1 ? values[0] : values;
  let href;
  if (typeof value === 'string') {
    const link = markdownLink(value);
    if (link) {
      value = link.label;
      href = link.href;
    }
  }
  const field = { label: definition.label, value, ...(href ? { href } : {}) };
  if (target === 'meta') sidebar.meta.push(field);
  else ensureSection(sidebar.sections, target).fields.push(field);
  return true;
}

function addItemBlocks(sidebar, title, blocks) {
  const section = ensureSection(sidebar.sections, title);
  let count = 0;
  for (const block of blocks) {
    for (const value of valueLines(block)) {
      section.items.push(markdownLink(value) ?? value);
      count += 1;
    }
  }
  return count;
}

function genericDefinition(block, activeSection) {
  return { label: cleanLabel(block.text), target: activeSection || 'Details' };
}

function hasLegacyContext(blocks, startIndex, endIndex) {
  const before = blocks.slice(Math.max(0, startIndex - 4), startIndex).map((block) => block.text).join('\n');
  const after = blocks.slice(endIndex + 1, Math.min(blocks.length, endIndex + 10)).map((block) => block.text).join('\n');
  const image = /!\[[^\]]*\]\([^)]*\)|\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/.test(before);
  return image || ARTWORK_DISCLAIMER.test(after);
}

// eslint-disable-next-line complexity
function parseCandidate(blocks, startIndex, type) {
  const sidebar = { meta: [], sections: [] };
  const consumed = new Set();
  let index = startIndex;
  let activeSection = null;
  let labelCount = 0;
  let knownCount = 0;
  let extractedEntries = 0;

  while (index < blocks.length) {
    const block = blocks[index];
    if (isBoundary(block)) break;

    const token = knownToken(block, type);
    if (token?.kind === 'section') {
      consumed.add(index);
      knownCount += 1;
      activeSection = token.title;
      index += 1;

      if (token.consumeItems) {
        const itemBlocks = [];
        while (index < blocks.length && !isBoundary(blocks[index])) {
          const nextToken = knownToken(blocks[index], type);
          if (nextToken || isLikelyGenericLabel(blocks[index])) break;
          itemBlocks.push(blocks[index]);
          consumed.add(index);
          index += 1;
        }
        extractedEntries += addItemBlocks(sidebar, token.title, itemBlocks);
      }
      continue;
    }

    let definition;
    if (token?.kind === 'field') {
      definition = token;
      knownCount += 1;
    } else if (index > startIndex && isLikelyGenericLabel(block)) {
      definition = genericDefinition(block, activeSection);
    } else {
      break;
    }

    labelCount += 1;
    consumed.add(index);
    const next = blocks[index + 1];
    if (!next || isBoundary(next)) {
      index += 1;
      continue;
    }

    const nextToken = knownToken(next, type);
    if (nextToken) {
      index += 1;
      continue;
    }

    if (addField(sidebar, definition, next, activeSection)) extractedEntries += 1;
    consumed.add(index + 1);
    index += 2;
  }

  sidebar.sections = sidebar.sections.filter((section) => section.fields.length > 0 || section.items.length > 0);
  const lastConsumed = consumed.size > 0 ? Math.max(...consumed) : startIndex;
  const confident = knownCount > 0 && extractedEntries > 0 && (labelCount >= 2 || hasLegacyContext(blocks, startIndex, lastConsumed));
  if (!confident) return null;
  return { sidebar, consumed, endIndex: lastConsumed, extractedEntries };
}

function mergeSidebar(target, incoming) {
  target.meta.push(...incoming.meta);
  for (const section of incoming.sections) {
    const existing = ensureSection(target.sections, section.title);
    existing.fields.push(...section.fields);
    existing.items.push(...section.items);
  }
}

export function extractLegacySidebar(body, filePath = 'Article-Unknown.md') {
  const type = legacyType(filePath);
  const { lines, blocks } = blocksFromBody(body);
  const sidebar = { meta: [], sections: [] };
  const removeLines = new Set();
  let extractedGroups = 0;
  let extractedEntries = 0;

  for (let index = 0; index < blocks.length;) {
    const token = knownToken(blocks[index], type);
    if (!token) {
      index += 1;
      continue;
    }

    const candidate = parseCandidate(blocks, index, type);
    if (!candidate) {
      index += 1;
      continue;
    }

    mergeSidebar(sidebar, candidate.sidebar);
    extractedGroups += 1;
    extractedEntries += candidate.extractedEntries;

    for (const blockIndex of candidate.consumed) {
      const block = blocks[blockIndex];
      for (let lineIndex = block.start; lineIndex <= block.end; lineIndex += 1) removeLines.add(lineIndex);
    }

    if (index > 0 && isDetailsHeading(blocks[index - 1])) {
      const heading = blocks[index - 1];
      for (let lineIndex = heading.start; lineIndex <= heading.end; lineIndex += 1) removeLines.add(lineIndex);
    }

    index = candidate.endIndex + 1;
  }

  sidebar.sections = sidebar.sections.filter((section) => section.fields.length > 0 || section.items.length > 0);
  const total = sidebar.meta.length + sidebar.sections.reduce((sum, section) => sum + section.fields.length + section.items.length, 0);
  if (total === 0) return { body, sidebar: null, extractedGroups: 0, extractedEntries: 0 };

  const cleaned = lines.filter((_, index) => !removeLines.has(index)).join('\n').replace(/\n{3,}/g, '\n\n').trimStart();
  return { body: cleaned, sidebar, extractedGroups, extractedEntries };
}

function yaml(value) {
  return JSON.stringify(String(value ?? ''));
}

function yamlField(field, indent) {
  const pad = ' '.repeat(indent);
  const lines = [`${pad}- label: ${yaml(field.label)}`];
  if (Array.isArray(field.value)) {
    lines.push(`${pad}  value:`);
    for (const item of field.value) lines.push(`${pad}    - ${yaml(item)}`);
  } else {
    lines.push(`${pad}  value: ${yaml(field.value)}`);
  }
  if (field.href) lines.push(`${pad}  href: ${yaml(field.href)}`);
  return lines;
}

function yamlItem(item, indent) {
  const pad = ' '.repeat(indent);
  if (typeof item === 'string') return [`${pad}- ${yaml(item)}`];
  const lines = [`${pad}- label: ${yaml(item.label)}`];
  if (item.href) lines.push(`${pad}  href: ${yaml(item.href)}`);
  return lines;
}

export function sidebarYaml(sidebar) {
  const lines = ['sidebar:', '  replaceMeta: true'];
  if (sidebar.meta.length > 0) {
    lines.push('  meta:');
    for (const field of sidebar.meta) lines.push(...yamlField(field, 4));
  }
  if (sidebar.sections.length > 0) {
    lines.push('  sections:');
    for (const section of sidebar.sections) {
      lines.push(`    - title: ${yaml(section.title)}`);
      if (section.fields.length > 0) {
        lines.push('      fields:');
        for (const field of section.fields) lines.push(...yamlField(field, 8));
      }
      if (section.items.length > 0) {
        lines.push('      items:');
        for (const item of section.items) lines.push(...yamlItem(item, 8));
      }
    }
  }
  return lines.join('\n');
}

function splitFrontmatter(markdown) {
  const text = String(markdown ?? '').replace(/\r\n/g, '\n');
  if (!text.startsWith('---\n')) return { frontmatter: '', body: text, hasFrontmatter: false };
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) return { frontmatter: '', body: text, hasFrontmatter: false };
  return { frontmatter: text.slice(4, end), body: text.slice(end + 5), hasFrontmatter: true };
}

export function normaliseImportedMarkdown(markdown, filePath = 'Article-Unknown.md') {
  const parts = splitFrontmatter(markdown);
  if (/^sidebar:\s*$/m.test(parts.frontmatter)) return { changed: false, markdown, reason: 'existing-sidebar', extractedEntries: 0, extractedGroups: 0 };

  const extracted = extractLegacySidebar(parts.body, filePath);
  if (!extracted.sidebar) return { changed: false, markdown, reason: 'no-confident-sidebar', extractedEntries: 0, extractedGroups: 0 };

  const generated = sidebarYaml(extracted.sidebar);
  let output;
  if (parts.hasFrontmatter) {
    const frontmatter = parts.frontmatter.trimEnd();
    output = `---\n${frontmatter}${frontmatter ? '\n' : ''}${generated}\n---\n${extracted.body}`;
  } else {
    output = `---\n${generated}\n---\n${extracted.body}`;
  }
  if (String(markdown).endsWith('\n') && !output.endsWith('\n')) output += '\n';
  return { changed: output !== markdown, markdown: output, reason: 'normalised', extractedEntries: extracted.extractedEntries, extractedGroups: extracted.extractedGroups };
}

async function markdownFiles(directory) {
  return (await Array.fromAsync(fs.glob('**/*.md', { cwd: directory })))
    .map((file) => path.join(directory, file));
}

export async function runSidebarNormaliser({ directory = DEFAULT_IMPORT_DIR, write = false } = {}) {
  const files = await markdownFiles(directory);
  const summary = { mode: write ? 'write' : 'audit', scanned: files.length, changed: 0, extractedEntries: 0, extractedGroups: 0, existingSidebar: 0, noConfidentSidebar: 0, files: [] };

  for (const file of files) {
    const source = await fs.readFile(file, 'utf8');
    const result = normaliseImportedMarkdown(source, file);
    if (result.reason === 'existing-sidebar') summary.existingSidebar += 1;
    if (result.reason === 'no-confident-sidebar') summary.noConfidentSidebar += 1;
    if (!result.changed) continue;

    summary.changed += 1;
    summary.extractedEntries += result.extractedEntries;
    summary.extractedGroups += result.extractedGroups;
    summary.files.push(path.relative(directory, file).replace(/\\/g, '/'));
    if (write) await fs.writeFile(file, result.markdown, 'utf8');
  }

  console.log(`World Anvil sidebar normalisation (${summary.mode})`);
  console.log(`Scanned: ${summary.scanned}`);
  console.log(`${write ? 'Changed' : 'Would change'}: ${summary.changed}`);
  console.log(`Extracted entries: ${summary.extractedEntries}`);
  console.log(`Extracted groups: ${summary.extractedGroups}`);
  console.log(`Already had sidebar: ${summary.existingSidebar}`);
  console.log(`No confident sidebar block: ${summary.noConfidentSidebar}`);
  if (summary.files.length > 0) {
    console.log('Affected files:');
    for (const file of summary.files) console.log(`- ${file}`);
  }
  return summary;
}

function parseArgs(argv) {
  const args = { write: false, directory: DEFAULT_IMPORT_DIR };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--write') args.write = true;
    else if (argv[index] === '--dir') {
      index += 1;
      if (!argv[index]) throw new Error('--dir requires a path.');
      args.directory = path.resolve(argv[index]);
    } else if (argv[index] === '--help' || argv[index] === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return args;
}

if (isMainModule(import.meta.url)) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      console.log('Usage: node scripts/normalise-worldanvil-sidebars.mjs [--write] [--dir PATH]');
      console.log('Without --write, the command performs a read-only audit.');
    } else {
      await runSidebarNormaliser({ directory: args.directory, write: args.write });
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
