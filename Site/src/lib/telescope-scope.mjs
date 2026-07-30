import { normaliseEra, validEntityId } from './era-context.mjs';

export function normaliseTelescopePath(value) {
  return String(value ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.(md|mdx)$/i, '');
}

export function telescopeMetadataKey(value) {
  return normaliseTelescopePath(value).toLowerCase();
}

export function telescopeScopeLabel(era) {
  const normalized = normaliseEra(era);
  return normalized && normalized !== 'Universal'
    ? `${normalized} + Universal`
    : 'All eras';
}

function metadataFor(page, metadata = {}) {
  const key = telescopeMetadataKey(page?.path);
  return metadata[key] ?? metadata[normaliseTelescopePath(page?.path)] ?? null;
}

export function filterTelescopePages(pages, metadata = {}, era) {
  const source = Array.isArray(pages) ? pages : [];
  const activeEra = normaliseEra(era);
  const historicalEra = activeEra && activeEra !== 'Universal' ? activeEra : null;

  const continuityHubs = new Set(
    Object.values(metadata)
      .filter((entry) => entry?.type === 'continuity' && validEntityId(entry?.entity_id))
      .map((entry) => entry.entity_id),
  );

  return source.filter((page) => {
    const meta = metadataFor(page, metadata);

    if (meta?.searchable === false) return false;

    if (historicalEra) {
      // Unknown metadata is excluded inside an era. It is safer for a scoped search
      // to omit an unclassified page than to leak another era into the result set.
      if (!meta) return false;
      if (meta.type === 'continuity') return false;
      const pageEra = normaliseEra(meta.era);
      return pageEra === historicalEra || pageEra === 'Universal';
    }

    // In the all-era Codex, one continuity hub represents a conceptual entity.
    // Hide its individual editions only when a generated hub actually exists.
    if (
      meta
      && meta.type !== 'continuity'
      && validEntityId(meta.entity_id)
      && continuityHubs.has(meta.entity_id)
    ) {
      return false;
    }

    return true;
  });
}
