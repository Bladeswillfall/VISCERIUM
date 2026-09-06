import path from 'node:path';
import process from 'node:process';
import { parseIconSpec } from '../src/lib/icon-spec.mjs';
import { findInvalidFrontmatterReferences } from '../src/lib/frontmatter-reference.mjs';
import { validateEraPrimerData } from '../src/lib/era-primer-data.mjs';
import { vaultSourceSlug } from '../src/lib/codex-paths.mjs';
import { resolveCommunityForPage } from '../src/lib/page-kind.mjs';
import {
  ERA_VALUES,
  buildContinuityFamilies,
  eraFromPath,
  normaliseEra,
  pageEra,
  validEntityId,
} from '../src/lib/era-context.mjs';
import { loadVaultContent } from './content-manifest.mjs';
import { inferNoteType } from './note-inference.mjs';
import { isMainModule } from './script-entry.mjs';

const siteRoot = process.cwd();
const requiredPublicFields = ['title', 'description'];
const iconFields = ['icon', 'sidebarIcon', 'titleIcon'];
const communityIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const forbiddenActiveTag = /<\s*\/?\s*(?:script|iframe|object|embed|base)\b/i;
const inlineEventHandler = /<[^>]*\son[a-z][\w:-]*\s*=/i;
const unsafeUrlScheme = /(?:\b(?:href|src|action|formaction)\s*=\s*["']?\s*|\]\(\s*)(?:javascript:|data\s*:\s*text\/html)/i;
const remoteMdxModule = /^\s*(?:import\s+(?:[^'"\n]+\s+from\s+)?|export[^\n]*\s+from\s+)["'](?:https?:|data:|javascript:)/im;
const remoteDynamicImport = /\bimport\s*\(\s*["'](?:https?:|data:|javascript:)/i;
const eraPrimerShortcode = /^\s*\[EraPrimer:([^\]\s]+)\]\s*$/gim;
const migrationReviewScaffolding = /<!--\s*worldanvil-migration-review:(?:start|end)\s*-->/i;
const draftInboxWikilink = /!?\[\[Drafts\/Inbox\/[^\]]+\]\]/i;

function relative(file) {
  return path.relative(siteRoot, file).replace(/\\/g, '/');
}

function executableSurface(content) {
  return String(content ?? '')
    .replace(/(`{3,}|~{3,})[\s\S]*?\1/g, '')
    .replace(/`[^`\n]*`/g, '');
}

function eraValues(value) {
  if (value === undefined || value === null || value === '') return [];
  return Array.isArray(value) ? value : [value];
}

function validateIcon(spec, label, file, fail) {
  if (spec === undefined || spec === null || spec === '') return;
  if (typeof spec !== 'string' || !parseIconSpec(spec)) {
    fail(`Invalid ${label} icon specification in ${relative(file)}: ${JSON.stringify(spec)}`);
  }
}

function validateActiveContent(content, file, fail) {
  const surface = executableSurface(content);
  if (forbiddenActiveTag.test(surface)) {
    fail(`Published note contains a forbidden active HTML tag: ${relative(file)}`);
  }
  if (inlineEventHandler.test(surface)) {
    fail(`Published note contains an inline HTML event handler: ${relative(file)}`);
  }
  if (unsafeUrlScheme.test(surface)) {
    fail(`Published note contains a javascript: or data:text/html URL: ${relative(file)}`);
  }
  if (remoteMdxModule.test(surface) || remoteDynamicImport.test(surface)) {
    fail(`Published note imports executable MDX code from a remote URL: ${relative(file)}`);
  }
}

function validateEraPrimerSource(content, data, file, fail) {
  const matches = [...String(content ?? '').matchAll(eraPrimerShortcode)];
  eraPrimerShortcode.lastIndex = 0;

  if (matches.length === 0) {
    if (data.eraPrimer !== undefined) {
      fail(`Lore note has eraPrimer data but no [EraPrimer:id] shortcode: ${relative(file)}`);
    }
    return;
  }

  if (matches.length > 1) {
    fail(`Lore note contains more than one era primer shortcode: ${relative(file)}`);
    return;
  }

  const eraId = matches[0][1].trim().toLowerCase();
  const errors = validateEraPrimerData(data.eraPrimer, eraId);
  for (const error of errors) {
    fail(`Invalid Vault-owned era primer in ${relative(file)}: ${error}`);
  }
}

function validateControlledEraFields(data, file, fail) {
  for (const [field, value] of [['era', data.era], ['eras', data.eras]]) {
    for (const rawEra of eraValues(value)) {
      if (!normaliseEra(rawEra)) {
        fail(`Invalid ${field} value in ${relative(file)}: ${JSON.stringify(rawEra)}. Allowed values: ${ERA_VALUES.join(', ')}.`);
      }
    }
  }
}

function validatePublishedMetadata({ file, data, content }, fail) {
  for (const reference of findInvalidFrontmatterReferences(data)) {
    fail(`Invalid frontmatter ${reference.kind} reference "${reference.field}" in ${relative(file)}: ${JSON.stringify(reference.value)}`);
  }

  if (migrationReviewScaffolding.test(content)) {
    fail(`Published note contains World Anvil migration review scaffolding: ${relative(file)}`);
  }
  if (draftInboxWikilink.test(content)) {
    fail(`Published note links to Drafts/Inbox; publish the target or leave the term unlinked: ${relative(file)}`);
  }

  validateEraPrimerSource(content, data, file, fail);

  if (data.entity_id && Object.hasOwn(data, 'eras')) {
    fail(`Published continuity edition uses transitional "eras" metadata; choose one scalar era/Universal scope or create separate era editions: ${relative(file)}`);
  }
  if (data.entity_id && Array.isArray(data.era)) {
    fail(`Published continuity edition uses an era array; editions require one scalar era/Universal value: ${relative(file)}`);
  }
  if (Object.hasOwn(data, 'slug')) {
    fail(`Published note routes are derived from file paths; remove frontmatter "slug": ${relative(file)}`);
  }

  for (const field of requiredPublicFields) {
    if (!data[field]) fail(`Published note is missing required frontmatter "${field}": ${relative(file)}`);
  }
  for (const field of iconFields) {
    validateIcon(data[field], `frontmatter "${field}"`, file, fail);
  }
  for (const match of content.matchAll(/^\s{0,3}#{1,6}\s+\[icon:([^\]]+)\]/gim)) {
    validateIcon(match[1], 'heading shortcode', file, fail);
  }
}

function validatePublishedContinuity({ file, relativePath, data }, folderEra, effectiveEra, fail) {
  if (data.entity_id && !effectiveEra) {
    fail(`Published continuity edition has entity_id but no controlled era: ${relative(file)}`);
  }
  if (data.entity_id && effectiveEra && effectiveEra !== 'Universal' && folderEra !== effectiveEra) {
    fail(`Published ${effectiveEra} continuity edition must live beneath Lore/Eras/${effectiveEra}/ so its public route remains inside that era context: ${relative(file)}`);
  }
  if (
    data.entity_id
    && effectiveEra === 'Universal'
    && !String(relativePath ?? '').replace(/\\/g, '/').toLowerCase().startsWith('universal/')
  ) {
    fail(`Published Universal continuity edition must live beneath Lore/Universal/ so it is available from every era without masquerading as a historical edition: ${relative(file)}`);
  }
}

function validateRecord(record, fail) {
  const { file, relativePath, data, content } = record;

  if (Object.hasOwn(data, 'publish')) {
    fail(`Lore note uses retired frontmatter "publish"; remove it and use status: published when public: ${relative(file)}`);
  }
  if (data.status === 'canon') {
    fail(`Lore note uses retired status: canon; use status: published when public: ${relative(file)}`);
    return;
  }

  validateControlledEraFields(data, file, fail);

  if (data.entity_id !== undefined && data.entity_id !== null && data.entity_id !== '' && !validEntityId(data.entity_id)) {
    fail(`Invalid entity_id in ${relative(file)}: ${JSON.stringify(data.entity_id)}. Use stable lowercase kebab-case such as "okse-dominion-a".`);
  }

  const folderEra = eraFromPath(relativePath ?? file);
  const declaredEra = normaliseEra(Array.isArray(data.era) ? data.era[0] : data.era);
  if (folderEra && declaredEra && folderEra !== declaredEra) {
    fail(`Era mismatch in ${relative(file)}: folder implies ${folderEra} but frontmatter declares ${declaredEra}.`);
  }

  const effectiveEra = pageEra(data, relativePath ?? file);
  if (data.type === 'event' && effectiveEra === 'Universal') {
    fail(`Events are chronological and cannot use era: Universal: ${relative(file)}`);
  }
  if (data.status !== 'published') return;

  validatePublishedMetadata(record, fail);
  validatePublishedContinuity(record, folderEra, effectiveEra, fail);
  validateActiveContent(content, file, fail);
}

function validateContinuityFamilies(records, fail) {
  const published = records.filter((record) => record.data?.status === 'published');
  const families = buildContinuityFamilies(published);

  for (const family of families.values()) {
    const types = [...new Set(family.records.map((record) => record.data?.type).filter(Boolean))];
    if (types.length > 1) {
      fail(`Continuity family "${family.entity_id}" mixes entity types (${types.join(', ')}). Keep one conceptual type per entity_id.`);
    }

    const eras = [...family.editions.keys()];
    if (eras.includes('Universal') && eras.some((era) => era !== 'Universal')) {
      fail(`Continuity family "${family.entity_id}" mixes Universal with historical editions. Use the generated entity hub instead of an authored Universal parent.`);
    }

    for (const [era, familyRecords] of family.editions.entries()) {
      if (familyRecords.length <= 1) continue;
      fail(`Continuity family "${family.entity_id}" has ${familyRecords.length} published ${era} editions: ${familyRecords.map((record) => relative(record.file)).join(', ')}`);
    }
  }
}

function validateCommunityIds(records, fail) {
  const seen = new Map();

  for (const record of records) {
    const { file, relativePath, data } = record;
    const communityId = data?.community_id;

    if (communityId !== undefined) {
      if (typeof communityId !== 'string' || !communityIdPattern.test(communityId)) {
        fail(`Invalid community_id in ${relative(file)}: ${JSON.stringify(communityId)}. Use a UUIDv4 value.`);
      } else {
        const previous = seen.get(communityId);
        if (previous) {
          fail(`Duplicate community_id "${communityId}" in ${previous} and ${relative(file)}.`);
        } else {
          seen.set(communityId, relative(file));
        }
      }
    }

    if (data?.status !== 'published' || !relativePath) continue;

    const slug = vaultSourceSlug(relativePath);
    const type = data.type ?? inferNoteType(path.join('source', relativePath), 'source');
    if (!resolveCommunityForPage({ ...data, slug, type }, slug)) continue;

    if (!communityId) {
      fail(`Published Community page is missing community_id: ${relative(file)}`);
    }
  }
}

export function validateVaultNotes(manifest) {
  let failed = false;

  function fail(message) {
    console.error(message);
    failed = true;
  }

  for (const record of manifest.records) {
    validateRecord(record, fail);
  }
  validateContinuityFamilies(manifest.records, fail);
  validateCommunityIds(manifest.records, fail);

  if (!failed) console.log(`Validated ${manifest.records.length} vault source note(s).`);
  return !failed;
}

if (isMainModule(import.meta.url)) {
  const valid = validateVaultNotes(await loadVaultContent());
  if (!valid) process.exitCode = 1;
}
