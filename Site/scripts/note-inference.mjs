import path from 'node:path';

const FOLDER_ALIASES = [
  ['article', 'article'],
  ['articles', 'article'],
  ['degel system', 'article'],
  ['character', 'character'],
  ['characters', 'character'],
  ['person', 'character'],
  ['persons', 'character'],
  ['people', 'character'],
  ['npc', 'character'],
  ['npcs', 'character'],
  ['faction', 'faction'],
  ['factions', 'faction'],
  ['nation', 'faction'],
  ['nations', 'faction'],
  ['organisation', 'faction'],
  ['organisations', 'faction'],
  ['organization', 'faction'],
  ['organizations', 'faction'],
  ['kingdom', 'faction'],
  ['kingdoms', 'faction'],
  ['dominion', 'faction'],
  ['dominions', 'faction'],
  ['republic', 'faction'],
  ['republics', 'faction'],
  ['corporation', 'faction'],
  ['corporations', 'faction'],
  ['order', 'faction'],
  ['orders', 'faction'],
  ['cult', 'faction'],
  ['cults', 'faction'],
  ['guild', 'faction'],
  ['guilds', 'faction'],
  ['clan', 'faction'],
  ['clans', 'faction'],
  ['house', 'faction'],
  ['houses', 'faction'],
  ['location', 'location'],
  ['locations', 'location'],
  ['place', 'location'],
  ['places', 'location'],
  ['region', 'location'],
  ['regions', 'location'],
  ['settlement', 'location'],
  ['settlements', 'location'],
  ['city', 'location'],
  ['cities', 'location'],
  ['town', 'location'],
  ['towns', 'location'],
  ['village', 'location'],
  ['villages', 'location'],
  ['wilderness', 'location'],
  ['site', 'location'],
  ['sites', 'location'],
  ['ruin', 'location'],
  ['ruins', 'location'],
  ['landmark', 'location'],
  ['landmarks', 'location'],
  ['world', 'location'],
  ['worlds', 'location'],
  ['planet', 'location'],
  ['planets', 'location'],
  ['event', 'event'],
  ['events', 'event'],
  ['battle', 'event'],
  ['battles', 'event'],
  ['conflict', 'event'],
  ['conflicts', 'event'],
  ['species', 'species'],
  ['fauna', 'species'],
  ['animal', 'species'],
  ['animals', 'species'],
  ['reptile', 'species'],
  ['reptiles', 'species'],
  ['mammal', 'species'],
  ['mammals', 'species'],
  ['bird', 'species'],
  ['birds', 'species'],
  ['avian', 'species'],
  ['avians', 'species'],
  ['fish', 'species'],
  ['amphibian', 'species'],
  ['amphibians', 'species'],
  ['insect', 'species'],
  ['insects', 'species'],
  ['arachnid', 'species'],
  ['arachnids', 'species'],
  ['flora', 'species'],
  ['plant', 'species'],
  ['plants', 'species'],
  ['fungi', 'species'],
  ['fungus', 'species'],
  ['myrkildicary', 'species'],
  ['item', 'item'],
  ['items', 'item'],
  ['weapon', 'item'],
  ['weapons', 'item'],
  ['weaponry', 'item'],
  ['armour', 'item'],
  ['armours', 'item'],
  ['armor', 'item'],
  ['armors', 'item'],
  ['equipment', 'item'],
  ['tool', 'item'],
  ['tools', 'item'],
  ['artefact', 'item'],
  ['artefacts', 'item'],
  ['artifact', 'item'],
  ['artifacts', 'item'],
  ['relic', 'item'],
  ['relics', 'item'],
  ['vehicle', 'item'],
  ['vehicles', 'item'],
  ['technology', 'item'],
  ['weapons and armour', 'item'],
  ['weapons armour', 'item'],
  ['map', 'map'],
  ['maps', 'map'],
  ['image', 'image'],
  ['images', 'image'],
  ['artwork', 'image'],
  ['era', 'era'],
  ['eras', 'era'],
  ['timeline', 'timeline'],
  ['timelines', 'timeline'],
  ['calendar', 'calendar'],
  ['calendars', 'calendar'],
  ['demo', 'system'],
];

export const TYPE_BY_FOLDER = new Map(FOLDER_ALIASES);

export function normaliseSourceSegment(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function sourceSegments(file, sourceDir) {
  const relative = path.relative(sourceDir, file).replace(/\\/g, '/').replace(/\.(md|mdx)$/i, '');
  return relative.split('/').filter(Boolean);
}

export function inferNoteType(file, sourceDir) {
  const segments = sourceSegments(file, sourceDir);
  for (let index = segments.length - 2; index >= 0; index -= 1) {
    const type = TYPE_BY_FOLDER.get(normaliseSourceSegment(segments[index]));
    if (!type) continue;

    // "Eras" identifies the direct era index notes. It must not turn an
    // otherwise untyped descendant of Lore/Eras/<ERA>/ into type: era.
    if (type === 'era' && !(index === 0 && segments.length === 2)) continue;
    return type;
  }
  return TYPE_BY_FOLDER.get(normaliseSourceSegment(segments[0])) ?? 'article';
}
