import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { isMainModule } from './script-entry.mjs';
import { sidebarYaml } from './normalise-worldanvil-sidebars.mjs';

const DEFAULT_IMPORT_DIR = path.resolve(process.cwd(), '../Vault/Drafts/WorldAnvil Import');
const ARTWORK_DISCLAIMER = /all artwork that isn['’]t an original creation/i;

const META_FIELDS = new Map([
  ['role', 'Role'],
  ['manufacturer', 'Manufacturer'],
]);

const SPEC_FIELDS = new Map([
  ['length', 'Length'],
  ['width', 'Width'],
  ['height', 'Height'],
  ['weight', 'Weight'],
  ['curb weight', 'Curb weight'],
  ['carry weight', 'Carry weight'],
  ['crew', 'Crew'],
  ['passengers', 'Passengers'],
  ['capacity', 'Capacity'],
  ['level flight top speed (vh)', 'Level flight top speed (VH)'],
  ['design diving speed (vd)', 'Design diving speed (VD)'],
]);

const POWER_FIELDS = new Map([
  ['engine', 'Engine'],
  ['motors', 'Motors'],
  ['turbocharger', 'Turbocharger'],
  ['power output', 'Power output'],
  ['torque output', 'Torque output'],
  ['e-power output', 'e-Power output'],
  ['e-torque output', 'e-Torque output'],
  ['top speed', 'Top speed'],
  ['pwr ratio (standard)(hp/lb)', 'PWR ratio (standard)(hp/lb)'],
  ['pwr ratio (plus e-power)(hp/lb)', 'PWR ratio (plus e-power)(hp/lb)'],
  ['pwr ratio (hp/lb)', 'PWR ratio (hp/lb)'],
  ['transmission', 'Transmission'],
  ['drivetrain', 'Drivetrain'],
  ['range extender', 'Range extender'],
]);

const SUSPENSION_FIELDS = new Map([
  ['spring type', 'Spring type'],
  ['axle type', 'Axle type'],
]);

const ARMAMENT_FIELDS = new Map([
  ['nose gun', 'Nose gun'],
  ['door gun(s)', 'Door gun(s)'],
  ['door guns', 'Door guns'],
  ['primary armament', 'Primary armament'],
  ['secondary armament', 'Secondary armament'],
  ['coaxial weapon', 'Coaxial weapon'],
]);

const UNIT_PLACEHOLDERS = new Set([
  'l',
  'hp (kw)',
  'lb⋅ft (n⋅m)',
  'lb-ft (n-m)',
  'mph (kph)',
  'kw',
  'm (ft)',
  'kg (lbs)',
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

function cleanValue(value) {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/^\s*[-*+]\s+/, '')
    .trim()
    .replace(/,+$/, '');
}

function isPlaceholderValue(value) {
  const text = cleanValue(value);
  const key = text.toLocaleLowerCase('en');
  if (!text) return true;
  if (/^\[?(?:tbc|tbd|n\/?a)\]?$/i.test(text)) return true;
  if (/^_+$/.test(text)) return true;
  if (/^_+(?:m|kg)\s+\(_+(?:ft|lbs)\)$/i.test(text)) return true;
  return UNIT_PLACEHOLDERS.has(key);
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
  return /^#{2,6}\s+/.test(text) || ARTWORK_DISCLAIMER.test(text) || /^---+$/.test(text);
}

function singleLineKey(block) {
  if (!block || block.text.includes('\n')) return null;
  return keyFor(block.text);
}

function fieldToken(block, activeSection) {
  const key = singleLineKey(block);
  if (!key) return null;
  if (META_FIELDS.has(key)) return { label: META_FIELDS.get(key), target: 'meta' };
  if (SPEC_FIELDS.has(key)) return { label: SPEC_FIELDS.get(key), target: 'Specifications' };
  if (POWER_FIELDS.has(key)) return { label: POWER_FIELDS.get(key), target: 'Power plant' };
  if (SUSPENSION_FIELDS.has(key)) return { label: SUSPENSION_FIELDS.get(key), target: 'Suspension' };
  if (ARMAMENT_FIELDS.has(key)) return { label: ARMAMENT_FIELDS.get(key), target: 'Armament' };
  if (activeSection) return null;
  return null;
}

function sectionToken(block, nextBlock) {
  const key = singleLineKey(block);
  if (!key) return null;
  if (key === 'power plant') return 'Power plant';
  if (key === 'suspension') return 'Suspension';
  if (key === 'armament') {
    const nextKey = singleLineKey(nextBlock);
    if (nextKey && ARMAMENT_FIELDS.has(nextKey)) return 'Armament';
  }
  return null;
}

function armamentAsSimpleField(block, nextBlock) {
  return singleLineKey(block) === 'armament' && sectionToken(block, nextBlock) === null;
}

function knownLabel(block, activeSection, nextBlock) {
  const section = sectionToken(block, nextBlock);
  if (section) return { kind: 'section', title: section };
  if (armamentAsSimpleField(block, nextBlock)) return { kind: 'field', label: 'Armament', target: 'Specifications' };
  const field = fieldToken(block, activeSection);
  return field ? { kind: 'field', ...field } : null;
}

function ensureSection(sections, title) {
  let section = sections.find((item) => item.title === title);
  if (!section) {
    section = { title, fields: [], items: [] };
    sections.push(section);
  }
  return section;
}

function blockValues(block) {
  return String(block?.text ?? '')
    .split('\n')
    .map(cleanValue)
    .filter((value) => value && !isPlaceholderValue(value));
}

function addField(sidebar, token, valueBlock) {
  const values = blockValues(valueBlock);
  if (values.length === 0) return false;
  const value = values.length === 1 ? values[0] : values;
  const field = { label: token.label, value };
  if (token.target === 'meta') sidebar.meta.push(field);
  else ensureSection(sidebar.sections, token.target).fields.push(field);
  return true;
}

function findSidebarStart(blocks) {
  for (let index = 0; index < blocks.length; index += 1) {
    const key = singleLineKey(blocks[index]);
    if (key === 'role' || key === 'manufacturer') return index;
  }
  return -1;
}

function findSidebarEnd(blocks, startIndex) {
  for (let index = startIndex; index < blocks.length; index += 1) {
    if (ARTWORK_DISCLAIMER.test(blocks[index].text)) return index - 1;
    if (index > startIndex && /^#{2,6}\s+/.test(blocks[index].text)) return index - 1;
  }
  return blocks.length - 1;
}

export function extractVehicleSidebar(body) {
  const { lines, blocks } = blocksFromBody(body);
  const startIndex = findSidebarStart(blocks);
  if (startIndex === -1) return { body, sidebar: null, extractedEntries: 0 };
  const endIndex = findSidebarEnd(blocks, startIndex);
  const sidebar = { meta: [], sections: [] };
  const consumed = new Set();
  let activeSection = null;
  let extractedEntries = 0;
  let index = startIndex;

  while (index <= endIndex) {
    const block = blocks[index];
    if (isBoundary(block)) break;
    const next = index + 1 <= endIndex ? blocks[index + 1] : null;
    const token = knownLabel(block, activeSection, next);

    if (!token) {
      index += 1;
      continue;
    }

    consumed.add(index);
    if (token.kind === 'section') {
      activeSection = token.title;
      index += 1;
      continue;
    }

    const nextToken = next ? knownLabel(next, activeSection, index + 2 <= endIndex ? blocks[index + 2] : null) : null;
    if (!next || isBoundary(next) || nextToken) {
      index += 1;
      continue;
    }

    if (addField(sidebar, token, next)) extractedEntries += 1;
    consumed.add(index + 1);
    index += 2;
  }

  sidebar.sections = sidebar.sections.filter((section) => section.fields.length > 0 || section.items.length > 0);
  if (extractedEntries === 0) return { body, sidebar: null, extractedEntries: 0 };

  const removeLines = new Set();
  for (const blockIndex of consumed) {
    const block = blocks[blockIndex];
    for (let lineIndex = block.start; lineIndex <= block.end; lineIndex += 1) removeLines.add(lineIndex);
  }
  const cleaned = lines.filter((_, lineIndex) => !removeLines.has(lineIndex)).join('\n').replace(/\n{3,}/g, '\n\n').trimStart();
  return { body: cleaned, sidebar, extractedEntries };
}

function splitFrontmatter(markdown) {
  const text = String(markdown ?? '').replace(/\r\n/g, '\n');
  if (!text.startsWith('---\n')) return { frontmatter: '', body: text, hasFrontmatter: false };
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) return { frontmatter: '', body: text, hasFrontmatter: false };
  return { frontmatter: text.slice(4, end), body: text.slice(end + 5), hasFrontmatter: true };
}

export function normaliseVehicleMarkdown(markdown) {
  const parts = splitFrontmatter(markdown);
  if (/^sidebar:\s*$/m.test(parts.frontmatter)) return { changed: false, markdown, reason: 'existing-sidebar', extractedEntries: 0 };
  const extracted = extractVehicleSidebar(parts.body);
  if (!extracted.sidebar) return { changed: false, markdown, reason: 'no-confident-sidebar', extractedEntries: 0 };

  const generated = sidebarYaml(extracted.sidebar);
  let output;
  if (parts.hasFrontmatter) {
    const frontmatter = parts.frontmatter.trimEnd();
    output = `---\n${frontmatter}${frontmatter ? '\n' : ''}${generated}\n---\n${extracted.body}`;
  } else {
    output = `---\n${generated}\n---\n${extracted.body}`;
  }
  if (String(markdown).endsWith('\n') && !output.endsWith('\n')) output += '\n';
  return { changed: output !== markdown, markdown: output, reason: 'normalised', extractedEntries: extracted.extractedEntries };
}

async function vehicleFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.startsWith('Vehicle-') && entry.name.endsWith('.md'))
    .map((entry) => path.join(directory, entry.name));
}

export async function runVehicleSidebarNormaliser({ directory = DEFAULT_IMPORT_DIR, write = false } = {}) {
  const files = await vehicleFiles(directory);
  const summary = { mode: write ? 'write' : 'audit', scanned: files.length, changed: 0, extractedEntries: 0, files: [] };
  for (const file of files) {
    const source = await fs.readFile(file, 'utf8');
    const result = normaliseVehicleMarkdown(source);
    if (!result.changed) continue;
    summary.changed += 1;
    summary.extractedEntries += result.extractedEntries;
    summary.files.push(path.basename(file));
    if (write) await fs.writeFile(file, result.markdown, 'utf8');
  }

  console.log(`World Anvil vehicle sidebar normalisation (${summary.mode})`);
  console.log(`Scanned vehicles: ${summary.scanned}`);
  console.log(`${write ? 'Changed' : 'Would change'}: ${summary.changed}`);
  console.log(`Extracted entries: ${summary.extractedEntries}`);
  if (summary.files.length > 0) {
    console.log('Affected vehicles:');
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
      console.log('Usage: node scripts/normalise-worldanvil-vehicle-sidebars.mjs [--write] [--dir PATH]');
    } else {
      await runVehicleSidebarNormaliser({ directory: args.directory, write: args.write });
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
