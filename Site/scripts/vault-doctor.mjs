import path from 'node:path';
import process from 'node:process';
import { scanMarkdownContent } from './content-manifest.mjs';
import { isMainModule } from './script-entry.mjs';

const ORDINARY_ENTITY_FOLDERS = new Map([
  ['fauna', 'Drafts/Databases/Fauna'],
  ['flora', 'Drafts/Databases/Flora'],
  ['fungi', 'Drafts/Databases/Fungi'],
  ['item', 'Drafts/Databases/Items'],
]);
const MYRKILD_FOLDER = 'Drafts/Databases/Myrkild Units';
const CREATOR_TYPES = new Set([...ORDINARY_ENTITY_FOLDERS.keys(), 'myrkild-unit']);
const DEVELOPMENT_LEVELS = new Set(['stub', 'usable', 'developed']);
const ERAS = new Set(['CITADEL', 'SMOG', 'NEARSIGHT', 'ENTROPY']);
const LIST_PROPERTIES = ['locations', 'biomes', 'tags'];

function recordPath(record) {
  return String(record.relativePath ?? record.file ?? '<unknown>').replace(/\\/g, '/');
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normaliseName(value) {
  return String(value ?? '')
    .toLocaleLowerCase('en')
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function wikiTarget(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]$/);
  return match?.[1]?.trim() ?? null;
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

function canonicalNameIndex(records) {
  const names = new Map();
  for (const record of records) {
    const file = recordPath(record);
    if (!file.startsWith('Lore/')) continue;
    if (record.data?.status !== 'published') continue;
    const candidates = [record.data?.title, path.basename(file, path.extname(file))].filter(nonEmptyString);
    for (const candidate of candidates) {
      const normalised = normaliseName(candidate);
      if (normalised && !names.has(normalised)) names.set(normalised, candidate.trim());
    }
  }
  return names;
}

function addDiagnostic(diagnostics, severity, code, file, message) {
  diagnostics.push({ severity, code, file, message });
}

function validateListProperty(diagnostics, file, data, property) {
  if (!Object.hasOwn(data, property) || data[property] == null) return;
  if (!Array.isArray(data[property])) {
    addDiagnostic(diagnostics, 'error', 'property-type', file, `"${property}" must be a list when present.`);
  }
}

function validateEraList(diagnostics, file, eras) {
  if (eras == null) return;
  if (!Array.isArray(eras)) {
    addDiagnostic(diagnostics, 'error', 'eras-type', file, '"eras" must be a list for fauna, flora, fungi and item entries.');
    return;
  }
  for (const era of eras) {
    if (!ERAS.has(era)) {
      addDiagnostic(diagnostics, 'error', 'unknown-era', file, `Unknown era in "eras": ${JSON.stringify(era)}.`);
    }
  }
}

function nearestCanonicalName(value, canonicalNames) {
  if (!nonEmptyString(value) || wikiTarget(value)) return null;
  const normalised = normaliseName(value);
  if (normalised.length < 5 || canonicalNames.has(normalised)) return null;
  let best = null;
  for (const [candidateNormalised, candidate] of canonicalNames) {
    if (Math.abs(candidateNormalised.length - normalised.length) > 2) continue;
    if (candidateNormalised[0] !== normalised[0]) continue;
    const distance = levenshtein(normalised, candidateNormalised);
    if (distance > 2) continue;
    if (!best || distance < best.distance) best = { candidate, distance };
    else if (distance === best.distance && candidate !== best.candidate) best.ambiguous = true;
  }
  return best && !best.ambiguous ? best.candidate : null;
}

export function diagnoseCreatorVault(manifest) {
  const diagnostics = [];
  const records = manifest.records ?? [];
  const canonicalNames = canonicalNameIndex(records);
  const unitIds = new Map();
  let entityCount = 0;

  for (const record of records) {
    const file = recordPath(record);
    if (file.startsWith('Templates/')) continue;
    const data = record.data ?? {};

    if (Object.hasOwn(data, 'publish')) {
      addDiagnostic(
        diagnostics,
        'error',
        'legacy-publish-field',
        file,
        'Remove the legacy "publish" boolean. Publication is controlled by status: published and Lore/ placement.',
      );
    }

    const type = data.type;
    const ordinaryFolderEntry = [...ORDINARY_ENTITY_FOLDERS].find(([, folder]) => file.startsWith(`${folder}/`));
    const inMyrkildFolder = file.startsWith(`${MYRKILD_FOLDER}/`);
    const inCreatorDatabase = Boolean(ordinaryFolderEntry || inMyrkildFolder);
    const isCreatorType = CREATOR_TYPES.has(type);

    if (!inCreatorDatabase && !isCreatorType) continue;
    entityCount += 1;

    if (ordinaryFolderEntry && type !== ordinaryFolderEntry[0]) {
      addDiagnostic(
        diagnostics,
        'error',
        'folder-type-mismatch',
        file,
        `Folder implies type "${ordinaryFolderEntry[0]}", but frontmatter type is ${JSON.stringify(type)}.`,
      );
    }
    if (inMyrkildFolder && type !== 'myrkild-unit') {
      addDiagnostic(
        diagnostics,
        'error',
        'folder-type-mismatch',
        file,
        `Myrkild Units folder requires type "myrkild-unit", but found ${JSON.stringify(type)}.`,
      );
    }

    if (isCreatorType && !nonEmptyString(data.title)) {
      addDiagnostic(diagnostics, 'error', 'missing-title', file, 'Creator entity is missing a non-empty "title".');
    }
    if (isCreatorType && !nonEmptyString(data.description)) {
      addDiagnostic(diagnostics, 'error', 'missing-description', file, 'Creator entity is missing a non-empty "description".');
    }
    if (Object.hasOwn(data, 'development_level') && data.development_level != null && !DEVELOPMENT_LEVELS.has(data.development_level)) {
      addDiagnostic(
        diagnostics,
        'error',
        'development-level',
        file,
        `Unknown development_level ${JSON.stringify(data.development_level)}; expected stub, usable or developed.`,
      );
    }
    for (const property of LIST_PROPERTIES) validateListProperty(diagnostics, file, data, property);

    if (ORDINARY_ENTITY_FOLDERS.has(type)) {
      validateEraList(diagnostics, file, data.eras);
      if (file.startsWith('Drafts/Databases/') && Object.hasOwn(data, 'era')) {
        addDiagnostic(
          diagnostics,
          'notice',
          'ordinary-era-property',
          file,
          'Ordinary story entities use plural "eras" in the creator database; singular "era" may be legacy or accidental.',
        );
      }
      if (!file.includes('/') || (!file.startsWith('Drafts/') && !file.startsWith('Lore/'))) {
        addDiagnostic(
          diagnostics,
          'notice',
          'loose-entity',
          file,
          'Story entity sits outside Drafts/ or Lore/. Consider filing it into the creator database or canonical lore.',
        );
      }
      if (Array.isArray(data.locations)) {
        for (const location of data.locations) {
          if (typeof location !== 'string') continue;
          const suggestion = nearestCanonicalName(location, canonicalNames);
          if (suggestion) {
            addDiagnostic(
              diagnostics,
              'notice',
              'near-canonical-name',
              file,
              `Location ${JSON.stringify(location)} closely resembles canonical note title ${JSON.stringify(suggestion)}. Check spelling or link it explicitly if they are the same place.`,
            );
          }
        }
      }
    }

    if (type === 'myrkild-unit') {
      if (data.era != null && !ERAS.has(data.era)) {
        addDiagnostic(diagnostics, 'error', 'unknown-era', file, `Unknown Myrkild era: ${JSON.stringify(data.era)}.`);
      }
      if (nonEmptyString(data.unit_id)) {
        const existing = unitIds.get(data.unit_id);
        if (existing) {
          addDiagnostic(
            diagnostics,
            'error',
            'duplicate-unit-id',
            file,
            `Duplicate Myrkild unit_id ${JSON.stringify(data.unit_id)}; already used by ${existing}.`,
          );
        } else {
          unitIds.set(data.unit_id, file);
        }
      }
    }
  }

  diagnostics.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'error' ? -1 : 1;
    return a.file.localeCompare(b.file) || a.code.localeCompare(b.code);
  });
  const errors = diagnostics.filter((item) => item.severity === 'error');
  const notices = diagnostics.filter((item) => item.severity === 'notice');
  return { ok: errors.length === 0, entityCount, errors, notices, diagnostics };
}

export function printVaultDoctor(result) {
  for (const item of result.diagnostics) {
    const line = `${item.severity === 'error' ? 'ERROR' : 'NOTICE'} [${item.code}] ${item.file}: ${item.message}`;
    if (item.severity === 'error') console.error(line);
    else console.warn(line);
  }
  console.log(`Vault Doctor checked ${result.entityCount} creator entit${result.entityCount === 1 ? 'y' : 'ies'}: ${result.errors.length} error(s), ${result.notices.length} notice(s).`);
}

async function loadWholeVault() {
  const vaultRoot = path.resolve(process.cwd(), '../Vault');
  return scanMarkdownContent(vaultRoot, { refresh: true });
}

if (isMainModule(import.meta.url)) {
  const result = diagnoseCreatorVault(await loadWholeVault());
  printVaultDoctor(result);
  if (!result.ok) process.exitCode = 1;
}
