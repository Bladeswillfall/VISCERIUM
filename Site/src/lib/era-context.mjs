export const HISTORICAL_ERAS = Object.freeze(['CITADEL', 'SMOG', 'NEARSIGHT', 'ENTROPY']);
export const ERA_VALUES = Object.freeze([...HISTORICAL_ERAS, 'Universal']);
export const ENTITY_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const eraByKey = new Map(ERA_VALUES.map((era) => [era.toLowerCase(), era]));
const historicalSlugs = new Map(HISTORICAL_ERAS.map((era) => [era.toLowerCase(), era]));

export function normaliseEra(value) {
  if (typeof value !== 'string') return undefined;
  const key = value.trim().toLowerCase();
  return eraByKey.get(key);
}

export function isValidEra(value) {
  return Boolean(normaliseEra(value));
}

export function isHistoricalEra(value) {
  const era = normaliseEra(value);
  return Boolean(era && era !== 'Universal');
}

export function isUniversalEra(value) {
  return normaliseEra(value) === 'Universal';
}

export function eraSlug(value) {
  const era = normaliseEra(value);
  return era ? era.toLowerCase() : undefined;
}

export function eraFromPath(value) {
  const path = String(value ?? '').replace(/\\/g, '/');
  const match = path.match(/(?:^|\/)eras\/(citadel|smog|nearsight|entropy)(?:\/|$)/i);
  return match ? historicalSlugs.get(match[1].toLowerCase()) : undefined;
}

export function pageEra(data = {}, path = '') {
  return normaliseEra(data.era) ?? eraFromPath(path);
}

export function validEntityId(value) {
  return typeof value === 'string' && ENTITY_ID_PATTERN.test(value.trim());
}

export function continuityHubRoute(entityId) {
  return `/entities/${String(entityId).trim()}/`;
}

function candidateKey(candidate) {
  return `${candidate.slug ?? candidate.path ?? ''}|${candidate.era ?? ''}|${candidate.entity_id ?? ''}`;
}

function uniqueCandidates(candidates) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = candidateKey(candidate);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Resolve a conceptual link without silently crossing historical eras.
 * Resolution order inside an era is: same-era edition, Universal page,
 * generated continuity hub. A global source may resolve a unique page directly,
 * otherwise it falls back to a shared continuity hub when all candidates belong
 * to the same entity family.
 */
export function resolveContextualTarget(candidates, sourceEra) {
  const list = uniqueCandidates((candidates ?? []).filter(Boolean));
  if (list.length === 0) return null;

  const contextEra = normaliseEra(sourceEra);
  if (contextEra && contextEra !== 'Universal') {
    const sameEra = list.filter((candidate) => normaliseEra(candidate.era) === contextEra);
    if (sameEra.length === 1) return { kind: 'page', candidate: sameEra[0] };
    if (sameEra.length > 1) return null;

    const universal = list.filter((candidate) => normaliseEra(candidate.era) === 'Universal');
    if (universal.length === 1) return { kind: 'page', candidate: universal[0] };
    if (universal.length > 1) return null;
  } else if (contextEra === 'Universal') {
    const universal = list.filter((candidate) => normaliseEra(candidate.era) === 'Universal');
    if (universal.length === 1) return { kind: 'page', candidate: universal[0] };
    if (universal.length > 1) return null;
  }

  if (!contextEra && list.length === 1) return { kind: 'page', candidate: list[0] };

  const entityIds = [...new Set(list.map((candidate) => candidate.entity_id).filter(validEntityId))];
  if (entityIds.length === 1 && list.every((candidate) => candidate.entity_id === entityIds[0])) {
    return { kind: 'continuity', entity_id: entityIds[0], route: continuityHubRoute(entityIds[0]) };
  }

  return null;
}

export function buildContinuityFamilies(records) {
  const families = new Map();
  for (const record of records ?? []) {
    const data = record?.data ?? {};
    const entityId = typeof data.entity_id === 'string' ? data.entity_id.trim() : '';
    if (!validEntityId(entityId)) continue;
    const era = pageEra(data, record.relativePath ?? record.slug ?? record.file ?? '');
    const family = families.get(entityId) ?? {
      entity_id: entityId,
      title: data.title,
      type: data.type,
      editions: new Map(),
      records: [],
    };
    family.records.push(record);
    if (era) {
      const entries = family.editions.get(era) ?? [];
      entries.push(record);
      family.editions.set(era, entries);
    }
    families.set(entityId, family);
  }
  return families;
}
