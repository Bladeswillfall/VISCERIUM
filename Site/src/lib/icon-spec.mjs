const safeTokenPattern = /^[a-z0-9][a-z0-9-]*$/i;
const iconLabelPattern = /^\[icon:([^\]]+)\]\s*(.*)$/i;
const legacyIconLabelPattern = /^\[([a-z0-9][a-z0-9-]*)\]\s*(.*)$/i;

function cleanSpec(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

export function parseIconSpec(value) {
  const raw = cleanSpec(value);
  if (!raw) return null;

  const name = raw.replace(/^local\s+/i, '');
  if (!safeTokenPattern.test(name)) return null;

  return {
    provider: 'local',
    name,
    spec: `local ${name}`,
  };
}

export function iconLabel(spec, label) {
  const parsed = parseIconSpec(spec);
  return parsed ? `[Icon:${parsed.spec}] ${label}` : label;
}

export function parseIconLabel(value) {
  const raw = typeof value === 'string' ? value : '';
  const explicit = raw.match(iconLabelPattern);
  if (explicit) {
    const icon = parseIconSpec(explicit[1]);
    return {
      icon: icon?.spec,
      label: explicit[2].trim(),
    };
  }

  const legacy = raw.match(legacyIconLabelPattern);
  if (legacy) {
    return {
      icon: `local ${legacy[1]}`,
      label: legacy[2].trim(),
    };
  }

  return { icon: undefined, label: raw };
}

export function renderIconMarkup(spec, options = {}) {
  const parsed = parseIconSpec(spec);
  if (!parsed) return '';

  const jsx = options.jsx === true;
  const attr = jsx ? 'className' : 'class';
  const classes = ['codex-icon', options.className].filter(Boolean).join(' ');
  const iconPath = `/icons/${parsed.name}.svg`;
  const style = jsx
    ? `style={"--icon: url('${iconPath}')"}`
    : `style="--icon: url('${iconPath}')"`;
  return `<span ${attr}="${classes} codex-local-icon" aria-hidden="true" ${style}></span>`;
}
