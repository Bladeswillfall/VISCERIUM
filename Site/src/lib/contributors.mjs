// Solacon path generation adapts https://github.com/misaki-web/solacon.
// Copyright (c) 2022 Jon Van Oast. MIT. See LICENSES/Solacon-MIT.txt.

const ROLE_PRIORITY = Object.freeze([
  'author',
  'co-author',
  'editor',
  'research',
  'illustrator',
  'consultant',
]);

const ROLE_PRIORITY_INDEX = new Map(ROLE_PRIORITY.map((role, index) => [role, index]));

export { ROLE_PRIORITY };

export function normalizeRole(role) {
  return String(role ?? '').trim().toLowerCase();
}

export function normalizeRoles(roles) {
  const unique = new Map();
  for (const value of roles ?? []) {
    const display = String(value ?? '').trim();
    const key = normalizeRole(display);
    if (key && !unique.has(key)) unique.set(key, display);
  }
  return [...unique.values()];
}

export function visualRoles(roles, limit = 4) {
  return normalizeRoles(roles)
    .map((display, index) => ({ display, key: normalizeRole(display), index }))
    .sort((a, b) => (
      (ROLE_PRIORITY_INDEX.get(a.key) ?? ROLE_PRIORITY.length)
      - (ROLE_PRIORITY_INDEX.get(b.key) ?? ROLE_PRIORITY.length)
      || a.index - b.index
    ))
    .slice(0, Math.max(0, limit));
}

export function roleClass(role) {
  const key = normalizeRole(role);
  return ROLE_PRIORITY_INDEX.has(key) ? `role-${key}` : 'role-other';
}

export function buildRoleSegments(roles) {
  const displayed = visualRoles(roles);
  const count = displayed.length;
  if (count === 0) return [];
  if (count === 1) return [{
    ...displayed[0],
    className: roleClass(displayed[0].key),
    dasharray: '100 0',
    dashoffset: 0,
  }];

  const slice = 100 / count;
  const gap = 3;
  const length = slice - gap;
  return displayed.map((role, index) => ({
    ...role,
    className: roleClass(role.key),
    dasharray: `${length} ${100 - length}`,
    dashoffset: -(index * slice + gap / 2),
  }));
}

export function githubUsernameFromUrl(value) {
  try {
    const url = new URL(String(value ?? ''));
    if (!['github.com', 'www.github.com'].includes(url.hostname.toLowerCase())) return undefined;
    const [username] = url.pathname.split('/').filter(Boolean);
    return username || undefined;
  } catch {
    return undefined;
  }
}

export function contributorSlug(name) {
  return String(name ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'contributor';
}

function sdbm(value) {
  let input = String(value ?? '').normalize('NFC');
  if (input.length < 6) input = input.repeat(5);
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = input.charCodeAt(index) + (hash << 6) + (hash << 16) - hash;
  }
  return hash >>> 0;
}

function point(angle, radius, center) {
  return [
    radius * Math.cos(angle) + center,
    radius * Math.sin(angle) + center,
  ];
}

function rounded(value) {
  return Math.round(value * 1000) / 1000;
}

function pointString([x, y]) {
  return `${rounded(x)} ${rounded(y)}`;
}

function swishPath(a1, a2, r1, r2, center) {
  const p1 = point(a1, r1, center);
  const p2 = point(a2, r2, center);
  const bend = (a2 - a1) / 3;
  const b1 = point(a1 + bend, (r1 + r2) / 2, center);
  const b2 = point(a2 - bend, (r1 + r2) / 2, center);
  const inner1 = point(a1 + bend, (r1 + r2) / 3, center);
  const inner2 = point(a2 - bend, (r1 + r2) / 3, center);
  return `M ${pointString(p1)} C ${pointString(b1)}, ${pointString(b2)}, ${pointString(p2)} C ${pointString(inner1)}, ${pointString(inner2)}, ${pointString(p1)}`;
}

function solaconColor(hash) {
  const channels = [hash & 0xff, (hash >>> 8) & 0xff, (hash >>> 16) & 0xff];
  const max = Math.max(...channels);
  const min = Math.min(...channels);
  if (max - min < 48) channels[(hash >>> 24) % 3] = Math.min(220, max + 72);
  return channels.map((channel) => Math.max(42, Math.min(210, channel)));
}

function mixedWithWhite(channel, amount) {
  return Math.round(channel * amount + 255 * (1 - amount));
}

export function generateSolaconSvg(seed, size = 192) {
  const hash = sdbm(seed);
  const slices = (hash & 0x07) + 3;
  const center = size / 2;
  const radius = size / 2;
  const wedgeAngle = Math.PI * 2 / slices;
  const data = [];
  const [r, g, b] = solaconColor(hash);

  for (let index = 0; index < 6; index += 1) {
    data.push([
      ((hash >>> (index * 3)) & 0x07) / 7,
      ((hash >>> (index * 3 + 1)) & 0x07) / 7,
      (hash >>> (index * 3 + 2)) & 0x07,
    ]);
  }

  const paths = [];
  for (let slice = 0; slice < slices; slice += 1) {
    const a1 = wedgeAngle * slice;
    const a2 = wedgeAngle * (slice + 1);
    for (const [r1, r2, alpha] of data) {
      if (alpha === 0) continue;
      paths.push(`<path fill="rgba(${r},${g},${b},${rounded(alpha / 7)})" d="${swishPath(a1, a2, radius * r1, radius * r2, center)}"/>`);
    }
  }

  const background = [r, g, b].map((channel) => mixedWithWhite(channel, 0.16));
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">`,
    `<rect width="${size}" height="${size}" fill="rgb(${background.join(',')})"/>`,
    ...paths,
    '</svg>',
  ].join('');
}
