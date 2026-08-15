export const DEFAULT_READING_WORDS_PER_MINUTE = 225;

const STORYTELLER_BLOCK = /<!--\s*viscerium:storyteller:start\s*-->[\s\S]*?<!--\s*viscerium:storyteller:end\s*-->/gi;
const OBSIDIAN_COMMENT = /%%[\s\S]*?%%/g;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const FENCED_CODE = /(^|\n)\s*(```|~~~)[^\n]*\n[\s\S]*?\n\s*\2(?=\n|$)/g;

export function readableMarkdownText(markdown = '') {
  return String(markdown)
    .replace(STORYTELLER_BLOCK, ' ')
    .replace(OBSIDIAN_COMMENT, ' ')
    .replace(HTML_COMMENT, ' ')
    .replace(FENCED_CODE, ' ')
    .replace(/^\s*(?:import|export)\s.+$/gm, ' ')
    .replace(/!\[([^\]]*)\]\([^\)]*\)/g, ' ')
    .replace(/!\[\[[^\]]+\]\]/g, ' ')
    .replace(/\[([^\]]+)\]\([^\)]*\)/g, '$1')
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (_, target, label) => label ?? target.split('/').pop() ?? '')
    .replace(/`[^`\n]+`/g, ' ')
    .replace(/<https?:\/\/[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/^\s*\[\^[^\]]+\]:.*$/gm, ' ')
    .replace(/\[\^[^\]]+\]/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*>+\s?/gm, '')
    .replace(/^\s*(?:[-+*]|\d+[.)])\s+/gm, '')
    .replace(/^\s*[-:| ]{3,}\s*$/gm, ' ')
    .replace(/[|*_~]/g, ' ')
    .replace(/&(?:[a-z][a-z0-9]+|#\d+|#x[0-9a-f]+);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function countReadableWords(markdown = '') {
  const text = readableMarkdownText(markdown);
  if (!text) return 0;
  return text.match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

export function estimateReadingTime(markdown = '', wordsPerMinute = DEFAULT_READING_WORDS_PER_MINUTE) {
  const safeRate = Number.isFinite(wordsPerMinute) && wordsPerMinute > 0
    ? wordsPerMinute
    : DEFAULT_READING_WORDS_PER_MINUTE;
  const words = countReadableWords(markdown);
  return {
    words,
    wordsPerMinute: safeRate,
    minutes: Math.max(1, Math.ceil(words / safeRate)),
  };
}
