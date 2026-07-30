function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function requireText(errors, value, path) {
  if (!hasText(value)) errors.push(`${path} must be a non-empty string.`);
}

function requireObject(errors, value, path) {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object.`);
    return false;
  }
  return true;
}

function requireObjectList(errors, value, path, requiredFields) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array.`);
    return;
  }

  value.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (!requireObject(errors, item, itemPath)) return;
    for (const field of requiredFields) requireText(errors, item[field], `${itemPath}.${field}`);
  });
}

export function normaliseEraPrimerId(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function validateEraPrimerData(primer, expectedId) {
  const errors = [];
  if (!requireObject(errors, primer, 'eraPrimer')) return errors;

  for (const field of ['id', 'number', 'title', 'tagline', 'lead']) {
    requireText(errors, primer[field], `eraPrimer.${field}`);
  }

  const actualId = normaliseEraPrimerId(primer.id);
  const wantedId = normaliseEraPrimerId(expectedId);
  if (wantedId && actualId && actualId !== wantedId) {
    errors.push(`eraPrimer.id "${primer.id}" does not match shortcode "${expectedId}".`);
  }

  requireObjectList(errors, primer.traits, 'eraPrimer.traits', ['label', 'tip']);
  requireObjectList(errors, primer.essentials, 'eraPrimer.essentials', ['eyebrow', 'title', 'body']);
  requireObjectList(errors, primer.terms, 'eraPrimer.terms', ['label', 'tip']);
  requireObjectList(errors, primer.powers, 'eraPrimer.powers', ['title', 'summary']);
  requireObjectList(errors, primer.knowledge, 'eraPrimer.knowledge', ['label', 'body']);

  if (requireObject(errors, primer.map, 'eraPrimer.map')) {
    for (const field of ['src', 'alt', 'href', 'eyebrow', 'label', 'action']) {
      requireText(errors, primer.map[field], `eraPrimer.map.${field}`);
    }

    if (hasText(primer.map.href) && !primer.map.href.trim().startsWith('/maps/')) {
      errors.push('eraPrimer.map.href must use an internal Atlas route beginning with "/maps/".');
    }
  }

  if (requireObject(errors, primer.worldNow, 'eraPrimer.worldNow')) {
    requireText(errors, primer.worldNow.eyebrow, 'eraPrimer.worldNow.eyebrow');
    requireText(errors, primer.worldNow.title, 'eraPrimer.worldNow.title');
    const body = primer.worldNow.body;
    if (Array.isArray(body)) {
      if (body.length === 0) errors.push('eraPrimer.worldNow.body must not be empty.');
      body.forEach((paragraph, index) => requireText(errors, paragraph, `eraPrimer.worldNow.body[${index}]`));
    } else {
      requireText(errors, body, 'eraPrimer.worldNow.body');
    }
  }

  requireText(errors, primer.powersIntro, 'eraPrimer.powersIntro');

  if (requireObject(errors, primer.record, 'eraPrimer.record')) {
    for (const field of ['eyebrow', 'title', 'body', 'eventsHref', 'nextEraHref', 'nextEraLabel']) {
      requireText(errors, primer.record[field], `eraPrimer.record.${field}`);
    }
  }

  for (const [path, list] of [
    ['eraPrimer.essentials', primer.essentials],
    ['eraPrimer.terms', primer.terms],
    ['eraPrimer.powers', primer.powers],
  ]) {
    if (!Array.isArray(list)) continue;
    list.forEach((item, index) => {
      if (item?.link !== undefined) {
        if (requireObject(errors, item.link, `${path}[${index}].link`)) {
          requireText(errors, item.link.label, `${path}[${index}].link.label`);
          requireText(errors, item.link.href, `${path}[${index}].link.href`);
        }
      }
      if (item?.href !== undefined) requireText(errors, item.href, `${path}[${index}].href`);
      if (item?.sigil !== undefined) requireText(errors, item.sigil, `${path}[${index}].sigil`);
    });
  }

  return errors;
}

export function serialiseEraPrimerData(primer) {
  return JSON.stringify(primer)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
