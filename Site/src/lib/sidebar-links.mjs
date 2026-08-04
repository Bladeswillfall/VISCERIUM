export function parseSidebarWikilink(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^\[\[([^\]|#]+)(#[^\]|]+)?(?:\|[^\]]+)?\]\]$/);
  if (!match) return null;
  return {
    target: match[1].trim(),
    fragment: match[2] ?? '',
  };
}
