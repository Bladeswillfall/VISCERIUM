import { HISTORICAL_ERAS } from '../lib/era-context.mjs';

const historicalEraSlugs = new Map(HISTORICAL_ERAS.map((era, index) => [
  era.toLowerCase(),
  { key: era.toLowerCase(), label: era, icon: index === 0 ? 'faction' : 'spark', order: index * 10 },
]));

export const ROOT_SIDEBAR_SECTIONS = Object.freeze([
  { key: 'degel-system', label: 'Degel System', icon: 'spark', order: 10, aliases: ['degel'] },
  { key: 'eras', label: 'Eras', icon: 'event', order: 20 },
  { key: 'the-wyrd', label: 'The Wyrd', icon: 'wyrd', order: 30, aliases: ['wyrd'] },
  { key: 'naranoricon', label: 'Naranoricon', icon: 'naranor', order: 40 },
  { key: 'myrkildicary', label: 'Myrkildicary', icon: 'myrkild', order: 50 },
  { key: 'meta-content', label: 'Meta Content', icon: 'codex', order: 60, aliases: ['meta', 'demo'] },
]);

export const ERA_SIDEBAR_SECTIONS = Object.freeze([
  { key: 'relationships', label: 'Relationships', icon: 'relationships', order: 10 },
  { key: 'events', label: 'Events', icon: 'event', order: 20, typeAliases: ['event'] },
  {
    key: 'nations',
    label: 'Nations',
    icon: 'faction',
    order: 30,
    aliases: ['factions', 'nation', 'states'],
    typeAliases: ['faction', 'nation', 'state'],
  },
  {
    key: 'international-groups',
    label: 'International Groups',
    icon: 'international-group',
    order: 40,
    aliases: ['international-organisations', 'international-organizations', 'organisations', 'organizations'],
    typeAliases: ['international-group'],
  },
  {
    key: 'professions',
    label: 'Professions',
    icon: 'profession',
    order: 50,
    aliases: ['profession', 'occupations', 'occupation'],
    typeAliases: ['profession', 'occupation'],
  },
  {
    key: 'bestiary',
    label: 'Bestiary',
    icon: 'bug',
    order: 60,
    aliases: ['creatures', 'creature', 'species'],
    typeAliases: ['creature', 'species', 'bestiary'],
  },
  {
    key: 'flora-fungi',
    label: 'Flora & Fungi',
    icon: 'flora',
    order: 70,
    aliases: ['flora-and-fungi', 'flora', 'fungi', 'fungus'],
    typeAliases: ['flora', 'fungus', 'plant'],
  },
  {
    key: 'weapons-armour',
    label: 'Weapons & Armour',
    icon: 'weapons-armour',
    order: 80,
    aliases: ['weapons-and-armour', 'weapons', 'armour', 'armor', 'equipment'],
    typeAliases: ['weapon', 'armour', 'armor', 'equipment'],
  },
  {
    key: 'transportation',
    label: 'Transportation',
    icon: 'transportation',
    order: 90,
    aliases: ['transport', 'vehicles', 'vehicle'],
    typeAliases: ['transportation', 'transport', 'vehicle'],
  },
]);

const fallbackIcons = new Map([
  ['calendar', 'event'],
  ['characters', 'character'],
  ['entities', 'spark'],
  ['images', 'image'],
  ['locations', 'location'],
  ['maps', 'map'],
  ['atlas', 'map'],
  ['releases', 'event'],
]);

function normaliseKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function definitionMap(definitions) {
  const map = new Map();
  for (const definition of definitions) {
    map.set(definition.key, definition);
    map.set(normaliseKey(definition.label), definition);
    for (const alias of definition.aliases ?? []) map.set(normaliseKey(alias), definition);
  }
  return map;
}

const rootByKey = definitionMap(ROOT_SIDEBAR_SECTIONS);
const eraSectionByKey = definitionMap(ERA_SIDEBAR_SECTIONS);
const eraSectionByType = new Map();
for (const definition of ERA_SIDEBAR_SECTIONS) {
  for (const type of definition.typeAliases ?? []) eraSectionByType.set(normaliseKey(type), definition);
}

export function rootSidebarSection(value) {
  return rootByKey.get(normaliseKey(value));
}

export function historicalEraSection(value) {
  return historicalEraSlugs.get(normaliseKey(value));
}

export function eraSidebarSection(value) {
  return eraSectionByKey.get(normaliseKey(value));
}

export function inferEraSidebarSection(data = {}) {
  const explicit = eraSidebarSection(data.navigation?.section);
  if (explicit) return explicit;
  return eraSectionByType.get(normaliseKey(data.type));
}

export function sidebarGroupDefinition(value, context = 'default') {
  if (context === 'root') return rootSidebarSection(value);
  if (context === 'eras') return historicalEraSection(value);
  if (context === 'era') return eraSidebarSection(value);
  return undefined;
}

export function sidebarIconForLabel(value) {
  return rootSidebarSection(value)?.icon
    ?? historicalEraSection(value)?.icon
    ?? eraSidebarSection(value)?.icon
    ?? fallbackIcons.get(normaliseKey(value));
}

export function sidebarFallbackLabel(value) {
  return String(value ?? '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function sidebarGroupRank(value, context = 'default') {
  return sidebarGroupDefinition(value, context)?.order ?? 10_000;
}

export function canonicalSidebarGroup(value, context = 'default') {
  return sidebarGroupDefinition(value, context)?.key ?? normaliseKey(value);
}
