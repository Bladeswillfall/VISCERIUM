import path from 'node:path';

export const TYPE_BY_FOLDER = new Map([
  ['characters', 'character'],
  ['factions', 'faction'],
  ['locations', 'location'],
  ['events', 'event'],
  ['maps', 'map'],
  ['images', 'image'],
  ['eras', 'era'],
  ['timelines', 'timeline'],
  ['calendar', 'calendar'],
  ['demo', 'system'],
]);

export function sourceSegments(file, sourceDir) {
  const relative = path.relative(sourceDir, file).replace(/\\/g, '/').replace(/\.(md|mdx)$/i, '');
  return relative.split('/').filter(Boolean);
}

export function inferNoteType(file, sourceDir) {
  const segments = sourceSegments(file, sourceDir).map((segment) => segment.toLowerCase());
  for (let index = segments.length - 2; index >= 0; index -= 1) {
    const type = TYPE_BY_FOLDER.get(segments[index]);
    if (type) return type;
  }
  return TYPE_BY_FOLDER.get(segments[0]) ?? 'article';
}
