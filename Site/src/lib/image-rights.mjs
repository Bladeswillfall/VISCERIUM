const CC_ICON_BASE = 'https://mirrors.creativecommons.org/presskit/icons';

const CC_LICENSE_ICONS = {
  'BY': ['by'],
  'BY-SA': ['by', 'sa'],
  'BY-ND': ['by', 'nd'],
  'BY-NC': ['by', 'nc'],
  'BY-NC-SA': ['by', 'nc', 'sa'],
  'BY-NC-ND': ['by', 'nc', 'nd'],
};

const ICON_LABELS = {
  cc: 'Creative Commons',
  by: 'Attribution',
  nc: 'NonCommercial',
  sa: 'ShareAlike',
  nd: 'NoDerivatives',
  pd: 'Public Domain',
  zero: 'CC0',
};

function icon(name) {
  return {
    name,
    label: ICON_LABELS[name],
    src: `${CC_ICON_BASE}/${name}.svg`,
  };
}

function normaliseCcCode(value) {
  let normalised = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[–—_]/g, '-')
    .replace(/\s+/g, ' ');

  normalised = normalised
    .replace(/^CREATIVE COMMONS\s+/, '')
    .replace(/^CC\s+/, '');

  let version;
  const versionMatch = normalised.match(/\s+(\d+(?:\.\d+)?)$/);
  if (versionMatch) {
    version = versionMatch[1];
    normalised = normalised.slice(0, versionMatch.index).trim();
  }

  const code = normalised
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return { code, version };
}

export function presentImageRights(value, notRecorded = 'Not recorded') {
  const raw = String(value ?? '').trim();
  const upper = raw.toUpperCase().replace(/\s+/g, ' ');

  if (!raw) {
    return {
      kind: 'unknown',
      label: notRecorded,
      symbol: '?',
      icons: [],
    };
  }

  if (/^(COPYRIGHT|©|ALL RIGHTS RESERVED|PROPRIETARY)$/.test(upper)) {
    return {
      kind: 'copyright',
      label: raw === '©' ? 'Copyright' : raw,
      symbol: '©',
      icons: [],
    };
  }

  if (/^(PUBLIC DOMAIN|PD|PDM)$/.test(upper)) {
    return {
      kind: 'public-domain',
      label: 'Public Domain',
      icons: [icon('pd')],
    };
  }

  if (/^(CC\s*0|ZERO)$/.test(upper)) {
    return {
      kind: 'public-domain',
      label: 'CC0',
      icons: [icon('cc'), icon('zero')],
    };
  }

  const { code, version } = normaliseCcCode(raw);
  const licenseIcons = CC_LICENSE_ICONS[code];

  if (licenseIcons) {
    return {
      kind: 'creative-commons',
      label: `CC ${code}${version ? ` ${version}` : ''}`,
      icons: [icon('cc'), ...licenseIcons.map(icon)],
    };
  }

  return {
    kind: 'unknown',
    label: raw,
    symbol: '?',
    icons: [],
  };
}
